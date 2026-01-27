'use strict';

/**
 * Create a Glue table backed by Apache Iceberg format on S3.
 *
 * @param {Object} options - Options for creating an Iceberg table.
 * @param {String} options.LogicalName - The logical name of the Glue Table within the CloudFormation template.
 * @param {String} options.Name - The name of the table.
 * @param {String} options.DatabaseName - The name of the database the table resides in.
 * @param {String} options.Location - The physical location of the table (S3 URI). Required.
 * @param {Object} options.Schema - Full Iceberg schema definition with Type: "struct" and Fields array.
 * Each field must have Id (integer), Name (string), Type (string or object for complex types), and Required (boolean).
 * See [AWS
 * documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-icebergtableinput.html).
 * @param {Object} [options.PartitionSpec] - Iceberg partition specification. See [AWS
 * documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-partitionspec.html).
 * @param {Object} [options.WriteOrder] - Iceberg write order specification. See [AWS
 * documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-writeorder.html).
 * @param {String} [options.CatalogId=AccountId] - The AWS account ID for the account in which to create the table.
 * @param {String} [options.IcebergVersion='2'] - The table version for the Iceberg table.
 * @param {Boolean} [options.EnableOptimizer=false] - Whether to enable the snapshot retention optimizer.
 * @param {String} [options.OptimizerRoleArn=undefined] - The ARN of the IAM role for the retention optimizer. Required if EnableOptimizer is true.
 * @param {Number} [options.SnapshotRetentionPeriodInDays=5] - The number of days to retain snapshots.
 * @param {Number} [options.NumberOfSnapshotsToRetain=1] - The minimum number of snapshots to retain.
 * @param {Boolean} [options.CleanExpiredFiles=true] - Whether to delete expired data files after expiring snapshots.
 * @param {Boolean} [options.EnableCompaction=false] - Whether to enable the compaction optimizer.
 * @param {String} [options.CompactionRoleArn=undefined] - The ARN of the IAM role for the compaction optimizer. Required if EnableCompaction is true.
 * @param {Boolean} [options.EnableOrphanFileDeletion=false] - Whether to enable the orphan file deletion optimizer.
 * @param {String} [options.OrphanFileDeletionRoleArn=undefined] - The ARN of the IAM role for the orphan file deletion optimizer. Required if EnableOrphanFileDeletion is true.
 * @param {Number} [options.OrphanFileRetentionPeriodInDays=3] - The number of days to retain orphan files before deleting them.
 * @param {String} [options.OrphanFileDeletionLocation=undefined] - The S3 location to scan for orphan files.
 */
class GlueIcebergTable {
  constructor(options) {
    if (!options) throw new Error('Options required');
    const {
      LogicalName,
      Name,
      DatabaseName,
      Location,
      Schema,
      PartitionSpec,
      WriteOrder,
      CatalogId = { Ref: 'AWS::AccountId' },
      IcebergVersion = '2',
      EnableOptimizer = false,
      OptimizerRoleArn,
      SnapshotRetentionPeriodInDays = 5,
      NumberOfSnapshotsToRetain = 1,
      CleanExpiredFiles = true,
      EnableCompaction = false,
      CompactionRoleArn,
      EnableOrphanFileDeletion = false,
      OrphanFileDeletionRoleArn,
      OrphanFileRetentionPeriodInDays = 3,
      OrphanFileDeletionLocation
    } = options;

    // Validate required fields
    const required = [LogicalName, Name, DatabaseName, Location, Schema];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a LogicalName, Name, DatabaseName, Location, and Schema');

    if (EnableOptimizer && !OptimizerRoleArn)
      throw new Error('You must provide an OptimizerRoleArn when EnableOptimizer is true');

    if (EnableCompaction && !CompactionRoleArn)
      throw new Error('You must provide a CompactionRoleArn when EnableCompaction is true');

    if (EnableOrphanFileDeletion && !OrphanFileDeletionRoleArn)
      throw new Error('You must provide an OrphanFileDeletionRoleArn when EnableOrphanFileDeletion is true');

    // Build the Iceberg table resource (no TableInput!)
    this.Resources = {
      [LogicalName]: {
        Type: 'AWS::Glue::Table',
        Properties: {
          CatalogId,
          DatabaseName,
          Name,
          OpenTableFormatInput: {
            IcebergInput: {
              MetadataOperation: 'CREATE',
              Version: IcebergVersion,
              IcebergTableInput: {
                Location,
                Schema
              }
            }
          }
        }
      }
    };

    // Add optional PartitionSpec if provided
    if (PartitionSpec) {
      this.Resources[LogicalName].Properties.OpenTableFormatInput.IcebergInput.IcebergTableInput.PartitionSpec = PartitionSpec;
    }

    // Add optional WriteOrder if provided
    if (WriteOrder) {
      this.Resources[LogicalName].Properties.OpenTableFormatInput.IcebergInput.IcebergTableInput.WriteOrder = WriteOrder;
    }

    // Optionally add TableOptimizer for configuring snapshot retention
    if (EnableOptimizer) {
      const optimizerLogicalName = `${LogicalName}RetentionOptimizer`;
      this.Resources[optimizerLogicalName] = {
        Type: 'AWS::Glue::TableOptimizer',
        DependsOn: LogicalName,
        Properties: {
          CatalogId,
          DatabaseName,
          TableName: Name,
          Type: 'retention',
          TableOptimizerConfiguration: {
            RoleArn: OptimizerRoleArn,
            Enabled: true,
            RetentionConfiguration: {
              IcebergConfiguration: {
                SnapshotRetentionPeriodInDays,
                NumberOfSnapshotsToRetain,
                CleanExpiredFiles
              }
            }
          }
        }
      };
    }

    // Optionally add TableOptimizer for compaction
    // NOTE: CloudFormation does not support CompactionConfiguration properties
    // (strategy, minInputFiles, deleteFileThreshold). These must be configured
    // via AWS CLI/API after stack creation, or will use AWS defaults.
    // See: https://github.com/aws-cloudformation/cloudformation-coverage-roadmap/issues/2257
    if (EnableCompaction) {
      const compactionLogicalName = `${LogicalName}CompactionOptimizer`;
      this.Resources[compactionLogicalName] = {
        Type: 'AWS::Glue::TableOptimizer',
        DependsOn: LogicalName,
        Properties: {
          CatalogId,
          DatabaseName,
          TableName: Name,
          Type: 'compaction',
          TableOptimizerConfiguration: {
            RoleArn: CompactionRoleArn,
            Enabled: true
          }
        }
      };
    }

    // Optionally add TableOptimizer for orphan file deletion
    if (EnableOrphanFileDeletion) {
      const orphanLogicalName = `${LogicalName}OrphanFileDeletionOptimizer`;
      const icebergConfiguration = {
        OrphanFileRetentionPeriodInDays
      };

      // Only add Location if specified, otherwise it defaults to table location
      if (OrphanFileDeletionLocation) {
        icebergConfiguration.Location = OrphanFileDeletionLocation;
      }

      this.Resources[orphanLogicalName] = {
        Type: 'AWS::Glue::TableOptimizer',
        DependsOn: LogicalName,
        Properties: {
          CatalogId,
          DatabaseName,
          TableName: Name,
          Type: 'orphan_file_deletion',
          TableOptimizerConfiguration: {
            RoleArn: OrphanFileDeletionRoleArn,
            Enabled: true,
            OrphanFileDeletionConfiguration: {
              IcebergConfiguration: icebergConfiguration
            }
          }
        }
      };
    }
  }
}

module.exports = GlueIcebergTable;
