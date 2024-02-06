## Classes

<dl>
<dt><a href="#CrossAccountRole">CrossAccountRole</a></dt>
<dd><p>Create an IAM role that will be assumed from another AWS Account.</p>
</dd>
<dt><a href="#EventLambda">EventLambda</a></dt>
<dd><p>A Lambda function that runs in reaction to a CloudWatch Event. Includes
a LogGroup, a Role, an Alarm on function errors, a CloudWatch Event Rule, and
a Lambda permission.</p>
</dd>
<dt><a href="#GlueDatabase">GlueDatabase</a></dt>
<dd><p>Create a Glue Database.</p>
</dd>
<dt><a href="#GlueJsonTable">GlueJsonTable</a></dt>
<dd><p>Create a Glue Table backed by line-delimited JSON files on S3.</p>
</dd>
<dt><a href="#GlueOrcTable">GlueOrcTable</a></dt>
<dd><p>Create a Glue Table backed by ORC files on S3.</p>
</dd>
<dt><a href="#GlueParquetTable">GlueParquetTable</a></dt>
<dd><p>Create a Glue table backed by Parquet files on S3.</p>
</dd>
<dt><a href="#GluePrestoView">GluePrestoView</a></dt>
<dd><p>Create a Glue Presto View.</p>
</dd>
<dt><a href="#GlueSparkView">GlueSparkView</a></dt>
<dd><p>Create a Glue Presto View.</p>
</dd>
<dt><a href="#GlueTable">GlueTable</a></dt>
<dd><p>Create a Glue Table.</p>
<p>Pre-configured versions of this shortcut are available for tables stored as line-delimited JSON or ORC:</p>
<ul>
<li><a href="#gluejsontable">GlueJsonTable</a></li>
<li><a href="#glueorctable">GlueOrcTable</a></li>
</ul>
</dd>
<dt><a href="#KinesisFirehoseBase">KinesisFirehoseBase</a></dt>
<dd><p>Base class for creating a Kinesis Firehouse that can receive records
by direct put or by consuming a Kinesis Stream.
Each implementing subclass enables writing to a specific destination.
Creates a Kinesis Firehouse delivery stream, sets up logging and creates
a policy allowing records to be delivered to the delivery stream.</p>
</dd>
<dt><a href="#Lambda">Lambda</a></dt>
<dd><p>Baseline CloudFormation resources involved in a Lambda Function. Creates a
Log Group, a Role, an Alarm on function errors, and the Lambda Function itself.</p>
</dd>
<dt><a href="#LogSubscriptionLambda">LogSubscriptionLambda</a></dt>
<dd><p>A Lambda function that runs in response to a log subscription filter.
Includes a Log Group, a Role, an Alarm on function errors, a CloudWatch Subscription Filter,
and a Lambda permission.</p>
</dd>
<dt><a href="#QueueLambda">QueueLambda</a></dt>
<dd><p>A Lambda function that runs in response to messages in an SQS queue.
Includes a Log Group, a Role, an Alarm on function errors, and an event source
mapping.</p>
</dd>
<dt><a href="#Queue">Queue</a></dt>
<dd><p>Creates an SQS queue with an attached dead-letter queue.</p>
<p>Standard (non-FIFO) queues can receive messages through an SNS topic. The
shortcut either creates a new SNS topic that can be used for sending messages
into the queue, or subscribes the queue to an existing SNS topic provided
with the <code>ExistingTopicArn</code> option. For FIFO queues, no SNS topic is created
and <code>ExistingTopicArn</code> is ignored.</p>
</dd>
<dt><a href="#Role">Role</a></dt>
<dd><p>Create an IAM role.</p>
</dd>
<dt><a href="#S3KinesisFirehose">S3KinesisFirehose</a></dt>
<dd><p>Creates a Kinesis Firehouse that can receive records by direct put or by consuming a Kinesis Stream
and writes out to the specific S3 destination. Creates a Kinesis Firehouse delivery stream,
sets up logging, and creates a policy allowing records to be delivered to the delivery stream.
Also creates a CloudWatch alarm on the <code>DeliveryToS3.DataFreshness</code> metric -- the age
of the oldest record in Kinesis Data Firehose (from entering the Kinesis Data Firehose until now).
By default, if that metric exceeds double the <code>BufferingIntervalInSeconds</code>, the
alarm is triggered.</p>
</dd>
<dt><a href="#ScheduledLambda">ScheduledLambda</a></dt>
<dd><p>A Lambda function that runs on in response to a CloudWatch Event. Includes
a Log Group, a Role, an Alarm on function errors, a CloudWatch Event Rule, and
a Lambda permission.</p>
</dd>
<dt><a href="#ServiceRole">ServiceRole</a></dt>
<dd><p>Create an IAM role that will be assumed by an AWS service, e.g. Lambda or ECS.</p>
</dd>
<dt><a href="#StreamLambda">StreamLambda</a></dt>
<dd><p>A Lambda function that runs in response to events in a DynamoDB or Kinesis
stream. Includes a Log Group, a Role, an Alarm on function errors, and an event
source mapping.</p>
</dd>
</dl>

<a name="CrossAccountRole"></a>

## CrossAccountRole
Create an IAM role that will be assumed from another AWS Account.

**Kind**: global class  
<a name="new_CrossAccountRole_new"></a>

### new CrossAccountRole(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Extends the options for [`Role`](#role). You do not need to provide an `AssumeRolePrincipals` attribute, but do need to include the following additional attributes: |
| options.Accounts | <code>Array.&lt;(String\|Object)&gt;</code> | An array of accounts that can assume this IAM Role. These could be account IDs (`123456789012`), account ARNs (`arn:aws:iam::123456789012:root`), or CloudFormation intrinsic function objects (`cf.sub('arn:aws:iam::${AccountIdParameter}:root')`). |

**Example**  
```js
const cf = require('@mapbox/cloudfriend');

const myTemplate = { ... };

const role = new cf.shortcuts.CrossAccountRole({
  LogicalName: 'MyRole',
  Accounts: ['123456789012'],
  Statement: [
    {
      Effect: 'Allow',
      Action: 's3:GetObject',
      Resource: 'arn:aws:s3:::my-bucket/my/data.tar.gz'
    }
  ]
});

module.exports = cf.merge(myTemplate, role);
```
<a name="EventLambda"></a>

## EventLambda
A Lambda function that runs in reaction to a CloudWatch Event. Includes
a LogGroup, a Role, an Alarm on function errors, a CloudWatch Event Rule, and
a Lambda permission.

**Kind**: global class  
<a name="new_EventLambda_new"></a>

### new EventLambda(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Extends the options for [`Lambda`](#lambda) with the following additional attributes: |
| options.EventPattern | <code>String</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-rule.html#cfn-events-rule-eventpattern). |
| [options.State] | <code>String</code> | <code>&#x27;ENABLED&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-rule.html#cfn-events-rule-state). |

**Example**  
```js
const cf = require('@mapbox/cloudfriend');

const myTemplate = { ... };

const lambda = new cf.shortcuts.EventLambda({
  LogicalName: 'MyLambda',
  Code: {
    S3Bucket: 'my-code-bucket',
    S3Key: 'path/to/code.zip'
  },
  EventPattern: {
    'detail-type': ['AWS Console Sign In via CloudTrail'],
    detail: {
      eventSource: ['signin.amazonaws.com'],
      eventName: ['ConsoleLogin']
    }
  }
});

module.exports = cf.merge(myTemplate, lambda);
```
<a name="GlueDatabase"></a>

## GlueDatabase
Create a Glue Database.

**Kind**: global class  
<a name="new_GlueDatabase_new"></a>

### new GlueDatabase(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Options. |
| options.LogicalName | <code>String</code> |  | The logical name of the Glue Database within the CloudFormation template. |
| options.Name | <code>String</code> |  | The name of the database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-database-databaseinput.html#cfn-glue-database-databaseinput-name). |
| [options.CatalogId] | <code>String</code> | <code>AccountId</code> | The AWS account ID for the account in which to create the database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-glue-database.html#cfn-glue-database-catalogid). |
| [options.Description] | <code>String</code> | <code>&#x27;Created by the ${AWS::StackName} CloudFormation stack&#x27;</code> | The description of the database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-database-databaseinput.html#cfn-glue-database-databaseinput-description). |
| [options.LocationUri] | <code>String</code> |  | The location of the database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-database-databaseinput.html#cfn-glue-database-databaseinput-locationuri). |
| [options.Parameters] | <code>String</code> |  | Parameters of the database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-database-databaseinput.html#cfn-glue-database-databaseinput-parameters). |
| [options.Condition] | <code>String</code> |  | If there is a `Condition` defined in the template that should control whether to create this database, specify the name of the condition here. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html). |
| [options.DependsOn] | <code>String</code> |  | Specify a stack resource dependency to this database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-dependson.html). |

**Example**  
```js
const cf = require('@mapbox/cloudfriend');

const myTemplate = { ... };

const db = new cf.shortcuts.GlueDatabase({
  LogicalName: 'MyDatabase',
  Name: 'my_database'
});

module.exports = cf.merge(myTemplate, db);
```
<a name="GlueJsonTable"></a>

## GlueJsonTable
Create a Glue Table backed by line-delimited JSON files on S3.

**Kind**: global class  
<a name="new_GlueJsonTable_new"></a>

### new GlueJsonTable(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Accepts the same options as [`GlueTable`](#gluetable), though the following additional attributes are either required or hard-wired: |
| options.Location | <code>String</code> |  | The physical location of the table. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-location). |
| [options.TableType] | <code>String</code> | <code>&#x27;EXTERNAL_TABLE&#x27;</code> | Hard-wired by this shortcut. |
| [options.InputFormat] | <code>String</code> | <code>&#x27;org.apache.hadoop.mapred.TextInputFormat&#x27;</code> | Hard-wired by this shortcut. |
| [options.OutputFormat] | <code>String</code> | <code>&#x27;org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat&#x27;</code> | Hard-wired by this shortcut. |
| [options.SerdeInfo] | <code>Object</code> |  | Hard-wired by this shortcut. |
| [options.SerdeInfo.SerializationLibrary] | <code>Object</code> | <code>&#x27;org.openx.data.jsonserde.JsonSerDe&#x27;</code> | Hard-wired by this shortcut. |

<a name="GlueOrcTable"></a>

## GlueOrcTable
Create a Glue Table backed by ORC files on S3.

**Kind**: global class  
<a name="new_GlueOrcTable_new"></a>

### new GlueOrcTable(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Accepts the same options as [`GlueTable`](#gluetable), though the following additional attributes are either required or hard-wired: |
| options.Location | <code>String</code> |  | The physical location of the table. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-location). |
| [options.TableType] | <code>String</code> | <code>&#x27;EXTERNAL_TABLE&#x27;</code> | Hard-wired by this shortcut. |
| [options.InputFormat] | <code>String</code> | <code>&#x27;org.apache.hadoop.hive.ql.io.orc.OrcInputFormat&#x27;</code> | Hard-wired by this shortcut. |
| [options.OutputFormat] | <code>String</code> | <code>&#x27;org.apache.hadoop.hive.ql.io.orc.OrcOutputFormat&#x27;</code> | Hard-wired by this shortcut. |
| [options.SerdeInfo] | <code>Object</code> |  | Hard-wired by this shortcut. |
| [options.SerdeInfo.SerializationLibrary] | <code>Object</code> | <code>&#x27;org.apache.hadoop.hive.ql.io.orc.OrcSerde&#x27;</code> | Hard-wired by this shortcut. |

<a name="GlueParquetTable"></a>

## GlueParquetTable
Create a Glue table backed by Parquet files on S3.

**Kind**: global class  
<a name="new_GlueParquetTable_new"></a>

### new GlueParquetTable(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Accepts the same options as cloudfriend's [`GlueTable`](https://github.com/mapbox/cloudfriend/blob/master/lib/shortcuts/glue-table.js), though the following additional attributes are either required or hard-wired: |
| options.Location | <code>String</code> |  | The physical location of the table. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-location). |
| [options.TableType] | <code>String</code> | <code>&#x27;EXTERNAL_TABLE&#x27;</code> | Hard-wired by this shortcut. |
| [options.InputFormat] | <code>String</code> | <code>&#x27;org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat&#x27;</code> | - Hard-wired by this shortcut. |
| [options.OutputFormat] | <code>String</code> | <code>&#x27;org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat&#x27;</code> | - Hard-wired by this shortcut. |
| [options.SerdeInfo] | <code>Object</code> |  | Hard-wired by this shortcut. |
| [options.SerdeInfo.SerializationLibrary] | <code>String</code> | <code>&#x27;org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe&#x27;</code> | - Hard-wired by this shortcut. |

<a name="GluePrestoView"></a>

## GluePrestoView
Create a Glue Presto View.

**Kind**: global class  
<a name="new_GluePrestoView_new"></a>

### new GluePrestoView(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Accepts the same options as [`GlueTable`](#gluetable), though the following additional attributes are either required or hard-wired: |
| options.OriginalSql | <code>String</code> |  | The SQL query that defines the view. |
| [options.TableType] | <code>String</code> | <code>&#x27;VIRTUAL_VIEW&#x27;</code> | Hard-wired by this shortcut. |

<a name="GlueSparkView"></a>

## GlueSparkView
Create a Glue Presto View.

**Kind**: global class  
<a name="new_GlueSparkView_new"></a>

### new GlueSparkView(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Accepts the same options as [`GlueTable`](#gluetable), though the following additional attributes are either required or hard-wired: |
| options.OriginalSql | <code>String</code> |  | The SQL query that defines the view. |
| [options.TableType] | <code>String</code> | <code>&#x27;VIRTUAL_VIEW&#x27;</code> | Hard-wired by this shortcut. |

<a name="GlueTable"></a>

## GlueTable
Create a Glue Table.

Pre-configured versions of this shortcut are available for tables stored as line-delimited JSON or ORC:
- [GlueJsonTable](#gluejsontable)
- [GlueOrcTable](#glueorctable)

**Kind**: global class  
<a name="new_GlueTable_new"></a>

### new GlueTable(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Options. |
| options.LogicalName | <code>String</code> |  | The logical name of the Glue Table within the CloudFormation template. |
| options.Name | <code>String</code> |  | The name of the table. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-tableinput.html#cfn-glue-table-tableinput-name). |
| options.DatabaseName | <code>String</code> |  | The name of the database the table resides in. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-glue-table.html#cfn-glue-table-databasename). |
| options.Columns | <code>Array.&lt;Object&gt;</code> |  | List of the table's columns. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-columns). |
| [options.CatalogId] | <code>String</code> | <code>AccountId</code> | The AWS account ID for the account in which to create the table. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-glue-table.html#cfn-glue-table-catalogid). |
| [options.Owner] | <code>String</code> |  | The table owner. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-tableinput.html#cfn-glue-table-tableinput-owner). |
| [options.Parameters] | <code>Object</code> |  | Table parameters. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-tableinput.html#cfn-glue-table-tableinput-parameters). |
| [options.PartitionKeys] | <code>Array.&lt;String&gt;</code> | <code>[]</code> | List of partitioning columns. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-tableinput.html#cfn-glue-table-tableinput-partitionkeys). |
| [options.Description] | <code>String</code> | <code>&#x27;Created by the ${AWS::StackName} CloudFormation stack&#x27;</code> | The description of the table. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-tableinput.html#cfn-glue-table-tableinput-description). |
| [options.Retention] | <code>Number</code> |  | Retention time for the table. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-tableinput.html#cfn-glue-table-tableinput-retention). |
| [options.TableType] | <code>String</code> |  | The type of this table. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-tableinput.html#cfn-glue-table-tableinput-tabletype). |
| [options.ViewExpandedText] | <code>String</code> |  | The expanded text of the view. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-tableinput.html#cfn-glue-table-tableinput-viewexpandedtext). |
| [options.ViewOriginalText] | <code>String</code> |  | The original text of the view. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-tableinput.html#cfn-glue-table-tableinput-vieworiginaltext). |
| [options.BucketColumns] | <code>Array.&lt;String&gt;</code> |  | List of bucketing columns. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-bucketcolumns). |
| [options.Compressed] | <code>Boolean</code> | <code>false</code> | Whether the data is compressed. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-compressed). |
| [options.InputFormat] | <code>String</code> |  | The table's input format. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-inputformat). |
| [options.Location] | <code>String</code> | <code>&#x27;&#x27;</code> | The physical location of the table. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-location). |
| [options.NumberOfBuckets] | <code>Number</code> | <code>0</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-numberofbuckets). |
| [options.OutputFormat] | <code>String</code> |  | The table's output format. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-outputformat). |
| [options.StorageParameters] | <code>Object</code> |  | Storage parameters. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-parameters). |
| [options.SerdeInfo] | <code>Object</code> | <code>{}</code> | The serialization/deserialization information. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-serdeinfo). |
| [options.SkewedInfo] | <code>Object</code> |  | Frequent value information. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-skewedinfo). |
| [options.SortColumns] | <code>Array.&lt;Object&gt;</code> |  | List specifying the sort order. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-sortcolumns). |
| [options.StoredAsSubDirectories] | <code>Boolean</code> | <code>true</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-storedasdubdirectories). |
| [options.Condition] | <code>String</code> |  | If there is a `Condition` defined in the template that should control whether to create this database, specify the name of the condition here. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html). |
| [options.DependsOn] | <code>String</code> |  | Specify a stack resource dependency to this database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-dependson.html). |

**Example**  
```js
const cf = require('@mapbox/cloudfriend');

const myTemplate = { ... };

const table = new cf.shortcuts.GlueTable({
  LogicalName: 'MyTable',
  DatabaseName: 'my_database',
  Name: 'my_table',
  Columns: [
    { Name: 'column_name', Type: 'string', Comment: 'my_column description' }
  ]
});

module.exports = cf.merge(myTemplate, table);
```
<a name="KinesisFirehoseBase"></a>

## KinesisFirehoseBase
Base class for creating a Kinesis Firehouse that can receive records
by direct put or by consuming a Kinesis Stream.
Each implementing subclass enables writing to a specific destination.
Creates a Kinesis Firehouse delivery stream, sets up logging and creates
a policy allowing records to be delivered to the delivery stream.

**Kind**: global class  
<a name="new_KinesisFirehoseBase_new"></a>

### new KinesisFirehoseBase(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Options. |
| options.LogicalName | <code>String</code> | The logical name of the Kinesis Firehouse delivery stream within the CloudFormation template. This is also used to construct the logical names of the other resources. |
| [options.KinesisStreamARN] | <code>String</code> \| <code>Object</code> | The ARN of a source Kinesis Stream. |

<a name="Lambda"></a>

## Lambda
Baseline CloudFormation resources involved in a Lambda Function. Creates a
Log Group, a Role, an Alarm on function errors, and the Lambda Function itself.

**Kind**: global class  
<a name="new_Lambda_new"></a>

### new Lambda(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Options. |
| options.LogicalName | <code>String</code> |  | The logical name of the Lambda function within the CloudFormation template. This is used to construct the logical names of the other resources, as well as the Lambda function's name. |
| options.Code | <code>Object</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-lambda-function-code.html). |
| [options.DeadLetterConfig] | <code>Object</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-deadletterconfig). |
| [options.Description] | <code>String</code> | <code>&#x27;${logical name} in the ${stack name} stack&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-description). |
| [options.Environment] | <code>Object</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-environment). |
| [options.FunctionName] | <code>String</code> | <code>&#x27;${stack name}-${logical name}&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-functionname). |
| [options.Handler] | <code>String</code> | <code>&#x27;index.handler&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-handler). |
| [options.KmsKeyArn] | <code>String</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-kmskeyarn). |
| [options.Layers] | <code>Array.&lt;String&gt;</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-layers). |
| [options.MemorySize] | <code>Number</code> | <code>128</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-memorysize). |
| [options.ReservedConcurrentExecutions] | <code>Number</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-reservedconcurrentexecutions). |
| [options.Runtime] | <code>String</code> | <code>&#x27;nodejs18.x&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-runtime). |
| [options.Tags] | <code>Array.&lt;Object&gt;</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-tags). |
| [options.Timeout] | <code>Number</code> | <code>300</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-timeout). |
| [options.TracingConfig] | <code>Object</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-tracingconfig). |
| [options.VpcConfig] | <code>Object</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-vpcconfig). |
| [options.Condition] | <code>String</code> |  | If there is a `Condition` defined in the template that should control whether to create this Lambda function, specify the name of the condition here. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html). |
| [options.DependsOn] | <code>String</code> |  | Specify a stack resource dependency to this Lambda function. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-dependson.html). |
| [options.Statement] | <code>Array.&lt;Object&gt;</code> | <code>[]</code> | Policy statements that will be added to a generated IAM role defining the permissions your Lambda function needs to run. _Do not use this option when specifying your own role via RoleArn._ |
| [options.RoleArn] | <code>String</code> |  | If specified, the Lambda function will use this role instead of creating a new role. _If this option is specified, do not use the Statement option; add the permissions you need to your Role directly._ |
| [options.AlarmName] | <code>String</code> | <code>&#x27;${stack name}-${logical name}-Errors-${region}&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmname). |
| [options.AlarmDescription] | <code>String</code> | <code>&#x27;Error alarm for ${stack name}-${logical name} lambda function in ${stack name} stack&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmdescription). |
| [options.AlarmActions] | <code>Array.&lt;String&gt;</code> | <code>[]</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmactions). |
| [options.Period] | <code>Number</code> | <code>60</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-period). |
| [options.EvaluationPeriods] | <code>Number</code> | <code>1</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-evaluationperiods). |
| [options.Statistic] | <code>String</code> | <code>&#x27;Sum&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-statistic). |
| [options.DatapointsToAlarm] | <code>Number</code> | <code>1</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarm-datapointstoalarm). |
| [options.Threshold] | <code>Number</code> | <code>0</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-threshold). |
| [options.ComparisonOperator] | <code>String</code> | <code>&#x27;GreaterThanThreshold&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-comparisonoperator). |
| [options.TreatMissingData] | <code>String</code> | <code>&#x27;notBreaching&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-treatmissingdata). |
| [options.EvaluateLowSampleCountPercentile] | <code>String</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-evaluatelowsamplecountpercentile). |
| [options.ExtendedStatistic] | <code>String</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-extendedstatistic)] |
| [options.OKActions] | <code>Array.&lt;String&gt;</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-okactions). |

**Example**  
```js
const cf = require('@mapbox/cloudfriend');

const myTemplate = { ... };

const lambda = new cf.shortcuts.Lambda({
  LogicalName: 'MyLambda',
  Code: {
    S3Bucket: 'my-code-bucket',
    S3Key: 'path/to/code.zip'
  }
});

module.exports = cf.merge(myTemplate, lambda);
```
<a name="LogSubscriptionLambda"></a>

## LogSubscriptionLambda
A Lambda function that runs in response to a log subscription filter.
Includes a Log Group, a Role, an Alarm on function errors, a CloudWatch Subscription Filter,
and a Lambda permission.

**Kind**: global class  
<a name="new_LogSubscriptionLambda_new"></a>

### new LogSubscriptionLambda(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Extends the options for [`Lambda`](#lambda) with the following additional attributes: |
| options.LogGroupName | <code>String</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-logs-subscriptionfilter.html#cfn-cwl-subscriptionfilter-loggroupname). |
| [options.FilterPattern] | <code>String</code> | <code>&#x27;&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-logs-subscriptionfilter.html#cfn-cwl-subscriptionfilter-filterpattern). |

**Example**  
```js
const cf = require('@mapbox/cloudfriend');

const myTemplate = { ... };

const lambda = new cf.shortcuts.LogSubscriptionLambda({
  LogicalName: 'MyLambda',
  Code: {
    S3Bucket: 'my-code-bucket',
    S3Key: 'path/to/code.zip'
  },
  LogGroupName: 'my-log-group'
});

module.exports = cf.merge(myTemplate, lambda);
```
<a name="QueueLambda"></a>

## QueueLambda
A Lambda function that runs in response to messages in an SQS queue.
Includes a Log Group, a Role, an Alarm on function errors, and an event source
mapping.

**Kind**: global class  
<a name="new_QueueLambda_new"></a>

### new QueueLambda(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Extends the options for [`Lambda`](#lambda) with the following additional attributes: |
| options.EventSourceArn | <code>String</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-eventsourcearn). |
| options.ReservedConcurrentExecutions | <code>Number</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-reservedconcurrentexecutions). |
| [options.BatchSize] | <code>Number</code> | <code>1</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-batchsize). |

**Example**  
```js
const cf = require('@mapbox/cloudfriend');

const myTemplate = { ... };

const lambda = new cf.shortcuts.QueueLambda({
  LogicalName: 'MyLambda',
  Code: {
    S3Bucket: 'my-code-bucket',
    S3Key: 'path/to/code.zip'
  },
  EventSourceArn: cf.getAtt('MyQueue', 'Arn'),
  ReservedConcurrentExecutions: 30
});

module.exports = cf.merge(myTemplate, lambda);
```
<a name="Queue"></a>

## Queue
Creates an SQS queue with an attached dead-letter queue.

Standard (non-FIFO) queues can receive messages through an SNS topic. The
shortcut either creates a new SNS topic that can be used for sending messages
into the queue, or subscribes the queue to an existing SNS topic provided
with the `ExistingTopicArn` option. For FIFO queues, no SNS topic is created
and `ExistingTopicArn` is ignored.

**Kind**: global class  
<a name="new_Queue_new"></a>

### new Queue(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Options. |
| options.LogicalName | <code>String</code> |  | The logical name of the SQS queue within the CloudFormation template. This is also used to construct the logical names of the other resources. |
| [options.VisibilityTimeout] | <code>Number</code> | <code>300</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#aws-sqs-queue-visibilitytimeout). |
| [options.maxReceiveCount] | <code>Number</code> | <code>10</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues-redrivepolicy.html#aws-sqs-queue-redrivepolicy-maxcount). |
| [options.ContentBasedDeduplication] | <code>Boolean</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#cfn-sqs-queue-contentbaseddeduplication). |
| [options.DelaySeconds] | <code>Number</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#aws-sqs-queue-delayseconds). |
| [options.FifoQueue] | <code>Boolean</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#cfn-sqs-queue-fifoqueue). |
| [options.KmsMasterKeyId] | <code>String</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#aws-sqs-queue-kmsmasterkeyid). |
| [options.KmsDataKeyReusePeriodSeconds] | <code>Number</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#aws-sqs-queue-kmsdatakeyreuseperiodseconds). |
| [options.MaximumMessageSize] | <code>Number</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#aws-sqs-queue-maxmsgsize). |
| [options.MessageRetentionPeriod] | <code>Number</code> | <code>1209600</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#aws-sqs-queue-msgretentionperiod). |
| [options.QueueName] | <code>String</code> | <code>&#x27;${stack name}-${logical name}&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#aws-sqs-queue-name). If `FifoQueue` is `true`, the suffix `.fifo` will be added to the queue name. |
| [options.ReceiveMessageWaitTimeSeconds] | <code>Number</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#aws-sqs-queue-receivemsgwaittime). |
| [options.Condition] | <code>String</code> |  | If there is a `Condition` defined in the template that should control whether to create this SQS queue, specify the name of the condition here. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html). |
| [options.DependsOn] | <code>String</code> |  | Specify a stack resource dependency to this SQS queue. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-dependson.html). |
| [options.ExistingTopicArn] | <code>String</code> |  | Specify an SNS topic ARN to subscribe the queue to. If this option is provided, `TopicName` is irrelevant because no new topic is created. This option is ignored if `FifoQueue: true`, because FIFO queues cannot subscribe to SNS topics. |
| [options.TopicName] | <code>String</code> | <code>&#x27;${stack name}-${logical name}&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sns-topic.html#cfn-sns-topic-name). This option is ignored if `FifoQueue: true`, because FIFO queues cannot subscribe to SNS topics. |
| [options.DisplayName] | <code>String</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sns-topic.html#cfn-sns-topic-displayname). |
| [options.DeadLetterVisibilityTimeout] | <code>Number</code> | <code>300</code> | [VisibilityTimeout](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#aws-sqs-queue-visibilitytimeout) for the dead-letter queue. |

**Example**  
```js
const cf = require('@mapbox/cloudfriend');

const myTemplate = { ... };

const queue = new cf.shortcuts.Queue({
  LogicalName: 'MyQueue'
});

module.exports = cf.merge(myTemplate, queue);
```
<a name="Role"></a>

## Role
Create an IAM role.

**Kind**: global class  
<a name="new_Role_new"></a>

### new Role(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Options. |
| options.LogicalName | <code>String</code> |  | The logical name of the IAM role within the CloudFormation template. |
| options.AssumeRolePrincipals | <code>Array.&lt;Object&gt;</code> |  | An array of [principal objects](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html) defining entities able to assume this role. Will be included in the role's [`AssumeRolePolicyDocument`](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html?shortFooter=true#cfn-iam-role-assumerolepolicydocument). |
| [options.Statement] | <code>Array.&lt;Object&gt;</code> | <code>[]</code> | An array of permissions statements to be included in the [`PolicyDocument`](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-iam-policy.html#cfn-iam-policies-policydocument). |
| [options.ManagedPolicyArns] | <code>Array.&lt;String&gt;</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html#cfn-iam-role-managepolicyarns). |
| [options.MaxSessionDuration] | <code>Number</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html#cfn-iam-role-maxsessionduration). |
| [options.Path] | <code>String</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html#cfn-iam-role-path). |
| [options.RoleName] | <code>String</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html#cfn-iam-role-rolename). |
| [options.Tags] | <code>Array.&lt;Object&gt;</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html#cfn-iam-role-tags). |
| [options.Condition] | <code>String</code> |  | If there is a `Condition` defined in the template that should control whether to create this IAM role, specify the name of the condition here. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html). |
| [options.DependsOn] | <code>String</code> |  | Specify a stack resource dependency to this IAM role. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-dependson.html). |

**Example**  
```js
const cf = require('@mapbox/cloudfriend');

const myTemplate = { ... };

const role = new cf.shortcuts.Role({
  LogicalName: 'MyRole',
  AssumeRolePrincipals: [
    { Service: 'ec2.amazonaws.com' }
  ],
  Statement: [
    {
      Effect: 'Allow',
      Action: 's3:GetObject',
      Resource: 'arn:aws:s3:::my-bucket/my/data.tar.gz'
    }
  ]
});

module.exports = cf.merge(myTemplate, role);
```
<a name="S3KinesisFirehose"></a>

## S3KinesisFirehose
Creates a Kinesis Firehouse that can receive records by direct put or by consuming a Kinesis Stream
and writes out to the specific S3 destination. Creates a Kinesis Firehouse delivery stream,
sets up logging, and creates a policy allowing records to be delivered to the delivery stream.
Also creates a CloudWatch alarm on the `DeliveryToS3.DataFreshness` metric -- the age
of the oldest record in Kinesis Data Firehose (from entering the Kinesis Data Firehose until now).
By default, if that metric exceeds double the `BufferingIntervalInSeconds`, the
alarm is triggered.

**Kind**: global class  
<a name="new_S3KinesisFirehose_new"></a>

### new S3KinesisFirehose(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Options. |
| options.LogicalName | <code>String</code> |  | The logical name of the Kinesis Firehouse delivery stream within the CloudFormation template. This is also used to construct the logical names of the other resources. |
| options.DestinationBucket | <code>String</code> |  | The name of the S3 bucket to write to. |
| [options.Prefix] | <code>String</code> | <code>&#x27;raw/${logical name}/&#x27;</code> | The prefix path (folder) within the DestinationBucket to write to. |
| [options.KinesisStreamARN] | <code>String</code> \| <code>Object</code> |  | The ARN of a source Kinesis Stream. |
| [options.BufferingIntervalInSeconds] | <code>Number</code> | <code>900</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-kinesisfirehose-deliverystream-bufferinghints.html#cfn-kinesisfirehose-deliverystream-bufferinghints-intervalinseconds). |
| [options.BufferingSizeInMBs] | <code>Number</code> | <code>128</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-kinesisfirehose-deliverystream-bufferinghints.html#cfn-kinesisfirehose-deliverystream-bufferinghints-sizeinmbs). |
| [options.AlarmName] | <code>String</code> | <code>&#x27;${stack name}-${logical name}-Freshness-${region}&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmname). |
| [options.AlarmDescription] | <code>String</code> | <code>&#x27;Freshness alarm for ${stack name}-${logical name} kinesis firehose in ${stack name} stack&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmdescription). |
| [options.AlarmActions] | <code>Array.&lt;String&gt;</code> | <code>[]</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-alarmactions). |
| [options.Period] | <code>Number</code> | <code>60</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-period). |
| [options.EvaluationPeriods] | <code>Number</code> | <code>1</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-evaluationperiods). |
| [options.Statistic] | <code>String</code> | <code>&#x27;Maximum&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-statistic). |
| [options.Threshold] | <code>Number</code> | <code>(BufferingIntervalInSeconds * 2)</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-threshold). |
| [options.ComparisonOperator] | <code>String</code> | <code>&#x27;GreaterThanThreshold&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-comparisonoperator). |
| [options.TreatMissingData] | <code>String</code> | <code>&#x27;notBreaching&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-treatmissingdata). |
| [options.EvaluateLowSampleCountPercentile] | <code>String</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-evaluatelowsamplecountpercentile). |
| [options.ExtendedStatistic] | <code>String</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-extendedstatistic)] |
| [options.OKActions] | <code>Array.&lt;String&gt;</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cw-alarm.html#cfn-cloudwatch-alarms-okactions). |

**Example**  
```js
const cf = require('@mapbox/cloudfriend');

const myTemplate = { ... };

const firehose = new cf.shortcuts.S3KinesisFirehose({
  LogicalName: 'MyKinesisFirehose',
  DestinationBucket: 'mah-bukkit'
});

module.exports = cf.merge(myTemplate, firehose);
```
<a name="ScheduledLambda"></a>

## ScheduledLambda
A Lambda function that runs on in response to a CloudWatch Event. Includes
a Log Group, a Role, an Alarm on function errors, a CloudWatch Event Rule, and
a Lambda permission.

**Kind**: global class  
<a name="new_ScheduledLambda_new"></a>

### new ScheduledLambda(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Extends the options for [`Lambda`](#lambda) with the following additional attributes: |
| options.ScheduleExpression | <code>String</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-rule.html#cfn-events-rule-scheduleexpression). |
| [options.RoleArn] | <code>String</code> | If specified, the eventbride schedule will use this role to invoke your lambda . _If this option is specified, do not use the Statement option; add the permissions you need to your Role directly._ See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-scheduler-schedule-target.html#cfn-scheduler-schedule-target-rolearn) |
| [options.RoleArn] | <code>String</code> | If specified, the eventbride schedule will use this role to invoke your lambda . _If this option is specified, do not use the Statement option; add the permissions you need to your Role directly._ |
| [options.ScheduleGroupName] | <code>String</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-scheduler-schedule.html#cfn-scheduler-schedule-groupname). |

**Example**  
```js
const cf = require('@mapbox/cloudfriend');

const myTemplate = { ... };

const lambda = new cf.shortcuts.ScheduledLambda({
  LogicalName: 'MyLambda',
  Code: {
    S3Bucket: 'my-code-bucket',
    S3Key: 'path/to/code.zip'
  },
  ScheduleExpression: 'cron(45 * * * ? *)',
});

module.exports = cf.merge(myTemplate, lambda);
```
<a name="ServiceRole"></a>

## ServiceRole
Create an IAM role that will be assumed by an AWS service, e.g. Lambda or ECS.

**Kind**: global class  
<a name="new_ServiceRole_new"></a>

### new ServiceRole(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Extends the options for [`Role`](#role). You do not need to provide an `AssumeRolePrincipals` attribute, but do need to include the following additional attributes: |
| options.Service | <code>String</code> | The name of the AWS service that will assume this role, e.g. `lambda`. |

**Example**  
```js
const cf = require('@mapbox/cloudfriend');

const myTemplate = { ... };

const role = new cf.shortcuts.ServiceRole({
  LogicalName: 'MyRole',
  Service: 'lambda',
  Statement: [
    {
      Effect: 'Allow',
      Action: 's3:GetObject',
      Resource: 'arn:aws:s3:::my-bucket/my/data.tar.gz'
    }
  ]
});

module.exports = cf.merge(myTemplate, role);
```
<a name="StreamLambda"></a>

## StreamLambda
A Lambda function that runs in response to events in a DynamoDB or Kinesis
stream. Includes a Log Group, a Role, an Alarm on function errors, and an event
source mapping.

**Kind**: global class  
<a name="new_StreamLambda_new"></a>

### new StreamLambda(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Extends the options for [`Lambda`](#lambda) with the following additional attributes: |
| options.EventSourceArn | <code>String</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-eventsourcearn). |
| [options.BatchSize] | <code>Number</code> | <code>1</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-batchsize). |
| [options.MaximumBatchingWindowInSeconds] | <code>Number</code> |  | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-maximumbatchingwindowinseconds). |
| [options.Enabled] | <code>Boolean</code> | <code>true</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-enabled). |
| [options.StartingPosition] | <code>String</code> | <code>&#x27;LATEST&#x27;</code> | See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-startingposition). |

**Example**  
```js
const cf = require('@mapbox/cloudfriend');

const myTemplate = { ... };

const lambda = new cf.shortcuts.StreamLambda({
  LogicalName: 'MyLambda',
  Code: {
    S3Bucket: 'my-code-bucket',
    S3Key: 'path/to/code.zip'
  },
  EventSourceArn: cf.getAtt('MyStream', 'Arn')
});

module.exports = cf.merge(myTemplate, lambda);
```
