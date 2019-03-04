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
   * @param {Lambda.ConstructorOptions} options configuration options for the Lambda function, its
   * IAM role, and the error Alarm.
  */
  constructor(options) {
    const { LogicalName } = options;
    const { FunctionName = { 'Fn::Sub': `\${AWS::StackName}-${LogicalName}` } } = options;
    const {
      Code,
      DeadLetterConfig,
      Description = { 'Fn::Sub': `${LogicalName} in the \${AWS::StackName} stack` },
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
      AlarmName = { 'Fn::Sub': `\${AWS::StackName}-${LogicalName}-Errors-\${AWS::Region}` },
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

/**
 * @typedef {Object} Lambda.ConstructorOptions
 * @property {String} LogicalName the logical name of the Lambda function
 * within the CloudFormation template. This is used to construct the logical
 * names of the other resources, as well as the Lambda function's name.
 * @property {Object} Code See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-lambda-function-code.html)
 * @property {Object} [DeadLetterConfig=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-deadletterconfig)
 * @property {String} [Description='${logical name} in the ${stack name} stack'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-description)
 * @property {Object} [Environment=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-environment)
 * @property {String} [FunctionName='${stack name}-${logical name}'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-functionname)
 * @property {String} [Handler='index.handler'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-handler)
 * @property {String} [KmsKeyArn=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-kmskeyarn)
 * @property {Number} [MemorySize=128] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-memorysize)
 * @property {Number} [ReservedConcurrentExecutions=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-reservedconcurrentexecutions)
 * @property {String} [Runtime='nodejs8.10'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-runtime)
 * @property {Array<Object>} [Tags=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-tags)
 * @property {Number} [Timeout=300] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-timeout)
 * @property {Object} [TracingConfig=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-tracingconfig)
 * @property {Object} [VpcConfig=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-vpcconfig)
 * @property {String} [Condition=undefined] if there is a Condition defined in the template
 * that should control whether or not to create this Lambda function, specify
 * the name of the condition here. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html)
 * @property {String} [DependsOn=undefined] Specify a stack resource dependency
 * to this Lambda function. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-dependson.html)
 * @property {Array<Object>} [Statement=[]] an array of policy statements
 * defining the permissions that your Lambda function needs in order to execute.
 * @property {String} [AlarmName='${stack name}-${logical name}-Errors-${region}'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmname)
 * @property {String} [AlarmDescription='Error alarm for ${stack name}-${logical name} lambda function in ${stack name} stack'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmdescription)
 * @property {Array<String>} [AlarmActions=[]] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmactions)
 * @property {Number} [Period=60] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-period)
 * @property {Number} [EvaluationPeriods=1] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-evaluationperiods)
 * @property {String} [Statistic='Sum'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-statistic)
 * @property {Number} [Threshold=0] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-threshold)
 * @property {String} [ComparisonOperator='GreaterThanThreshold'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-comparisonoperator)
 * @property {String} [TreatMissingData='notBreaching'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-treatmissingdata)
 * @property {String} [EvaluateLowSampleCountPercentile=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-evaluatelowsamplecountpercentile)
 * @property {String} [ExtendedStatistic=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-extendedstatistic)
 * @property {Array<String>} [OKActions=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-okactions)
 */
