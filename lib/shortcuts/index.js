'use strict';

module.exports = {
  Lambda: require('./lambda'),
  ScheduledLambda: require('./scheduled-lambda'),
  QueueLambda: require('./queue-lambda'),
  StreamLambda: require('./stream-lambda'),
  Role: require('./role'),
  CrossAccountRole: require('./cross-account-role'),
  ServiceRole: require('./service-role'),
  Queue: require('./queue'),
  hookshot: require('./hookshot')
};
