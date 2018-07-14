'use strict';

module.exports = {
  Lambda: require('./lambda'),
  ScheduledLambda: require('./scheduled-lambda'),
  QueueLambda: require('./queue-lambda'),
  StreamLambda: require('./stream-lambda')
};
