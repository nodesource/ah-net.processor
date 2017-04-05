const test = require('tape')
// eslint-disable-next-line no-unused-vars
const ocat = require('./utils/ocat')
const spok = require('spok')

const { TlsClientConnectionProcessor } = require('../')
const activities = new Map(require('../test/fixtures/tls-one-connection.noshutdown.client.json'))

const SOCKETID = 42
test('\nactivities for a tls client that established one connection to a server that did not shutdown', function(t) {
  const includeActivities = false
  const separateFunctions = true
  const { operations, groups } =
    new TlsClientConnectionProcessor({ activities, includeActivities, separateFunctions }).process()

  t.equal(groups.size, 1, 'finds one tls client connection group')
  const op = operations.get(SOCKETID)
  spok(t, op,
     { lifeCycle:
       { created: { ms: '144.10ms', ns: 144099920 }
       , destroyed: spok.notDefined
       , timeAlive: spok.notDefined }
     , createdAt: spok.test(/at Socket\.onserverListening.+tls-one-connection.client\.js/)
     , socket: { id: SOCKETID, triggerId: spok.gtz }
     , getaddrinfo: { id: spok.gtz, triggerId: spok.gtz }
     , connect: { id: spok.gtz, triggerId: SOCKETID }
     , shutdown: spok.notDefined
     , tls:
       { id: spok.gtz
       , triggerId: spok.gtz
       , optsRequestCert: true
       , optsRejectUnauthorized: false
       , optsHandshakeTimeout: spok.notDefined
       , writeQueueSize: 1
       , fd: 22
       , bytesRead: 0
       , lastHandshakeTime: spok.notDefined
       , handshakes: spok.notDefined
       , _secureEstablished: false
       , _securePending: false
       , _newSessionPending: false
       , _controlReleased: true
       , servername: spok.notDefined
       , npnProtocol: spok.notDefined
       , alpnProtocol: spok.notDefined
       , authorized: false
       , authorizationError: spok.notDefined
       , encrypted: true
       , _hadError: false
       , _requestCert: true
       , _rejectUnauthorized: false }
     , userFunctions:
       [ { file: '/Volumes/d/dev/js/async-hooks/ah-net/test/tls-one-connection.client.js'
         , line: 99
         , column: 21
         , inferredName: ''
         , name: 'ondata'
         , location: 'ondata (/Volumes/d/dev/js/async-hooks/ah-net/test/tls-one-connection.client.js:99:21)'
         , args: spok.notDefined
         , propertyPaths: [ 'socket.resource.owner._events.data' ] } ] }
  )
  t.end()
})
