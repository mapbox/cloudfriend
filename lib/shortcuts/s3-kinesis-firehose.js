'use strict';
const KinesisFirehoseBase = require('./kinesis-firehose-base');
const assert = require('assert');

'use strict';

/**
 * Creates a Kinesis Firehouse that can receive records by direct put or by consuming a Kinesis Stream
 * and writes out to the specific S3 destination. Creates a Kinesis Firehouse delivery stream,
 * sets up logging, and creates a policy allowing records to be delivered to the delivery stream.
 * Also creates a CloudWatch alarm on the `DeliveryToS3.DataFreshness` metric -- the age
 * of the oldest record in Kinesis Data Firehose (from entering the Kinesis Data Firehose until now).
 * By default, if that metric exceeds double the `BufferingIntervalInSeconds`, the
 * alarm is triggered.
 *
 * @param {Object} options - Options.
 * @param {String} options.LogicalName - The logical name of the Kinesis Firehouse delivery stream
 * within the CloudFormation template. This is also used to construct the logical
 * names of the other resources.
 * @param {String} options.DestinationBucket - The name of the S3 bucket to write to.
 * @param {String} [options.Prefix='raw/${logical name}/'] - The prefix path (folder) within the DestinationBucket to write to.
 * @param {String|Object} [options.KinesisStreamARN=undefined] - The ARN of a source Kinesis Stream.
 * @param {Number} [options.BufferingIntervalInSeconds=900] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-kinesisfirehose-deliverystream-bufferinghints.html#cfn-kinesisfirehose-deliverystream-bufferinghints-intervalinseconds).
 * @param {Number} [options.BufferingSizeInMBs=128] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-kinesisfirehose-deliverystream-bufferinghints.html#cfn-kinesisfirehose-deliverystream-bufferinghints-sizeinmbs).
 * @param {String} [options.AlarmName='${stack name}-${logical name}-Freshness-${region}'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmname).
 * @param {String} [options.AlarmDescription='Freshness alarm for ${stack name}-${logical name} kinesis firehose in ${stack name} stack'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmdescription).
 * @param {Array<String>} [options.AlarmActions=[]] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmactions).
 * @param {Number} [options.Period=60] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-period).
 * @param {Number} [options.EvaluationPeriods=1] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-evaluationperiods).
 * @param {String} [options.Statistic='Maximum'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-statistic).
 * @param {Number} [options.Threshold=(BufferingIntervalInSeconds * 2)] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-threshold).
 * @param {String} [options.ComparisonOperator='GreaterThanThreshold'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-comparisonoperator).
 * @param {String} [options.TreatMissingData='notBreaching'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-treatmissingdata).
 * @param {String} [options.EvaluateLowSampleCountPercentile=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-evaluatelowsamplecountpercentile).
 * @param {String} [options.ExtendedStatistic=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-extendedstatistic)]
 * @param {Array<String>} [options.OKActions=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-okactions).
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
  constructor(options) {
    const {
      LogicalName,
      DestinationBucket,
      Prefix = { 'Fn::Join': ['', ['raw/', LogicalName, '/']] },
      BufferingIntervalInSeconds = 900,
      BufferingSizeInMBs = 128,
      AlarmName = { 'Fn::Sub': `\${AWS::StackName}-${LogicalName}-Freshness-\${AWS::Region}` },
      AlarmDescription = {
        'Fn::Sub': [
          'Freshness alarm for ${AWS::StackName}-${name} kinesis firehose in ${AWS::StackName} stack',
          { name: LogicalName }
        ]
      },
      AlarmActions = [],
      Period = 60,
      EvaluationPeriods = 1,
      Statistic = 'Maximum',
      Threshold = BufferingIntervalInSeconds * 2,
      ComparisonOperator = 'GreaterThanThreshold',
      TreatMissingData = 'notBreaching',
      EvaluateLowSampleCountPercentile,
      ExtendedStatistic,
      OKActions
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

    this.Resources[`${LogicalName}ErrorAlarm`] = {
      Type: 'AWS::CloudWatch::Alarm',
      Properties: {
        AlarmName,
        AlarmDescription,
        AlarmActions,
        Period,
        EvaluationPeriods,
        Statistic,
        Threshold,
        ComparisonOperator,
        TreatMissingData,
        EvaluateLowSampleCountPercentile,
        ExtendedStatistic,
        OKActions,
        Namespace: 'AWS/Firehose',
        Dimensions: [
          {
            Name: 'FirehoseName',
            Value: { 'Ref': LogicalName }
          }
        ],
        MetricName: 'DeliveryToS3.DataFreshness'
      }
    };

    Object.assign(this.Resources[LogicalName].Properties, { S3DestinationConfiguration });
    this.Resources[`${LogicalName}Role`].Properties.Policies.push(Policy);
  }
}

module.exports = S3KinesisFirehose;
