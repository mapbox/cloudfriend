'use strict';

/**
 * Baseline CloudFormation resources involved in a Lambda Function. Includes a
 * LogGroup, a Role, an Alarm on function errors, and the Lambda Function itself.
 *
 * @property {Object} Resources - the CloudFormation resources created by this shortcut.
 *
 * @param {Object} options configuration options for the Lambda function, its
 * IAM role, and the error Alarm.
 * @param {String} options.LogicalName the logical name of the Lambda function
 * within the CloudFormation template. This is used to construct the logical
 * names of the other resources, as well as the Lambda function's name.
 * @param {Object} options.Code See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-lambda-function-code.html)
 * @param {Object} [options.DeadLetterConfig=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-deadletterconfig)
 * @param {String} [options.Description='${logical name} in the ${stack name} stack'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-description)
 * @param {Object} [options.Environment=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-environment)
 * @param {String} [options.FunctionName='${stack name}-${logical name}'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-functionname)
 * @param {String} [options.Handler='index.handler'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-handler)
 * @param {String} [options.KmsKeyArn=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-kmskeyarn)
 * @param {Number} [options.MemorySize=128] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-memorysize)
 * @param {Number} [options.ReservedConcurrentExecutions=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-reservedconcurrentexecutions)
 * @param {String} [options.Runtime='nodejs8.10'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-runtime)
 * @param {Array<Object>} [options.Tags=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-tags)
 * @param {Number} [options.Timeout=300] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-timeout)
 * @param {Object} [options.TracingConfig=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-tracingconfig)
 * @param {Object} [options.VpcConfig=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-vpcconfig)
 * @param {String} [options.Condition=undefined] if there is a Condition defined in the template
 * that should control whether or not to create this Lambda function, specify
 * the name of the condition here. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html)
 * @param {Array<Object>} [options.Statement=[]] an array of policy statements
 * defining the permissions that your Lambda function needs in order to execute.
 * @param {String} [options.AlarmName='${stack name}-${logical name}-Errors'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmname)
 * @param {String} [options.AlarmDescription='Error alarm for ${stack name}-${logical name} lambda function in ${stack name} stack'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmdescription)
 * @param {Array<String>} [options.AlarmActions=[]] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmactions)
 * @param {Number} [options.Period=60] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-period)
 * @param {Number} [options.EvaluationPeriods=1] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-evaluationperiods)
 * @param {String} [options.Statistic='Sum'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-statistic)
 * @param {Number} [options.Threshold=0] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-threshold)
 * @param {String} [options.ComparisonOperator='GreaterThanThreshold'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-comparisonoperator)
 * @param {String} [options.TreatMissingData='notBreaching'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-treatmissingdata)
 * @param {String} [options.EvaluateLowSampleCountPercentile=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-evaluatelowsamplecountpercentile)
 * @param {Array<String>} [options.OKActions=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-okactions)
 *
 * @example
 * const cf = require('@mapbox/cloudfriend');
 *
 * const myTemplate = { ... };
 *
 * const lambda = new cf.shortcuts.Lambda({
 *   LogicalName: 'MyLambda',
 *   Code: {
 *     S3Bucket: 'my-code-bucket',
 *     S3Key: 'path/to/code.zip'
 *   }
 * });
 *
 * module.exports = cf.merge(myTemplate, lambda);
 */
class Lambda {

  constructor(options = {}) {
    const {
      LogicalName,
      Code,
      DeadLetterConfig,
      Description = { 'Fn::Sub': `${LogicalName} in the \${AWS::StackName} stack` },
      Environment,
      FunctionName = { 'Fn::Sub': `\${AWS::StackName}-${LogicalName}` },
      Handler = 'index.handler',
      KmsKeyArn,
      MemorySize = 128,
      ReservedConcurrentExecutions,
      Runtime = Code && Code.ZipFile ? 'nodejs6.10' : 'nodejs8.10',
      Tags,
      Timeout = 300,
      TracingConfig,
      VpcConfig,
      Condition = undefined,
      Statement = [],
      AlarmName = { 'Fn::Sub': `\${AWS::StackName}-${LogicalName}-Errors` },
      AlarmDescription = {
        'Fn::Sub': [
          'Error alarm for ${name} lambda function in ${AWS::StackName} stack',
          { name: FunctionName }
        ]
      },
      AlarmActions = [],
      Period = 60,
      EvaluationPeriods = 1,
      Statistic = 'Sum',
      Threshold = 0,
      ComparisonOperator = 'GreaterThanThreshold',
      TreatMissingData = 'notBreaching',
      EvaluateLowSampleCountPercentile,
      ExtendedStatistic,
      OKActions
    } = options;

    const required = [LogicalName, Code];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a LogicalName, and Code');

    this.LogicalName = LogicalName;
    this.FunctionName = FunctionName;
    this.Condition = Condition;

    this.Resources = {
      [`${LogicalName}Logs`]: {
        Type: 'AWS::Logs::LogGroup',
        Condition,
        Properties: {
          LogGroupName: {
            'Fn::Sub': ['/aws/lambda/${name}', { name: FunctionName }]
          },
          RetentionInDays: 14
        }
      },

      [`${LogicalName}Role`]: {
        Type: 'AWS::IAM::Role',
        Condition,
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Action: 'sts:AssumeRole',
                Principal: {
                  Service: 'lambda.amazonaws.com'
                }
              }
            ]
          },
          Policies: [
            {
              PolicyName: 'main',
              PolicyDocument: {
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: 'logs:*',
                    Resource: {
                      'Fn::GetAtt': [`${LogicalName}Logs`, 'Arn']
                    }
                  },
                  ...Statement
                ]
              }
            }
          ]
        }
      },

      [`${LogicalName}`]: {
        Type: 'AWS::Lambda::Function',
        Condition,
        Properties: {
          Code,
          DeadLetterConfig,
          Description,
          Environment,
          FunctionName,
          Handler,
          KmsKeyArn,
          MemorySize,
          ReservedConcurrentExecutions,
          Role: { 'Fn::GetAtt': [`${LogicalName}Role`, 'Arn'] },
          Runtime,
          Timeout,
          TracingConfig,
          VpcConfig,
          Tags
        }
      },

      [`${LogicalName}ErrorAlarm`]: {
        Type: 'AWS::CloudWatch::Alarm',
        Condition,
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
          Namespace: 'AWS/Lambda',
          Dimensions: [
            {
              Name: 'FunctionName',
              Value: { 'Ref': LogicalName }
            }
          ],
          MetricName: 'Errors'
        }
      }
    };
  }
}

module.exports = Lambda;
