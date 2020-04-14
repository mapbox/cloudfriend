'use strict';

const GlueTable = require('./glue-table');

/**
 * Create a Glue Presto View.
 *
 * @property {Object} Resources - the CloudFormation resources created by this shortcut.
 *
 * @param {Object} options configuration options for the Glue Presto View. Accepts [the same `options` as the vanilla Glue Table](#gluetable), though the following additional properties are either required or hard-wired:
 * @param {String} options.OriginalSql the SQL query that defines the view.
 * @param {String} [options.TableType='VIRTUAL_VIEW'] hard-wired by this shortcut.

 */
class GlueSparkSQLView extends GlueTable {
  constructor(options = {}) {
    let { SqlVariables = {} } = options;
    const {
      Columns,
      DatabaseName,
      OriginalSql: originalSql
    } = options;

    const required = [DatabaseName, Columns, originalSql];
    if (required.some((variable) => !variable))
      throw new Error(
        'You must provide a DatabaseName, Columns, and OriginalSql'
      );

    const TableType = 'VIRTUAL_VIEW';
    const StoredAsSubDirectories = false;
    SqlVariables = Object.assign({ DatabaseName }, SqlVariables);

    const view = {
      'Fn::Sub': [
        originalSql,
        SqlVariables
      ]
    };

    super(
      Object.assign(
        {
          TableType,
          StoredAsSubDirectories,
          ViewOriginalText: view
        },
        options
      )
    );
  }
}

module.exports = GlueSparkSQLView;
