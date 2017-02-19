'use strict';

const assert = require('assert');
const uuid = require('uuid/v4');
const ReturnValues = require('./return-values');

class Dereferencer {
  constructor(template) {
    assert.equal(typeof template, 'object', 'template must be an object');
    assert.ok(template.Resources, 'template must define Resources');

    Object.assign(this, {
      template: JSON.parse(JSON.stringify(template)),

      parameters: template.Parameters ? JSON.parse(JSON.stringify(template.Parameters)) : {},

      mappings: template.Mappings ? JSON.parse(JSON.stringify(template.Mappings)) : {},

      resources: Object.keys(template.Resources).reduce((resources, logicalName) => {
        resources[logicalName] = new Resource(this, template.Resources[logicalName], logicalName);
        return resources;
      }, {}),

      paramTransforms: {
        String: (value) => value,
        Number: (value) => Number(value),
        CommaDelimitedList: (value) => value.split(','),
        'List<number>': (value) => value.split(',').map((num) => Number(num))
      }
    });
  }

  deploy(deploy, parameters) {
    this.deployment = new Deployment(deploy, parameters);
    this.returnValues = new ReturnValues(this);

    const resolve = (obj) => {
      if (Array.isArray(obj)) return obj.map((item) => resolve(item));

      if (typeof obj === 'object') return Object.keys(obj).reduce((final, key) => {
        try { final[key] = this.deref(obj[key]); }
        catch(err) { final[key] = resolve(obj[key]); }
        return final;
      }, {});
      return obj;
    };

    return resolve(this.template);
  }

  deref(obj) {
    if (typeof obj !== 'object' || Array.isArray(obj)) return obj;
    const key = Object.keys(obj)[0];
    if (this[key]) return this[key](obj[key]);
    assert.fail(`${key} in not recognized as an intrinsic function or pseudo-parameter`);
  }

  paramDeref(name) {
    const parameter = this.parameters[name];
    const value = this.deployment.values[name];
    const resolve = this.paramTransforms[parameter.Type];

    assert.ok(resolve, `Parameter type ${parameter.Type} is not implemented`);
    return resolve(value);
  }

  'Fn::FindInMap'(data) {
    assert.ok(Array.isArray(data), 'Fn::FindInMap requires an array of [mapping name, key, attribute]');

    data = data.map((item) => this.deref(item));
    assert.ok(data.every((item) => typeof item === 'string') && data.length === 3, 'Fn::FindInMap requires an array of three strings');

    const mapping = data[0];
    const key = data[1];
    const attribute = data[2];

    assert.ok(this.mappings[mapping], `Mapping ${mapping} not found`);
    assert.ok(this.mappings[mapping][key], `Key ${key} in mapping ${mapping} not found`);
    assert.ok(this.mappings[mapping][key][attribute], `Attribute ${attribute} in mapping ${mapping}.${key} not found`);

    return this.mappings[mapping][key][attribute];
  }

  Ref(name) {
    name = this.deref(name);
    assert.ok(typeof name === 'string', 'Ref requires a string');
    const resource = this.resources[name];
    const parameter = this.parameters[name];
    const pseudo = this.deployment.pseudo[name];

    if (this.deployment.pseudo.hasOwnProperty(name)) return pseudo;
    if (parameter) return this.paramDeref(name);
    if (resource) {
      const valuator = this.returnValues[resource.Type];
      assert.ok(valuator, `${resource.Type} return values are not implemented`);
      const values = this.returnValues[resource.Type](resource);
      return values.Ref;
    }

    assert.fail(`${name} is not recognized as a template Parameter or Resource, or as a CloudFormation pseudo-parameter`);
  }

  'Fn::GetAtt'(data) {
    assert.ok(Array.isArray(data), 'Fn::GetAtt requires an array of [name, attribute]');

    data = data.map((item) => this.deref(item));
    assert.ok(data.every((item) => typeof item === 'string') && data.length === 2, 'Fn::GetAtt requires an array of two strings');

    const name = data[0];
    const attribute = data[1];
    const resource = this.resources[name];
    assert.ok(resource, `Resource ${name} is not found`);

    const valuator = this.returnValues[resource.Type];
    assert.ok(valuator, `${resource.Type} return values are not implemented`);

    const values = this.returnValues[resource.Type](resource);
    assert.ok(values[attribute], `${attribute} is not a valid return value for Resource type ${resource.Type}`);
    return values[attribute];
  }

  'Fn::Join'(data) {
    assert.ok(Array.isArray(data), 'Fn::Join requires an array');

    let delimiter;
    let pieces = this.deref(data[1]);

    if (!Array.isArray(pieces)) {
      delimiter = '';
      pieces = data;
    } else {
      delimiter = this.deref(data[0]);
    }

    assert.ok(Array.isArray(pieces), 'Fn::Join requires an array');
    pieces = pieces.map((piece) => this.deref(piece));
    assert.ok(pieces.every((piece) => typeof piece === 'string' || typeof piece === 'undefined'), 'Fn::Join requires an array of strings');

    return pieces.join(delimiter);
  }

  'Fn::Select'(data) {
    const index = parseInt(this.deref(data[0]));
    let list = this.deref(data[1]);
    assert.ok(!isNaN(index), 'Fn::Select requires a number');
    assert.ok(Array.isArray(list), 'Fn::Select requires an array');
    list = list.map((item) => this.deref(item));

    return list[index];
  }

  'Fn::Split'(data) {
    const delimiter = this.deref(data[0]);
    const str = this.deref(data[1]);
    assert.equal(typeof delimiter, 'string', 'Fn::Split requres a string');
    assert.equal(typeof str, 'string', 'Fn::Split requres a string');
    return str.split(delimiter);
  }

  'Fn::Sub'(data) {
    let str = Array.isArray(data) ? this.deref(data[0]) : this.deref(data);
    assert.equal(typeof str, 'string', 'Fn::Sub requires a string');

    let variables = {};
    if (Array.isArray(data) && data[1]) variables = data[1];
    assert.equal(typeof variables, 'object', 'Fn::Sub requires an object');

    const matches = str.match(/(\$\{[^!].+?\})/g);
    if (!matches) return str;

    matches.forEach((token) => {
      let replacement;
      const name = token.replace(/^\$\{/, '').replace(/\}$/, '');
      if (variables[name]) replacement = this.deref(variables[name]);
      else if (/^AWS::/.test(name)) replacement = this.deployment.pseudo[name];
      else if (/\./.test(name)) replacement = this['Fn::GetAtt'](name.split('.'));
      else replacement = this.Ref(name);
      str = str.replace(token, replacement);
    });

    return str;
  }

  'Fn::Base64'(str) {
    assert.ok(this.deployment, 'must set deployment data first');
    str = this.deref(str);
    assert.ok(typeof str === 'string', 'Fn::Base64 requires a string');
    return new Buffer(str).toString('base64');
  }

  'Fn::GetAZs'() {
    assert.fail('Fn::GetAZs is not implemented');
  }

  'Fn::ImportValue'() {
    assert.fail('Fn::ImportValue is not implemented');
  }

  'Fn::Equals'(data) {
    assert.ok(Array.isArray(data) && data.length === 2, 'Fn::Equals requires an array with two items');
    try {
      assert.deepEqual(this.deref(data[0]), this.deref(data[1]));
      return true;
    } catch(err) {
      return false;
    }
  }

  'Fn::And'(data) {
    assert.ok(Array.isArray(data) && data.length === 2, 'Fn::And requires an array with two items');
    data = data.map((item) => this.deref(item));
    assert.ok(data.every((item) => typeof item === 'boolean'), 'Fn::And requires two conditions that evaluate to booleans');

    return data[0] && data[1];
  }

  'Fn::Or'(data) {
    assert.ok(Array.isArray(data) && data.length === 2, 'Fn::Or requires an array with two items');
    data = data.map((item) => this.deref(item));
    assert.ok(data.every((item) => typeof item === 'boolean'), 'Fn::Or requires two conditions that evaluate to booleans');
    return data[0] || data[1];
  }

  'Fn::Not'(data) {
    assert.ok(Array.isArray(data) && data.length === 1, 'Fn::Not requires an array with one item');
    return this.deref(data[0]);
  }

  'Fn::If'(data) {
    assert.ok(Array.isArray(data) && data.length === 3, 'Fn::If requires an array with three items');
    data = data.map((item) => this.deref(item));

    const name = data[0];
    const conditions = this.template.Conditions || {};
    assert.ok(conditions.hasOwnProperty(name), `${name} is not a defined template Condition`);
    const condition = this.deref(conditions[name]);
    assert.equal(typeof condition, 'boolean', 'Fn::If requires a condition that evaluates to a boolean');
    return condition ? data[1] : data[2];
  }
}

class Deployment {
  constructor(deploy, parameters) {
    assert.equal(typeof deploy.accountId, 'string', 'deploy.accountId must be a string');
    assert.equal(typeof deploy.region, 'string', 'deploy.region must be a string');
    assert.equal(typeof deploy.stackName, 'string', 'deploy.stackName must be a string');
    if (deploy.notificationArns) {
      assert.ok(Array.isArray(deploy.notificationArns), 'NotificationARNs must be an array');
      assert.ok(deploy.notificationArns.every((arn) => typeof arn === 'string'), 'NotificationARNs must each be a string');
    }

    this.pseudo = {
      'AWS::AccountId': deploy.accountId,
      'AWS::Region': deploy.region,
      'AWS::StackName': deploy.stackName,
      'AWS::StackId': `arn:aws:cloudformation:${deploy.region}:${deploy.accountId}/${deploy.stackName}/${uuid()}`,
      'AWS::NotificationARNs': deploy.notificationArns || [],
      'AWS::NoValue': undefined
    };

    this.values = parameters || {};
    assert.equal(typeof this.values, 'object', 'parameters must be an object');
  }
}

class Resource {
  constructor(dereferencer, resource, logicalName) {
    Object.assign(this, resource, {
      LogicalName: logicalName,
      deref: dereferencer.deref.bind(dereferencer)
    });
  }

  get Name() {
    return this.Properties.Name ? this.deref(this.Properties.Name) : this.LogicalName;
  }
}

module.exports = Dereferencer;
