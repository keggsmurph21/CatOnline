'use strict';

const fs = require('fs'),
  toml = require('toml'),
  parser = require('./parser');

function parse(filepath) {
  const contents = fs.readFileSync(filepath).toString();
  return toml.parse(contents);
}

module.exports = {
  standard: parse(__dirname + '/standard.toml')
};
