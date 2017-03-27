const test = require('tape')
// eslint-disable-next-line no-unused-vars
const ocat = require('./utils/ocat')
const spok = require('spok')

const { HttpConnectionProcessor, TcpListenProcessor } = require('../')
const activities = new Map(require('./fixtures/http-one-connection.server.json'))

test('\nactivities for an http server that served one client connection', function(t) {
  const includeActivities = false
  const separateFunctions = true
  const { groups, operations } =
    new HttpConnectionProcessor({ activities, includeActivities, separateFunctions }).process()

  t.equal(groups.size, 1, 'finds one http connection group')
  const SOCKETID = groups.keys().next().value
  const op = operations.get(SOCKETID)

  spok(t, op,
    { lifeCycle:
      { created: { ms: '210.19ms', ns: 210192240 }
      , destroyed: { ms: '240.21ms', ns: 240206088 }
      , timeAlive: { ms: '30.01ms', ns: 30013848 } }
    , createdAt: '<Unknown>'
    , socket: { id: SOCKETID, triggerId: 2, connectionKey: '6::::4444' }
    , httpParser:
      { id: 7
      , triggerId: 2
      , incoming:
        { httpVersion: '1.1'
        , headersHost: 'localhost:'
        , headersConnection: 'close'
        , url: '/shutdown'
        , method: 'GET'
        , complete: false
        , upgrade: false
        , statusCode: null
        , statusMessage: null }
      , outgoing:
        { header: 'HTTP/1.1 2'
        , statusCode: 200
        , statusMessage: 'OK'
        , finished: true
        , headerSent: true
        , upgrading: false
        , chunkedEncoding: true
        , shouldKeepAlive: false
        , sendDate: true
        , hasBody: true
        , sent100: false } }
    , shutdown: { id: 13, triggerId: 4 }
    , userFunctions:
      [ { file: '/Volumes/d/dev/js/async-hooks/ah-net/scenarios/http-one-connection/server'
        , line: 38
        , column: 18
        , inferredName: ''
        , name: 'onrequest'
        , location: 'onrequest (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/http-one-connection/server:38:18)'
        , args: null
        , propertyPaths:
          [ 'socket.resource.owner._server._events.request'
          , 'httpParser.resource.incoming.client._server._events.request' ] }
      , { file: '/Volumes/d/dev/js/async-hooks/ah-net/scenarios/http-one-connection/server'
        , line: 46
        , column: 16
        , inferredName: ''
        , name: 'onerror'
        , location: 'onerror (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/http-one-connection/server:46:16)'
        , args: null
        , propertyPaths:
          [ 'socket.resource.owner._server._events.error'
          , 'httpParser.resource.incoming.client._server._events.error' ] }
      , { file: '/Volumes/d/dev/js/async-hooks/ah-net/scenarios/http-one-connection/server'
        , line: 50
        , column: 20
        , inferredName: ''
        , name: 'onlistening'
        , location: 'onlistening (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/http-one-connection/server:50:20)'
        , args: null
        , propertyPaths:
          [ 'socket.resource.owner._server._events.listening'
          , 'httpParser.resource.incoming.client._server._events.listening' ] } ] }
  )
  t.end()
})

test('\nactivities for a listening http server', function(t) {
  const includeActivities = false
  const separateFunctions = true
  const { groups, operations } =
    new TcpListenProcessor({ activities, includeActivities, separateFunctions }).process()

  t.equal(groups.size, 1, 'finds one tcp listen group')
  const LISTENID = groups.keys().next().value
  const op = operations.get(LISTENID)
  spok(t, op,
    { lifeCycle:
      { created: { ms: '11.15ms', ns: 11148293 }
      , destroyed: { ms: '240.43ms', ns: 240430312 }
      , timeAlive: { ms: '229.28ms', ns: 229282019 } }
    , createdAt: 'at Object.<anonymous> (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/http-one-connection/server:24:4)'
    , listen: { id: LISTENID, triggerId: 1, connectionKey: '6::::4444' }
    , userFunctions:
      [ { file: '/Volumes/d/dev/js/async-hooks/ah-net/scenarios/http-one-connection/server'
        , line: 38
        , column: 18
        , inferredName: ''
        , name: 'onrequest'
        , location: 'onrequest (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/http-one-connection/server:38:18)'
        , args: null
        , propertyPaths: [ 'listen.resource.owner._events.request' ] }
      , { file: '/Volumes/d/dev/js/async-hooks/ah-net/scenarios/http-one-connection/server'
        , line: 46
        , column: 16
        , inferredName: ''
        , name: 'onerror'
        , location: 'onerror (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/http-one-connection/server:46:16)'
        , args: null
        , propertyPaths: [ 'listen.resource.owner._events.error' ] }
      , { file: '/Volumes/d/dev/js/async-hooks/ah-net/scenarios/http-one-connection/server'
        , line: 50
        , column: 20
        , inferredName: ''
        , name: 'onlistening'
        , location: 'onlistening (/Volumes/d/dev/js/async-hooks/ah-net/scenarios/http-one-connection/server:50:20)'
        , args: null
        , propertyPaths: [ 'listen.resource.owner._events.listening' ] } ] }
  )

  t.end()
})
