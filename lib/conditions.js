var conditions = module.exports = {};

/**
 * [The condition Fn::And](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e121706)
 * returns true if all the specified conditions evaluate to true, or returns
 * false if any one of the conditions evaluates to false. Fn::And acts as an
 * AND operator. The minimum number of conditions that you can include is 2, and
 * the maximum is 10.
 *
 * @static
 * @memberof cloudfriend
 * @name and
 * @param {array} conditions - An array of conditions that evaluate to true or
 * false.
 * @returns true if all the specified conditions evaluate to true, or returns
 * false if any one of the conditions evaluates to false
 */
conditions.and = (conditions) => {
  return { 'Fn::And': conditions };
};

/**
 * [The condition Fn::Equals](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e121788)
 * compares if two values are equal. Returns true if the two values are equal or
 * false if they aren't.
 *
 * @static
 * @memberof cloudfriend
 * @name equals
 * @param {any} a - A value of any type that you want to compare.
 * @param {any} b - A value of any type that you want to compare.
 * @returns true if the two values are equal or false if they aren't
 */
conditions.equals = (a, b) => {
  return { 'Fn::Equals': [a, b] };
};

/**
 * [The condition Fn::If](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e121863)
 * returns one value if the specified condition evaluates to true and another
 * value if the specified condition evaluates to false. Currently, AWS
 * CloudFormation supports the Fn::If intrinsic function in the metadata
 * attribute, update policy attribute, and property values in the Resources
 * section and Outputs sections of a template. You can use the AWS::NoValue
 * pseudo parameter as a return value to remove the corresponding property.
 *
 * @static
 * @memberof cloudfriend
 * @name if
 * @param {string} condition -A reference to a condition in the Conditions
 * section. Use the condition's name to reference it.
 * @param {any} ifTrue - A value to be returned if the specified condition
 * evaluates to true.
 * @param {any} ifFalse - A value to be returned if the specified condition
 * evaluates to false.
 * @returns one value if the specified condition evaluates to true and another
 * value if the specified condition evaluates to false
 */
conditions.if = (condition, ifTrue, ifFalse) => {
  return { 'Fn::If': [condition, ifTrue, ifFalse] };
};

/**
 * [The condition Fn::Not](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e122042)
 * returns true for a condition that evaluates to false or returns false for a
 * condition that evaluates to true. Fn::Not acts as a NOT operator.
 *
 * @static
 * @memberof cloudfriend
 * @name not
 * @param {boolean} condition - A condition such as Fn::Equals that evaluates
 * to true or false.
 * @returns true for a condition that evaluates to false or returns false for a
 * condition that evaluates to true
 */
conditions.not = (condition) => {
  return { 'Fn::Not': [condition] };
};

/**
 * [The condition Fn::Or](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e122130)
 * returns true if any one of the specified conditions evaluate to true, or
 * returns false if all of the conditions evaluates to false. Fn::Or acts as an
 * OR operator. The minimum number of conditions that you can include is 2, and
 * the maximum is 10.
 *
 * @static
 * @memberof cloudfriend
 * @name or
 * @param {array} conditions - An array of conditions that evaluate to true or
 * false.
 * @returns true if any one of the specified conditions evaluate to true, or
 * returns false if all of the conditions evaluates to false
 */
conditions.or = (conditions) => {
  return { 'Fn::Or': conditions };
};

/**
 * An amalgamation of [the condition Fn::Not](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e122042)
 * and [The condition Fn::Equals](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#d0e121788)
 * returns false if the two values are equal or true if they aren't
 *
 * @static
 * @memberof cloudfriend
 * @name notEquals
 * @param {any} a - A value of any type that you want to compare.
 * @param {any} b - A value of any type that you want to compare.
 * @returns false if the two values are equal or true if they aren't
 */
conditions.notEquals = (a, b) => {
  return conditions.not(conditions.equals(a, b));
};
