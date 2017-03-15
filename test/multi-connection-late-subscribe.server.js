const test = require('tape')
// eslint-disable-next-line no-unused-vars
const ocat = require('./utils/ocat')
const spok = require('spok')

const { TcpConnectionProcessor } = require('../')
const activities = new Map(require('./fixtures/multi-connection-late-subscribe.server.json'))
const CONN1ID = 4
const CONN2ID = 9
const CONN3ID = 12

const userFunctions = [
  { file: '/Volumes/d/dev/js/async-hooks/ah-net/scenarios/multi-connections-late-subscribe/server'
  , line: 27
  , column: 21
  , inferredName: ''
  , name: 'onconnection'
  , location: 'onconnection (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/multi-connections-late-subscribe/server:27:21)'
  , args: null
  , propertyPaths: [ 'socket.resource.owner._server._events.connection' ] }
, { file: '/Volumes/d/dev/js/async-hooks/ah-net/scenarios/multi-connections-late-subscribe/server'
  , line: 32
  , column: 16
  , inferredName: ''
  , name: 'onerror'
  , location: 'onerror (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/multi-connections-late-subscribe/server:32:16)'
  , args: null
  , propertyPaths: [ 'socket.resource.owner._server._events.error' ] }
, { file: '/Volumes/d/dev/js/async-hooks/ah-net/scenarios/multi-connections-late-subscribe/server'
  , line: 36
  , column: 20
  , inferredName: ''
  , name: 'onlistening'
  , location: 'onlistening (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/multi-connections-late-subscribe/server:36:20)'
  , args: null
  , propertyPaths: [ 'socket.resource.owner._server._events.listening' ] } ]

test('\nactivities for server that served three connections', function(t) {
  const includeActivities = false
  const separateFunctions = true
  const { groups, operations } =
    new TcpConnectionProcessor({ activities, includeActivities, separateFunctions }).process()

  t.equal(groups.size, 3, 'finds three connection groups')
  const op1 = operations.get(CONN1ID)
  const op2 = operations.get(CONN2ID)
  const op3 = operations.get(CONN3ID)

  spok(t, op1,
    { $topic: 'connection 1'
    , lifeCycle:
      { created: { ms: '330.43ms', ns: 330434000 }
      , destroyed: { ms: '334.33ms', ns: 334326000 }
      , timeAlive: { ms: '3.89ms', ns: 3892000 } }
    , createdAt: '<Unknown>'
    , socket: { id: 4, triggerId: 2 }
    , shutdown: { id: 5, triggerId: op1.socket.id }
    , userFunctions
  })

  spok(t, op2,
    { $topic: 'connection 2'
    , lifeCycle:
      { created: { ms: '512.52ms', ns: 512522000 }
      , destroyed: { ms: '514.50ms', ns: 514503000 }
      , timeAlive: { ms: '1.98ms', ns: 1981000 } }
    , createdAt: '<Unknown>'
    , socket: { id: 9, triggerId: 2 }
    , shutdown: { id: 10, triggerId: op2.socket.id }
    , userFunctions
  })

  spok(t, op3,
    { $topic: 'connection 3'
    , lifeCycle:
      { created: { ms: '693.13ms', ns: 693130000 }
      , destroyed: { ms: '694.11ms', ns: 694105000 }
      , timeAlive: { ms: '0.97ms', ns: 975000 } }
    , createdAt: '<Unknown>'
    , socket: { id: 12, triggerId: 2 }
    , shutdown: { id: 13, triggerId: op3.socket.id }
    , userFunctions
  })

  t.end()
})
