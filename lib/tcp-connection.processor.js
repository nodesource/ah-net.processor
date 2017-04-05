const ServerConnectionProcessorBase = require('./base/server-connection.processor')

/**
  * Instantiates an tcp server connection data processor to process data collected via
  * [nodesource/ah-net](https://github.com/nodesource/ah-net)
  *
  * Parameters and return value are congruent to the ones explained in
  * [ReadFileProcessor](https://nodesource.github.io/ah-fs.processor/#readfileprocessor)
  *
  * @name TcpConnectionProcessor
  * @constructor
  */
class TcpConnectionProcessor extends ServerConnectionProcessorBase {
  /**
   * Processing algorithm is the same as the [one for the readFile processor](https://nodesource.github.io/ah-fs.processor/#readfileprocessorprocess).
   *
   * ## Sample Return Value
   *
   * For a sample return value please consult the [related tests](https://github.com/nodesource/ah-net.processor/blob/master/test/one-connection.server.js).
   *
   * @name tcpConnectionProcessor.process
   * @function
   */
  process() {
    this._clear()
    this._findTcpSocketIds()
    this._findTcpSocketShutdownIds()
    this._separateIntoGroups()
    this._addOperations()

    return { groups: this._groups, operations: this._operations }
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
exports.operationSteps = 2
exports.operation = 'tcp:server connection'
