// app/models/game.js

// load stuff
var mongoose = require('mongoose');
var dateformat = require('dateformat');

// define the schema for our game model
var GameSchema = mongoose.Schema({

  meta : {
    author: {
      id : String,
      name : String,
      isAdmin : Boolean,
      isSuperAdmin : Boolean,
      isMuted : Boolean,
      flair : String },
    players: [ {
      id : String,
      name : String,
      isAdmin : Boolean,
      isSuperAdmin : Boolean,
      isMuted : Boolean,
      flair : String } ],
    active: Boolean,
    created: Date,
    updated: { type: Date, default: Date.now },
    publiclyViewable: Boolean,
    status: String,
    waitfor: {
      id : String,
      name : String
    }
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

GameSchema.methods.getDataForUser = function(user,callback) {
  data = {
    meta : this.meta,
    sett : this.settings,
    publ : this.state.public,
    priv : [0,1,2,3]
  };

  callback(data);
}

GameSchema.methods.getPublicData = function() {
  return {
    id       : this._id,
    scenario : this.settings.scenario,
    numHumans: this.settings.numHumans,
    numCPUs  : this.settings.numCPUs,
    players  : this.meta.players,
    author   : this.meta.author,
    VPs      : this.settings.victoryPointsGoal,
    turn     : this.state.public.turn,
    status   : this.meta.status,
    public   : this.meta.publiclyViewable,
    waitfor  : this.meta.waitfor,
    created  : this.formatDate( this.meta.created ),
    updated  : this.formatDate( this.meta.updated ),
    isFull   : this.checkIsFull()
  }
}

GameSchema.methods.checkIsFull = function() {
  return ( this.meta.players.length === (this.settings.numHumans+this.settings.numCPUs) );
}

GameSchema.methods.formatDate = function( datetime ) {
  return dateformat(datetime, "mmm. dS, h:MM:ss tt")
}



// create the model for games and expose it to our app
module.exports = mongoose.model('Game', GameSchema, 'games');
