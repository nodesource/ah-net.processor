const TCPWrap = 'TCPWRAP'
const TcpListenOperation = require('./tcp-listen.operation')

/*
 * Sample init stack of net.createServer().listen():
 *
 *  "at createServerHandle (net.js:1200:14)",
 *  "at Server._listen2 (net.js:1244:14)",
 *  "at listen (net.js:1312:10)",
 *  "at Server.listen (net.js:1391:9)",
 *  "at Test.<anonymous> (/Volumes/d/dev/js/async-hooks/ah-net/test/one-tcp-server.listen+close.js:30:6)"
 *
 * Code at net.js:1200:
 *
 * `handle = new TCP();`
 *
 * Bottom frame has info about where `server.listen()` call originated.
 *
 */
const listenInitFrame0Rx = /at createServerHandle/i

class TcpListenProcessor {
  constructor({ activities, includeActivities = false, separateFunctions = true }) {
    this._activities = activities
    this._includeActivities = includeActivities
    this._separateFunctions = separateFunctions
  }

  process() {
    this._clear()
    this._findTcpListenIds()
    this._separateIntoGroups()
    this._addOperations()

    return { groups: this._groups, operations: this._operations }
  }

  _clear() {
    this._tcpListenIds = new Set()
    this._groups = new Map()
    this._operations = new Map()
  }

  _findTcpListenIds() {
    for (const a of this._activities.values()) {
      if (a.type !== TCPWrap) continue
      if (a.initStack == null || a.initStack < 1) continue
      if (!listenInitFrame0Rx.test(a.initStack[0])) continue
      this._tcpListenIds.add(a.id)
    }
  }

  // Separating and resolving groups may not make much sense in this case since
  // we only ever will have a listen in each group, but to be consistent with other
  // processors we follow the same structure anyways.
  _separateIntoGroups() {
    for (const listenId of this._tcpListenIds) {
      const group = new Set([ listenId ])
      this._groups.set(listenId, group)
    }
  }

  _addOperations() {
    for (const [ id, group ] of this._groups) this._addOperation(id, group)
  }

  _addOperation(id, group) {
    const info = this._resolveGroup(group)
    const op = new TcpListenOperation({
        group: info
      , includeActivities: this._includeActivities
    })
    this._operations.set(id, op.summary({ separateFunctions: this._separateFunctions }))
  }

  _resolveGroup(group) {
    const groupInfo = []
    for (const id of group) {
      const activity = this._activities.get(id)
      const islisten = this._tcpListenIds.has(id)
      const info = { activity, islisten }
      groupInfo.push(info)
    }
    return groupInfo
  }
}

module.exports = TcpListenProcessor
