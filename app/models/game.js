// app/models/game.js

// load stuff
var mongoose = require('mongoose');

// define the schema for our game model
var GameSchema = mongoose.Schema({

  meta : {
    author: String,
    players: Array,
    active: Boolean,
    created: Date,
    updated: { type: Date, default: Date.now }
  },

  settings : {
    rules: String,
    victoryPointsGoal: Number,
    humans: Number,
    CPUs: Number,
    portStrategy: String,
    resourceStrategy: String
  },

  state : Object

})

// create the model for games and expose it to our app
module.exports = mongoose.model('Game', GameSchema, 'games');
