'use strict';

const BaseObject = require('../base-object'),
  utils = require('../utils');

class BoardElement extends BaseObject {
  constructor(name, id, coords) {

    super(name);

    this.id = id;
    this.coords = coords;
  }

  offset(offset) {
    return {
      x: this.x + offset.x,
      y: this.y + offset.y,
      z: this.z + offset.z,
    };
  }

  get coords() {
    return {
      x: this.x,
      y: this.y,
      z: this.z,
    };
  }

  set coords(coords) {
    this.x = coords.x;
    this.y = coords.y;
    this.z = coords.z;
  }

  get renderedCoords() {
    return utils.cubeToRendered(this.coords);
  }
}

module.exports = BoardElement;
