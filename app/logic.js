var funcs = require('./funcs.js');
var config = require('../config/catan.js');

function getFlags(game, i) {
  let player = game.state.players[i];
  /*console.log('players: ('+game.state.players.length+')');
  console.log('iteration:',i,'=>\n',game.state.players[i]);*/
  let data = {
    isGameOver       : game.state.isGameOver,
    isFirstTurn      : game.state.isFirstTurn,
    isSecondTurn     : game.state.isSecondTurn,
    isRollSeven      : game.state.isRollSeven,
    hasRolled        : game.state.hasRolled,
    vertex           : player.vertex,
    canAcceptTrade   : player.canAcceptTrade,
    hasHeavyPurse    : player.hasHeavyPurse,
    canPlayDC        : player.canPlayDC,
    canBuild         : player.canBuild,
    canBuy           : player.canBuy,
    isHuman          : player.isHuman,
    isCurrentPlayer  : game.state.currentPlayerID===player.playerID,
    isWaitingFor     : false
  }
  //console.log('flags', data);
  for (let i=0; i<game.state.waiting.forWho.length; i++) {
    if (funcs.usersCheckEqual(game.state.waiting.forWho[i], player.lobbyData))
      data.isWaitingFor = true;
  }
  return data;
}
function getAllPlayerData(player, game) {
  for (let i=0; i<game.state.players.length; i++) {
    if (funcs.usersCheckEqual(player, game.state.players[i].lobbyData)) {
      return game.state.players[i];
    }
  }
}
function iterateTurn(game) {
  // reset flags for player who just ended their turn
  let endTurnPlayer = game.state.players[game.state.currentPlayerID];

  game.state.waiting.forWho =
  game.state.currentPlayerID = game.state.turn % game.state.players.length;
}

module.exports = {

  /*getFlagsForUser : function(user, game) {
    let flags = getFlags(user, game);
    console.log(flags);
    let vertices = config.getStateVertices();
    let keys = Object.keys(vertices);
    for (let i=0; i<420; i++) {
      flags.vertex= keys[ keys.length * Math.random() << 0];
      console.log('\n'+flags.vertex);
      config.getAdjacentGameStates(flags);
    }
    return "SEE CONSOLE";
  },*/
  launch : function(game, next) {
    for (let i=0; i<game.meta.settings.numCPUs; i++) {
      game.state.players.push( config.getNewPlayerData(user,game,false) );
    }

    console.log('launching');
    funcs.shuffle(game.state.players);
    colors = config.getColors(game);
    let waiting = { forWho:[], forWhat:[] };

    for (let i=0; i<colors.length; i++) {
      let player = game.state.players[i];
      player.playerID = i;
      let flags = getFlags(game, i);
      player.flags = flags;
      let adjacents = config.getAdjacentGameStates(flags);
      player.adjacents = adjacents;
      if (adjacents.length) {
        waiting.forWho.push( player.lobbyData );
        waiting.forWhat.push( adjacents );
      }
      player.color    = colors[i];
    }

    game.state.currentPlayerID = 0;
    game.state.waiting= waiting;
    game.state.turn   = 1;
    game.state.status = 'in-progress';
    game.meta.updated = new Date;

    return next(null);
  },
  getGameData : function(user, game) {
    console.log("getting game data");
    return {
      public  : game.getPublicGameData(),
      private : game.getPrivateGameData(user)
    };
  },
  checkFlags : function(game, i) {
    return getFlags(game, i);
  },
  validateEdgeIsAdjacent : function(game, i, edge) {
    return game.state.players[i].adjacents.indexOf(edge) > -1;
  }

}
