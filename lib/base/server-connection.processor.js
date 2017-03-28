const TCPWrap = 'TCPWRAP'
const ShutdownWrap = 'SHUTDOWNWRAP'

/**
 * Sample init stack of socket shutdown:
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

class ServerConnectionProcessorBase {
  constructor({ activities, includeActivities = false, separateFunctions = true }) {
    this._activities = activities
    this._includeActivities = includeActivities
    this._separateFunctions = separateFunctions
  }

  // @virtual (override to add more id sets)
  _clear() {
    this._tcpSocketIds = new Set()
    this._tcpSocketShutdownIds = new Set()
    this._groups = new Map()
    this._operations = new Map()
  }

  _findTcpSocketIds() {
    for (const a of this._activities.values()) {
      if (a.type !== TCPWrap) continue
      const owner = a.resource && a.resource.owner
      if (owner == null || owner.proto !== 'Socket') continue
      this._tcpSocketIds.add(a.id)
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

  _addOperations() {
    for (const [ id, group ] of this._groups) this._addOperation(id, group)
  }
}

module.exports = ServerConnectionProcessorBase
