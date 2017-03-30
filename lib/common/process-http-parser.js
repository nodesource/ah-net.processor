const { safeGetVal, uniqueUserFunctions } = require('ah-processor.utils')

/**
  * The http parser resource gives us a huge amount of information.
  * We have access to the socket here (same as we process in _processSocket).
  * The socket allows grouping by the but also is captured at a point where it
  * has the _httpMessage (unlike the socket we process above).
  *
  * We also have access to the _httpMessage and the incoming message here.
  * We do pick and choose only a few of those as to not overwhelm the user, on
  * top of that the ah-net pre-processor already removed some info in order to
  * keep the data a decent size.
  * Ergo here we could get lots more data in the future should we need to.
  *
  * @name processHttpParser
  * @function
  * @param {Object} info information about the http parser of an http server
  * or client, pre-processed by the `HttpConnectionProcessor` or `HttpClientConnectionProcessor`.
  */
module.exports = function processHttpParser(info) {
  const { id, triggerId } = info.activity
  const res = { id, triggerId }
  if (info.activity.resource == null) return res

  const incoming = info.activity.resource.incoming
  if (incoming != null) {
    const httpVersion = safeGetVal(incoming.httpVersion)
    const headersHost = safeGetVal(incoming.headers.host)
    const headersConnection = safeGetVal(incoming.headers.connection)
    const url = safeGetVal(incoming.url)
    const method = safeGetVal(incoming.method)
    const { complete, upgrade, statusCode, statusMessage } = incoming
    res.incoming = {
        httpVersion
      , headersHost
      , headersConnection
      , url
      , method
      , complete
      , upgrade
      , statusCode
      , statusMessage
    }
  }

  const httpMessage = info.activity.resource.socket
    && info.activity.resource.socket._httpMessage
  if (httpMessage != null) {
    const {
        finished
      , _headerSent
      , upgrading
      , chunkedEncoding
      , shouldKeepAlive
      , sendDate
      , _hasBody
      , _sent100
      , statusCode
    } = httpMessage
    const header = safeGetVal(httpMessage._header)
    const statusMessage = safeGetVal(httpMessage.statusMessage)

    res.outgoing = {
        header
      , statusCode
      , statusMessage
      , finished
      , headerSent: _headerSent
      , upgrading
      , chunkedEncoding
      , shouldKeepAlive
      , sendDate
      , hasBody: _hasBody
      , sent100: _sent100
    }
  }
  const functions = info.activity.resource.functions
  if (functions != null) {
    res.userFunctions =
      uniqueUserFunctions(functions, { pathPrefix: 'httpParser.resource' })
  }
  return res
}
