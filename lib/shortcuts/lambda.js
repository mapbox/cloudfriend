'use strict';

const merge = require('../merge');
const ServiceRole = require('./service-role');

/**
 * Baseline CloudFormation resources involved in a Lambda Function. Creates a
 * Log Group, a Role, an Alarm on function errors, and the Lambda Function itself.
 *
 * @param {Object} options - Options.
 * @param {String} options.LogicalName - The logical name of the Lambda function
 * within the CloudFormation template. This is used to construct the logical
 * names of the other resources, as well as the Lambda function's name.
 * @param {Object} options.Code - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-lambda-function-code.html).
 * @param {Object} [options.ImageConfig=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-imageconfig).
 * @param {Object} [options.DeadLetterConfig=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-deadletterconfig).
 * @param {String} [options.Description='${logical name} in the ${stack name} stack'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-description).
 * @param {Object} [options.Environment=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-environment).
 * @param {String} [options.FunctionName='${stack name}-${logical name}'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-functionname).
 * @param {String} [options.Handler='index.handler'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-handler).
 * @param {String} [options.KmsKeyArn=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-kmskeyarn).
 * @param {Array<String>} [options.Layers=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-layers).
 * @param {Number} [options.MemorySize=128] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-memorysize).
 * @param {Number} [options.ReservedConcurrentExecutions=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-reservedconcurrentexecutions).
 * @param {String} [options.Runtime='nodejs22.x'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-runtime).
 * @param {Array<Object>} [options.Tags=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-tags).
 * @param {Number} [options.Timeout=300] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-timeout).
 * @param {Object} [options.TracingConfig=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-tracingconfig).
 * @param {Object} [options.VpcConfig=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-vpcconfig).
 * @param {String} [options.Condition=undefined] - If there is a `Condition` defined in the template
 * that should control whether to create this Lambda function, specify
 * the name of the condition here. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html).
 * @param {String} [options.DependsOn=undefined] - Specify a stack resource dependency
 * to this Lambda function. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-dependson.html).
 * @param {Array<Object>} [options.Statement=[]] Policy statements that will be added to a generated IAM role defining the permissions your Lambda function needs to run. _Do not use this option when specifying your own role via RoleArn._
 * @param {String} [options.RoleArn=undefined] If specified, the Lambda function will use this role instead of creating a new role. _If this option is specified, do not use the Statement option; add the permissions you need to your Role directly._
 * @param {String} [options.AlarmName='${stack name}-${logical name}-Errors-${region}'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmname).
 * @param {String} [options.AlarmDescription='Error alarm for ${stack name}-${logical name} lambda function in ${stack name} stack'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmdescription).
 * @param {Array<String>} [options.AlarmActions=[]] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmactions).
 * @param {Number} [options.Period=60] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-period).
 * @param {Number} [options.EvaluationPeriods=1] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-evaluationperiods).
 * @param {String} [options.Statistic='Sum'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-statistic).
 * @param {Number} [options.DatapointsToAlarm=1] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarm-datapointstoalarm).
 * @param {Number} [options.Threshold=0] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-threshold).
 * @param {String} [options.ComparisonOperator='GreaterThanThreshold'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-comparisonoperator).
 * @param {String} [options.TreatMissingData='notBreaching'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-treatmissingdata).
 * @param {String} [options.EvaluateLowSampleCountPercentile=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-evaluatelowsamplecountpercentile).
 * @param {String} [options.ExtendedStatistic=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-extendedstatistic)]
 * @param {Array<String>} [options.OKActions=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-okactions).
 * @param {Number} [options.LogRetentionInDays=14] - How long to retain CloudWatch logs for this Lambda function. See [AWS Documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-logs-loggroup.html) for allowed values.
 * @param {String} [options.LogPolicyDeletionPolicy='Delete'] - DeletionPolicy on the IAM Policy resource used to access Logs. See [AWS Documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-attribute-deletionpolicy.html) for allowed values.
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

  constructor(options) {
    if (!options) throw new Error('Options required');
    const {
      LogicalName,
      Code,
      ImageConfig,
      DeadLetterConfig,
      Description = { 'Fn::Sub': `${LogicalName} in the \${AWS::StackName} stack` },
      Environment,
      FunctionName = { 'Fn::Sub': `\${AWS::StackName}-${LogicalName}` },
      Handler = 'index.handler',
      KmsKeyArn,
      Layers,
      MemorySize = 128,
      ReservedConcurrentExecutions,
      Runtime = 'nodejs22.x',
      Tags,
      Timeout = 300,
      TracingConfig,
      VpcConfig,
      Condition = undefined,
      DependsOn = undefined,
      Statement = [],
      RoleArn,
      AlarmName = { 'Fn::Sub': `\${AWS::StackName}-${LogicalName}-Errors-\${AWS::Region}` },
      AlarmDescription = {
        'Fn::Sub': [
          'Error alarm for ${name} lambda function in ${AWS::StackName} stack',
          { name: FunctionName }
        ]
      },
      AlarmActions = [],
      Period = 60,
      EvaluationPeriods = Math.ceil(Timeout / Period),
      Statistic = 'Sum',
      DatapointsToAlarm = 1,
      Threshold = 0,
      ComparisonOperator = 'GreaterThanThreshold',
      TreatMissingData = 'notBreaching',
      EvaluateLowSampleCountPercentile,
      ExtendedStatistic,
      OKActions,
      LogRetentionInDays = 14,
      LogPolicyDeletionPolicy = 'Delete'
    } = options;

    if (options.EvaluationPeriods < Math.ceil(Timeout / Period))
      throw new Error('Cloudwatch alarm evalution window shorter than lambda timeout');

    const required = [LogicalName, Code];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a LogicalName, and Code');

    if (Statement.length > 0 && RoleArn) {
      throw new Error('You cannot specify both Statements and a RoleArn');
    }

    // if the RoleArn was specified, we need to split just the name for use with the log policy
    let roleName;
    if (RoleArn) {
      roleName = { 'Fn::Select': [1, { 'Fn::Split': ['/', RoleArn] }] };
    } else {
      roleName = { Ref: `${LogicalName}Role` };
    }

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
          RetentionInDays: LogRetentionInDays
        }
      },

      [`${LogicalName}`]: {
        Type: 'AWS::Lambda::Function',
        Condition,
        DependsOn,
        Properties: {
          Code,
          ImageConfig,
          DeadLetterConfig,
          Description,
          Environment,
          FunctionName,
          Handler,
          KmsKeyArn,
          Layers,
          MemorySize,
          ReservedConcurrentExecutions,
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
          DatapointsToAlarm,
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
      },

      [`${LogicalName}LogPolicy`]: {
        Type: 'AWS::IAM::Policy',
        Condition,
        DependsOn: (RoleArn) ? undefined : `${LogicalName}Role`,
        DeletionPolicy: LogPolicyDeletionPolicy,
        Properties: {
          PolicyName: `${LogicalName}-lambda-log-access`,
          Roles: [roleName],
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: 'logs:*',
                Resource: {
                  'Fn::GetAtt': [`${LogicalName}Logs`, 'Arn']
                }
              }
            ]
          }
        }
      }
    };

    if (RoleArn) {
      this.Resources[`${LogicalName}`].Properties.Role = RoleArn;
    } else {
      const serviceRole = new ServiceRole({
        LogicalName: `${LogicalName}Role`,
        Service: 'lambda',
        Condition,
        Statement
      });
      this.Resources[`${LogicalName}`].Properties.Role = { 'Fn::GetAtt': [`${LogicalName}Role`, 'Arn'] };
      this.Resources = merge(this, serviceRole).Resources;
    }

    if (Code.ImageUri) {
      this.Resources[`${LogicalName}`].Properties.PackageType = 'Image';
      delete this.Resources[`${LogicalName}`].Properties.Runtime;
      delete this.Resources[`${LogicalName}`].Properties.Handler;
    }
  }
}

module.exports = Lambda;
