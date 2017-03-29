const test = require('tape')
// eslint-disable-next-line no-unused-vars
const ocat = require('./utils/ocat')
const spok = require('spok')

const { TcpConnectionProcessor } = require('../')
const activities = new Map(require('./fixtures/multi-connection-late-subscribe.two-noshutdown.server.json'))
const CONN1ID = 4
const CONN2ID = 9
const CONN3ID = 12

const userFunctions = require(
  './common/multi-connection-late-subscription.user-functions'
)

test('\nactivities for server that served three connections, the two last ones did not shutdown', function(t) {
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
      , destroyed: spok.notDefined
      , timeAlive: null }
    , createdAt: '<Unknown>'
    , socket: { id: 9, triggerId: 2, connectionKey: '6::::4444' }
    , shutdown: spok.notDefined
    , userFunctions
  })

  spok(t, op3,
    { $topic: 'connection 3'
    , lifeCycle:
      { created: { ms: '868.16ms', ns: 868162000 }
      , destroyed: spok.notDefined
      , timeAlive: null }
    , createdAt: '<Unknown>'
    , socket: { id: 12, triggerId: 2, connectionKey: '6::::4444' }
    , shutdown: spok.notDefined
    , userFunctions
  })

  t.end()
})
