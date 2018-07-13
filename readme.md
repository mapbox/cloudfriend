# cloudfriend

[![Build Status](https://travis-ci.org/mapbox/cloudfriend.svg?branch=master)](https://travis-ci.org/mapbox/cloudfriend)

Helper functions for assembling CloudFormation templates in JavaScript

## Intrinsic functions and conditions

These are functions that you can use in place of various CloudFormation objects.

CloudFriend | CloudFormation
--- | ---
base64(value) | [Fn::Base64](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-base64.html)
findInMap(mapping, key, attr) | [Fn::FindInMap](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-findinmap.html)
getAtt(obj, key) | [Fn::GetAtt](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-getatt.html)
getAzs(region) | [Fn::GetAZs](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-getavailabilityzones.html)
join(delimiter, pieces) | [Fn::Join](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-join.html)
split(delimiter, string) | [Fn::Split](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-split.html)
select(index, list) | [Fn::Select](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-select.html)
ref(name) | [Ref](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-ref.html)
userData(lines) | [Fn::Base64](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-base64.html) and [Fn::Join](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-join.html) with `\n` delimiter
and(conditions) | [Fn::And](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e121706)
equals(a, b) | [Fn::Equals](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e121788)
if(condition, ifTrue, ifFalse) | [Fn::If](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e121863)
not(condition) | [Fn::Not](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e122042)
or(conditions) | [Fn::Or](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e122130)
notEquals(a, b) | [Fn::Not](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e122042) and [Fn::Equals](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e121788)
sub(str, variables) | [Fn::Sub](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-sub.html)
importValue(sharedValue) | [Fn::ImportValue](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-importvalue.html),
arn(service, suffix) | [Fn::Sub](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-sub.html) designed for an ARN

## Pseudo parameters

These are static properties of `cloudfriend` that you can use to reference various CloudFormation objects.

CloudFriend | CloudFormation
--- | ---
accountId | [AWS::AccountId](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html)
notificationArns | [AWS::NotificationARNs](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html)
noValue | [AWS::NoValue](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html)
region | [AWS::Region](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html)
stackId | [AWS::StackId](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html)
stackName | [AWS::StackName](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html)
partition | [AWS::Partition](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html#cfn-pseudo-param-partition)
urlSuffix | [AWS::URLSuffix](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html#cfn-pseudo-param-urlsuffix)

## Shortcuts

Cloudfriend contains a library of JS classes that reduce the amount of "boilerplate" CloudFormation that you need to write in order to setup a common set of AWS Resources. 

As an example, here's how you would use the scheduled Lambda shortcut to build a template that includes a Lambda function that executes every hour. This shortcut produces CloudFormation resources for a LogGroup, Role, Lambda function, Scheduled CloudWatch event, and Lambda permission.

```js
const cf = require('@mapbox/cloudfriend');

const myTemplate = { ... }; // define other aspects of your template

const scheduledLambda = new cf.shortcuts.ScheduledLambda(
    'ScheduledLambdaFunction', // [required] the lambda function's logical name within the final template
    { S3Bucket: 'my-lambda-code-bucket', S3Key: 'path/to/the/code.zip' }, // [required] the `.Code` property for a Lambda function
    'index.handler', // [required] the JS function for Lambda to execute
    'rate(1 hour)', // [required] the schedule expression
    { Timeout: 30, MemorySize: 256 }, // [optional] additional properties for the Lambda function
    {
        Statement: [
            {
                Effet: 'Allow',
                Action: 's3:GetObject',
                Resource: 'arn:aws:s3:::data-bucket/some/data/object.zip'
            }
        ]
    } // [optional] select additional properties for other resources within the shortcut
);

module.exports = cf.merge(
    myTemplate,
    scheduledLambda
); // this script outputs myTemplate with the scheduled function resources merged into it
```

## Other helpers

method | description
--- | ---
build(file, opts) | Builds a template defined by a static JavaScript export, a synchronous or an asynchronous function.
validate(file) | Uses the `cloudformation:ValidateTemplate` API call to perform rudimentary template validation
merge(...template) | Merges templates together. Throws errors if logical names are reused

## CLI tools

By installing cloudfriend globally, it can provide you with simple CLI tools for building and validating CloudFormation templates.

```
# either...
$ git clone https://github.com/mapbox/cloudfriend && cd cloudfriend && npm link
# ... or ...
$ npm install -g @mapbox/cloudfriend
```

Then, to build a template:

```
# Prints the template as JSON to stdout
$ build-template path/to/template.js
```

Or, to validate a template:

```
# Make sure that your shell is configured to make AWS requests
$ validate-template path/to/template.js
```

You may also specify a region for validation:

```
# Make sure that your shell is configured to make AWS requests
$ validate-template path/to/template.js us-east-1
```
