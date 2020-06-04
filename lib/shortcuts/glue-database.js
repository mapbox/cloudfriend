'use strict';

/**
 * Create a Glue Database.
 *
 * @param {Object} options - Options.
 * @param {String} options.LogicalName - The logical name of the Glue Database within the CloudFormation template.
 * @param {String} options.Name - The name of the database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-database-databaseinput.html#cfn-glue-database-databaseinput-name).
 * @param {String} [options.CatalogId=AccountId] - The AWS account ID for the account in which to create the database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-glue-database.html#cfn-glue-database-catalogid).
 * @param {String} [options.Description='Created by the ${AWS::StackName} CloudFormation stack'] - The description of the database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-database-databaseinput.html#cfn-glue-database-databaseinput-description).
 * @param {String} [options.LocationUri=undefined] - The location of the database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-database-databaseinput.html#cfn-glue-database-databaseinput-locationuri).
 * @param {String} [options.Parameters=undefined] - Parameters of the database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-database-databaseinput.html#cfn-glue-database-databaseinput-parameters).
 * @param {String} [options.Condition=undefined] - If there is a `Condition` defined
 * in the template that should control whether to create this database,
 * specify the name of the condition here. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html).
 * @param {String} [options.DependsOn=undefined] - Specify a stack resource dependency
 * to this database. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-dependson.html).
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
  constructor(options) {
    if (!options) throw new Error('Options required');
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
