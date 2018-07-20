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

## Available shortcuts

Links to documentation for each shortcut in [api.md](./api.md)

- [Lambda](./api.md#lambda)
- [ScheduledLambda](./api.md#scheduledlambda)
- [StreamLambda](./api.md#streamlambda)
- [QueueLambda](./api.md#queuelambda)
- [ServiceRole](./api.md#servicerole)
- [Queue](./api.md#queue)

## Using shortcuts in a template

Shortcuts are intended to be included in a template using cloudfriend's `.merge()` function. The developer should begin by constructing a template that defines parameters and other aspects of the stack. Then, instantiate shortcut objects in the same template script, and export the result of `.merge()`ing the template with the shortcut objects. The final template JSON can be created via cloudfriend's `.build()` function, or the script can be deployed directly using [cfn-config](https://github.com/mapbox/cfn-config).

As an example, this template will create a named S3 bucket, and a Lambda function that can read from that bucket.

```js
const cf = require('@mapbox/cloudfriend');

const Parameters = {
  BucketName: { Type: 'String' },
  AlarmEmail: { Type: 'String' }
};

const Resources = {
  Bucket: {
    Type: 'AWS::S3::Bucket',
    Properties: {
      BucketName: cf.ref('BucketName')
    }
  }
};

const lambda = new cf.shortcuts.Lambda({
  LogicalName: 'Reader', 
  Code: {
    S3Bucket: 'my-lambda-code-bucket',
    S3Key: 'key/for/my/lambda/code.zip'
  }, 
  Description: cf.sub('Reads data from s3://${Bucket}'),
  MemorySize: 512, 
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
  ],
  AlarmActions: [cf.ref('AlarmEmail')]
});

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
