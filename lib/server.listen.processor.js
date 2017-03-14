const TCPWrap = 'TCPWRAP'
const ShutdownWrap = 'SHUTDOWNWRAP'
const { idsTriggeredBy } = require('ah-processor.utils')
const TcpListenOperation = require('./server.listen.operation')

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

class NetTcpListenProcessor {
  constructor({ activities, includeActivities = false, separateFunctions = true }) {
    this._activities = activities
    this._includeActivities = includeActivities
    this._separateFunctions = separateFunctions
  }

  process() {
    this._clear()
    this._findTcpListenIds()
    this._findTcpSocketIds()
    this._findTcpSocketShutdownIds()
    this._separateIntoGroups()
    this._addOperations()

    return { groups: this._groups, operations: this._operations }
  }

  _clear() {
    this._tcpListenIds = new Set()
    this._tcpSocketIds = new Set()
    this._tcpSocketShutdownIds = new Set()
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
    const stop = id =>
         !this._tcpListenIds.has(id)
      && !this._tcpSocketIds.has(id)
      && !this._tcpSocketShutdownIds.has(id)

    for (const listenId of this._tcpListenIds) {
      const group = idsTriggeredBy(this._activities, listenId, stop)
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
      const issocket = this._tcpSocketIds.has(id)
      const isshutdown = this._tcpSocketShutdownIds.has(id)
      const info = { activity, islisten, issocket, isshutdown }
      groupInfo.push(info)
    }
    return groupInfo
  }
}

module.exports = NetTcpListenProcessor
