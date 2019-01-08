'use strict';

const Player = require('./player');
const Game = require('./game');

let p = new Player();
let g = new Game();

p.register(g);
