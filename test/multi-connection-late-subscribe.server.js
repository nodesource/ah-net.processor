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
      { created: { ms: '497.77ms', ns: 497768000 }
      , destroyed: { ms: '501.62ms', ns: 501618000 }
      , timeAlive: { ms: '3.85ms', ns: 3850000 } }
    , createdAt: '<Unknown>'
    , socket: { id: 4, triggerId: 2, connectionKey: '6::::4444' }
    , shutdown: { id: 5, triggerId: op1.socket.id }
    , userFunctions
  })

  spok(t, op2,
    { $topic: 'connection 2'
    , lifeCycle:
      { created: { ms: '680.68ms', ns: 680676000 }
      , destroyed: { ms: '682.32ms', ns: 682317000 }
      , timeAlive: { ms: '1.64ms', ns: 1641000 } }
    , createdAt: '<Unknown>'
    , socket: { id: 9, triggerId: 2, connectionKey: '6::::4444' }
    , shutdown: { id: 10, triggerId: op2.socket.id }
    , userFunctions
  })

  spok(t, op3,
    { $topic: 'connection 3'
    , lifeCycle:
      { created: { ms: '868.16ms', ns: 868162000 }
      , destroyed: { ms: '869.47ms', ns: 869469000 }
      , timeAlive: { ms: '1.31ms', ns: 1307000 } }
    , createdAt: '<Unknown>'
    , socket: { id: 12, triggerId: 2, connectionKey: '6::::4444' }
    , shutdown: { id: 13, triggerId: op3.socket.id }
    , userFunctions
  })

  t.end()
})
