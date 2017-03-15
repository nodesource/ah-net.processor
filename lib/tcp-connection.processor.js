const TCPWrap = 'TCPWRAP'
const ShutdownWrap = 'SHUTDOWNWRAP'
const { idsTriggeredBy } = require('ah-processor.utils')
const TcpConnectionOperation = require('./tcp-connection.operation')

/**
 * Sample init stack of socket shutdown:
 *
 * "at Socket.onSocketFinish (net.js:240:26)",
 * "at emitNone (events.js:86:13)",
 * "at Socket.emit (events.js:186:7)",
 * "at finishMaybe (_stream_writable.js:509:14)",
 * "at endWritable (_stream_writable.js:519:3)"
 *
 * Code at net.js:240:
 *
 * `var err = this._handle.shutdown(req);`
 */
const socketShutdownInitFrame0Rx = /at Socket\.onSocketFinish/i

class TcpConnectionProcessor {
  constructor({ activities, includeActivities = false, separateFunctions = true }) {
    this._activities = activities
    this._includeActivities = includeActivities
    this._separateFunctions = separateFunctions
  }

  process() {
    this._clear()
    this._findTcpSocketIds()
    this._findTcpSocketShutdownIds()
    this._separateIntoGroups()
    this._addOperations()

    return { groups: this._groups, operations: this._operations }
  }

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

  _separateIntoGroups() {
    const stop = id => !this._tcpSocketShutdownIds.has(id)

    for (const socketId of this._tcpSocketIds) {
      const group = idsTriggeredBy(this._activities, socketId, stop)
      this._groups.set(socketId, group)
    }
  }

  _addOperations() {
    for (const [ id, group ] of this._groups) this._addOperation(id, group)
  }

  _addOperation(id, group) {
    const info = this._resolveGroup(group)
    const op = new TcpConnectionOperation({
        group: info
      , includeActivities: this._includeActivities
    })
    this._operations.set(id, op.summary({ separateFunctions: this._separateFunctions }))
  }

  _resolveGroup(group) {
    const groupInfo = []
    for (const id of group) {
      const activity = this._activities.get(id)
      const issocket = this._tcpSocketIds.has(id)
      const isshutdown = this._tcpSocketShutdownIds.has(id)
      const info = { activity, issocket, isshutdown }
      groupInfo.push(info)
    }
    return groupInfo
  }
}

exports = module.exports = TcpConnectionProcessor
exports.operationSteps = 3
exports.operation = 'tcp:server connection'
