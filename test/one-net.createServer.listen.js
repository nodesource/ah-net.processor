const test = require('tape')
// eslint-disable-next-line no-unused-vars
const ocat = require('./utils/ocat')
const spok = require('spok')

const { TcpListenProcessor } = require('../')
const activities = new Map(require('./fixtures/one-server.listen.json'))

const LISTENID = 10
function expectedUserFunctions(separated) {
  return [
    { file: '/Volumes/d/dev/js/async-hooks/ah-net/test/one-tcp-server.listen+close.js'
    , line: 32
    , column: 23
    , inferredName: ''
    , name: 'onconnection'
    , location: 'onconnection (/Volumes/d/dev/js/async-hooks/ah-net/test/one-tcp-server.listen+close.js:32:23)'
    , args: null
    , propertyPaths: separated ? [ 'listen.resource.owner._events.connection' ] : spok.notDefined
    , propertyPath: separated ? spok.notDefined : 'listen.resource.owner._events.connection'
    }
  , { file: '/Volumes/d/dev/js/async-hooks/ah-net/test/one-tcp-server.listen+close.js'
    , line: 33
    , column: 18
    , inferredName: ''
    , name: 'onerror'
    , location: 'onerror (/Volumes/d/dev/js/async-hooks/ah-net/test/one-tcp-server.listen+close.js:33:18)'
    , args: null
    , propertyPaths: separated ? [ 'listen.resource.owner._events.error' ] : spok.notDefined
    , propertyPath: separated ? spok.notDefined : 'listen.resource.owner._events.error'
  }
  , { file: '/Volumes/d/dev/js/async-hooks/ah-net/test/one-tcp-server.listen+close.js'
    , line: 34
    , column: 22
    , inferredName: ''
    , name: 'onlistening'
    , location: 'onlistening (/Volumes/d/dev/js/async-hooks/ah-net/test/one-tcp-server.listen+close.js:34:22)'
    , args: null
    , propertyPaths: separated ? [ 'listen.resource.owner._events.listening' ] : spok.notDefined
    , propertyPath: separated ? spok.notDefined : 'listen.resource.owner._events.listening'
  } ]
}

test('\nactivities for one listening server, not including activities, separating user function', function(t) {
  const includeActivities = false
  const separateFunctions = true
  const { groups, operations } =
    new TcpListenProcessor({ activities, includeActivities, separateFunctions }).process()

  t.equal(groups.size, 1, 'finds one server listen group')
  const op = operations.get(LISTENID)
  spok(t, op,
    { lifeCycle:
      { created: { ms: '26.13ms', ns: 26129000 }
      , destroyed: { ms: '0.00ms', ns: 0 }
      , timeAlive: { ms: '0.00ms', ns: 0 } }
    , createdAt: 'at Test.<anonymous> (/Volumes/d/dev/js/async-hooks/ah-net/test/one-tcp-server.listen+close.js:30:6)'
    , listen: { id: 10, triggerId: 1 }
    , userFunctions: expectedUserFunctions(separateFunctions)
  })

  t.equal(typeof op.listen.activity, 'undefined', 'does not include activity for listen')
  t.end()
})

test('\nactivities for one listening server, not including activities, not separating user function', function(t) {
  const includeActivities = false
  const separateFunctions = false
  const { groups, operations } =
    new TcpListenProcessor({ activities, includeActivities, separateFunctions }).process()

  t.equal(groups.size, 1, 'finds one server listen group')
  const op = operations.get(LISTENID)
  spok(t, op,
    { lifeCycle:
      { created: { ms: '26.13ms', ns: 26129000 }
      , destroyed: { ms: '0.00ms', ns: 0 }
      , timeAlive: { ms: '0.00ms', ns: 0 } }
    , createdAt: 'at Test.<anonymous> (/Volumes/d/dev/js/async-hooks/ah-net/test/one-tcp-server.listen+close.js:30:6)'
    , listen:
      { id: 10
      , triggerId: 1
      , userFunctions: expectedUserFunctions(separateFunctions) }
  })

  t.equal(typeof op.listen.activity, 'undefined', 'does not include activity for listen')
  t.end()
})

test('\nactivities for one listening server, including activities', function(t) {
  const includeActivities = true
  const { groups, operations } =
    new TcpListenProcessor({ activities, includeActivities }).process()

  t.equal(groups.size, 1, 'finds one server listen group')
  const op = operations.get(LISTENID)
  t.equal(typeof op.listen.activity, 'object', 'does include activity for listen')
  t.end()
})

test('\nactivities for one listening server that got closed, not including activities, separating user function', function(t) {
  const includeActivities = false
  const separateFunctions = true
  const activities = new Map(require('./fixtures/one-server.listen+close.json'))
  const { groups, operations } =
    new TcpListenProcessor({ activities, includeActivities, separateFunctions }).process()

  t.equal(groups.size, 1, 'finds one server listen group')
  const op = operations.get(LISTENID)
  spok(t, op,
    { lifeCycle:
      { created: { ms: '23.08ms', ns: 23080000 }
      , destroyed: { ms: '26.82ms', ns: 26816000 }
      , timeAlive: { ms: '3.74ms', ns: 3736000 } }
    , createdAt: 'at Test.<anonymous> (/Volumes/d/dev/js/async-hooks/ah-net/test/one-tcp-server.listen+close.js:31:6)'
    , listen: { id: 10, triggerId: 1 }
    , userFunctions: expectedUserFunctions(separateFunctions)
    }
  )

  t.equal(typeof op.listen.activity, 'undefined', 'does not include activity for listen')
  t.end()
})
