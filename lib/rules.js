'use strict';

const rules = module.exports = {};

/**
 * [The rule function
 * Fn::Contains](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#fn-contains)
 * returns true if a specified string matches at least one value in a list of
 * strings.
 *
 * @static
 * @memberof cloudfriend
 * @name contains
 * @param {array} strings
 * @param {string} s
 */
rules.contains = (strings, s) => {
  return { 'Fn::Contains': [strings, s] };
};

/**
 * [The rule function
 * Fn::EachMemberEquals](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#fn-eachmemberequals)
 * returns true if a specified string matches all values in a list.
 *
 * @static
 * @memberof cloudfriend
 * @name eachMemberEquals
 * @param {array} strings
 * @param {string} s
 */
rules.eachMemberEquals = (strings, s) => {
  return { 'Fn::EachMemberEquals': [strings, s] };
};

/**
 * [The rule function
 * Fn::EachMemberIn](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#fn-eachmemberin)
 * returns true if each member in a list of strings matches at least one value
 * in a second list of strings.
 *
 * @static
 * @memberof cloudfriend
 * @name eachMemberIn
 * @param {array} stringsToCheck
 * @param {array} stringsToMatch
 */
rules.eachMemberIn = (stringsToCheck, stringsToMatch) => {
  return { 'Fn::EachMemberIn': [stringsToCheck, stringsToMatch] };
};

/**
 * [The rule function Fn::RefAll](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#fn-refall) returns all values for a specified parameter type.
 *
 * @static
 * @memberof cloudfriend
 * @name refAll
 * @param {string} parameterType An AWS-specific parameter type, such as AWS::EC2::SecurityGroup::Id or AWS::EC2::VPC::Id.
 */
rules.refAll = (parameterType) => {
  return { 'Fn::RefAll': parameterType };
};

/**
 * [The rule function Fn::ValueOf](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#fn-valueof) returns an attribute value or list of values for a specific parameter and attribute.
 *
 * @static
 * @memberof cloudfriend
 * @name valueOf
 * @param {string} parameterLogicalId The name of a parameter for which you want to retrieve attribute values. The parameter must be declared in the Parameters section of the template.
 * @param {*} attribute The name of an attribute from which you want to retrieve a value. For more information about attributes, see [Supported Attributes](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#rules-parameter-attributes).
 */
rules.valueOf = (parameterLogicalId, attribute) => {
  return { 'Fn::ValueOf': [parameterLogicalId, attribute] };
};

/**
 * [The rule function Fn::ValueOfAll](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#fn-valueofall) returns a list of all attribute values for a given parameter type and attribute.
 *
 * @static
 * @memberof cloudfriend
 * @name valueOfAll
 * @param {string} parameterType An AWS-specific parameter type, such as AWS::EC2::SecurityGroup::Id or AWS::EC2::VPC::Id.
 * @param {string} attribute The name of an attribute from which you want to retrieve a value. For more information about attributes, see [Supported Attributes](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#rules-parameter-attributes).
 */
rules.valueOfAll = (parameterType, attribute) => {
  return { 'Fn::ValueOfAll': [parameterType, attribute] };
};
