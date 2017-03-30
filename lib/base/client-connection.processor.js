const { idsTriggeredBy, immediatelyBeforeId } = require('ah-processor.utils')

const TCPWrap = 'TCPWRAP'
const GetaddrinfoWrap = 'GETADDRINFOREQWRAP'
const TCPConnectWrap = 'TCPCONNECTWRAP'
const ShutdownWrap = 'SHUTDOWNWRAP'

/**
 * Sample init stack of socket intialization that was created via
 * `net.connect()`:
 *
 * ```
 * "at Socket.connect (net.js:932:40)",
 * "at Object.exports.connect.exports.createConnection (net.js:75:35)",
 * "at Object.<anonymous> (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/client:19:4)",
 * "at Module._compile (module.js:571:32)",
 * "at Object.Module._extensions..js (module.js:580:10)"
 * ```
 *
 * Code at net.js:932:
 *
 * `this._handle = pipe ? new Pipe() : new TCP();`
 *
 * The 3rd frame from the top tells us where the connection was created.
 *
 * TODO: this may be different when we create a socket with the slighly lower leve
 * API (see: https://nodejs.org/api/net.html#net_class_net_socket)
 * Therefore we need to test/adapt for this case as well.
 *
 */
const socketInitFrame0Rx = /at Socket\.connect/i

/**
 * Sample init stack of getAddrInfo lookup:
 *
 * ```
 * "at lookup (dns.js:164:19)",
 * "at lookupAndConnect (net.js:1004:3)",
 * "at Socket.connect (net.js:948:5)",
 * "at Object.exports.connect.exports.createConnection (net.js:75:35)",
 * "at Object.<anonymous> (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/client:19:4)"
 * ```
 *
 * Code at dns.js:164
 *
 * `var err = cares.getaddrinfo(req, hostname, family, hints);`
 *
 * Code at net.js 10004:
 *
 * `lookup(host, dnsopts, function emitLookup(err, ip, addressType)`
 *
 */
const getaddrinfoInitFrame0Rx = /at lookup/i
const getaddrinfoInitFrame1Rx = /at lookupAndConnect/i

/**
 * Sample init stack of tcp client connect:
 *
 * ```
 * "at connect (net.js:873:26)",
 * "at emitLookup (net.js:1023:7)",
 * "at GetAddrInfoReqWrap.asyncCallback [as callback] (dns.js:62:16)",
 * "at GetAddrInfoReqWrap.onlookup [as oncomplete] (dns.js:81:10)"
 * ```
 *
 * Code at net.js:873
 * `err = self._handle.connect(req, address, port);`
 *
 * We can clearly see here that it is triggered by the address lookup.
 * The frame1 regex only works in that case as well, i.e. if in some
 * cases no lookup is performed we need to write a smaller processor.
 */
const connectInitFrame0Rx = /at connect/i
const connectInitFrame1Rx = /at emitLookup/i

/**
 * Sample init stack of socket shutdown,
 * it is the same as the socket shutdown on the server side:
 *
 * ```
 * "at Socket.onSocketFinish (net.js:240:26)",
 * "at emitNone (events.js:86:13)",
 * "at Socket.emit (events.js:186:7)",
 * "at finishMaybe (_stream_writable.js:509:14)",
 * "at endWritable (_stream_writable.js:519:3)"
 * ```
 *
 * Code at net.js:240:
 *
 * `var err = this._handle.shutdown(req);`
 */
const socketShutdownInitFrame0Rx = /at Socket\.onSocketFinish/i

class ClientConnectionProcessorBase {
  constructor({ activities, includeActivities = false, separateFunctions = true }) {
    this._activities = activities
    this._includeActivities = includeActivities
    this._separateFunctions = separateFunctions
  }

  // @virtual (override to add more id sets)
  _clear() {
    this._tcpSocketIds = new Set()
    this._getaddrinfoIds = new Set()
    this._tcpSocketConnectIds = new Set()
    this._tcpSocketShutdownIds = new Set()
    this._groups = new Map()
    this._operations = new Map()
  }

  _findTcpSocketIds() {
    for (const a of this._activities.values()) {
      if (a.type !== TCPWrap) continue
      const owner = a.resource && a.resource.owner
      if (owner == null || owner.proto !== 'Socket') continue
      if (a.initStack == null || a.initStack < 1) continue
      if (!socketInitFrame0Rx.test(a.initStack[0])) continue
      this._tcpSocketIds.add(a.id)
    }
  }

  _findGetaddrinfoIds() {
    for (const a of this._activities.values()) {
      if (a.type !== GetaddrinfoWrap) continue
      if (a.initStack == null || a.initStack < 2) continue
      if (!getaddrinfoInitFrame0Rx.test(a.initStack[0])) continue
      if (!getaddrinfoInitFrame1Rx.test(a.initStack[1])) continue
      this._getaddrinfoIds.add(a.id)
    }
  }

  _findTcpSocketConnectIds() {
    for (const a of this._activities.values()) {
      if (a.type !== TCPConnectWrap) continue
      if (a.initStack == null || a.initStack < 2) continue
      if (!connectInitFrame0Rx.test(a.initStack[0])) continue
      if (!connectInitFrame1Rx.test(a.initStack[1])) continue
      this._tcpSocketConnectIds.add(a.id)
    }
  }

  _findTcpSocketShutdownIds() {
    for (const a of this._activities.values()) {
      if (a.type !== ShutdownWrap) continue
      if (a.initStack == null || a.initStack < 1) continue
      if (!socketShutdownInitFrame0Rx.test(a.initStack[0])) continue
      this._tcpSocketShutdownIds.add(a.id)
    }
  }

  _separateIntoGroups() {
    const self = this
    function stop(id) {
      if (self._tcpSocketShutdownIds.has(id)) return true

      // In case we saw no shutdown, we include all network activities
      // until we see a new connection being created.
      // TODO: This approach may be flawed, but we need a more involved
      // example to find out
      if (self._tcpSocketConnectIds.has(id)) return true

      return false
    }

    // We can group the addrinfo lookup and the socket activity since the
    // former triggered the latter
    for (const addrinfoId of this._getaddrinfoIds) {
      const group = idsTriggeredBy(this._activities, addrinfoId, stop)
      this._groups.set(addrinfoId, group)
    }

    // Then we find the connect activity which initialized right before each
    // addrinfo lookup and add it to the group.
    for (const [ addrinfoId, group ] of this._groups) {
      const socketId = immediatelyBeforeId(
          this._activities
        , this._tcpSocketIds
        , addrinfoId
      )
      if (socketId == null) continue

      group.add(socketId)
      // The tcp socket triggered the shutdown, so we can add that as well
      for (const shutdownId of this._tcpSocketShutdownIds) {
        const tid = this._activities.get(shutdownId).triggerId
        if (tid === socketId) group.add(shutdownId)
      }
    }
  }

  _addOperations() {
    for (const [ id, group ] of this._groups) this._addOperation(id, group)
  }
}

exports = module.exports = ClientConnectionProcessorBase
