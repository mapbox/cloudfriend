'use strict';

module.exports = {
  Lambda: require('./lambda'),
  ScheduledLambda: require('./scheduled-lambda'),
  EventLambda: require('./event-lambda'),
  QueueLambda: require('./queue-lambda'),
  StreamLambda: require('./stream-lambda'),
  Role: require('./role'),
  CrossAccountRole: require('./cross-account-role'),
  ServiceRole: require('./service-role'),
  Queue: require('./queue'),
  S3KinesisFirehose: require('./s3-kinesis-firehose'),
  GlueDatabase: require('./glue-database'),
  GlueTable: require('./glue-table'),
  GlueJsonTable: require('./glue-json-table'),
  GlueOrcTable: require('./glue-orc-table'),
  GlueView: require('./glue-view'),
  hookshot: require('./hookshot'),
  LogSubscriptionLambda: require('./log-subscription-lambda')
};
