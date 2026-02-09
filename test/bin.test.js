'use strict';

const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

describe('bin/build-template', () => {
  const script = path.normalize(__dirname + '/../bin/build-template.js');
  const template = path.normalize(__dirname + '/fixtures/sync-args.js');

  test('outputs expected', async () => {
    const { stdout, stderr } = await execFileAsync(script, [
      template,
      '--this',
      'that',
      '-r',
      'cn-north-1'
    ]);
    expect(stderr).toBeFalsy();
    const result = JSON.parse(stdout);
    expect(result.this).toBe('that');
    expect(result.region).toBe('cn-north-1');
  });
});
