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
