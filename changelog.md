## v1.8.1

- `.split()` now allows object arguments.

## v1.8.0

- `.split()` added for `Fn::Split` intrinsic function.

## v1.7.0

- Adds `cloudfriend.permissions`, which exports a CloudFormation template which creates an AWS user and access key with permission to run `cloudfriend.validate()`.

## v1.6.0

- Adds support of Fn::ImportValue

## v1.5.0

- `.merge()` now allows name reuse across template properties, e.g. can have a Resource and an Output with the same name.
- `.merge()` now allows name overlaps if the provided objects are identical.

## v1.4.0

- `validate-template` now exits 1 if the template is invalid.

## v1.3.0

- Adds support for Fn::Sub

## v1.2.0

- Fixes `cloudfriend.build()` for JSON template files that do not use the `.json` extension.
- Adds an optional second arg to `cloudfriend.build(template, opts)`. If provided, this object is handed to any `.js`-defined template file that exports a function.

## v1.1.0

- Initial release
