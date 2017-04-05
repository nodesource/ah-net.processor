const ServerConnectionProcessorBase = require('./base/server-connection.processor')

const TlsWrap = 'TLSWRAP'

/**
  * Instantiates an tls server connection data processor to process data collected via
  * [nodesource/ah-net](https://github.com/nodesource/ah-net)
  *
  * Parameters and return value are congruent to the ones explained in
  * [ReadFileProcessor](https://nodesource.github.io/ah-fs.processor/#readfileprocessor)
  *
  * @name TlsConnectionProcessor
  * @constructor
  */
class TlsConnectionProcessor extends ServerConnectionProcessorBase {
  /**
   * Processing algorithm is the same as the [one for the readFile processor](https://nodesource.github.io/ah-fs.processor/#readfileprocessorprocess).
   *
   * ## Sample Return Value
   *
   * For a sample return value please consult the [related tests](https://github.com/nodesource/ah-net.processor/blob/master/test/tls.one-connection.server.js).
   *
   * @name tlsConnectionProcessor.process
   * @function
   */
  process() {
    this._clear()
    this._findTcpSocketIds()
    this._findTcpSocketShutdownIds()
    this._findTlsIds()
    this._separateIntoGroups()
    this._addOperations()

    return { groups: this._groups, operations: this._operations }
  }

  // @override
  _clear() {
    super._clear()
    this._tlsIds = new Set()
  }

  _findTlsIds() {
    for (const a of this._activities.values()) {
      if (a.type !== TlsWrap) continue
      this._tlsIds.add(a.id)
    }
  }

  // The tls server activities are grouped as follows:
  // TCPWRAP (server listen - not captured as part of connection)
  //  |
  //  +- TCPWRAP (socket)
  //  |   |
  //  |   +- shutdown
  //  +- TLSWrap (ah-net captures _parentId as part of _handle which is socket.id)
  _separateIntoGroups() {
    super._separateIntoGroups()

    // Walk through all socket ids and add ids of any tls wraps that
    // is a child of it to the group
    for (const [ socketId, group ] of this._groups) {
      for (const tlsId of this._tlsIds) {
        const a = this._activities.get(tlsId)
        const parentId = a.resource != null &&
          a.resource.owner != null &&
          a.resource.owner._handle != null &&
          a.resource.owner._handle._parentId
        if (parentId === socketId) group.add(tlsId)
      }
    }
  }

  _resolveGroup(group) {
    const groupInfo = []
    for (const id of group) {
      const activity = this._activities.get(id)
      const issocket = this._tcpSocketIds.has(id)
      const isshutdown = this._tcpSocketShutdownIds.has(id)
      const istls = this._tlsIds.has(id)
      const info = { activity, issocket, isshutdown, istls }
      groupInfo.push(info)
    }
    return groupInfo
  }
}

exports = module.exports = TlsConnectionProcessor
exports.operationSteps = 3
exports.operation = 'tls:server connection'
