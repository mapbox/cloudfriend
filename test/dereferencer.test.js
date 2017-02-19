'use strict';

const test = require('tape');
const Dereferencer = require('../lib/dereferencer');

test('[dereferencer] various AWS::SQS::Queue return values', (assert) => {
  const template = {
    Resources: {
      Queue: {
        Type: 'AWS::SQS::Queue',
        Properties: {}
      }
    },
    Outputs: {
      QueueUrl: {
        Value: { Ref: 'Queue' }
      },
      QueueName: {
        Value: { 'Fn::GetAtt': ['Queue', 'QueueName'] }
      },
      QueueArn: {
        Value: { 'Fn::GetAtt': ['Queue', 'Arn'] }
      }
    }
  };

  const deploy = {
    accountId: '123456789012',
    stackName: 'my-stack',
    region: 'us-east-1',
  };

  assert.deepEqual(new Dereferencer(template).deploy(deploy, {}), {
    Resources: {
      Queue: {
        Type: 'AWS::SQS::Queue',
        Properties: {}
      }
    },
    Outputs: {
      QueueUrl: {
        Value: `https://sqs.${deploy.region}.amazonaws.com/${deploy.accountId}/Queue`
      },
      QueueName: {
        Value: 'Queue'
      },
      QueueArn: {
        Value: `arn:aws:sqs:${deploy.region}:${deploy.accountId}:Queue`
      }
    }
  }, 'resolves dead simple template');

  assert.end();
});

test('[dereferencer] complex list operations', (assert) => {
  const template = {
    Parameters: {
      TheName: { Type: 'String' },
      Num: { Type: 'Number' },
      List: { Type: 'CommaDelimitedList' },
      ListOfNums: { Type: 'List<number>' },
      SplitThis: { Type: 'String' }
    },
    Resources: {
      Queue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          Name: { Ref: 'TheName' }
        }
      }
    },
    Outputs: {
      QueueName: {
        Value: { 'Fn::GetAtt': ['Queue', 'QueueName'] }
      },
      FirstInList: {
        Value: { 'Fn::Select': [0, { Ref: 'List' }] }
      },
      Which: {
        Value: {
          'Fn::Select': [
            {
              'Fn::Select': [{ Ref: 'Num' }, { Ref: 'ListOfNums' }]
            },
            { Ref: 'List' }
          ]
        }
      },
      Combined: {
        Value: { 'Fn::Join': ['-', { Ref: 'List' }] }
      },
      SplitAndPick: {
        Value: {
          'Fn::Select': [
            0,
            { 'Fn::Split': [',', { Ref: 'SplitThis' }] }
          ]
        }
      }
    }
  };

  const deploy = {
    accountId: '123456789012',
    stackName: 'my-stack',
    region: 'us-east-1',
  };

  const parameters = {
    TheName: 'humbug',
    Num: '1',
    List: 'a,b,c,d',
    ListOfNums: '0,2,3,1',
    SplitThis: 'd,c,e'
  };

  assert.deepEqual(new Dereferencer(template).deploy(deploy, parameters), {
    Parameters: {
      TheName: { Type: 'String' },
      Num: { Type: 'Number' },
      List: { Type: 'CommaDelimitedList' },
      ListOfNums: { Type: 'List<number>' },
      SplitThis: { Type: 'String' }
    },
    Resources: {
      Queue: {
        Type: 'AWS::SQS::Queue',
        Properties: { Name: 'humbug' }
      }
    },
    Outputs: {
      QueueName: { Value: 'humbug' },
      FirstInList: { Value: 'a' },
      Which: { Value: 'c' },
      Combined: { Value: 'a-b-c-d' },
      SplitAndPick: { Value: 'd' }
    }
  }, 'handles parameters and lists');

  assert.end();
});

test('[dereferencer] sub and pseudos', (assert) => {
  const template = {
    Parameters: {
      Param: { Type: 'String' }
    },
    Resources: {
      Queue: { Type: 'AWS::SQS::Queue', Properties: {} }
    },
    Outputs: {
      Strung: {
        Value: { 'Fn::Sub': '${AWS::Region}-${Param}-${Queue}-${Queue.Arn}' }
      },
      WithVariables: {
        Value: { 'Fn::Sub': ['${abra}-${cadabra}', { abra: 'a', cadabra: { Ref: 'Param' } }] }
      }
    }
  };

  const deploy = {
    accountId: '123456789012',
    stackName: 'my-stack',
    region: 'us-east-1',
  };

  const parameters = { Param: 'p' };

  assert.deepEqual(new Dereferencer(template).deploy(deploy, parameters), {
    Parameters: {
      Param: { Type: 'String' }
    },
    Resources: {
      Queue: { Type: 'AWS::SQS::Queue', Properties: {} }
    },
    Outputs: {
      Strung: {
        Value: 'us-east-1-p-https://sqs.us-east-1.amazonaws.com/123456789012/Queue-arn:aws:sqs:us-east-1:123456789012:Queue'
      },
      WithVariables: {
        Value: 'a-p'
      }
    }
  }, 'handles all types of Fn::Sub');

  assert.end();
});

test('[dereferencer] passes through unimplemented things', (assert) => {
  const template = {
    Parameters: {
      Param: { Type: 'String' }
    },
    Resources: {
      Thing: { Type: 'Custom::Thing', Properties: {} }
    },
    Outputs: {
      Imported: {
        Value: { 'Fn::ImportValue': { Ref: 'Param' } }
      },
      Unsupported: {
        Value: { Ref: 'Thing' }
      }
    }
  };

  const deploy = {
    accountId: '123456789012',
    stackName: 'my-stack',
    region: 'us-east-1',
  };

  const parameters = { Param: 'p' };

  assert.deepEqual(new Dereferencer(template).deploy(deploy, parameters), {
    Parameters: {
      Param: { Type: 'String' }
    },
    Resources: {
      Thing: { Type: 'Custom::Thing', Properties: {} }
    },
    Outputs: {
      Imported: {
        Value: { 'Fn::ImportValue': 'p' }
      },
      Unsupported: {
        Value: { Ref: 'Thing' }
      }
    }
  }, 'does not touch unimplemented types and functions');

  assert.end();
});

test('[dereferencer] NoValue', (assert) => {
  const template = {
    Parameters: {
      Param: { Type: 'String' }
    },
    Resources: {
      Queue: { Type: 'AWS::SQS::Queue', Properties: {} }
    },
    Outputs: {
      JoinedToNothing: {
        Value: { 'Fn::Join': [{ 'Fn::GetAtt': ['Queue', 'QueueName'] }, { Ref: 'AWS::NoValue' }] }
      }
    }
  };

  const deploy = {
    accountId: '123456789012',
    stackName: 'my-stack',
    region: 'us-east-1',
  };

  const parameters = { Param: 'p' };

  assert.deepEqual(new Dereferencer(template).deploy(deploy, parameters), {
    Parameters: {
      Param: { Type: 'String' }
    },
    Resources: {
      Queue: { Type: 'AWS::SQS::Queue', Properties: {} }
    },
    Outputs: {
      JoinedToNothing: {
        Value: 'Queue'
      }
    }
  }, 'does not touch unimplemented types and functions');

  assert.end();
});

test('[dereferencer] conditions', (assert) => {
  const template = {
    Parameters: {
      Param: { Type: 'String' }
    },
    Conditions: {
      Yes: { 'Fn::Equals': ['p', { Ref: 'Param' }] },
      No: { 'Fn::Not': [{ 'Fn::Equals': ['p', { Ref: 'Param' }] }] },
      AlsoYes: {
        'Fn::Or': [
          { 'Fn::Equals': ['p', { Ref: 'Param' }] },
          { 'Fn::Not': [{ 'Fn::Equals': ['p', { Ref: 'Param' }] }] }
        ]
      },
      AlsoNo: {
        'Fn::And': [
          { 'Fn::Equals': ['p', { Ref: 'Param' }] },
          { 'Fn::Not': [{ 'Fn::Equals': ['p', { Ref: 'Param' }] }] }
        ]
      }
    },
    Resources: {
      Queue: { Type: 'AWS::SQS::Queue', Properties: {} }
    },
    Outputs: {
      Yes: {
        Value: { 'Fn::If': ['Yes', 'Yes', 'No'] }
      },
      No: {
        Value: { 'Fn::If': ['No', 'No', 'Yes'] }
      },
      AlsoYes: {
        Value: { 'Fn::If': ['AlsoYes', 'Yes', 'No'] }
      },
      AlsoNo: {
        Value: { 'Fn::If': ['AlsoNo', 'No', 'Yes'] }
      }
    }
  };

  const deploy = {
    accountId: '123456789012',
    stackName: 'my-stack',
    region: 'us-east-1',
  };

  const parameters = { Param: 'p' };

  assert.deepEqual(new Dereferencer(template).deploy(deploy, parameters), {
    Parameters: {
      Param: { Type: 'String' }
    },
    Conditions: {
      Yes: true,
      No: true,
      AlsoYes: true,
      AlsoNo: true
    },
    Resources: {
      Queue: { Type: 'AWS::SQS::Queue', Properties: {} }
    },
    Outputs: {
      Yes: { Value: 'Yes' },
      No: { Value: 'No' },
      AlsoYes: { Value: 'Yes' },
      AlsoNo: { Value: 'No' }
    }
  }, 'handles conditions');

  assert.end();
});

test('[dereferences] mapping', (assert) => {
  assert.end();
});
