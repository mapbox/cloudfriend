var intrinsic = require('./intrinsic');

var pseudo = module.exports = {};

/**
 * [The pseudo parameter AWS::AccountId](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html),
 * a reference to the AWS account ID of the account in which the stack is being
 * created, such as 123456789012.
 * @static
 * @memberof cloudfriend
 * @name accountId
 */
pseudo.accountId = intrinsic.ref('AWS::AccountId');

/**
 * [The pseudo parameter AWS::NotificationARNs](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html),
 * a reference to the list of notification Amazon Resource Names (ARNs) for the
 * current stack.
 *
 * @static
 * @memberof cloudfriend
 * @name notificationArns
 */
pseudo.notificationArns = intrinsic.ref('AWS::NotificationARNs');

/**
 * [The pseudo parameter AWS::NoValue](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html)
 * removes the corresponding resource property when specified as a return value
 * in the Fn::If intrinsic function.
 *
 * @static
 * @memberof cloudfriend
 * @name noValue
 */
pseudo.noValue = intrinsic.ref('AWS::NoValue');

/**
 * [The pseudo parameter AWS::Region](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html),
 * a reference to the AWS Region in which the encompassing resource is being
 * created, such as us-west-2.
 *
 * @static
 * @memberof cloudfriend
 * @name region
 */
pseudo.region = intrinsic.ref('AWS::Region');

/**
 * [The pseudo parameter AWS::StackId](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html),
 * a reference to the ID of the stack as specified with the aws cloudformation
 * create-stack command, such as arn:aws:cloudformation:us-west-2:123456789012:stack/teststack/51af3dc0-da77-11e4-872e-1234567db123.
 *
 * @static
 * @memberof cloudfriend
 * @name stackId
 */
pseudo.stackId = intrinsic.ref('AWS::StackId');

/**
 * [The pseudo parameter AWS::StackName](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html),
 * a reference to the name of the stack as specified with the aws cloudformation
 * create-stack command, such as teststack.
 *
 * @static
 * @memberof cloudfriend
 * @name stackName
 */
pseudo.stackName = intrinsic.ref('AWS::StackName');

/**
 * [The pseudo parameter AWS::Partition](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html#cfn-pseudo-param-partition),
 * a reference to the partition that the resource is in. For standard AWS
 * regions, the partition is aws. For resources in other partitions, the
 * partition is aws-partitionname. For example, the partition for resources in
 * the China (Beijing) region is aws-cn.
 *
 * @static
 * @memberof cloudfriend
 * @name partition
 */
pseudo.partition = intrinsic.ref('AWS::Partition');

/**
 * [The pseudo parameter AWS::UrlSuffix](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html#cfn-pseudo-param-urlsuffix),
 * a reference to the suffix for a service URL. Values might differ by region, such as the suffix .com.cn in the China region.
 * Currently returns either 'amazonaws.com' for global regions, or 'amazonaws.com.cn' for China regions
 *

 * @static
 * @memberof cloudfriend
 * @name urlSuffix
 */
pseudo.urlSuffix = intrinsic.ref('AWS::URLSuffix');
