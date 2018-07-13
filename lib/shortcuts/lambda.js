'use strict';

/**
 * Baseline CloudFormation resources involved in a Lambda Function. Includes a
 * LogGroup, a Role, and the Lambda Function itself.
 *
 * @param {string} LogicalName - the logical name of the Lambda function within
 * the CloudFormation template. This is used to construct the logical names of
 * the other resources, as well as the Lambda function's name (if you don't
 * provide one)
 * @param {object} Code - the definition of where your Lambda function's code
 * can be found. See https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-lambda-function-code.html
 * @param {string} Handler - the name of the function that Lambda calls to start
 * running your code. See https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-handler
 * @param {object} [LambdaProperties] - optionally, you can specify any of the
 * other properties that you would set on a Lambda function. See https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html
 * for the full set of options.
 * @param {object} [AdditionalOptions] - further optional properties that are not
 * part of the definition of the Lambda function itself.
 * @param {string} [AdditionalOptions.Condition] - if there is a Condition defined
 * in the template that should control whether or not to create this Lambda
 * function, specify the name of the condition here. See https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html
 * @param {array<object>} [AdditionalOptions.Statement] - an array of policy
 * statements defining the permissions that your Lambda function needs in order
 * to execute properly
 */
class Lambda {
  constructor(
    LogicalName,
    Code,
    Handler,
    {
      DeadLetterConfig,
      Description = { 'Fn::Sub': `${LogicalName} in the \${AWS::StackName} stack` },
      Environment,
      FunctionName = { 'Fn::Sub': `\${AWS::StackName}-${LogicalName}` },
      KmsKeyArn,
      MemorySize = 128,
      ReservedConcurrencyExecutions,
      Runtime = 'nodejs8.10',
      Timeout = 300,
      TracingConfig,
      VpcConfig,
      Tags
    } = {},
    {
      Condition = undefined,
      Statement = []
    } = {}
  ) {
    const required = [LogicalName, Code, Handler];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a LogicalName, Code, and Handler');

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
                  Service: {
                    'Fn::Sub': 'lambda.${AWS::URLSuffix}'
                  }
                }
              }
            ]
          }
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
                }
              ].concat(Statement)
            }
          }
        ]
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
          ReservedConcurrencyExecutions,
          Role: { 'Ref': `${LogicalName}Role` },
          Runtime,
          Timeout,
          TracingConfig,
          VpcConfig,
          Tags
        }
      }
    };
  }
}

module.exports = Lambda;
