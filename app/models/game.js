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
    settings : {
      scenario: String,
      isPublic: Boolean,
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
    status: String,
    turn: Number,
    vertex: String,
    history: [ Object ],
    isFirstTurn: Boolean,
    isSecondTurn: Boolean,
    isGameOver: Boolean,
    isRollSeven: Boolean,
    waiting: {
      forWho: [ String ],
      forWhat: String
    },
    currentPlayerID: Number,
    hasRolled: Boolean,

    // player-specific state-values
    players: [ {

      // user.getLobbyData() fields
      lobbyData : {
        id : String,
        name : String,
        isAdmin : Boolean,
        isSuperAdmin : Boolean,
        isMuted : Boolean,
        flair : String },

      adjacents: [ String ],

      // flags&values
      isHuman: Boolean,
      canAcceptTrade : Boolean,
      hasHeavyPurse : Boolean,
      bankTradeRates: Object, // { $RES : Number }
      canPlayDC: Object,      // { $DC : Boolean }
      canBuild: Object,       // { $BUILD : [ Number ] }
      canBuy: Object,         // { $DC+ : Boolean }

      // other data
      playerID: Number,       // assign at launch
      unplayedDCs: Object,    // { $DC : Number }
      playedDCs: Object,      // { $DC : Number }
      playedKnights: Number,
      hasLargestArmy: Boolean,
      resources: Object,      // { $RES : Number }
      settlements: [ Number ],
      roads: [ Number ],
      hasLongestRoad: Boolean,
      publicScore: Number,
      privateScore: Number

     } ]
  },

  // none of this data should persist after the game is completed/exited
  graph : Object

}, {
  usePushEach: true
});

GameSchema.methods.getLobbyData = function() {
  data = {
    id       : this._id,
    author   : this.meta.author,
    settings : this.meta.settings,
    players  : [],
    turn     : this.state.turn,
    status   : this.state.status,
    waiting  : this.state.waiting.forWho,
    updated  : this.formatDate( this.meta.updated ),
    isFull   : this.checkIsFull() };
  for (let i=0; i<this.state.players.length; i++) {
    console.log('in get lobby data loop');
    console.log(this.state.players[i].lobbyData);
    if (this.state.players[i].lobbyData.id)
      data.players.push(this.state.players[i].lobbyData);
  };
  return data;
}
GameSchema.methods.getPublicGameData = function() {
  return {
    /*data = { // copied from earlier /play implementation
      meta : this.meta,
      sett : this.settings,
      publ : this.state.public,
      priv : [0,1,2,3]
    }*/
  };
}
GameSchema.methods.getPrivateGameData = function(playerid) {
  // takes an integer (not a userid) and returns the private data for that player
  return {

  };
}
GameSchema.methods.checkIsFull = function() {
  return ( this.state.players.length === (this.meta.settings.numHumans+this.meta.settings.numCPUs) );
}
GameSchema.methods.checkIsActive = function() {
  return [ 'pending', 'ready', 'in-progress' ].indexOf( this.state.status ) > -1;
}
GameSchema.methods.formatDate = function( datetime ) {
  return dateformat(datetime, "mmm. dS, h:MM:ss tt")
}
GameSchema.methods.setAdjacentGameStates = function() {

}


// create the model for games and expose it to our app
module.exports = mongoose.model('Game', GameSchema, 'games');
