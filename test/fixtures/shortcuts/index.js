'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
  update: (name, data) => {
    fs.writeFileSync(
      path.join(__dirname, `${name}.json`),
      JSON.stringify(data, null, 2),
    );
  },

  get: (name) => {
    return require(path.join(__dirname, `${name}.json`));
  },
};
