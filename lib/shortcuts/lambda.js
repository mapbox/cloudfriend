'use strict';

/**
 * Baseline CloudFormation resources involved in a Lambda Function. Includes a
 * LogGroup, a Role, an Alarm on function errors, and the Lambda Function itself.
 *
 * @property {Object} Resources - the CloudFormation resources created by this shortcut.
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
  /**
   *
   * @param {object} options configuration options for the Lambda function, its
   * IAM role, and the error Alarm.
   * @param {string} options.LogicalName the logical name of the Lambda function
   * within the CloudFormation template. This is used to construct the logical
   * names of the other resources, as well as the Lambda function's name.
   * @param {object} options.Code See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-lambda-function-code.html)
   * @param {object} [options.DeadLetterConfig=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-deadletterconfig)
   * @param {string|object} [options.Description='${logical name} in the ${stack name} stack'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-description)
   * @param {object} [options.Environment=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-environment)
   * @param {string|object} [options.FunctionName='${stack name}-${logical name}'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-functionname)
   * @param {string} [options.Handler='index.handler'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-handler)
   * @param {string} [options.KmsKeyArn=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-kmskeyarn)
   * @param {Number} [options.MemorySize=128] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-memorysize)
   * @param {Number} [options.ReservedConcurrentExecutions=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-reservedconcurrentexecutions)
   * @param {string} [options.Runtime='nodejs8.10'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-runtime)
   * @param {Array<object>} [options.Tags=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-tags)
   * @param {Number} [options.Timeout=300] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-timeout)
   * @param {object} [options.TracingConfig=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-tracingconfig)
   * @param {object} [options.VpcConfig=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-vpcconfig)
   * @param {string} [options.Condition=undefined] if there is a Condition defined in the template
   * that should control whether or not to create this Lambda function, specify
   * the name of the condition here. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html)
   * @param {string} [options.DependsOn=undefined] Specify a stack resource dependency
   * to this Lambda function. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-dependson.html)
   * @param {Array<object>} [options.Statement=[]] an array of policy statements
   * defining the permissions that your Lambda function needs in order to execute.
   * @param {string} [options.AlarmName='${stack name}-${logical name}-Errors-${region}'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmname)
   * @param {string} [options.AlarmDescription='Error alarm for ${stack name}-${logical name} lambda function in ${stack name} stack'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmdescription)
   * @param {Array<string>} [options.AlarmActions=[]] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmactions)
   * @param {Number} [options.Period=60] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-period)
   * @param {Number} [options.EvaluationPeriods=1] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-evaluationperiods)
   * @param {string} [options.Statistic='Sum'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-statistic)
   * @param {Number} [options.Threshold=0] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-threshold)
   * @param {string} [options.ComparisonOperator='GreaterThanThreshold'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-comparisonoperator)
   * @param {string} [options.TreatMissingData='notBreaching'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-treatmissingdata)
   * @param {string} [options.EvaluateLowSampleCountPercentile=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-evaluatelowsamplecountpercentile)
   * @param {string} [options.ExtendedStatistic=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-extendedstatistic)
   * @param {Array<string>} [options.OKActions=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-okactions)
   */
  constructor(options) {
    const {
      LogicalName,
      Code,
      DeadLetterConfig,
      Environment,
      Handler = 'index.handler',
      KmsKeyArn,
      MemorySize = 128,
      ReservedConcurrentExecutions,
      Runtime = 'nodejs8.10',
      Tags,
      Timeout = 300,
      TracingConfig,
      VpcConfig,
      Condition = undefined,
      DependsOn = undefined,
      Statement = [],
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

    const {
      Description = { 'Fn::Sub': `${LogicalName} in the \${AWS::StackName} stack` },
      FunctionName = { 'Fn::Sub': `\${AWS::StackName}-${LogicalName}` },
      AlarmName = { 'Fn::Sub': `\${AWS::StackName}-${LogicalName}-Errors-\${AWS::Region}` }
    } = options;

    const {
      AlarmDescription = {
        'Fn::Sub': [
          'Error alarm for ${name} lambda function in ${AWS::StackName} stack',
          { name: FunctionName }
        ]
      }
    } = options;

    const required = [LogicalName, Code];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a LogicalName, and Code');

    this.LogicalName = LogicalName;
    this.FunctionName = FunctionName;
    this.Condition = Condition;
    this.Resources = {};

    this.Resources[`${LogicalName}Logs`] = {
      Type: 'AWS::Logs::LogGroup',
      Condition,
      Properties: {
        LogGroupName: {
          'Fn::Sub': ['/aws/lambda/${name}', { name: FunctionName }]
        },
        RetentionInDays: 14
      }
    };

    this.Resources[`${LogicalName}Role`] = {
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
    };

    this.Resources[`${LogicalName}`] = {
      Type: 'AWS::Lambda::Function',
      Condition,
      DependsOn,
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
    };

    this.Resources[`${LogicalName}ErrorAlarm`] = {
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
    };
  }
}

module.exports = Lambda;
