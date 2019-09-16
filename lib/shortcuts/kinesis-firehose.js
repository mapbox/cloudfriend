'use strict';
const assert = require('assert');

class KinesisFirehose {
  constructor(options = {}) {
    const {
      LogicalName,
      DestinationBucket,
      Prefix = { 'Fn::Join': ['', ['raw/', LogicalName, '/']] },
      KinesisStreamARN,
      BufferingIntervalInSeconds = 900,
      BufferingSizeInMBs = 128
    } = options;
    assert(LogicalName, 'You must provide a LogicalName');
    assert(DestinationBucket, 'You must provide a DestinationBucket');

    const DeliveryStreamType = !KinesisStreamARN ? 'DirectPut' : 'KinesisStreamAsSource';
    const BucketARN = { 'Fn::Sub': `arn:\${AWS::Partition}:s3:::${DestinationBucket}` };

    this.Resources = {
      [LogicalName]: {
        Type: 'AWS::KinesisFirehose::DeliveryStream',
        Properties: {
          DeliveryStreamName: { 'Fn::Sub': `\${AWS::StackName}-${LogicalName}` },
          DeliveryStreamType,
          S3DestinationConfiguration: {
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
          }
        }
      },
      [`${LogicalName}LogGroup`]: {
        Type: 'AWS::Logs::LogGroup',
        Properties: {
          LogGroupName: {
            'Fn::Sub': ['/aws/kinesisfirehose/${name}', {
              'name': {
                'Fn::Sub': '${AWS::StackName}-KinesisFirehose'
              }
            }]
          },
          RetentionInDays: 14
        }
      },
      [`${LogicalName}LogStream`]: {
        Type: 'AWS::Logs::LogStream',
        Properties: {
          LogGroupName: { 'Ref': `${LogicalName}LogGroup` },
          LogStreamName: 'firehose'
        }
      },
      [`${LogicalName}Role`]: {
        Type: 'AWS::IAM::Role',
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: [{
              Effect: 'Allow',
              Principal: { Service: ['firehose.amazonaws.com'] },
              Action: ['sts:AssumeRole']
            }]
          },
          Path: '/',
          Policies: [
            {
              PolicyName: 'main',
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
                    ] }
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
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:*'
                  ],
                  Resource: { 'Fn::GetAtt': [`${LogicalName}LogGroup`, 'Arn'] }
                }]
              }
            }
          ].concat(KinesisStreamARN ? [
            {
              PolicyName: 'kinesis-stream',
              PolicyDocument: {
                Statement: [{
                  Effect: 'Allow',
                  Action: [
                    'kinesis:DescribeStream',
                    'kinesis:Get*'
                  ],
                  Resource: KinesisStreamARN
                }]
              }
            }
          ] : [])
        }
      }
    };

    if (KinesisStreamARN) {
      this.Resources[LogicalName].Properties.KinesisStreamSourceConfiguration = {
        KinesisStreamARN,
        RoleARN: { 'Fn::GetAtt': [`${LogicalName}Role`, 'Arn'] }
      };
    }
  }
}

module.exports = KinesisFirehose;
