const {
    firstNonZeroStamp
  , lifeCycle
  , prettyNs
  , separateUserFunctions
  , mergeUserFunctions
  , uniqueUserFunctions
} = require('ah-processor.utils')

const processHttpParser = require('./common/process-http-parser')

class TcpClientConnectionOperation {
  /**
   * Processes a group of async activities that represent a tcp client
   * connection operation.
   * It is used by the
   * [TcpClientConnectionProcessor](#tcpclientconnectionprocessor)
   * and [HttpClientConnectionProcessor](#httpclientconnectionprocessor) as part of `process`.
   *
   * Even though the methods here including some private ones are documented, the `TcpConnectionOperation`
   * should not be instantiated and used directly.
   *
   * Parameters are the same as that of the [ah-fs `ReadFileOperation`](https://nodesource.github.io/ah-fs.processor/#readfileoperation).
   *
   * @name TcpClientConnectionOperation
   * @constructor
   */
  constructor({ group, includeActivities = false }) {
    this._includeActivities = includeActivities
    this._process(group)
  }

  _process(group) {
    this._sockets = []
    for (let i = 0; i < group.length; i++) {
      const info = group[i]
      if (info.issocket) {
        this._processSocket(info)
      } else if (info.isgetaddrinfo) {
        this._processGetAddrInfo(info)
      } else if (info.isconnect) {
        this._processConnect(info)
      } else if (info.isshutdown) {
        this._processShutdown(info)
      } else if (info.ishttpparser) {
        this._processHttpParser(info)
      } else {
        throw new Error(
          `Unknown step of net::client.connection operation of type: '${info.activity.type}'.`
        )
      }
    }
  }

  /**
   * The socket creation activity has three important information points.
   *
   * We can glean from the stack trace where the client connection was created.
   * We also take the init timestamp to be the beginning of the life of the
   * client connection.
   * On top of that the associated user functions were attached to the owner
   * as event listeners.
   *
   * @name tcpClientConnectionOperation._processSocket
   * @function
   * @param {Object} info information about the _establish socket_ step
   */
  _processSocket(info) {
    const { created } = lifeCycle(info.activity)

    // Sample init stack:
    // "at Socket.connect (net.js:932:40)",
    // "at Object.exports.connect.exports.createConnection (net.js:75:35)",
    // "at Object.<anonymous> (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/client:19:4)",
    // "at Module._compile (module.js:571:32)",
    // "at Object.Module._extensions..js (module.js:580:10)"

    const initStack = info.activity.initStack
    if (initStack == null || initStack.length < 3) return
    this._createdAt = info.activity.initStack[2]

    this._created = created
    this._socket = {
        id: info.activity.id
      , triggerId: info.activity.triggerId
    }

    const resource = info.activity.resource
    if (resource != null) {
      const functions = info.activity.resource.functions
      this._socket.userFunctions =
        uniqueUserFunctions(functions, { pathPrefix: 'socket.resource' })
    }
  }

  /**
   * The dns resolution operation (GetAddrInfo) doesn't give us much info, however it
   * gives us another option to get at the line of code that established the
   * socket connection, i.e. called `connect`.
   *
   * We only use this option if we couldn't get that information via `_processSocket`.
   *
   * @name tcpClientConnectionOperation._processGetAddrInfo
   * @function
   * @param {Object} info information about the dns lookup step
   */
  _processGetAddrInfo(info) {
    this._getaddrinfo = {
        id: info.activity.id
      , triggerId: info.activity.triggerId
    }

    if (this._createdAt != null) return

    // Sample init stack:
    // "at lookup (dns.js:164:19)",
    // "at lookupAndConnect (net.js:1004:3)",
    // "at Socket.connect (net.js:948:5)",
    // "at Object.exports.connect.exports.createConnection (net.js:75:35)",
    // "at Object.<anonymous> (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/client:19:4)"

    const initStack = info.activity.initStack
    if (initStack == null || initStack.length < 5) return
    this._createdAt = info.activity.initStack[4]
  }

  /**
   * The established connection gives us no useful info, so we just record its ids
   * and move on.
   *
   * @name tcpClientConnectionOperation._processConnect
   * @function
   * @param {Object} info information about the established connection
   */
  _processConnect(info) {
    this._connect = {
        id: info.activity.id
      , triggerId: info.activity.triggerId
    }
  }

  /**
   * This function is only used when we are dealing with an http connection which
   * has an http parser.
   *
   * @name tcpClientConnectionOperation._processHttpParser
   * @function
   * @param {Object} info information about the http parser
   */
  _processHttpParser(info) {
    this._httpParser = processHttpParser(info)
  }

  /**
   * As is the case for the `TcpConnectionOperation` we can only obtain the ids
   * and the life cycle information of the shutdown resource.
   * We do have an initStack, but that just points to core code.
   *
   * However we also pull the `destroyed` timestamp from it in order to establish the
   * full lifetime of the tcp client connection which ends when its shutdown completes.
   *
   * @name tcpClientConnectionOperation._processShutdown
   * @function
   * @param {Object} info information about the shutdown of the tcp client connection
   */
  _processShutdown(info) {
    // Do our best to determine when the client connection completed
    // We may not have seen the `destroy` yet, so we use the next best stamp.
    this._destroyed = firstNonZeroStamp([
        info.activity.destroy
      , info.activity.after
      , info.activity.before
      , info.activity.init
    ])

    this._shutdown = {
        id: info.activity.id
      , triggerId: info.activity.triggerId
    }
  }

  /**
   * Returns the summary of processing the group into an operation.
   *
   * The general properties `lifeCycle` and `createdAt` are documented as part of
   * the ah-fs.processor `ReadFileProcessor`.
   * Therefore learn more [here](https://nodesource.github.io/ah-fs.processor/#general-operation-properties).
   *
   * The parameters `{ separateFunctions, mergeFunctions }` and return value
   * are documented as part of the [ah-fs.processor `ReadFileProcessor`](https://nodesource.github.io/ah-fs.processor/#readfileoperationsummary)
   * as well.
   *
   * ## Properties Specific to `tcp client connection`
   *
   * - **socket**: see `tcpClientConnectionOperation._processSocket`
   * - **getaddrinfo**: see `tcpClientConnectionOperation._processGetAddrInfo`
   * - **connect**: see `tcpClientConnectionOperation._processConnect`
   * - **httpparser**: see `tcpClientConnectionOperation._processHttpParser`
   * - **shutdown**: see `tcpClientConnectionOperation._processShutdown`
   *
   * @name tcpClientConnectionOperation.summary
   * @function
   */
  summary({ separateFunctions = true, mergeFunctions = true } = {}) {
    const timeAlive = this._created != null && this._destroyed != null
      ? prettyNs(this._destroyed.ns - this._created.ns)
      : null

    const info = {
        lifeCycle : {
          created: this._created
        , destroyed: this._destroyed
        , timeAlive
        }
      , createdAt   : this._createdAt
      , socket      : this._socket
      , getaddrinfo : this._getaddrinfo
      , connect     : this._connect
      , httpParser  : this._httpParser
      , shutdown    : this._shutdown
    }

    if (!separateFunctions) return info
    const separated = separateUserFunctions(info)

    if (!mergeFunctions) return separated
    return mergeUserFunctions(separated)
  }
}

module.exports = TcpClientConnectionOperation
