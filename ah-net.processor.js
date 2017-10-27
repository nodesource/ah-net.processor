const { processActivities } = require('ah-processor.utils')
const TcpListenProcessor = require('./lib/tcp-listen.processor')
const TcpConnectionProcessor = require('./lib/tcp-connection.processor')
const TcpClientConnectionProcessor = require('./lib/tcp-client-connection.processor')
const HttpConnectionProcessor = require('./lib/http-connection.processor')
const HttpClientConnectionProcessor = require('./lib/http-client-connection.processor')
const TlsClientConnectionProcessor = require('./lib/tls-client-connection.processor')
const TlsConnectionProcessor = require('./lib/tls-connection.processor')

/**
 * Processes all network related activities found inside the supplied `activities`.
 * Groups them into operations and pulls out meaningful data for each.
 *
 * Lots of activity data is omitted from the result, therefore make sure to include
 * activities if you need it.
 *
 * @name processNetwork
 * @function
 * @param {Object} $0
 * @param {Map.<string, Object>} $0.activities a map of async activities hashed by id
 * @param {boolean} [$0.includeActivities=false] if `true` the actual activities are appended to the output
 */
function processNetwork({ activities, includeActivities = false }) {
  const processors = [
      TcpListenProcessor
    , TcpConnectionProcessor
    , TcpClientConnectionProcessor
    , HttpConnectionProcessor
    , HttpClientConnectionProcessor
    , TlsConnectionProcessor
    , TlsClientConnectionProcessor
  ]
  return processActivities({ activities, processors, includeActivities })
}

module.exports = {
    TcpListenProcessor
  , TcpConnectionProcessor
  , TcpClientConnectionProcessor
  , HttpConnectionProcessor
  , HttpClientConnectionProcessor
  , TlsConnectionProcessor
  , TlsClientConnectionProcessor
  , processNetwork
}
