const { idsTriggeredBy } = require('ah-processor.utils')
const TcpConnectionOperation = require('./tcp-connection.operation')
const ServerConnectionProcessorBase = require('./base/server-connection.processor')

class TcpConnectionProcessor extends ServerConnectionProcessorBase {
  process() {
    this._clear()
    this._findTcpSocketIds()
    this._findTcpSocketShutdownIds()
    this._separateIntoGroups()
    this._addOperations()

    return { groups: this._groups, operations: this._operations }
  }

  _separateIntoGroups() {
    const stop = id => !this._tcpSocketShutdownIds.has(id)

    for (const socketId of this._tcpSocketIds) {
      const group = idsTriggeredBy(this._activities, socketId, stop)
      this._groups.set(socketId, group)
    }
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
