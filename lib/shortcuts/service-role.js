'use strict';

class ServiceRole {
  constructor(
    LogicalName,
    Service,
    Statement = [],
    {
      ManagedPolicyArns,
      MaxSessionDuration,
      Path,
      RoleName
    } = {},
    {
      Condition = undefined
    } = {}
  ) {
    const required = [LogicalName, Service];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a LogicalName and Service');

    Service = {
      'Fn::Sub': `${Service.replace(/\.amazonaws.com(\..*)?$/, '')}.\${AWS::URLSuffix}`
    };

    this.Resources = {
      [LogicalName]: {
        Type: 'AWS::IAM::Role',
        Condition,
        Properties: {
          ManagedPolicyArns,
          MaxSessionDuration,
          Path,
          RoleName,
          AssumeRolePolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Action: 'sts:AssumeRole',
                Principal: { Service }
              }
            ]
          },
          Policies: [
            {
              PolicyName: 'main',
              PolicyDocument: {
                Statement
              }
            }
          ]
        }
      }
    };
  }
}

module.exports = ServiceRole;
