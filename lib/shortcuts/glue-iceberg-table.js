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
 * role for the table optimizer to use. Required if EnableOptimizer is true.
 * See [AWS
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
      CleanExpiredFiles = true
    } = options;

    const required = [Location];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a Location');

    if (EnableOptimizer && !OptimizerRoleArn)
      throw new Error('You must provide an OptimizerRoleArn when EnableOptimizer is true');

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
      const optimizerLogicalName = `${logicalName}Optimizer`;
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
  }
}

module.exports = GlueIcebergTable;
