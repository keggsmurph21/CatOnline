// app/models/game.js

// load stuff
var mongoose = require('mongoose');

// define the schema for our game model
var GameSchema = mongoose.Schema({

  meta : {
    author: {
      id : String,
      name : String
    },
    players: Array,
    active: Boolean,
    created: Date,
    updated: { type: Date, default: Date.now },
    publiclyViewable: Boolean
  },

  settings : {
    scenario: String,
    victoryPointsGoal: Number,
    numHumans: Number,
    numCPUs: Number,
    portStyle: String,
    tileStyle: String
  },

  state : Object

}, {
  usePushEach: true
});

GameSchema.methods.getAccessibleData = function(userid,callback) {
  data = {
    meta : this.meta,
    sett : this.settings,
    publ : this.state.public,
    priv : [0,1,2,3]
  };

  callback(data);
}

// create the model for games and expose it to our app
module.exports = mongoose.model('Game', GameSchema, 'games');
