// game/classes.js
// store classes here in one place for use by various game logic guys

// some helper functions
var tools = require('../public/resources/js/tools.js');

// Dice class
class Dice {
  constructor() {
    this.values = [0,0];
    return this
  }

  roll() {
    this.values = [
      tools.getRandomInt(1,6),
      tools.getRandomInt(1,6)
    ]
    return this.values[0] + this.values[1];
  }
}

module.exports.Dice = Dice;
