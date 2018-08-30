'use strict';

const _ = require('underscore'),
  BoardElement = require('./board-element'),
  utils = require('../utils');

class Hex extends BoardElement {
  constructor(id, params) {

    super('Hex', id, params.coords);

    this.neighbors = {};
    this.juncs = {};
    this.roads = {};

    this.isOcean = params.isOcean;
    this.resources = params.resources;
    this.resource = null;
    this.dice = {
      roll: null,
      dots: null,
    };
  }

  render() {

    const center = this.renderedCoords;
    const points = _.map(this.juncs, junc => junc.renderedCoords);

    return {
      cy: center.y,
      cx: center.x,
      points: utils.pointsArrayToString(points),
      roll: this.dice.roll || 'x',
    };
  }
}

module.exports = Hex;
