// game/classes.js
// store classes here in one place for use by various game logic guys

// some helper functions
var funcs = require('../app/funcs.js');

// Dice class
class Dice {
  constructor() {
    this.values = [0,0];
    return this;
  }

  roll() {
    this.values = [
      funcs.getRandomInt(1,6),
      funcs.getRandomInt(1,6)
    ]
    return this.values[0] + this.values[1];
  }
}

// Hex class
class Hex {
  constructor(num, resource, diceValue) {
    this.num = num;
    this.resource = resource;
    this.roll = diceValue.roll;
    this.dots = diceValue.dots;
    this.conns = [];
    return this;
  }
}

// Junction class (replaces Node)
class Junc {
  constructor(num) {
    this.num = num;
    this.port = {};
    this.roads = [];
    this.conns = [];
    this.isCity = false;
    return this;
  }

  setPort( num, type, orientation ) {
    this.port = {
      num : num,
      type : type,
      orientation : orientation
    }
    return this;
  }
}

// Road class
class Road {
  constructor(num ) {
    this.num = num;
    this.juncs = [];
    this.owner = null;
    return this;
  }

  setVertices( j1, j2 ) {
    this.juncs = [j1, j2];
    return this;
  }
}

// Connection class
class Conn {
  constructor(num ) {
    this.num = num;
    this.junc = null;
    this.hex = null;
    this.owner = null;
    return this;
  }

  setVertices( junc, hex ) {
    this.junc = junc;
    this.hex = hex;
    return this;
  }
}

// export everything
module.exports = {
  Dice : Dice,
  Hex  : Hex,
  Junc : Junc,
  Road : Road,
  Conn : Conn
}
