var funcs = require('./funcs.js');
var config = require('../config/catan.js');

function getFlags(game, i) {
  let player = game.state.players[i];
  console.log('player:'+player);

  return {
    isGameOver:       game.state.isGameOver,
    isFirstTurn:      game.state.isFirstTurn,
    isSecondTurn:     game.state.isSecondTurn,
    isRollSeven:      game.state.isRollSeven,
    hasRolled:        game.state.hasRolled,
    vertex:           player.vertex,
    canAcceptTrade:   player.canAcceptTrade,
    hasHeavyPurse:    player.hasHeavyPurse,
    canPlayDC:        player.canPlayDC,
    canBuild:         player.canBuild,
    canBuy:           player.canBuy,
    isHuman:          player.isHuman,
    isCurrentPlayer:  game.state.currentPlayerID===i,
    isWaitingFor:     game.state.waiting.forWho.indexOf(i) > -1 // not sure if should save on the model itself
  }
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

  getFlagsForUser : function(user, game) {
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
  },
  launch : function(game, next) {
    for (let i=0; i<game.meta.settings.numCPUs; i++) {
      game.state.players.push( config.getNewPlayerData(user,game,false) );
    }

    funcs.shuffle(game.state.players);
    colors = config.getColors(game);
    for (let i=0; i<colors.length; i++) {
      let flags = getFlags(game, i);
      game.state.players[i].adjacents = config.getAdjacentGameStates(flags);
      game.state.players[i].color = colors[i];
    }

    return next(null);
  },
  getPlayData : function(user, game) {

  }

}
