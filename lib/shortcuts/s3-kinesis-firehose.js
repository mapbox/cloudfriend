'use strict';
const KinesisFirehoseBase = require('./kinesis-firehose-base');
const assert = require('assert');

'use strict';

/**
 * Creates a Kinesis Firehouse that can receive records by direct put or by consuming a Kinesis Stream
 * and writes out to the specific S3 destination. Creates a Kinesis Firehouse delivery stream,
 * sets up logging and creates a policy allowing records to be delivered to the delivery stream.
 *
 * @property {Object} Resources - the CloudFormation resources created by this shortcut.
 *
 * @param {Object} options configuration options for the Kinesis Firehouse delivery stream
 * and related resources.
 * @param {String} options.LogicalName the logical name of the Kinesis Firehouse delivery stream
 * within the CloudFormation template. This is also used to construct the logical
 * names of the other resources.
 * @param {String} options.DestinationBucket the name of the S3 bucket to write to
 * @param {String} [options.Prefix='raw/${logical name}/'] the prefix path (folder) within the DestinationBucket to write to
 * @param {String|Object} [options.KinesisStreamARN=undefined] a string or ref identifying a source Kinesis Stream
 * @param {Number} [options.BufferingIntervalInSeconds=900] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-kinesisfirehose-deliverystream-bufferinghints.html#cfn-kinesisfirehose-deliverystream-bufferinghints-intervalinseconds)
 * @param {Number} [options.BufferingSizeInMBs=128] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-kinesisfirehose-deliverystream-bufferinghints.html#cfn-kinesisfirehose-deliverystream-bufferinghints-sizeinmbs)
 *
 * @example
 * const cf = require('@mapbox/cloudfriend');
 *
 * const myTemplate = { ... };
 *
 * const firehose = new cf.shortcuts.S3KinesisFirehose({
 *   LogicalName: 'MyKinesisFirehose',
 *   DestinationBucket: 'mah-bukkit'
 * });
 *
 * module.exports = cf.merge(myTemplate, firehose);
 */
class S3KinesisFirehose extends KinesisFirehoseBase {
  constructor(options = {}) {
    const {
      LogicalName,
      DestinationBucket,
      Prefix = { 'Fn::Join': ['', ['raw/', LogicalName, '/']] },
      BufferingIntervalInSeconds = 900,
      BufferingSizeInMBs = 128
    } = options;
    super(options);

    assert(DestinationBucket, 'You must provide a DestinationBucket');

    const BucketARN = { 'Fn::Sub': `arn:\${AWS::Partition}:s3:::${DestinationBucket}` };
    const S3DestinationConfiguration = {
      BucketARN,
      Prefix,
      BufferingHints: {
        IntervalInSeconds: BufferingIntervalInSeconds,
        SizeInMBs: BufferingSizeInMBs
      },
      CloudWatchLoggingOptions: {
        Enabled: true,
        LogGroupName: { 'Ref': `${LogicalName}LogGroup` },
        LogStreamName: 'firehose'
      },
      CompressionFormat: 'GZIP',
      RoleARN: { 'Fn::GetAtt': [`${LogicalName}Role`, 'Arn'] }
    };
    const Policy = {
      PolicyName: 's3-destination',
      PolicyDocument: {
        Statement: [{
          Effect: 'Allow',
          Action: [
            's3:PutObject',
            's3:GetObject'
          ],
          Resource: {
            'Fn::Join': [
              '/',
              [
                BucketARN,
                Prefix,
                '*'
              ]
            ]
          }
        },
        {
          Effect: 'Allow',
          Action: [
            's3:AbortMultipartUpload',
            's3:GetBucketLocation',
            's3:ListBucket',
            's3:ListBucketMultipartUploads'
          ],
          Resource: BucketARN
        }]
      }
    };

    Object.assign(this.Resources[LogicalName].Properties, { S3DestinationConfiguration });
    this.Resources[`${LogicalName}Role`].Properties.Policies.push(Policy);
  }
}

module.exports = S3KinesisFirehose;
