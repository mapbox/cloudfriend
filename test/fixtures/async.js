module.exports = (callback) => {
  setImmediate(callback, null, {
    AWSTemplateFormatVersion: '2010-09-09',
    Parameters: {
      OutputThis: {
        Type: 'String'
      }
    },
    Resources: {
      Topic: {
        Type: 'AWS::SNS::Topic'
      }
    },
    Outputs: {
      ProvidedValue: {
        Value: {
          Ref: 'OutputThis'
        }
      }
    }
  });
};
