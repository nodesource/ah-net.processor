const test = require('tape')
// eslint-disable-next-line no-unused-vars
const ocat = require('./utils/ocat')
const spok = require('spok')

const { NetServerListenProcessor } = require('../')
const activities = new Map(require('./fixtures/one-connection.server.json'))
const LISTENID = 2

test('\nactivities for a server that served one client connection', function(t) {
  const includeActivities = false
  const separateFunctions = true
  const { groups, operations } =
    new NetServerListenProcessor({ activities, includeActivities, separateFunctions }).process()

  t.equal(groups.size, 1, 'finds one server listen group')
  const op = operations.get(LISTENID)
  spok(t, op,
    { lifeCycle:
      { created: { ms: '6.67ms', ns: 6666000 }
      , destroyed: { ms: '2s', ns: 2017371000 }
      , timeAlive: { ms: '2s', ns: 2010705000 } }
    , createdAt: 'at Object.<anonymous> (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/server:24:4)'
    , listen: { id: 2, triggerId: 1 }
    , sockets:
      [ { id: 4
        , triggerId: 2
        , lifeCycle:
          { created: { ms: '2s', ns: 2010560000 }
          , destroyed: { ms: '2s', ns: 2032761000 }
          , timeAlive: { ms: '22.20ms', ns: 22201000 } } } ]
    , shutdown:
      { id: 5
      , triggerId: 4
      , lifeCycle:
        { created: { ms: '2s', ns: 2013624000 }
        , destroyed: { ms: '2s', ns: 2017798000 }
        , timeAlive: { ms: '4.17ms', ns: 4174000 } } }
    , userFunctions:
      [ { file: '/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/server'
        , line: 26
        , column: 21
        , inferredName: ''
        , name: 'onconnection'
        , location: 'onconnection (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/server:26:21)'
        , args: null
        , propertyPaths: [ 'listen.resource.owner._events.connection' ] }
      , { file: '/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/server'
        , line: 31
        , column: 16
        , inferredName: ''
        , name: 'onerror'
        , location: 'onerror (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/server:31:16)'
        , args: null
        , propertyPaths: [ 'listen.resource.owner._events.error' ] }
      , { file: '/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/server'
        , line: 35
        , column: 20
        , inferredName: ''
        , name: 'onlistening'
        , location: 'onlistening (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/one-connection/server:35:20)'
        , args: null
        , propertyPaths: [ 'listen.resource.owner._events.listening' ] } ] }
  )

  t.equal(typeof op.listen.activity, 'undefined', 'does not include activity for listen')
  t.end()
})
