'use strict';

const _ = require('underscore'),
  BoardElement = require('./board-element'),
  utils = require('../utils');

class Port extends BoardElement {
  constructor(id, params) {

    super('Port', id, {});

    this.road = null;

    this.type = params.type;
    this.orientation = params.orientation;
    this.hexParams = params.hex;
  }

  bind(cache) {

    const hex = cache.get('h', this.hexParams.coords);

    this.road = hex.roads[this.hexParams.orientation];;
    this.coords = this.road.coords;

    delete this.hexParams;
  }

  get hex() {
    return _.find(this.hexes, hex => hex && !hex.isOcean);
  }

  get hexes() {
    return this.road.hexes;
  }

  get juncs() {
    return this.road.juncs;
  }
}

module.exports = Port;
