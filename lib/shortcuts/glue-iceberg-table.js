'use strict';

const GlueTable = require('./glue-table');

/**
 * Create a Glue table backed by Apache Iceberg format on S3.
 *
 * @param {Object} options - Accepts the same options as cloudfriend's
 * [`GlueTable`](https://github.com/mapbox/cloudfriend/blob/master/lib/shortcuts/glue-table.js),
 * though the following additional attributes are either required or hard-wired:
 * @param {String} options.Location - The physical location of the table. See
 * [AWS
 * documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-location).
 * @param {String} [options.TableType='EXTERNAL_TABLE'] - Hard-wired by this
 * shortcut.
 * @param {String} [options.IcebergVersion='2'] - The table version for the
 * Iceberg table. See [AWS
 * documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-iceberginput.html).
 * @param {Boolean} [options.EnableOptimizer=false] - Whether to enable the
 * snapshot retention optimizer for this Iceberg table.
 * @param {String} [options.OptimizerRoleArn=undefined] - The ARN of the IAM
 * role for the retention optimizer to use. Required if EnableOptimizer is
 * true. Can be the same role as CompactionRoleArn or OrphanFileDeletionRoleArn
 * if multiple optimizers are enabled. See [AWS
 * documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-tableoptimizer-tableoptimizerconfiguration.html).
 * @param {Number} [options.SnapshotRetentionPeriodInDays=5] - The number of
 * days to retain snapshots. See [AWS
 * documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-properties-glue-tableoptimizer-icebergretentionconfiguration.html).
 * @param {Number} [options.NumberOfSnapshotsToRetain=1] - The minimum number
 * of snapshots to retain. See [AWS
 * documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-properties-glue-tableoptimizer-icebergretentionconfiguration.html).
 * @param {Boolean} [options.CleanExpiredFiles=true] - Whether to delete
 * expired data files after expiring snapshots. See [AWS
 * documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-properties-glue-tableoptimizer-icebergretentionconfiguration.html).
 * @param {Boolean} [options.EnableCompaction=false] - Whether to enable the
 * compaction optimizer for this Iceberg table. Note: CloudFormation does not
 * support configuring compaction strategy or thresholds; the optimizer will use
 * AWS defaults (binpack strategy). Configuration must be done via AWS CLI/API.
 * See [GitHub issue](https://github.com/aws-cloudformation/cloudformation-coverage-roadmap/issues/2257).
 * @param {String} [options.CompactionRoleArn=undefined] - The ARN of the IAM
 * role for the compaction optimizer to use. Required if EnableCompaction is
 * true. Can be the same role as OptimizerRoleArn or OrphanFileDeletionRoleArn
 * if multiple optimizers are enabled. See [AWS
 * documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-tableoptimizer-tableoptimizerconfiguration.html).
 * @param {Boolean} [options.EnableOrphanFileDeletion=false] - Whether to
 * enable the orphan file deletion optimizer for this Iceberg table.
 * @param {String} [options.OrphanFileDeletionRoleArn=undefined] - The ARN of
 * the IAM role for the orphan file deletion optimizer to use. Required if
 * EnableOrphanFileDeletion is true. Can be the same role as OptimizerRoleArn
 * or CompactionRoleArn if multiple optimizers are enabled. See [AWS
 * documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-tableoptimizer-tableoptimizerconfiguration.html).
 * @param {Number} [options.OrphanFileRetentionPeriodInDays=3] - The number of
 * days to retain orphan files before deleting them. See [AWS
 * documentation](https://docs.aws.amazon.com/glue/latest/dg/enable-orphan-file-deletion.html).
 * @param {String} [options.OrphanFileDeletionLocation=undefined] - The S3
 * location to scan for orphan files. Defaults to the table location if not
 * specified. See [AWS
 * documentation](https://docs.aws.amazon.com/glue/latest/dg/enable-orphan-file-deletion.html).
 */
class GlueIcebergTable extends GlueTable {
  constructor(options) {
    if (!options) throw new Error('Options required');
    const {
      Location,
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

    const required = [Location];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a Location');

    if (EnableOptimizer && !OptimizerRoleArn)
      throw new Error('You must provide an OptimizerRoleArn when EnableOptimizer is true');

    if (EnableCompaction && !CompactionRoleArn)
      throw new Error('You must provide a CompactionRoleArn when EnableCompaction is true');

    if (EnableOrphanFileDeletion && !OrphanFileDeletionRoleArn)
      throw new Error('You must provide an OrphanFileDeletionRoleArn when EnableOrphanFileDeletion is true');

    super(
      Object.assign(
        {
          TableType: 'EXTERNAL_TABLE',
          Parameters: { EXTERNAL: 'TRUE' }
        },
        options
      )
    );

    const logicalName = options.LogicalName;
    this.Resources[logicalName].Properties.OpenTableFormatInput = {
      IcebergInput: {
        MetadataOperation: 'CREATE',
        Version: IcebergVersion
      }
    };

    // Optionally add TableOptimizer for configuring snapshot retention
    if (EnableOptimizer) {
      const optimizerLogicalName = `${logicalName}RetentionOptimizer`;
      this.Resources[optimizerLogicalName] = {
        Type: 'AWS::Glue::TableOptimizer',
        DependsOn: logicalName,
        Properties: {
          CatalogId: options.CatalogId || { Ref: 'AWS::AccountId' },
          DatabaseName: options.DatabaseName,
          TableName: options.Name,
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

      // Apply Condition to optimizer if specified on the table
      if (options.Condition) {
        this.Resources[optimizerLogicalName].Condition = options.Condition;
      }
    }

    // Optionally add TableOptimizer for compaction
    // NOTE: CloudFormation does not support CompactionConfiguration properties
    // (strategy, minInputFiles, deleteFileThreshold). These must be configured
    // via AWS CLI/API after stack creation, or will use AWS defaults.
    // See: https://github.com/aws-cloudformation/cloudformation-coverage-roadmap/issues/2257
    if (EnableCompaction) {
      const compactionLogicalName = `${logicalName}CompactionOptimizer`;
      this.Resources[compactionLogicalName] = {
        Type: 'AWS::Glue::TableOptimizer',
        DependsOn: logicalName,
        Properties: {
          CatalogId: options.CatalogId || { Ref: 'AWS::AccountId' },
          DatabaseName: options.DatabaseName,
          TableName: options.Name,
          Type: 'compaction',
          TableOptimizerConfiguration: {
            RoleArn: CompactionRoleArn,
            Enabled: true
          }
        }
      };

      // Apply Condition to compaction optimizer if specified on the table
      if (options.Condition) {
        this.Resources[compactionLogicalName].Condition = options.Condition;
      }
    }

    // Optionally add TableOptimizer for orphan file deletion
    if (EnableOrphanFileDeletion) {
      const orphanLogicalName = `${logicalName}OrphanFileDeletionOptimizer`;
      const icebergConfiguration = {
        OrphanFileRetentionPeriodInDays
      };

      // Only add Location if specified, otherwise it defaults to table location
      if (OrphanFileDeletionLocation) {
        icebergConfiguration.Location = OrphanFileDeletionLocation;
      }

      this.Resources[orphanLogicalName] = {
        Type: 'AWS::Glue::TableOptimizer',
        DependsOn: logicalName,
        Properties: {
          CatalogId: options.CatalogId || { Ref: 'AWS::AccountId' },
          DatabaseName: options.DatabaseName,
          TableName: options.Name,
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

      // Apply Condition to orphan file deletion optimizer if specified on the table
      if (options.Condition) {
        this.Resources[orphanLogicalName].Condition = options.Condition;
      }
    }
  }
}

module.exports = GlueIcebergTable;
