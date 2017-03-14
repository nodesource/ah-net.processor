const {
    lifeCycle
  , separateUserFunctions
  , mergeUserFunctions
  , uniqueUserFunctions
} = require('ah-processor.utils')

class ServerListenOperation {
  constructor({ group, includeActivities = false }) {
    this._includeActivities = includeActivities
    this._process(group)
  }

  _process(group) {
    this._sockets = []
    for (let i = 0; i < group.length; i++) {
      const info = group[i]
      if (info.islisten) {
        this._processListen(info)
      } else if (info.issocket) {
        this._processSocket(info)
      } else if (info.isshutdown) {
        this._processShutdown(info)
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
   * @name serverListenOperation._processListen
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
      && resource._connectionKey != null
      && resource._connectionKey.val != null) {
      this._listen.connectionKey = resource._connectionKey.val
    }

    if (resource != null) {
      const functions = info.activity.resource.functions
      this._listen.userFunctions =
        uniqueUserFunctions(functions, { pathPrefix: 'listen.resource' })
    }

    if (this._includeActivities) this._listen.activity = info.activity
  }

  /**
   * The tcp socket is created by core to service a client connection.
   * We may see multiple of these.
   *
   * Each contains no further interesting info related to user code that we didn't
   * already pull off the listen activity.
   * It has a reference to the server itself as well and therefore contains the
   * same user functions that are registered with the server (we already got them from
   * the listen activity).
   *
   * It contains extra info and functions that are solely interesting for core functionality
   * and thus we ignore it here
   *
   * In summary we only record id and triggerId and if available init and destroy timestamps as
   * they tell us how long the connection was alive.
   * Usually we also see two before and after timestamps but those are mainly only related to the
   * inner workings of core and are ignored for now.
   *
   * @name serverListenOperation._processSocket
   * @function
   * @param {Object} info information about the socket connection, pre-processed by the `ServerListenProcessor`.
   */
  _processSocket(info) {
    const { created, destroyed, timeAlive } = lifeCycle(info.activity)
    const socket = {
        id: info.activity.id
      , triggerId: info.activity.triggerId
      , lifeCycle: { created, destroyed, timeAlive }
    }
    this._sockets.push(socket)
  }

  /**
   * We only obtain the ids and the life cycle information of the shutdown resource.
   * We do have an initStack, but that just points to core code.
   *
   * @name serverListenOperation._processShutdown
   * @function
   * @param {Object} info information about the shutdown of the tcp server, pre-processed by the `ServerListenProcessor`.
   */
  _processShutdown(info) {
    const { created, destroyed, timeAlive } = lifeCycle(info.activity)
    this._shutdown = {
        id: info.activity.id
      , triggerId: info.activity.triggerId
      , lifeCycle: { created, destroyed, timeAlive }
    }
  }

  summary({ separateFunctions = true, mergeFunctions = true } = {}) {
    const info = {
        lifeCycle : this._lifeCycle
      , createdAt : this._createdAt
      , listen    : this._listen
      , sockets   : this._sockets
      , shutdown  : this._shutdown
    }

    if (!separateFunctions) return info
    const separated = separateUserFunctions(info)

    if (!mergeFunctions) return separated
    return mergeUserFunctions(separated)
  }
}

module.exports = ServerListenOperation
