const { processActivities } = require('ah-processor.utils')
const TcpListenProcessor = require('./lib/tcp-listen.processor')
const TcpConnectionProcessor = require('./lib/tcp-connection.processor')

function process({ activities, includeActivities = false }) {
  const processors = [
      TcpListenProcessor
    , TcpConnectionProcessor
  ]
  return processActivities({ activities, processors, includeActivities })
}

module.exports = {
    TcpListenProcessor
  , TcpConnectionProcessor
  , process
}
