'use strict';

class ReturnValues {
  constructor(deployment) {
    this.pseudo = deployment.pseudo;
  }

  'AWS::SQS::Queue'(resource) {
    return {
      Ref: `https://sqs.${this.pseudo['AWS::Region']}.amazonaws.com/${this.pseudo['AWS::AccountId']}/${resource.Name}`,
      Arn: `arn:aws:sqs:${this.pseudo['AWS::Region']}:${this.pseudo['AWS::AccountId']}:${resource.Name}`,
      QueueName: resource.Name
    };
  }
}

module.exports = ReturnValues;
