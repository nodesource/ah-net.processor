const {
    lifeCycle
  , separateUserFunctions
  , mergeUserFunctions
  , uniqueUserFunctions
} = require('ah-processor.utils')

class TcpListenOperation {
  /**
   * Processes a group of async activities that represent a tcp server listen operation.
   * It is used by the [TcpListenProcessor](#tcplistenprocessor) as part of `process`.
   *
   * Even though the methods here including some private ones are documented, the `TcpListenOperation`
   * should not be instantiated and used directly.
   *
   * Parameters are the same as that of the [ah-fs `ReadFileOperation`](https://nodesource.github.io/ah-fs.processor/#readfileoperation).
   *
   * @name TcpListenOperation
   * @constructor
   */
  constructor({ group, includeActivities = false }) {
    this._includeActivities = includeActivities
    this._process(group)
  }

  _process(group) {
    for (let i = 0; i < group.length; i++) {
      const info = group[i]
      if (info.islisten) {
        this._processListen(info)
      } else {
        throw new Error('Unknown step of net::server.listen operation.')
      }
    }
  }

  /**
   * The listen contains a lot of useful information about the `server.listen()`
   * operation.
   *
   * The last frame of the init stack tells us where `.listen` was called and the
   * callbacks registered with the server can be found here has well.
   *
   * If strings were included when the activity resource was captured, we can also
   * obtain the connection key here.
   *
   * @name tcpListenOperation._processListen
   * @function
   * @param {Object} info information about the listen step, pre-processed by the `ServerListenProcessor`.
   */
  _processListen(info) {
    this._lifeCycle = lifeCycle(info.activity)

    // Sample init stack:
    // "at createServerHandle (net.js:1200:14)",
    // "at Server._listen2 (net.js:1244:14)",
    // "at listen (net.js:1312:10)",
    // "at Server.listen (net.js:1391:9)",
    // "at Test.<anonymous> (/Volumes/d/dev/js/async-hooks/ah-net/test/one-tcp-server.listen+close.js:30:6)"
    const initStack = info.activity.initStack
    if (initStack == null || initStack.length < 5) return
    this._createdAt = info.activity.initStack[4]

    this._listen = {
        id: info.activity.id
      , triggerId: info.activity.triggerId
    }
    const resource = info.activity.resource
    if (resource != null
      && resource.owner != null
      && resource.owner._connectionKey != null
      && resource.owner._connectionKey.val != null) {
      this._listen.connectionKey = resource.owner._connectionKey.val
    }

    if (resource != null) {
      const functions = info.activity.resource.functions
      this._listen.userFunctions =
        uniqueUserFunctions(functions, { pathPrefix: 'listen.resource' })
    }

    if (this._includeActivities) this._listen.activity = info.activity
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
   * ## Properties Specific to `server.listen`
   *
   * - **listen**: see `tcpListenOperation._processListen`
   *
   * @name tcpListenOperation.summary
   * @function
   */
  summary({ separateFunctions = true, mergeFunctions = true } = {}) {
    const info = {
        lifeCycle : this._lifeCycle
      , createdAt : this._createdAt
      , listen    : this._listen
    }

    if (!separateFunctions) return info
    const separated = separateUserFunctions(info)

    if (!mergeFunctions) return separated
    return mergeUserFunctions(separated)
  }
}

module.exports = TcpListenOperation
