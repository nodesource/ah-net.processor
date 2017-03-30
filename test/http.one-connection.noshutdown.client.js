const test = require('tape')
// eslint-disable-next-line no-unused-vars
const ocat = require('./utils/ocat')
const spok = require('spok')
const userFunctions = require('./common/http.one-connection.client.user-functions')

const { HttpClientConnectionProcessor } = require('../')
const activities = new Map(require('../test/fixtures/http-one-connection.noshutdown.client.json'))
const SOCKETID = 10

test('\nactivities for a client that established one connection to a server', function(t) {
  const includeActivities = false
  const separateFunctions = true
  const { operations, groups } =
    new HttpClientConnectionProcessor({ activities, includeActivities, separateFunctions }).process()

  t.equal(groups.size, 1, 'finds one client connection group')
  const op = operations.get(SOCKETID)

  spok(t, op,
     { lifeCycle:
       { created: { ms: '18.11ms', ns: 18110308 }
       , destroyed: spok.notDefined
       , timeAlive: spok.notDefined }
     , createdAt: 'at Agent.createSocket (_http_agent.js:220:26)'
     , socket: { id: 10, triggerId: 1 }
     , getaddrinfo: { id: 11, triggerId: SOCKETID }
     , connect: { id: 16, triggerId: SOCKETID }
     , httpParser:
       { id: 14
       , triggerId: 1
       , incoming:
          { httpVersion: '1.1'
          , headersHost: null
          , headersConnection: 'close'
          , url: ''
          , method: null
          , complete: false
          , upgrade: false
          , statusCode: 302
          , statusMessage: { type: 'string', len: 5, included: 5, val: 'Found' } }
       , outgoing:
          { header: 'GET / HTTP/1.1\r\nHost: google.com\r\nConnection: close\r\n\r\n'
          , statusCode: spok.notDefined
          , statusMessage: null
          , finished: true
          , headerSent: true
          , upgrading: false
          , chunkedEncoding: false
          , shouldKeepAlive: false
          , sendDate: false
          , hasBody: true
          , sent100: spok.notDefined } }
     , shutdown: spok.notDefined
     , userFunctions }
  )
  t.end()
})
