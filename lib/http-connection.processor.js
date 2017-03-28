const { idsTriggeredBy } = require('ah-processor.utils')
const TcpConnectionOperation = require('./tcp-connection.operation')
const ServerConnectionProcessorBase = require('./base/server-connection.processor')

const HttpParser = 'HTTPPARSER'

/**
 * Sample init stack of http parser we are interested in:
 *
 * ```
 * "at Server.connectionListener (_http_server.js:302:10)",
 * "at emitOne (events.js:121:13)",
 * "at Server.emit (events.js:216:7)",
 * "at TCP.onconnection (net.js:1535:8)"
 * ```
 *
 * Code at _http_server.js:302:
 *
 * `parser.reinitialize(HTTPParser.REQUEST);`
 *
 * The parser we aren't interested in is allocated right before
 * at _http_server.js:301:
 *
 * `var parser = parsers.alloc();`
 */
const httpParserInitFrame0Rx = /at Server.connectionListener/i

/**
  * Instantiates an http server connection data processor to process data collected via
  * [nodesource/ah-net](https://github.com/nodesource/ah-net)
  *
  * Parameters and return value are congruent to the ones explained in
  * [ReadFileProcessor](https://nodesource.github.io/ah-fs.processor/#readfileprocessor)
  *
  * @name HttpConnectionProcessor
  * @constructor
  */
class HttpConnectionProcessor extends ServerConnectionProcessorBase {
  /**
   * Processing algorithm is the same as the [one for the readFile processor](https://nodesource.github.io/ah-fs.processor/#readfileprocessorprocess).
   *
   * ## Sample Return Value
   *
   * For a sample return value please consult the [related tests](https://github.com/nodesource/ah-net.processor/blob/master/test/http.one-connection.server.js).
   *
   * @name httpConnectionProcessor.process
   * @function
   */
  process() {
    this._clear()
    this._findTcpSocketIds()
    this._findTcpSocketShutdownIds()
    this._findHttpParserIds()
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
    // server listen operation.
    // The TcpSocket connection is triggered by the same resource.
    // However only one of them includes information we need

    for (const a of this._activities.values()) {
      if (a.type !== HttpParser) continue
      if (a.initStack == null || a.initStack < 1) continue
      if (!httpParserInitFrame0Rx.test(a.initStack[0])) continue
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

  _separateIntoGroups() {
    const stop = id => !this._tcpSocketShutdownIds.has(id)

    for (const socketId of this._tcpSocketIds) {
      const group = idsTriggeredBy(this._activities, socketId, stop)
      // The http parser is not triggered by the socket, but its resource
      // includes the socket information and thus its async id which allows
      // us to group it.
      const httpParserId = this._httpParserIdRelatedToSocket(socketId)
      if (httpParserId != null) group.add(httpParserId)
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
      const ishttpparser = this._httpParserIds.has(id)
      const info = { activity, issocket, isshutdown, ishttpparser }
      groupInfo.push(info)
    }
    return groupInfo
  }
}

exports = module.exports = HttpConnectionProcessor
exports.operationSteps = 3
exports.operation = 'http:server connection'
