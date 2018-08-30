'use strict';

const _ = require('underscore'),
  BoardElement = require('./board-element'),
  utils = require('../utils');

class Junc extends BoardElement {
  constructor(id, coords) {

    super('Junc', id, coords);

    this.hexes = {};
    this.roads = {};
    this.neighbors = {};

    this.owner = null;
    this.isCity = false;

  }

  get isOcean() {
    let isOcean = true;
    _.each(this.hexes, hex => {
      if (hex && !hex.isOcean)
        isOcean = false;
    });

    return isOcean;
  }

  render() {

    const center = this.renderedCoords;

    return {
      cy: center.y,
      cx: center.x,
    };
  }
}

module.exports = Junc;
