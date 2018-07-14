# cloudfriend.shortcuts

Shortcuts are JS classes that construct snippets of CloudFormation template that are required to build a piece of infrastructure. The intention is to reduce the amount of repetitious CloudFormation template code developers have to write in order to build systems that they use frequently, but without restricting the developer's need to adjust any aspect of the configuration that needs to be non-standard.

For example, to create a Lambda function, a CloudFormation template should always include:

- the definition of the Lambda function itself
- an IAM Role for the Lambda function to use during execution
- a CloudWatch LogGroup where the function's logs are written
- a CloudWatch Alarm that is triggered when there are execution errors

To create a Lambda function that invokes on a regular schedule, a CloudFormation template will include all of the above, plus:

- a CloudWatch Events Rule defining the invocation schedule
- a Lambda Permission allowing CloudWatch Events to invoke the Lambda function

All told, this can amount to hundreds of lines of CloudFormation template JSON. If the developer needs to build several Lambda functions, most of that code will be repetitious. Each may have a different code location and handler function, perhaps differences in permissions, and aside from that be mostly identical.

## Using shortcuts in a template

Shortcuts are intended to be included in a template using cloudfriend's `.merge()` function. The developer should begin by constructing a template that defines parameters and other aspects of the stack. Then, instantiate shortcut objects in the same template script, and export the result of `.merge()`ing the template with the shortcut objects. The final template JSON can be created via cloudfriend's `.build()` function, or the script can be deployed directly using [cfn-config](https://github.com/mapbox/cfn-config).

As an example, this template will create a named S3 bucket, and a Lambda function that can read from that bucket.

```js
const cf = require('@mapbox/cloudfriend');

const Parameters = {
  BucketName: { Type: 'String' }
};

const Resources = {
  Bucket: {
    Type: 'AWS::S3::Bucket',
    Properties: {
      BucketName: cf.ref('BucketName')
    }
  }
};

const lambdaCode = {
  S3Bucket: 'my-lambda-code-bucket',
  S3Key: 'key/for/my/lambda/code.zip'
};

const lambdaOptions = {
  Description: cf.sub('Reads data from s3://${Bucket}'),
  MemorySize: 512
};

const additionalOptions = {
  Statement: [
    {
      Effect: 'Allow',
      Action: [
        's3:ListBucket',
        's3:GetObject'
      ],
      Resource: [
        cf.getAtt('Bucket', 'Arn'),
        cf.sub('${Bucket.Arn}/*')
      ]
    }
  ]
};

const lambda = new cf.shortcuts.Lambda(
  'Reader', 
  lambdaCode, 
  'index.handler', 
  lambdaOptions, 
  additionalOptions
);

const Outputs = {
  ReaderFunctionArn: {
    Value: cf.getAtt('Reader')
  }
};

module.exports = cf.merge(
  { Parameters, Resources, Outputs },
  lambda
);
```

## Available shortcuts

- [Lambda](#cloudfriendshortcutslambda)
- [ScheduledLambda](#cloudfriendshortcutsscheduledlambda)
- [StreamLambda](#cloudfriendshortcutsstreamlambda)
- [QueueLambda](#cloudfriendshortcutsqueuelambda)

### cloudfriend.shortcuts.Lambda

A basic Lambda function with no defined trigger.

#### Resources created

Resource type | Description
---  | ---
`AWS::Lambda::Function` | the Lambda function itself
`AWS::Logs::LogGroup` | a 14-day retention period log group
`AWS::IAM::Role` | the Lambda function's execution role
`AWS::CloudWatch::Alarm` | an alarm that triggers on Lambda function errors

#### Arguments

```js
new cloudfriend.shortcuts.Lambda(LogicalName, Code, Handler, LambdaProperties, AdditionalOptions)
```

#### Required arguments

Argument | Description
--- | ---
**LogicalName** | The logical name of the Lambda function within the resulting CloudFormation template
**Code** | [The source code for the Lambda function](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-lambda-function-code.html)
**Handler** | [The name of the function that Lambda calls to start running your code](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-handler)

#### Optional arguments

#### LambdaProperties

An object representing [additional Lambda function properties](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html)

Attribute | Default Value
--- | ---
**Description** | conveys the lambda function's logical name and cloudformation stack
**FunctionName** | `${stack name}-${logical name}`
**MemorySize** | `128`
**Runtime** | `nodejs8.10`
**Timeout** | `300`
**\*** | additional properties as defined by Cloudformation & Lambda

#### AdditionalProperties

An object containing further resource options that do not impact the Lambda function itself

Attribute | Description | Default Value
--- | --- | ---
**Condition** | A stack condition that determines whether or not the Lambda function should be created | `undefined`
**Statement** | IAM policy statements for the Lambda function's execution role | `[]`
**ErrorAlarmProperties** | [Properties of a CloudWatch alarm](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html) which tracks Lambda function errors | `{}`

#### AdditionalProperties.ErrorAlarmProperties

An object to define properties of the function's error alarm

Attribute | Default Value
--- | ---
**AlarmName** | `${stack name}-${logical name}-Errors`
**Description** | conveys the Lambda function's name and stack
**AlarmActions** | `[]`
**Period** | `60`
**EvaluationPeriods** | `1`
**Statistic** | `Sum`
**Threshold** | `0`
**ComparisonOperator** | `GreaterThanThreshold`
**TreatMissingData** | `notBreaching`

---

### cloudfriend.shortcuts.ScheduledLambda

A Lambda function configured to execute on a regular schedule.

#### Resources created

[Same as for the Lambda shortcut above](#resources-created), plus the following additions:

Resource type | Description
---  | ---
`AWS::Events::Rule` | the scheduled rule for periodic invocation
`AWS::Lambda::Permission` | allows the rule to invoke the Lambda function

#### Arguments

```js
new cloudfriend.shortcuts.ScheduledLambda(LogicalName, Code, Handler, ScheduleExpression, LambdaProperties, AdditionalOptions)
```

#### Required arguments

Argument | Description
--- | ---
**LogicalName** | The logical name of the Lambda function within the resulting CloudFormation template
**Code** | [The source code for the Lambda function](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-lambda-function-code.html)
**Handler** | [The name of the function that Lambda calls to start running your code](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-handler)
**ScheduleExpression** | [The string defining the invocation schedule](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-rule.html#cfn-events-rule-scheduleexpression)

#### Optional arguments

#### LambdaProperties

[Same as for the Lambda shortcut above](#lambdaproperties).

#### AdditionalProperties

[Same as for the Lambda shortcut above](#additionalproperties).

---

### cloudfriend.shortcuts.StreamLambda

A Lambda function configured to execute in response to events in a stream, either Kinesis or DynamoDB.

#### Resources created

[Same as for the Lambda shortcut above](#resources-created), plus the following additions:

Resource type | Description
---  | ---
`AWS::Lambda::EventSourceMapping` | the connector between the source stream and the Lambda function

#### Arguments

```js
new cloudfriend.shortcuts.StreamLambda(LogicalName, Code, Handler, EventSourceArn, LambdaProperties, AdditionalOptions)
```

#### Required arguments

Argument | Description
--- | ---
**LogicalName** | The logical name of the Lambda function within the resulting CloudFormation template
**Code** | [The source code for the Lambda function](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-lambda-function-code.html)
**Handler** | [The name of the function that Lambda calls to start running your code](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-handler)
**EventSourceArn** | [The ARN of the source stream](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-eventsourcearn)

#### Optional arguments

#### LambdaProperties

[Same as for the Lambda shortcut above](#lambdaproperties).

#### AdditionalProperties

[Same as for the Lambda shortcut above](#additionalproperties), plus the following additions:

Attribute | Description | Default Value
--- | --- | ---
**BatchSize** | The maximum number of stream events per function invocation | `1`
**Enabled** | Indicates whether Lambda begins polling the stream | `true`
**StartingPosition** | [The position in the stream where Lambda starts reading](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-startingposition) | `LATEST`

---

### cloudfriend.shortcuts.QueueLambda

A Lambda function configured to execute in response to messages in an SQS queue.

#### Resources created

[Same as for the Lambda shortcut above](#resources-created), plus the following additions:

Resource type | Description
---  | ---
`AWS::Lambda::EventSourceMapping` | the connector between the SQS queue and the Lambda function

#### Arguments

```js
new cloudfriend.shortcuts.QueueLambda(LogicalName, Code, Handler, EventSourceArn, LambdaProperties, AdditionalOptions)
```

#### Required arguments

Argument | Description
--- | ---
**LogicalName** | The logical name of the Lambda function within the resulting CloudFormation template
**Code** | [The source code for the Lambda function](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-lambda-function-code.html)
**Handler** | [The name of the function that Lambda calls to start running your code](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-handler)
**EventSourceArn** | [The ARN of the source SQS queue](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-eventsourcearn)

#### Optional arguments

#### LambdaProperties

[Same as for the Lambda shortcut above](#lambdaproperties).

#### AdditionalProperties

[Same as for the Lambda shortcut above](#additionalproperties), plus the following additions:

Attribute | Description | Default Value
--- | --- | ---
**Enabled** | Indicates whether Lambda begins polling the SQS queue | `true`

---
