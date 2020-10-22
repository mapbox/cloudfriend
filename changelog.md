# unreleased

- Sets the policy Version in all generated Roles to **2012-10-17**
- Adds a `RoleArn` setting to Lambda shortcuts. If set, the created Lambda function will use this Role and will not create a new one.

# v4.3.0

- Adds Tags option to Role shortcuts

# v4.2.3

- Fix typo in Glue database shortcut

# v4.2.2

- Fix bugs in Queue shortcut with the setting `FifoQueue: true`. This option did not work to create FIFO queues before: the resources it created were undeployable. Now it works.

# v4.2.1

- Fix bug in QueueLambda where ReservedConcurrentExecution inncorrectly couldn't be set to zero

# v4.2.0

- Seperate Glue View into Glue Presto View and Glue Spark View

# v4.1.3

- Update minimist to resolve security vulnerabilities

# v4.1.2

- More Bugfixes for Glue shortcuts. Specifically, pass in the column descriptions!

# v4.1.1

- Bugfixes for Glue shortcuts

# v4.1.0

- Add shortcuts for Glue resources

# v4.0.0

- Upgrade cloudfriend and lambda shortcut to Node10 with support for Node12

# v3.8.1

- Fix bug in queue shortcut

# v3.8.0

- Adds `ExistingTopicArn` option to queue shortcut

# v.3.7.0

- Adds shortcut for log subscription lambda

# v3.6.0

- Adds support for the `MaximumBatchingWindowInSeconds` property of an event source mapping within the `StreamLambda` shortcut

# v3.5.0

- Adds shortcut for Kinesis Firehouse (with S3 destination)

# v3.4.0

- Adds requirement for lambda shortcut alarm evaluation windows to >= the lambda timeout

# v3.3.0

- Adds shortcut for an event-driven Lambda function.

# v3.2.0

- Adds shortcuts for a generic IAM role and for a cross-account IAM role.

# v3.1.1

- Revert shortcut Lambdas to `node8.10` runtime, as `ZipFile`-style function definitions are not yet supported for `node10.x` by Cloudformation.

# v3.1.0

- Shortcut lambdas are run with runtime Node10.x by default

# v3.0.1

- Dependency updates to avoid security vulnerabilities and make installable in node.js v12.

# v3.0.0

- Makes all hookshot API Gateway **regional** instead of **edge-optimized** endpoints.

# v2.8.2

- Adds `firehose` as another service which cannot use `AWS::URLSuffix`

# v2.8.1

- Implement a list of AWS service namespaces where use of `AWS::URLSuffix` results in an invalid service URL in China regions.

# v2.8.0

- Allows Hookshot callers to bring their own webhook secret. This is used for
signature-verification in the `.Github()` case.

# v2.7.0

- Adds support for Layers to Lambda shortcuts

# v2.6.0

- Modifies CloudWatch alarm names to include the AWS region.

## v2.5.0

- Hookshot caller can now enable metrics, detailed execution logging, and setup custom-formatted access logging

## v2.4.0

- Hookshot caller can now set execution LoggingLevel to INFO or ERROR

## v2.3.0

- Shortcut lambdas are run with runtime Node8.10 by default

## v2.2.0

- Pass options through to command line tools #22

## v2.1.0

- adds new shortcuts: `hookshot.Passthrough` and `hookshot.Github`, for simple webhook-response systems
- adds support for `DependsOn` properties to several shortcuts
- fixes a bug in `shortcuts.ServiceRole` if no permissions statements are provided

## v2.0.2

- fixes a bug in the lambda service principal definition in china regions

## v2.0.1

- various shortcut bugfixes. See https://github.com/mapbox/cloudfriend/pull/34

## v2.0.0

- Cloudfriend is no longer friends with node.js versions less than v8. Now is the right time to update your local runtime.
- Adds `cf.shortcuts`, which are a set of classes that can be used to generate boilerplate CloudFormation template code for certain scenarios.

## v1.10.0

- Allow specifiying region in `validate-template` command

## v1.9.1

- Rename `AWS::DomainSuffix` to `AWS::URLSuffix`

## v1.9.0

- Adds `AWS::Partition` and `AWS::DomainSuffix` pseudo-parameters
- Adds `cloudfriend.arn()`, a shortcut for constructing ARNs

## v1.8.2

- more permissive engines.node

## v1.8.1

- `.split()` now allows object arguments.

## v1.8.0

- `.split()` added for `Fn::Split` intrinsic function.

## v1.7.0

- Adds `cloudfriend.permissions`, which exports a CloudFormation template which creates an AWS user and access key with permission to run `cloudfriend.validate()`.

## v1.6.0

- Adds support of Fn::ImportValue

## v1.5.0

- `.merge()` now allows name reuse across template properties, e.g. can have a Resource and an Output with the same name.
- `.merge()` now allows name overlaps if the provided objects are identical.

## v1.4.0

- `validate-template` now exits 1 if the template is invalid.

## v1.3.0

- Adds support for Fn::Sub

## v1.2.0

- Fixes `cloudfriend.build()` for JSON template files that do not use the `.json` extension.
- Adds an optional second arg to `cloudfriend.build(template, opts)`. If provided, this object is handed to any `.js`-defined template file that exports a function.

## v1.1.0

- Initial release
