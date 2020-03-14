'use strict';

/**
 * Create a Glue Database.
 *
 * @property {Object} Resources - the CloudFormation resources created by this shortcut.
 *
 * @param {Object} options configuration options for the Glue Database.
 * @param {String} options.LogicalName the logical name of the Glue Database within the CloudFormation template.
 * @param {String} options.Name the name of the database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-database-databaseinput.html#cfn-glue-database-databaseinput-name)
 * @param {String} [options.CatalogId=AccountId] the AWS account ID for the account in which to create the database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-glue-database.html#cfn-glue-database-catalogid)
 * @param {String} [options.Description='Created by the ${AWS::StackName} CloudFormation stack'] the description of the database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-database-databaseinput.html#cfn-glue-database-databaseinput-description)
 * @param {String} [options.LocationUri=undefined] the location of the database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-database-databaseinput.html#cfn-glue-database-databaseinput-locationuri)
 * @param {String} [options.Parameters=undefined] parameters of the database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-database-databaseinput.html#cfn-glue-database-databaseinput-parameters)
 * @param {String} [options.Condition=undefined] if there is a Condition defined
 * in the template that should control whether or not to create this database,
 * specify the name of the condition here. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html)
 * @param {String} [options.DependsOn=undefined] Specify a stack resource dependency
 * to this database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-dependson.html)
 * @example
 * const cf = require('@mapbox/cloudfriend');
 *
 * const myTemplate = { ... };
 *
 * const db = new cf.shortcuts.GlueDatabase({
 *   LogicalName: 'MyDatabase',
 *   Name: 'my_database'
 * });
 *
 * module.exports = cf.merge(myTemplate, db);
 */
class GlueDatabase {
  constructor(options = {}) {
    const {
      LogicalName,
      Name,
      CatalogId = { Ref: 'AWS::AccountId' },
      Description = { 'Fn::Sub': 'Created by the {$AWS::StackName} CloudFormation stack' },
      LocationUri,
      Parameters,
      Condition,
      DependsOn
    } = options;

    const required = [LogicalName, Name];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a LogicalName and Name');

    this.Resources = {
      [LogicalName]: {
        Type: 'AWS::Glue::Database',
        Condition,
        DependsOn,
        Properties: {
          CatalogId,
          DatabaseInput: {
            Name,
            Description,
            LocationUri,
            Parameters
          }
        }
      }
    };
  }
}

module.exports = GlueDatabase;
