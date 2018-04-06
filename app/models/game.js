// app/models/game.js

// load stuff
const mongoose   = require('mongoose');
const dateformat = require('dateformat');

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
    initialGameConditions: Object,
    status: String,
    turn: Number,
    history: [ [ String ] ],
    isFirstTurn: Boolean,
    isSecondTurn: Boolean,
    isGameOver: Boolean,
    isRollSeven: Boolean,
    waiting: {
      forWho: [ {
        id : String,
        name : String,
        isAdmin : Boolean,
        isSuperAdmin : Boolean,
        isMuted : Boolean,
        flair : String } ],
      forWhat: [ [ String ] ]
    },
    canSteal: Boolean,
    tradeAccepted: Boolean,
    waitForDiscard: Boolean,
    currentTrade: {
      in: Object,
      out:Object
    },
    currentPlayerID: Number,
    hasRolled: Boolean,

    largestArmy: Number,
    hasLargestArmy: Number,
    longestRoad: Number,
    hasLongestRoad: Number,

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

      vertex: String,
      adjacents: [ String ],

      // flags
      flags : Object,

      // values to power flags
      isHuman: Boolean,
      discard: Number,
      hasDeclinedTrade: Boolean,
      canAcceptTrade : Boolean,
      hasHeavyPurse : Boolean,
      bankTradeRates: Object, // { $RES : Number }
      canPlayDC: Object,      // { $DC : Boolean }
      canBuild: Object,       // { $BUILD : [ Number ] }
      canBuy: Object,         // { $DC+ : Boolean }

      // other data
      playerID: Number,       // assign at launch
      color: String,

      unplayableDCs: Object,  // { $DC : Number }
      unplayedDCs: Object,    // { $DC : Number }
      playedDCs: Object,      // { $DC : Number }
      numKnights: Number,

      resources: Object,      // { $RES : Number }
      settlements: [ Number ],
      cities: [ Number ],
      roads: [ Number ],
      longestRoad: Number,

      publicScore: Number,
      privateScore: Number

     } ]
  },

  // none of this data should persist after the game is completed/exited
  board : {

    dcdeck    : [ String ],
    dice      : {
      values    : [ Number ] },
    hexes     : [ {
      num       : Number,
      resource  : String,
      roll      : Number,
      dots      : Number,
      juncs     : [ Number ] }],
    juncs     : [ {
      num       : Number,
      owner     : Number,
      port      : Object,
      roads     : [ Number ],
      hexes     : [ Number ],
      isSettleable : Boolean }],
    roads     : [ {
      num       : Number,
      owner     : Number,
      juncs     : [ Number ] }],
    robber    : Number

  },

}, {
  usePushEach: true
});

function sumOverObject(obj) {
  let acc = 0;
  for( var el in obj ) {
    acc += obj[el];
  }
  return acc;
}

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
    if (this.state.players[i].lobbyData.id)
      data.players.push(this.state.players[i].lobbyData);
  };
  return data;
}
GameSchema.methods.getPublicGameData = function() {
  data = {
    meta    : this.meta,
    dice    : this.board.dice,
    hexes   : this.board.hexes,
    juncs   : this.board.juncs,
    roads   : this.board.roads,
    trade   : this.state.currentTrade,
    hasLongestRoad  : this.state.hasLongestRoad,
    waiting : this.state.waiting,
    players : []
  };
  for (let i=0; i<this.state.players.length; i++) {
    let player = this.state.players[i];
    data.players.push({
      playerID        : player.playerID,
      color           : player.color,
      isHuman         : player.isHuman,
      devCardsInHand  : sumOverObject(player.unplayedDCs),
      numKnights      : player.numKnights,
      hasLargestArmy  : (this.state.hasLargestArmy===player.playerID),
      resourcesInHand : sumOverObject(player.resources), // TODO: move this to funcs, combine with the similar funciton in LOGIC
      longestRoad     : player.longestRoad,
      publicScore     : player.publicScore,
      roads           : player.roads,
      settlements     : player.settlements,
      cities          : player.cities,
      lobbyData       : player.lobbyData
    });
  }
  return data;
}
GameSchema.methods.getPrivateGameData = function(i) {
  if (i >= this.state.players.length)
    return null;
  let player = this.state.players[i];
  return {
    playerID      : player.playerID,
    vertex        : player.vertex,
    adjacents     : player.adjacents,
    flags         : player.flags,
    unplayedDCs   : player.unplayedDCs,
    playedDCs     : player.playerDCs,
    resources     : player.resources,
    privateScore  : player.privateScore
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

// create the model for games and expose it to our app
module.exports = mongoose.model('Game', GameSchema, 'games');
