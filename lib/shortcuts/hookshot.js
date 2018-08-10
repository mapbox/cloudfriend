'use strict';

const crypto = require('crypto');
const redent = require('redent');
const Lambda = require('./lambda');
const merge = require('../merge');

const random = crypto.randomBytes(4).toString('hex');

class Passthrough {
  constructor(options = {}) {
    const {
      Prefix,
      PassthroughTo
    } = options;

    this.Prefix = Prefix;
    this.PassthroughTo = PassthroughTo;

    const Resources = {
      [`${Prefix}Secret`]: {
        Type: 'AWS::ApiGateway::ApiKey',
        Properties: {
          Enabled: false
        }
      },

      [`${Prefix}Api`]: {
        Type: 'AWS::ApiGateway::RestApi',
        Properties: {
          Name: { 'Fn::Sub': '${AWS::StackName}-webhook' },
          FailOnWarnings: true
        }
      },

      [`${Prefix}Stage`]: {
        Type: 'AWS::ApiGateway::Stage',
        Properties: {
          DeploymentId: { Ref: `${Prefix}Deployment${random}` },
          StageName: 'hookshot',
          RestApiId: { Ref: `${Prefix}Api` },
          MethodSettings: [
            {
              HttpMethod: '*',
              ResourcePath: '/*',
              ThrottlingBurstLimit: 20,
              ThrottlingRateLimit: 5
            }
          ]
        }
      },

      [`${Prefix}Deployment${random}`]: {
        Type: 'AWS::ApiGateway::Deployment',
        DependsOn: `${Prefix}Method`,
        Properties: {
          RestApiId: { Ref: `${Prefix}Api` },
          StageName: 'unused'
        }
      },

      [`${Prefix}Resource`]: {
        Type: 'AWS::ApiGateway::Resource',
        Properties: {
          ParentId: { 'Fn::GetAtt': [`${Prefix}Api`, 'RootResourceId'] },
          RestApiId: { Ref: `${Prefix}Api` },
          PathPart: 'webhook'
        }
      },

      [`${Prefix}OptionsMethod`]: {
        Type: 'AWS::ApiGateway::Method',
        Properties: {
          RestApiId: { Ref: `${Prefix}Api` },
          ResourceId: { Ref: `${Prefix}Resource` },
          ApiKeyRequired: false,
          AuthorizationType: 'None',
          HttpMethod: 'OPTIONS',
          Integration: {
            Type: 'AWS_PROXY',
            IntegrationHttpMethod: 'POST',
            Uri: { 'Fn::Sub': `arn:aws:apigateway:\${AWS::Region}:lambda:path/2015-03-31/functions/\${${Prefix}Function.Arn}/invocations` }
          }
        }
      },

      [`${Prefix}Method`]: this.method(),

      [`${Prefix}Permission`]: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          FunctionName: { Ref: `${Prefix}Function` },
          Action: 'lambda:InvokeFunction',
          Principal: 'apigateway.amazonaws.com',
          SourceArn: { 'Fn::Sub': `arn:aws:execute-api:\${AWS::Region}:\${AWS::AccountId}:\${${Prefix}Api}/*` }
        }
      }
    };

    const lambda = new Lambda(
      Object.assign({}, options, {
        LogicalName: `${Prefix}Function`,
        FunctionName: { 'Fn::Sub': `\${AWS::StackName}-${Prefix}` },
        Code: { ZipFile: this.code() },
        Description: { 'Fn::Sub': 'Passthrough function for ${AWS::StackName}' },
        Handler: 'index.lambda',
        Timeout: 30,
        MemorySize: 128,
        Statement: [
          {
            Effect: 'Allow',
            Action: 'lambda:InvokeFunction',
            Resource: { 'Fn::GetAtt': [PassthroughTo, 'Arn'] }
          }
        ]
      })
    );

    this.Resources = merge({ Resources }, lambda).Resources;

    this.Outputs = {
      [`${Prefix}EndpointOutput`]: {
        Description: 'The HTTPS endpoint used to send github webhooks',
        Value: { 'Fn::Sub': `https://\${${Prefix}Api}.execute-api.\${AWS::Region}.amazonaws.com/hookshot/webhook` }
      },

      [`${Prefix}SecretOutput`]: {
        Description: 'A secret key to give Github to use when signing webhook requests',
        Value: { Ref: `${Prefix}Secret` }
      }
    };
  }

  method() {
    return {
      Type: 'AWS::ApiGateway::Method',
      Properties: {
        RestApiId: { Ref: `${this.Prefix}Api` },
        ResourceId: { Ref: `${this.Prefix}Resource` },
        ApiKeyRequired: false,
        AuthorizationType: 'None',
        HttpMethod: 'POST',
        Integration: {
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST',
          Uri: { 'Fn::Sub': `arn:aws:apigateway:\${AWS::Region}:lambda:path/2015-03-31/functions/\${${this.Prefix}Function.Arn}/invocations` }
        }
      }
    };
  }

  code() {
    return {
      'Fn::Sub': redent(`
        'use strict';

        const AWS = require('aws-sdk');
        const lambda = new AWS.Lambda();

        module.exports.lambda = (event, context, callback) => {
          if (event.httpMethod === 'OPTIONS') {
            const requestHeaders = event.headers['Access-Control-Request-Headers'] || event.headers['access-control-request-headers'];
            const response = {
              statusCode: 200,
              body: '',
              headers: {
                'Access-Control-Allow-Headers': requestHeaders,
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Origin': '*'
              }
            };
            return callback(null, response);
          }

          const lambdaParams = {
            FunctionName: '\${${this.PassthroughTo}}',
            Payload: JSON.stringify(event)
          };

          lambda.invoke(lambdaParams).promise()
            .then((response) => {
              if (!response || !response.Payload)
                return callback(new Error('Your Lambda function ${this.PassthroughTo} did not provide a payload'));

              var payload = JSON.parse(response.Payload);
              payload.headers = payload.headers || {};
              payload.headers['Access-Control-Allow-Origin'] = '*';
              callback(null, payload);
            })
            .catch((err) => callback(err));
        };
      `).trim()
    };
  }
}

class Github extends Passthrough {
  constructor(options = {}) {
    super(options);
    delete this.Resources[`${this.Prefix}OptionsMethod`];
  }
  method() {
    return {
      Type: 'AWS::ApiGateway::Method',
      Properties: {
        RestApiId: { Ref: `${this.Prefix}Api` },
        ResourceId: { Ref: `${this.Prefix}Resource` },
        ApiKeyRequired: false,
        AuthorizationType: 'None',
        HttpMethod: 'POST',
        Integration: {
          Type: 'AWS',
          IntegrationHttpMethod: 'POST',
          IntegrationResponses: [
            {
              StatusCode: 200
            },
            {
              StatusCode: 500,
              SelectionPattern: '^error.*'
            },
            {
              StatusCode: 403,
              SelectionPattern: '^invalid.*'
            }
          ],
          Uri: { 'Fn::Sub': `arn:aws:apigateway:\${AWS::Region}:lambda:path/2015-03-31/functions/\${${this.Prefix}Function.Arn}/invocations` },
          RequestTemplates: {
            'application/json': '{"signature":"$input.params(\'X-Hub-Signature\')","body":$input.json(\'$\')}'
          }
        },
        MethodResponses: [
          {
            StatusCode: '200',
            ResponseModels: {
              'application/json': 'Empty'
            }
          },
          {
            StatusCode: '500',
            ResponseModels: {
              'application/json': 'Empty'
            }
          },
          {
            StatusCode: '403',
            ResponseModels: {
              'application/json': 'Empty'
            }
          }
        ]
      }
    };
  }

  code() {
    return {
      'Fn::Sub': redent(`
        'use strict';

        const crypto = require('crypto');
        const AWS = require('aws-sdk');
        const lambda = new AWS.Lambda();
        const secret = '\${${this.Prefix}Secret}';

        module.exports.lambda = (event, context, callback) => {
          const body = event.body;
          const hash = 'sha1=' + crypto
            .createHmac('sha1', secret)
            .update(new Buffer(JSON.stringify(body)))
            .digest('hex');

          if (event.signature !== hash)
            return callback('invalid: signature does not match');

          if (body.zen) return callback(null, 'ignored ping request');

          const lambdaParams = {
            FunctionName: '\${${this.PassthroughTo}}',
            Payload: JSON.stringify(event.body),
            InvocationType: 'Event'
          };

          lambda.invoke(lambdaParams).promise()
            .then(() => callback(null, 'success'))
            .catch((err) => callback(err));
        };
      `).trim()
    };
  }
}

module.exports = {
  Passthrough,
  Github
};
