var intrinsic = module.exports = {};

/**
 * [The intrinsic function Fn::Base64](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-base64.html)
 * returns the Base64 representation of the input string. This function is
 * typically used to pass encoded data to Amazon EC2 instances by way of the
 * UserData property.
 *
 * @static
 * @memberof cloudfriend
 * @name base64
 * @param {string} value - The string value you want to convert to Base64.
 * @returns The original string, in Base64 representation.
 */
intrinsic.base64 = (value) => {
  return { 'Fn::Base64': value };
};

/**
 * [The intrinsic function Fn::FindInMap](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-findinmap.html)
 * returns the value corresponding to keys in a two-level map that is declared
 * in the Mappings section.
 *
 * @static
 * @memberof cloudfriend
 * @name lookup
 * @param {string} mapping - The logical name of a mapping declared in the
 * Mappings section that contains the keys and values.
 * @param {string} key - The top-level key name. Its value is a list of
 * key-value pairs.
 * @param {string} attr - The second-level key name, which is set to one of the
 * keys from the list assigned to key.
 * @returns The value that is assigned to SecondLevelKey.
 */
intrinsic.lookup = (mapping, key, attr) => {
  return { 'Fn::FindInMap': [mapping, key, attr] };
};

/**
 * [The intrinsic function Fn::GetAtt](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-getatt.html)
 * returns the value of an attribute from a resource in the template.
 *
 * @static
 * @memberof cloudfriend
 * @name attr
 * @param {string} obj - The logical name of the resource that contains the
 * attribute you want.
 * @param {string} key - The name of the resource-specific attribute whose value
 * you want. See the resource's reference page for details about the attributes
 * available for that resource type.
 * @returns The attribute value.
 */
intrinsic.attr = (obj, key) => {
  return { 'Fn::GetAtt': [obj, key] };
};

/**
 * [The intrinsic function Fn::GetAZs](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-getavailabilityzones.html)
 * returns an array that lists Availability Zones for a specified region.
 * Because customers have access to different Availability Zones, the intrinsic
 * function Fn::GetAZs enables template authors to write templates that adapt to
 * the calling user's access. That way you don't have to hard-code a full list
 * of Availability Zones for a specified region.
 *
 * @static
 * @memberof cloudfriend
 * @name azs
 * @param {string} [region] -The name of the region for which you want to get the
 * Availability Zones. You can use the region() function to specify the region
 * in which the stack is created. Specifying an empty string is equivalent to
 * specifying region().
 * @returns The list of Availability Zones for the region.
 */
intrinsic.azs = (region) => {
  return { 'Fn::GetAZs': region || '' };
};

/**
 * [The intrinsic function Fn::Join](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-join.html)
 * appends a set of values into a single value, separated by the specified
 * delimiter. If a delimiter is the empty string, the set of values are
 * concatenated with no delimiter.
 *
 * @static
 * @memberof cloudfriend
 * @name join
 * @param {array} pieces - The list of values you want combined.
 * @param {string} [delimiter=''] The value you want to occur between fragments.
 * The delimiter will occur between fragments only. It will not terminate the
 * final value.
 * @returns The combined string.
 */
intrinsic.join = (pieces, delimiter) => {
  delimiter = delimiter || '';
  return { 'Fn::Join': [delimiter, pieces] };
};

/**
 * [The intrinsic function Fn::Select](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-select.html)
 * returns a single object from a list of objects by index.
 *
 * @static
 * @memberof cloudfriend
 * @name select
 * @param {number} index - The index of the object to retrieve. This must be a
 * value from zero to N-1, where N represents the number of elements in the
 * array.
 * @param {array} list - The list of objects to select from. This list must not
 * be null, nor can it have null entries.
 * @returns The selected object.
 */
intrinsic.select = (index, list) => {
  return { 'Fn::Select': [index.toString(), list] };
};

/**
 * [The intrinsic function Ref](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-ref.html)
 * returns the value of the specified parameter or resource.
 *
 * @static
 * @memberof cloudfriend
 * @name ref
 * @param {string} name - The logical name of the resource or parameter you want
 * to dereference.
 * @returns The physical ID of the resource or the value of the parameter.
 */
intrinsic.ref = (name) => {
  return { Ref: name };
};

/**
 * Blends [the intrinsic function Fn::Base64](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-base64.html)
 * with [the intrinsic function Fn::Join](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-join.html)
 * to produce a Base64 encoding of an array of commands suitable for use in an
 * [EC2 LaunchConfiguration's UserData property](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-as-launchconfig.html#cfn-as-launchconfig-userdata).
 *
 * @static
 * @memberof cloudfriend
 * @name userData
 * @param {array} lines - an array of commands
 * @returns the array of commands, joined by `\n` and Base 64 encoded
 */
intrinsic.userData = (lines) => {
  return intrinsic.base64(intrinsic.join(lines, '\n'));
};
