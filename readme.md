# cloudfriend

Helper functions for assembling CloudFormation templates in JavaScript

## Intrinsic functions, conditions, pseudo parameters

CloudFriend | CloudFormation
--- | ---
base64(value) | [Fn::Base64](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-base64.html)
findInMap(mapping, key, attr) | [Fn::FindInMap](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-findinmap.html)
getAtt(obj, key) | [Fn::GetAtt](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-getatt.html)
getAzs(region) | [Fn::GetAZs](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-getavailabilityzones.html)
join(delimiter, pieces) | [Fn::Join](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-join.html)
select(index, list) | [Fn::Select](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-select.html)
ref(name) | [Ref](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-ref.html)
userData(lines) | [Fn::Base64](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-base64.html) and [Fn::Join](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-join.html) with `\n` delimiter
and(conditions) | [Fn::And](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e121706)
equals(a, b) | [Fn::Equals](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e121788)
if(condition, ifTrue, ifFalse) | [Fn::If](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e121863)
not(condition) | [Fn::Not](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e122042)
or(conditions) | [Fn::Or](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e122130)
notEquals(a, b) | [Fn::Not](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e122042) and [Fn::Equals](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e121788)
accountId | [AWS::AccountId](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html)
notificationArns | [AWS::NotificationARNs](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html)
noValue | [AWS::NoValue](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html)
region | [AWS::Region](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html)
stackId | [AWS::StackId](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html)
stackName | [AWS::StackName](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html)

## Other helpers

method | description
--- | ---
build(templatePath) | Builds a template defined by a static JavaScript export, a synchronous or an asynchronous function
validate(templatePath) | Uses the `cloudformation:ValidateTemplate` API call to perform rudimentary template validation
