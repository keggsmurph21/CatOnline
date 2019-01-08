'use strict';

const Emitter = require('./emitter');

class Game {
  constructor() {
    const emitter = new Emitter();

    emitter.on('transform', () => {

    });

    emitter.on('join', () => {

    });

    emitter.on('leave', () => {

    });

    emitter.on('delete', () => {

    });

    emitter.on('resign', () => {

    });

    this.emitter = emitter;
  }
}

module.exports = Game;
