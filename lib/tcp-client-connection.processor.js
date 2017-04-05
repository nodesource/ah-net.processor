const ClientConnectionProcessorBase = require('./base/client-connection.processor')

/**
  * Instantiates an `net.connect` data processor to process data collected via
  * [nodesource/ah-net](https://github.com/nodesource/ah-net)
  *
  * Parameters and return value are congruent to the ones explained in
  * [ReadFileProcessor](https://nodesource.github.io/ah-fs.processor/#readfileprocessor)
  *
  * @name TcpClientConnectionProcessor
  * @constructor
  */
class TcpClientConnectionProcessor extends ClientConnectionProcessorBase {
  /**
   * Processes the supplied async activities into client connection operations.
   *
   * ## Operations
   *
   * Here we consider full operation connect operations only, i.e. we group
   * together 4 operations.
   *
   * - **socket**: has data about the connection socket being created
   * - **getaddrinfo**: has data about the dns lookup of the server address
   * - **connect**: has data about the established the connection, it is
   *   alive as long as data is transferred between client and server
   * - **shutdown**: has data about the shutdown of the connection after all
   *   data was transferred
   *
   * ## Sample Return Value
   *
   * For a sample return value please consult the [related tests](https://github.com/nodesource/ah-net.processor/blob/master/test/one-connection.client.js).
   *
   * @name tcpClientConnectionProcessor.process
   * @function
   */
  process() {
    this._clear()
    this._findTcpSocketIds()
    this._findGetaddrinfoIds()
    this._findTcpSocketConnectIds()
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
      const isgetaddrinfo = this._getaddrinfoIds.has(id)
      const isconnect = this._tcpSocketConnectIds.has(id)
      const isshutdown = this._tcpSocketShutdownIds.has(id)
      const info = { activity, issocket, isgetaddrinfo, isconnect, isshutdown }
      groupInfo.push(info)
    }
    return groupInfo
  }
}

exports = module.exports = TcpClientConnectionProcessor
exports.operationSteps = 4
exports.operation = 'tcp:client connection'
