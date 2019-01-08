'use strict';

const Emitter = require('./emitter');

class Chatroom = {
  constructor() {
    const emitter = new Emitter();

    emitter.on('send-message', () => {

    });

    emitter.on('start-typing', () => {

    });

    this.emitter = emitter;
  }
}
