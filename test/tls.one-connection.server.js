const test = require('tape')
// eslint-disable-next-line no-unused-vars
const ocat = require('./utils/ocat')
const spok = require('spok')

const { TlsConnectionProcessor } = require('../')
const activities = new Map(require('../test/fixtures/tls-one-connection.server.json'))

test('\nactivities for a tls server that served one client connection that shutdown', function(t) {
  const includeActivities = false
  const separateFunctions = true
  const { groups, operations } =
    new TlsConnectionProcessor({ activities, includeActivities, separateFunctions }).process()

  t.equal(groups.size, 1, 'finds one tls connection group')
  const SOCKETID = groups.keys().next().value
  const op = operations.get(SOCKETID)

  spok(t, op,
     { lifeCycle:
       { created: { ms: '127.24ms', ns: 127241890 }
       , destroyed: { ms: '136.39ms', ns: 136393139 }
       , timeAlive: { ms: '9.15ms', ns: 9151249 } }
     , createdAt: '<Unknown>'
     , socket: { id: SOCKETID, triggerId: 11, connectionKey: '6:::1:0' }
     , httpParser: spok.notDefined
     , tls:
       { id: 15
       , triggerId: 11
       , optsRequestCert: false
       , optsRejectUnauthorized: true
       , optsHandshakeTimeout: 120000
       , writeQueueSize: 1
       , fd: 17
       , bytesRead: 0
       , lastHandshakeTime: 250
       , handshakes: 0
       , _contexts: 0
       , requestCert: false
       , rejectUnauthorized: true
       , honorCipherOrder: true
       , ciphers: 'AECDH-NULL-SHA'
       , sessionIdContext: 'e15221401a28960f6e4b321b42ca7266'
       , _connectionKey: '6:::1:0'
       , _secureEstablished: false
       , _securePending: false
       , _newSessionPending: false
       , _controlReleased: false
       , servername: spok.notDefined
       , npnProtocol: spok.notDefined
       , alpnProtocol: spok.notDefined
       , authorized: false
       , authorizationError: spok.notDefined
       , encrypted: true
       , _hadError: false
       , _requestCert: false
       , _rejectUnauthorized: true }
     , shutdown: { id: 19, triggerId: 14 }
     , userFunctions:
       [ { file: '/Volumes/d/dev/js/async-hooks/ah-net/test/tls-one-connection.server.js'
         , line: 77
         , column: 24
         , inferredName: ''
         , name: 'onsocketEnd'
         , location: 'onsocketEnd (/Volumes/d/dev/js/async-hooks/ah-net/test/tls-one-connection.server.js:77:24)'
         , args: null
         , propertyPaths:
            [ 'socket.resource.owner._events.finish[1]'
            , 'tls.resource.owner.ssl._parentWrap._events.finish[1]' ] }
       , { file: '/Volumes/d/dev/js/async-hooks/ah-net/test/tls-one-connection.server.js'
         , line: 71
         , column: 23
         , inferredName: ''
         , name: 'onconnection'
         , location: 'onconnection (/Volumes/d/dev/js/async-hooks/ah-net/test/tls-one-connection.server.js:71:23)'
         , args: null
         , propertyPaths:
            [ 'socket.resource.owner._server._events.connection[1]'
            , 'tls.resource.owner.ssl._parentWrap._server._events.connection[1]' ] }
       , { file: '/Volumes/d/dev/js/async-hooks/ah-net/test/tls-one-connection.server.js'
         , line: 56
         , column: 18
         , inferredName: ''
         , name: 'onerror'
         , location: 'onerror (/Volumes/d/dev/js/async-hooks/ah-net/test/tls-one-connection.server.js:56:18)'
         , args: null
         , propertyPaths:
            [ 'socket.resource.owner._server._events.error'
            , 'tls.resource.owner.ssl._parentWrap._server._events.error' ] }
       , { file: '/Volumes/d/dev/js/async-hooks/ah-net/test/tls-one-connection.server.js'
         , line: 57
         , column: 22
         , inferredName: ''
         , name: 'onlistening'
         , location: 'onlistening (/Volumes/d/dev/js/async-hooks/ah-net/test/tls-one-connection.server.js:57:22)'
         , args: null
         , propertyPaths:
            [ 'socket.resource.owner._server._events.listening'
            , 'tls.resource.owner.ssl._parentWrap._server._events.listening' ] } ] }
  )
  t.end()
})
