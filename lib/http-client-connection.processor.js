const TcpClientConnectionOperation = require('./tcp-client-connection.operation')
const ClientConnectionProcessorBase = require('./base/client-connection.processor')

const HttpParser = 'HTTPPARSER'

/**
  * Instantiates an http client connection data processor to process data collected via
  * [nodesource/ah-net](https://github.com/nodesource/ah-net)
  *
  * Parameters and return value are congruent to the ones explained in
  * [ReadFileProcessor](https://nodesource.github.io/ah-fs.processor/#readfileprocessor)
  *
  * @name HttpClientConnectionProcessor
  * @constructor
  */
class HttpClientConnectionProcessor extends ClientConnectionProcessorBase {
  /**
   * Processing algorithm is the same as the [one for the readFile processor](https://nodesource.github.io/ah-fs.processor/#readfileprocessorprocess).
   *
   * ## Sample Return Value
   *
   * For a sample return value please consult the [related tests](https://github.com/nodesource/ah-net.processor/blob/master/test/http.one-connection.client.js).
   *
   * @name httpClientConnectionProcessor.process
   * @function
   */
  process() {
    this._clear()
    this._findTcpSocketIds()
    this._findGetaddrinfoIds()
    this._findHttpParserIds()
    this._findTcpSocketConnectIds()
    this._findTcpSocketShutdownIds()
    this._separateIntoGroups()
    this._addOperations()

    return { groups: this._groups, operations: this._operations }
  }

  // @override
  _clear() {
    super._clear()
    this._httpParserIds = new Set()
  }

  _findHttpParserIds() {
    // Each connection includes two http parsers, both triggerd by the
    // client connect operation.
    // The TcpSocket connection is triggered by the same resource.
    // However only one of http parsers includes information we need

    for (const a of this._activities.values()) {
      if (a.type !== HttpParser) continue
      // not interested if we can't at least link the http parser to the
      // related socket connection (@see _httpParserIdRelatedToSocket)
      if (a.resource == null || a.resource.socket == null) continue
      this._httpParserIds.add(a.id)
    }
  }

  _httpParserIdRelatedToSocket(socketId) {
    for (const parserId of this._httpParserIds) {
      const a = this._activities.get(parserId)
      // socket will never be `null` since in that case we woulnd't have
      // included the parser during @see _findHttpParserIds
      if (a.resource.socket._asyncId === socketId) return parserId
    }
    return null
  }

  // @override
  _separateIntoGroups() {
    super._separateIntoGroups()

    for (const [ socketId, group ] of this._groups) {
      // The http parser is not triggered by the socket, but its resource
      // includes the socket information and thus its async id which allows
      // us to group it.
      const httpParserId = this._httpParserIdRelatedToSocket(socketId)
      if (httpParserId != null) group.add(httpParserId)
    }
  }

  _addOperation(id, group) {
    const info = this._resolveGroup(group)
    const op = new TcpClientConnectionOperation({
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
      const isgetaddrinfo = this._getaddrinfoIds.has(id)
      const ishttpparser = this._httpParserIds.has(id)
      const isconnect = this._tcpSocketConnectIds.has(id)
      const isshutdown = this._tcpSocketShutdownIds.has(id)
      const info = {
          activity
        , issocket
        , isgetaddrinfo
        , ishttpparser
        , isconnect
        , isshutdown
      }
      groupInfo.push(info)
    }
    return groupInfo
  }
}

exports = module.exports = HttpClientConnectionProcessor
exports.operationSteps = 5
exports.operation = 'http:client connection'
