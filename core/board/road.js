'use strict';

const _ = require('underscore'),
  BoardElement = require('./board-element'),
  utils = require('../utils');

class Road extends BoardElement {
  constructor(id, coords) {

    super('Road', id, coords);

    this.hexes = {};
    this.juncs = {};
    this.neighbors = {};

    this.owner = null;

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

    const points = _.map(this.juncs, junc => junc ? junc.renderedCoords : null).filter(utils.thin);

    return {
      path: utils.pointsArrayToPath(points),
    };
  }
}

module.exports = Road;
