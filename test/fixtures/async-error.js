'use strict';

module.exports = (callback) => {
  setImmediate(callback, new Error('oopsies'));
};
