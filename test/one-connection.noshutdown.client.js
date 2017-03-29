const test = require('tape')
// eslint-disable-next-line no-unused-vars
const ocat = require('./utils/ocat')
const spok = require('spok')

const { TcpClientConnectionProcessor } = require('../')
const activities = new Map(require('../test/fixtures/one-connection.noshutdown.client.json'))
const ADDRINFOID = 3

test('\nactivities for a client that established one connection to a server that never shutdown', function(t) {
  const includeActivities = false
  const separateFunctions = true
  const { operations, groups } =
    new TcpClientConnectionProcessor({ activities, includeActivities, separateFunctions }).process()

  t.equal(groups.size, 1, 'finds one client connection group')
  const op = operations.get(ADDRINFOID)

  spok(t, op,
     { lifeCycle:
       { created: { ms: '2.60ms', ns: 2605000 }
       , destroyed: spok.notDefined
       , timeAlive: null }
     , createdAt: 'at Object.<anonymous> (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/client:19:4)'
     , socket: { id: 2, triggerId: 1 }
     , getaddrinfo: { id: 3, triggerId: 1 }
     , connect: { id: 5, triggerId: 3 }
     , shutdown: spok.notDefined
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

