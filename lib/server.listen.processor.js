const TCPWrap = 'TCPWRAP'
const ServerListenOperation = require('./server.listen.operation')

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

class NetServerListenProcessor {
  constructor({ activities, includeActivities = false, separateFunctions = true }) {
    this._activities = activities
    this._includeActivities = includeActivities
    this._separateFunctions = separateFunctions
  }

  process() {
    this._clear()
    this._findServerListenIds()
    this._separateIntoGroups()
    this._addOperations()

    return { groups: this._groups, operations: this._operations }
  }

  _clear() {
    this._serverListenIds = new Set()
    this._groups = new Map()
    this._operations = new Map()
  }

  _findServerListenIds() {
    for (const a of this._activities.values()) {
      if (a.type !== TCPWrap) continue
      if (a.initStack == null || a.initStack < 1) continue
      if (!listenInitFrame0Rx.test(a.initStack[0])) continue
      this._serverListenIds.add(a.id)
    }
  }

  _separateIntoGroups() {
    // For now only the serverListen id is added to each group
    // we may encounter related resources in the future whose ids
    // we'd group together with it.
    // Same applies to operations.
    for (const listenId of this._serverListenIds) {
      const group = new Set([ listenId ])
      this._groups.set(listenId, group)
    }
  }

  _addOperations() {
    for (const [ id, group ] of this._groups) this._addOperation(id, group)
  }

  _addOperation(id, group) {
    const info = this._resolveGroup(group)
    const op = new ServerListenOperation({
        group: info
      , includeActivities: this._includeActivities
    })
    this._operations.set(id, op.summary({ separateFunctions: this._separateFunctions }))
  }

  _resolveGroup(group) {
    const groupInfo = []
    for (const id of group) {
      const activity = this._activities.get(id)
      const islisten = this._serverListenIds.has(id)
      const info = { activity, islisten }
      groupInfo.push(info)
    }
    return groupInfo
  }
}

module.exports = NetServerListenProcessor
