const {
    lifeCycle
  , prettyNs
  , separateUserFunctions
  , mergeUserFunctions
  , uniqueUserFunctions
} = require('ah-processor.utils')

const processHttpParser = require('./common/process-http-parser')

class TcpConnectionOperation {
  /**
   * Processes a group of async activities that represent a tcp server
   * connection operation.
   * It is used by the [TcpConnectionProcessor](#tcpconnectionprocessor) and
   * the [HttpConnectionProcessor](#httpconnectionprocessor) as part of `process`.
   *
   * Even though the methods here including some private ones are documented, the `TcpConnectionOperation`
   * should not be instantiated and used directly.
   *
   * Parameters are the same as that of the [ah-fs `ReadFileOperation`](https://nodesource.github.io/ah-fs.processor/#readfileoperation).
   *
   * @name TcpConnectionOperation
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
      } else if (info.isshutdown) {
        this._processShutdown(info)
      } else if (info.ishttpparser) {
        this._processHttpParser(info)
      } else {
        throw new Error('Unknown step of net::server.connection operation.')
      }
    }
  }

  /**
   * The tcp socket is created by core to service a client connection.
   * It has user functions attached which we extract.
   *
   * The `created` timestamp helps us define the life cycle of the connection, as it starts
   * when the socket is created and ends when the related shutdown is destroyed.
   * Usually we also see two before and after timestamps but those are mainly only related to the
   * inner workings of core and are ignored for now.
   *
   * @name tcpConnectionOperation._processSocket
   * @function
   * @param {Object} info information about the socket connection, pre-processed by the `TcpConnectionProcessor`.
   */
  _processSocket(info) {
    const { created } = lifeCycle(info.activity)
    this._created = created
    const socket = {
        id: info.activity.id
      , triggerId: info.activity.triggerId
    }

    const server = info.activity.resource
      && info.activity.resource.owner
      && info.activity.resource.owner.server

    if (server != null
      && server._connectionKey != null
      && server._connectionKey.val != null) {
      socket.connectionKey = server._connectionKey.val
    }

    if (info.activity.resource != null) {
      const functions = info.activity.resource.functions
      socket.userFunctions =
        uniqueUserFunctions(functions, { pathPrefix: 'socket.resource' })
    }

    if (this._includeActivities) socket.activity = info.activity
    this._socket = socket
  }

  /**
   * We only obtain the ids and the life cycle information of the shutdown resource.
   * We do have an initStack, but that just points to core code.
   *
   * @name tcpConnectionOperation._processShutdown
   * @function
   * @param {Object} info information about the shutdown of the tcp server, pre-processed by the `TcpConnectionProcessor`.
   */
  _processShutdown(info) {
    const { destroyed } = lifeCycle(info.activity)
    this._shutdown = {
        id: info.activity.id
      , triggerId: info.activity.triggerId
    }
    this._destroyed = destroyed
  }

  /**
   * This function is only used when we are dealing with an http connection which
   * has an http parser.
   *
   * @name tcpConnectionOperation._processHttpParser
   * @function
   * @param {Object} info information about the http parser
   */
  _processHttpParser(info) {
    this._httpParser = processHttpParser(info)
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
   * ## Properties Specific to `tcp connection`
   *
   * - **socket**: see `tcpConnectionOperation._processSocket`
   * - **httpParser**: see `tcpConnectionOperation._processHttpParser`
   * - **shutdown**: see `tcpConnectionOperation._processShutdown`
   *
   * @name tcpConnectionOperation.summary
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
      , createdAt : '<Unknown>'
      , socket    : this._socket
      , httpParser : this._httpParser
      , shutdown  : this._shutdown
    }

    if (!separateFunctions) return info
    const separated = separateUserFunctions(info)

    if (!mergeFunctions) return separated
    return mergeUserFunctions(separated)
  }
}

module.exports = TcpConnectionOperation
