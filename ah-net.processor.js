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
 * @name process
 * @function
 * @param {Map.<String|Number, Object}> activities the activities mapped by id
 * @param {Boolean} [includeActivities=false] if `true` the activities are attached to each processed operation
 */
function process({ activities, includeActivities = false }) {
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
  , process
}
