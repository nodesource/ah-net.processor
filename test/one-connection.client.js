const test = require('tape')
// eslint-disable-next-line no-unused-vars
const ocat = require('./utils/ocat')
const spok = require('spok')

const { TcpClientConnectionProcessor } = require('../')
const activities = new Map(require('../test/fixtures/one-connection.client.json'))
const SOCKETID = 2

test('\nactivities for a client that established one connection to a server', function(t) {
  const includeActivities = false
  const separateFunctions = true
  const { operations, groups } =
    new TcpClientConnectionProcessor({ activities, includeActivities, separateFunctions }).process()

  t.equal(groups.size, 1, 'finds one client connection group')
  const op = operations.get(SOCKETID)

  spok(t, op,
     { lifeCycle:
       { created: { ms: '2.57ms', ns: 2568814 }
       , destroyed: { ms: '20.28ms', ns: 20276352 }
       , timeAlive: { ms: '17.71ms', ns: 17707538 } }
     , createdAt: 'at Object.<anonymous> (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/client:19:4)'
     , socket: { id: 2, triggerId: 1 }
     , getaddrinfo: { id: 3, triggerId: SOCKETID }
     , connect: { id: 5, triggerId: SOCKETID }
     , httpParser: spok.notDefined
     , shutdown: { id: 6, triggerId: SOCKETID }
     , userFunctions:
       [ { file: '/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/client'
         , line: 27
         , column: 14
         , inferredName: ''
         , name: 'onend'
         , location: 'onend (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/client:27:14)'
         , args: null
         , propertyPaths: [ 'socket.resource.owner._events.end[1]' ] }
       , { file: '/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/client'
         , line: 24
         , column: 15
         , inferredName: ''
         , name: 'ondata'
         , location: 'ondata (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/client:24:15)'
         , args: null
         , propertyPaths: [ 'socket.resource.owner._events.data' ] } ] }
  )

  t.end()
})

