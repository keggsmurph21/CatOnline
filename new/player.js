'use strict';

class Player {
  constructor() {

  }

  listen(emitter) {

    // game emitters
    emitter.on('update', () => {

    });

    emitter.on('error', () => {

    });

    emitter.on('joined', () => {

    });

    emitter.on('left', () => {

    });

    emitter.on('deleted', () => {

    });

    emitter.on('resigned', () => {

    });

    emitter.on('gameover', () => {

    });

    // messaging emitters
    emitter.on('connected', () => {

    });

    emitter.on('disconnected', () => {

    });

    emitter.on('message', () => {

    });

    emitter.on('typing', () => {

    });
  }
}

module.exports = Player;
