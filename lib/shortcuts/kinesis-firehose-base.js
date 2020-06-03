'use strict';
const assert = require('assert');

'use strict';

/**
 * Base class for creating a Kinesis Firehouse that can receive records
 * by direct put or by consuming a Kinesis Stream.
 * Each implementing subclass enables writing to a specific destination.
 * Creates a Kinesis Firehouse delivery stream, sets up logging and creates
 * a policy allowing records to be delivered to the delivery stream.
 *
 * @param {Object} options - Options.
 * @param {String} options.LogicalName - The logical name of the Kinesis Firehouse delivery stream
 * within the CloudFormation template. This is also used to construct the logical
 * names of the other resources.
 * @param {String|Object} [options.KinesisStreamARN=undefined] - The ARN of a source Kinesis Stream.
 */
class KinesisFirehoseBase {
  constructor(options) {
    const {
      LogicalName,
      KinesisStreamARN
    } = options;
    assert(LogicalName, 'You must provide a LogicalName');

    const DeliveryStreamType = !KinesisStreamARN ? 'DirectPut' : 'KinesisStreamAsSource';

    this.Resources = {
      [LogicalName]: {
        Type: 'AWS::KinesisFirehose::DeliveryStream',
        Properties: {
          DeliveryStreamName: { 'Fn::Sub': `\${AWS::StackName}-${LogicalName}` },
          DeliveryStreamType
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
                    'logs:*'
                  ],
                  Resource: { 'Fn::GetAtt': [`${LogicalName}LogGroup`, 'Arn'] }
                }]
              }
            }
          ]
        }
      }
    };

    if (KinesisStreamARN) {
      Object.assign(this.Resources[LogicalName].Properties, {
        KinesisStreamSourceConfiguration: {
          KinesisStreamARN,
          RoleARN: { 'Fn::GetAtt': [`${LogicalName}Role`, 'Arn'] }
        }
      });
      this.Resources[`${LogicalName}Role`].Properties.Policies.push({
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
      });
    }
  }
}

module.exports = KinesisFirehoseBase;
