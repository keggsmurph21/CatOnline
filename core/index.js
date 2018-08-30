'use strict';

const _ = require('underscore'),
  Board = require('./board'),
  scenarios = require('./scenarios');

let boards = {};
_.each(scenarios, (params, name) => {
  boards[name] = new Board(name);
});

module.exports = {

  boards,
  Board,
  scenarios,
  utils: require('./utils'),

};
