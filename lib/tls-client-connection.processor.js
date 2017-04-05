const ClientConnectionProcessorBase = require('./base/client-connection.processor')

const TCPWrap = 'TCPWRAP'
const TlsWrap = 'TLSWRAP'

/**
 * Sample init stack of tls socket that was created via
 * `tls.connect`:
 *
 *```
 * "at TLSSocket._wrapHandle (_tls_wrap.js:372:42)",
 * "at new TLSSocket (_tls_wrap.js:290:18)",
 * "at Object.exports.connect (_tls_wrap.js:1051:16)",
 * "at Socket.onserverListening (/Volumes/d/dev/js/async-hooks/ah-net/test/tls-one-connection.client.js:91:10)",
 * "at emitOne (events.js:126:20)"
 * ```
 *
 * Code at net.js:372:
 *
 * `handle = options.pipe ? new Pipe() : new TCP();`
 *
 * The 4th frame from the top tells use where it was created.
 */
const tlsSocketInitFrame0Rx = /at TLSSocket\._wrapHandle/i

/**
  * Instantiates an tls client connection data processor to process data collected via
  * [nodesource/ah-net](https://github.com/nodesource/ah-net)
  *
  * Parameters and return value are congruent to the ones explained in
  * [ReadFileProcessor](https://nodesource.github.io/ah-fs.processor/#readfileprocessor)
  *
  * @name TlsClientConnectionProcessor
  * @constructor
  */
class TlsClientConnectionProcessor extends ClientConnectionProcessorBase {
  constructor({
      activities
    , includeActivities
    , separateFunctions
  }) {
    super({
      activities
    , includeActivities
    , separateFunctions
    , isTls: true
    })
  }

  /**
   * Processing algorithm is the same as the [one for the readFile processor](https://nodesource.github.io/ah-fs.processor/#readfileprocessorprocess).
   *
   * ## Sample Return Value
   *
   * For a sample return value please consult the [related tests](https://github.com/nodesource/ah-net.processor/blob/master/test/tls.one-connection.noshutdown.client.js).
   *
   * @name tlsClientConnectionProcessor.process
   * @function
   */
  process() {
    this._clear()
    this._findTlsSocketIds()
    this._findGetaddrinfoIds()
    this._findTlsIds()
    this._findTcpSocketConnectIds()
    this._findTcpSocketShutdownIds()
    this._separateIntoGroups()
    this._addOperations()

    return { groups: this._groups, operations: this._operations }
  }

  // @override
  _clear() {
    super._clear()
    this._tlsSocketIds = new Set()
    this._tlsIds = new Set()
  }

  _findTlsSocketIds() {
    for (const a of this._activities.values()) {
      if (a.type !== TCPWrap) continue
      const owner = a.resource && a.resource.owner
      if (owner == null || owner.proto !== 'TLSSocket') continue
      if (a.initStack == null || a.initStack < 1) continue
      if (!tlsSocketInitFrame0Rx.test(a.initStack[0])) continue
      this._tlsSocketIds.add(a.id)
    }
  }

  _findTlsIds() {
    for (const a of this._activities.values()) {
      if (a.type !== TlsWrap) continue
      this._tlsIds.add(a.id)
    }
  }

  /**
  * The tls client connection activities are grouped as follows
  *
  * ROOT
  *  |
  *  +- TCPWRAP
  *  |    |
  *  |    +- TCPCONNECTWRAP
  *  |    +- SHUTDOWNWRAP
  *  |
  *  +- TLSWRAP
  *       |
  *       +- GETADDRINFOWRAP
  *
  * The challenge here is to relate the TLSWrap to the TCPWrap.
  * Since they aren't linked in an obvious way we use the stacktrace and
  * before/after timestamps to deduce with some certainty that they are
  * related.
  *
  * ## Stacks
  *
  * TCPWrap and related TLSWRAP stacks are exactly the same except for top most
  * frame which has a different line number.
  *
  * TLS stack:
  * ```
  *  "at TLSSocket._wrapHandle (_tls_wrap.js:380:18)",
  *  "at new TLSSocket (_tls_wrap.js:290:18)",
  *  "at Object.exports.connect (_tls_wrap.js:1051:16)",
  *  "at Socket.onserverListening (/Volumes/d/dev/js/async-hooks/ah-net/test/tls-one-connection.client.js:91:10)",
  *  "at emitOne (events.js:126:20)"
  *  ```
  *
  *  TCP stack top frame:
  *
  * ```
  *  "at TLSSocket._wrapHandle (_tls_wrap.js:372:42)",
  * ```
  *
  * Code at _tls_wrap.js:372:
  *
  * `handle = options.pipe ? new Pipe() : new TCP();`
  *
  * Code at _tls_wrap:380:
  *
  * `res = tls_wrap.wrap(handle._externalStream,`
  *
  * The key to assure they could be related is the 4th frame from top since that
  * points to the origin of the connection.
  * Additionally they will have the same `triggerId`.
  *
  * ## Init/Before/After TimeStamps
  *
  * TCPWRAP:
  *
  *   init:   148565595
  *   before: 157863372
  *   after : 158064014
  *
  * TLSWRAP:
  *
  *   init:   149439787
  *   before: 153352646
  *   after:  153461245
  *
  * As TLS- and TCPWRAPS are related if:
  *
  * - tls inited just after tcp
  * - tcp before/after are just before tls before/after
  *
  * It may be enough to just consider the proximity of the inits, but for now
  * we include the before/after restrictions as well.
  *
  * @private
  * @override
  */
 _separateIntoGroups() {
    super._separateIntoGroups()
    const maxInitDelta = 2E6      // 2 milliseconds
    const maxBeforeDelta = 10E6   // 10 milliseconds
    const maxAfterDelta = 10E6   // 10 milliseconds

    for (const [ socketId, group ] of this._groups) {
      const tcp = this._activities.get(socketId)
      if (tcp.initStack.length < 5
        || tcp.before.length < 1
        || tcp.after.length < 1) continue

      const tcpCreated = tcp.initStack[3]
      const tcpInit = tcp.init[0]
      const tcpBefore = tcp.before[0]
      const tcpAfter = tcp.after[0]

      for (const tlsId of this._tlsIds) {
        // Ensure same triggerId
        const tls = this._activities.get(tlsId)
        if (tls.triggerId !== tcp.triggerId) continue

      if (tls.initStack.length < 5
        || tls.before.length < 1
        || tls.after.length < 1) continue

        // Ensure same stacks
        const tlsCreated = tls.initStack[3]
        if (tlsCreated !== tcpCreated) continue

        // Ensure timestamps indicate relation
        const tlsInit = tls.init[0]
        const tlsBefore = tls.before[0]
        const tlsAfter = tls.after[0]

        // TCP   init:   148565595
        // TLS   init:   149439787
        // Delta     :      874192
        if (tlsInit < tcpInit) continue
        if (tlsInit - tcpInit > maxInitDelta) continue

        // TCP: before: 157863372
        // TLS  before: 153352646
        // Delta      :   4510726  4.5ms
        if (tcpBefore < tlsBefore) continue
        if (tcpBefore - tlsBefore > maxBeforeDelta) continue

        // TCP  after: 158064014
        // TLS  after: 153461245
        // Delta     :   4602769  4.6ms
        if (tcpAfter < tlsAfter) continue
        if (tcpAfter - tlsAfter > maxAfterDelta) continue

        // We found a tls wrap that's most likely related to the tcp wrap
        // Therefore we add it to the group
        group.add(tlsId)

        // Now we find the addrinfo that was triggered by this tls and add it as well
        for (const addrinfoId of this._getaddrinfoIds) {
          const { triggerId } = this._activities.get(addrinfoId)
          if (triggerId !== tlsId) continue
          group.add(addrinfoId)
          break
        }
      }
    }
  }

  _resolveGroup(group) {
    const groupInfo = []
    for (const id of group) {
      const activity = this._activities.get(id)
      const issocket = this._tlsSocketIds.has(id)
      const isgetaddrinfo = this._getaddrinfoIds.has(id)
      const istls = this._tlsIds.has(id)
      const isconnect = this._tcpSocketConnectIds.has(id)
      const isshutdown = this._tcpSocketShutdownIds.has(id)
      const info = {
          activity
        , issocket
        , isgetaddrinfo
        , istls
        , isconnect
        , isshutdown
      }
      groupInfo.push(info)
    }
    return groupInfo
  }
}

exports = module.exports = TlsClientConnectionProcessor
exports.operationSteps = 5
exports.operation = 'tls:client connection'
