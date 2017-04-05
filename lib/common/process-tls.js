const { safeGetVal, uniqueUserFunctions } = require('ah-processor.utils')

module.exports = function processTls(info) {
  const tls = {
      id: info.activity.id
    , triggerId: info.activity.triggerId
  }

  const owner = info.activity.resource != null &&
    info.activity.resource.owner

  if (owner != null) {
    const tlsOptions = owner._tlsOptions
    if (tlsOptions != null) {
      tls.optsRequestCert        = tlsOptions.requestCert
      tls.optsRejectUnauthorized = tlsOptions.rejectUnauthorized
      tls.optsHandshakeTimeout   = tlsOptions.handshakeTimeout
    }

    const handle = owner._handle
    if (handle != null) {
      tls.writeQueueSize    = handle.writeQueueSize
      tls.fd                = handle.fd
      tls.bytesRead         = handle.bytesRead
      tls.lastHandshakeTime = handle.lastHandshakeTime
      tls.handshakes        = handle.handshakes
    }

    const server = owner.server
    if (server != null) {
      tls._contexts = server._contexts
      tls.requestCert = server.requestCert
      tls.rejectUnauthorized = server.rejectUnauthorized
      tls.honorCipherOrder = server.honorCipherOrder
      tls.ciphers = safeGetVal(server.ciphers)
      tls.sessionIdContext = safeGetVal(server.sessionIdContext)
      tls._connectionKey = safeGetVal(server._connectionKey)
    }

    ;[ '_secureEstablished'
    , '_securePending'
    , '_newSessionPending'
    , '_controlReleased'
    , 'servername'
    , 'npnProtocol'
    , 'alpnProtocol'
    , 'authorized'
    , 'authorizationError'
    , 'encrypted'
    , '_hadError'
    , '_requestCert'
    , '_rejectUnauthorized' ].forEach(x => (tls[x] = owner[x]))
  }

  if (info.activity.resource != null) {
    const functions = info.activity.resource.functions
    tls.userFunctions =
      uniqueUserFunctions(functions, { pathPrefix: 'tls.resource' })
  }
  return tls
}
