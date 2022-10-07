'use strict';

const crypto = require('crypto');
const redent = require('redent');
const Lambda = require('./lambda');
const merge = require('../merge');

const random = crypto.randomBytes(4).toString('hex');

/**
 * The hookshot.Passthrough class defines resources that set up a single API Gateway
 * endpoint that responds to `POST` and `OPTIONS` requests. You are expected to
 * provide a Lambda function that will receive the request, and return some
 * response to the caller.
 *
 * Note that in this case, your Lambda function will receive every HTTP `POST`
 * request that arrives at the API Gateway URL that hookshot helped you create.
 * You are responsible for any authentication that should be performed against
 * incoming requests.
 *
 * Your Lambda function will receive an event object which includes the request
 * method, headers, and body, as well as other data specific to the API Gateway
 * endpoint created by hookshot. See [AWS documentation here](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format)
 * for a full description of the incoming data.
 *
 * To work properly, **your lambda function must return a data object
 * matching in a specific JSON format**. Again, see [AWS documentation for a full description](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format).
 *
 * Your API Gateway endpoint will allow cross-origin resource
 * sharing (CORS) required by requests from any webpage. Preflight `OPTIONS`
 * requests will receive a `200` response with CORS headers. And the response
 * you return from your Lambda function will be modified to include CORS headers.
 *
 * The generated template's `Outputs` will include the URL for the API Gateway endpoint,
 * and a random string that can be used as a shared secret.
 *
 * @name hookshot.Passthrough
 *
 * @param {String} Prefix - This will be used to prefix the set of CloudFormation
 * resources created by this shortcut.
 * @param {String} PassthroughTo - The logical name of the Lambda function that you
 * have written which will receive a request and generate a response to provide
 * to the caller.
 * @param {String} [LoggingLevel='OFF'] - One of `OFF`, `INFO`, or `ERROR`. Logs are delivered
 * to a CloudWatch Log Group named `API-Gateway-Execution-Logs_{rest-api-id}/hookshot`.
 * @param {Boolean} [DataTraceEnabled=false] - Set to `true` to enable full request/response
 * logging in the API's logs.
 * @param {Boolean} [MetricsEnabled=false] - Set to `true` to enable additional metrics in CloudWatch.
 * @param {String} [AccessLogFormat] - A single line format of the access logs of
 * data, as specified by selected `$context` variables. The format must include at
 * least `$context.requestId`. [See AWS documentation for details](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-apigateway-stage-accesslogsetting.html#cfn-apigateway-stage-accesslogsetting-format).
 * @param {String|Object} [WebhookSecret] - A secret string to be used to verify
 * payload signatures that are delivered to the endpoint. This is optional. If
 * not specified, a string will be generated for you. Implementation of
 * signature verification is up to the caller.
 *
 * @example
 * const cf = require('@mapbox/cloudfriend');
 *
 * const myTemplate = {
 *   ...
 *   Resources: {
 *     MyLambdaFunction: {
 *       Type: 'AWS::Lambda::Function',
 *       Properties: { ... }
 *     }
 *   }
 * };
 *
 * const webhook = new cf.shortcuts.hookshot.Passthrough({
 *   Prefix: 'Webhook',
 *   PassthroughTo: 'MyLambdaFunction'
 * });
 *
 * module.exports = cf.merge(myTemplate, webhook);
 */
class Passthrough {
  constructor(options) {
    if (!options) throw new Error('Options required');
    const {
      Prefix,
      PassthroughTo,
      AccessLogFormat,
      DataTraceEnabled = false,
      MetricsEnabled = false,
      WebhookSecret
    } = options;

    let {
      LoggingLevel = 'OFF'
    } = options;

    const required = [Prefix, PassthroughTo];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a Prefix, and PassthroughTo');

    if (!['OFF', 'INFO', 'ERROR'].includes(LoggingLevel))
      throw new Error('LoggingLevel must be one of OFF, INFO, or ERROR');

    if (DataTraceEnabled)
      LoggingLevel = LoggingLevel === 'OFF' ? 'ERROR' : LoggingLevel;

    this.Prefix = Prefix;
    this.PassthroughTo = PassthroughTo;
    this.WebhookSecret = options.WebhookSecret;

    const Resources = {
      [`${Prefix}Api`]: {
        Type: 'AWS::ApiGateway::RestApi',
        Properties: {
          Name: { 'Fn::Sub': '${AWS::StackName}-webhook' },
          FailOnWarnings: true,
          EndpointConfiguration: {
            Types: ['REGIONAL']
          }
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
              ThrottlingRateLimit: 5,
              LoggingLevel,
              DataTraceEnabled,
              MetricsEnabled
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
          AuthorizationType: 'NONE',
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

    if (!WebhookSecret) Resources[`${Prefix}Secret`] = {
      Type: 'AWS::ApiGateway::ApiKey',
      Properties: {
        Enabled: false
      }
    };

    if (AccessLogFormat) {
      Resources[`${Prefix}AccessLogs`] = {
        Type: 'AWS::Logs::LogGroup',
        Properties: {
          LogGroupName: { 'Fn::Sub': `\${AWS::StackName}-${Prefix}-access-logs` },
          RetentionInDays: 14
        }
      };

      Resources[`${Prefix}Stage`].Properties.AccessLogSetting = {
        DestinationArn: { 'Fn::GetAtt': [`${Prefix}AccessLogs`, 'Arn'] },
        Format: AccessLogFormat
      };
    }

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
        Value: WebhookSecret ? WebhookSecret : { Ref: `${Prefix}Secret` }
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
        AuthorizationType: 'NONE',
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

/**
 * The hookshot.Github class defines resources that set up a single API Gateway
 * endpoint that is designed responds to POST requests sent from GitHub in
 * response to various GitHub events. The hookshot system will use a shared
 * secret to validate that the incoming payload did in fact originate from GitHub,
 * before sending the event payload to your Lambda function for further
 * processing. Any requests that did not come from GitHub or were not properly
 * signed using your secret key are rejected, and will never make it to your
 * Lambda function.
 *
 * @name hookshot.Github
 *
 * @property {Object} Resources - the CloudFormation resources created by this shortcut.
 * @property {Object} Outputs - the CloudFormation outputs created by this
 * shortcut. This includes the URL for the API Gateway endpoint, and a secret
 * string. Use these two values to configure GitHub to send webhooks to your
 * API Gateway endpoint.
 *
 * @param {String} Prefix this will be used to prefix the set of CloudFormation
 * resources created by this shortcut.
 * @param {String} PassthroughTo the logical name of the Lambda function that you
 * have written which will receive a request and generate a response to provide
 * to the caller.
 * @param {String} LoggingLevel one of `OFF`, `INFO`, or `ERROR`. Logs are delivered
 * to a CloudWatch LogGroup named `API-Gateway-Execution-Logs_{rest-api-id}/hookshot`
 * @param {String|Object} [WebhookSecret] A secret string to be used to verify
 * payload signatures that are delivered to the endpoint. This is optional. If
 * not specified, a string will be generated for you. You should provide this
 * value to GitHub, and signature verification will be performed before your
 * Lambda function being invoked to respond to the event.
 *
 * @example
 * const cf = require('@mapbox/cloudfriend');
 *
 * const myTemplate = {
 *   ...
 *   Resources: {
 *     MyLambdaFunction: {
 *       Type: 'AWS::Lambda::Function',
 *       Properties: { ... }
 *     }
 *   }
 * };
 *
 * const webhook = new cf.shortcuts.hookshot.Github({
 *   Prefix: 'Webhook',
 *   PassthroughTo: 'MyLambdaFunction'
 * });
 *
 * module.exports = cf.merge(myTemplate, webhook);
 */
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
        AuthorizationType: 'NONE',
        HttpMethod: 'POST',
        Integration: {
          Type: 'AWS',
          IntegrationHttpMethod: 'POST',
          IntegrationResponses: [
            {
              StatusCode: '200'
            },
            {
              StatusCode: '500',
              SelectionPattern: '^error.*'
            },
            {
              StatusCode: '403',
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
      'Fn::Sub': [
        redent(`
          'use strict';

          const crypto = require('crypto');
          const AWS = require('aws-sdk');
          const lambda = new AWS.Lambda();
          const secret = '\${WebhookSecret}';

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
        `).trim(),
        {
          WebhookSecret: this.WebhookSecret || { Ref: `${this.Prefix}Secret` }
        }
      ]
    };
  }
}

module.exports = {
  Passthrough,
  Github
};
