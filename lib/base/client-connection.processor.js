const { idsTriggeredBy } = require('ah-processor.utils')
const TcpClientConnectionOperation = require('../tcp-client-connection.operation')

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
 * TODO: this may be different when we create a socket with the slighly lower level
 * API (see: https://nodejs.org/api/net.html#net_class_net_socket)
 * Therefore we need to test/adapt for this case as well.
 *
 */
const socketInitFrame0Rx = /(at Socket\.connect|at TLSSocket\._wrapHandle)/i

/**
 * Sample init stack of getAddrInfo lookup:
 *
 * ```
 * "at lookup (dns.js:182:19)",
 * "at lookupAndConnect (net.js:1053:3)",
 * "at Socket.connect (net.js:948:5)",
 * "at Object.exports.connect.exports.createConnection (net.js:75:35)",
 * "at Object.<anonymous> (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/client:19:4)"
 * ```
 *
 * Code at dns.js:182
 *
 * `var err = cares.getaddrinfo(req, hostname, family, hints);`
 *
 * Code at net.js 1053:
 *
 * `lookup(host, dnsopts, function emitLookup(err, ip, addressType)`
 *
 * Sample init stack of getAddrInfo lookup for TLS connections:
 *
 * ```
 * "at lookup (dns.js:182:19)",
 * "at lookupAndConnect (net.js:1053:3)",
 * "at TLSSocket.Socket.connect (net.js:996:5)",
 * "at Object.exports.connect (_tls_wrap.js:1078:12)",
 * "at Socket.onserverListening (/Volumes/d/dev/js/async-hooks/ah-net/test/tls-one-connection.client.js:91:10)"
 * ```
 *
 * Code at net.js:996
 *
 * `lookupAndConnect(this, options);`
 *
 * In both cases the bottom parts are part of the Socket connect stack and last
 * in stack tells us where that connection was created.
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
 *
 * Sample init stack of tls client connect (old):
 *
 * ```
 * "at TLSWrap.methodProxy [as connect6] (_tls_wrap.js:327:33)",
 * "at connect (net.js:923:26)",
 * "at emitLookup (net.js:1072:7)",
 * "at GetAddrInfoReqWrap.asyncCallback [as callback] (dns.js:83:16)",
 * "at GetAddrInfoReqWrap.onlookup [as oncomplete] (dns.js:97:10)"
 * ```
 *
 * Updated to latest Node.js:
 *
 *  ```
 * "at internalConnect (net.js:918:26)",
 * "at GetAddrInfoReqWrap.emitLookup [as callback] (net.js:1077:7)",
 * "at GetAddrInfoReqWrap.onlookup [as oncomplete] (dns.js:100:10)"
 * ```
 *
 * It is basically the same as a tcp connect init except we have an extra tls
 * related frame. Therefore we use the same regexes, move one frame down
 */
const connectInitFrame0Rx = /at (internal)?connect/i
const connectInitFrame1Rx = /at (GetAddrInfoReqWrap\.)?emitLookup/i

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
  constructor({
      activities
    , includeActivities = false
    , separateFunctions = true
    , isTls = false
  }) {
    this._activities = activities
    this._includeActivities = includeActivities
    this._separateFunctions = separateFunctions
    this._isTls = isTls
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
      if (a.initStack == null || a.initStack.length < 2) continue
      if (!getaddrinfoInitFrame0Rx.test(a.initStack[0])) continue
      if (!getaddrinfoInitFrame1Rx.test(a.initStack[1])) continue
      this._getaddrinfoIds.add(a.id)
    }
  }

  _findTcpSocketConnectIds() {
    const frameStart = this._isTls ? 1 : 0
    for (const a of this._activities.values()) {
      if (a.type !== TCPConnectWrap) continue
      if (a.initStack == null || a.initStack.length < frameStart + 2) continue
      if (!connectInitFrame0Rx.test(a.initStack[frameStart])) continue
      if (!connectInitFrame1Rx.test(a.initStack[frameStart + 1])) continue
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
    const socketIds = this._isTls ? this._tlsSocketIds : this._tcpSocketIds

    function stop(id) {
      if (self._tcpSocketShutdownIds.has(id)) return true

      // In case we saw no shutdown, we include all network activities
      // until we see a new connection being created.
      // TODO: This approach may be flawed, but we need a more involved
      // example to find out
      if (socketIds.has(id)) return true

      return false
    }

    // The client connection activities are grouped as follows
    // (except for TLS see ../lib/tls-client-connection.process.js)
    //
    // TCPWRAP
    //    |
    //    +- GETADDRINFOWRAP
    //    +- TCPCONNECTWRAP
    //    +- HTTPPARSER (http requests)
    //    +- SHUTDOWNWRAP
    //  This makes things easy to group.
    //  I document it here since it wasn't always this way (things used
    //  to be grouped under GETADDRINFOWRAP) and may change in the future
    for (const socketId of socketIds) {
      const group = idsTriggeredBy(this._activities, socketId, stop)
      group.add(socketId)
      this._groups.set(socketId, group)
    }
  }

  _addOperations() {
    for (const [ id, group ] of this._groups) this._addOperation(id, group)
  }

  _addOperation(id, group) {
    const info = this._resolveGroup(group)
    const op = new TcpClientConnectionOperation({
        group: info
      , includeActivities: this._includeActivities
      , isTls: this._isTls
    })
    this._operations.set(id, op.summary({ separateFunctions: this._separateFunctions }))
  }
}

exports = module.exports = ClientConnectionProcessorBase
