'use strict';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/*.test.js'],
  collectCoverageFrom: [
    'index.js',
    'lib/**/*.js',
    'bin/**/*.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};
