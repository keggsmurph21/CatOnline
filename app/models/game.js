// app/models/game.js

// load stuff
var mongoose = require('mongoose');
var dateformat = require('dateformat');

// define the schema for our game model
var GameSchema = mongoose.Schema({

  // this data should persist even after the game is completed/exited
  meta : {
    author: {
      id : String,
      name : String,
      isAdmin : Boolean,
      isSuperAdmin : Boolean,
      isMuted : Boolean,
      flair : String },
    created: Date,
    updated: Date,
    isPublic: Boolean,
    status: String,
    settings : {
      scenario: String,
      victoryPointsGoal: Number,
      numHumans: Number,
      numCPUs: Number,
      portStyle: String,
      tileStyle: String
    },
  },

  // only some of this data should persist
  state: {
    // global state-values
    turn: Number
    node: Number,
    adjs: [ Number ],
    edges: [ Object ],
    history: [ Object ],
    isFirstTurn: Boolean,
    isSecondTurn: Boolean,
    isGameOver: Boolean,
    isRollSeven: Boolean,
    waiting: {
      forWho: [ String ],
      forWhat: String
    },
    // player-specific state-values
    players: [ {
      // user.getPublicData() fields
      id : String,
      name : String,
      isAdmin : Boolean,
      isSuperAdmin : Boolean,
      isMuted : Boolean,
      flair : String,
      // flags
      isCurrentPlayer : Boolean,
      isGameWaitingFor : Boolean,
      hasRolled : Boolean,
      canAcceptTrade : Boolean,
      hasHeavyPurse : Boolean,
      // values
      bankTradeRates: Object, // { $RES : Number }
      canPlayDC: Object,      // { $DC : Boolean }
      canBuild: Object        // { $BUILD : [ Number ] }
      canBuy: Object,         // { $DC+ : Boolean }
      // not sure if this is the best place for this data
      resources: [ String ],
      playedDCs: [ String ],
      unplayedDCs: [ String ]
     } ]
  }

  // none of this data should persist after the game is completed/exited
  graph : Object

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
    public   : this.meta.isPublic,
    waitfor  : this.meta.waitfor,
    created  : this.formatDate( this.meta.created ),
    updated  : this.formatDate( this.meta.updated ),
    isFull   : this.checkIsFull()
  }
}

GameSchema.methods.checkIsFull = function() {
  return ( this.meta.players.length === (this.settings.numHumans+this.settings.numCPUs) );
}

GameSchema.methods.checkIsActive = function() {
  return [ 'pending', 'ready', 'in-progress' ].indexOf( this.meta.status ) > -1;
}

GameSchema.methods.formatDate = function( datetime ) {
  return dateformat(datetime, "mmm. dS, h:MM:ss tt")
}

GameSchema.methods.setAdjacentGameStates = function() {

}


// create the model for games and expose it to our app
module.exports = mongoose.model('Game', GameSchema, 'games');
