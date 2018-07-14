'use strict';

const uuid = require('uuid');

class ReturnValues {
  constructor(dereferencer) {
    this.pseudo = dereferencer.deployment.pseudo;
    this.dereferencer = dereferencer;
  }

  deref(obj) {
    return this.dereferencer.deref(obj);
  }

  get region() {
    return this.pseudo['AWS::Region'];
  }

  get stackName() {
    return this.pseudo['AWS::StackName'];
  }

  get accountId() {
    return this.pseudo['AWS::AccountId'];
  }

  'AWS::ApiGateway::ApiKey'() {
    return {
      Ref: 'random-api-key'
    };
  }

  'AWS::ApiGateway::Deployment'() {
    return {
      Ref: 'random-deployment-id'
    };
  }

  'AWS:ApiGateway::Method'(resource) {
    return {
      Ref: resource.Name
    };
  }

  'AWS::ApiGateway::Model'(resource) {
    return {
      Ref: resource.Name
    };
  }

  'AWS::ApiGateway::Resource'(resource) {
    return {
      Ref: resource.Name
    };
  }

  'AWS::ApiGateway::RestApi'(resource) {
    return {
      Ref: 'random-api-id',
      RootResourceId: this.deref(resource.Properties.ParentId)
    };
  }

  'AWS::ApiGateway::Stage'(resource) {
    return {
      Ref: resource.Name
    };
  }

  'AWS::ApplicationAutoScaling::ScalableTarget'(resource) {
    return {
      Ref: `service/${this.deref(resource.Properties.ResourceId)}|${this.deref(resource.Properties.ScalableDimension)}|${this.deref(resource.Properties.ServiceNamespace)}`
    };
  }

  'AWS::ApplicationAutoScaling::ScalingPolicy'(resource) {
    return {
      Ref: `arn:aws:autoscaling:${this.region}:${this.accountId}:scalingPolicy:${uuid()}:resource/${this.deref(resource.Properties.ResourceId)}:policyName/${resource.Name}`
    };
  }

  'AWS::AutoScaling::AutoScalingGroup'(resource) {
    return {
      Ref: resource.Name
    };
  }

  'AWS::AutoScaling::LaunchConfiguration'(resource) {
    return {
      Ref: resource.Name
    };
  }

  'AWS::AutoScaling::LifecycleHook'(resource) {
    return {
      Ref: resource.Name
    };
  }

  'AWS::AutoScaling::ScalingPolicy'(resource) {
    return {
      Ref: `arn:aws:autoscaling:${this.region}:${this.accountId}:scalingPolicy:${uuid()}:${this.deref(resource.PropertiesAutoScalingGroupName)}:policyName/${resource.Name}`
    };
  }

  'AWS::AutoScaling::ScheduledAction'(resource) {
    return {
      Ref: resource.Name
    };
  }

  'AWS::CloudFormation::Stack'(resource) {
    return {
      Ref: `arn:aws:cloudformation:${this.region}:${this.accountId}:stack/${resource.Name}/${uuid()}`
    };
  }

  'AWS::IAM::Group'(resource) {
    return {
      Ref: `${resource.Name}`
    };
  }

  'AWS::IAM::ManagedPolicy'(resource) {
    return {
      Ref: `arn:aws:iam::${this.accountId}:policy/${this.stackName}-${resource.Name}`
    };
  }

  'AWS::IAM::Policy'(resource) {
    return {
      Ref: resource.Name
    };
  }

  'AWS::IAM::Role'(resource) {
    return {
      Ref: resource.Name,
      Arn: `arn:aws:iam::${this.accountId}:role/${resource.Name}`
    };
  }

  'AWS::IAM::User'(resource) {
    return {
      Ref: `${this.StackName}-${resource.Name}`
    };
  }

  'AWS::SQS::Queue'(resource) {
    return {
      Ref: `https://sqs.${this.region}.amazonaws.com/${this.accountId}/${resource.Name}`,
      Arn: `arn:aws:sqs:${this.region}:${this.accountId}:${resource.Name}`,
      QueueName: resource.Name
    };
  }
}

module.exports = ReturnValues;
