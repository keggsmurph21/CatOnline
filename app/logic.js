var funcs = require('./funcs.js');
var config = require('../config/catan.js');

function getFlags(user, game) {
  let player = getAllPlayerData(user, game);

  return {
    vertex:           game.state.vertex,
    isGameOver:       game.state.isGameOver,
    isFirstTurn:      game.state.isFirstTurn,
    isSecondTurn:     game.state.isSecondTurn,
    isRollSeven:      game.state.isRollSeven,
    isCurrentPlayer:  game.state.currentPlayerID===player.playerID,
    isWaitingFor:     game.state.waiting.forWho.indexOf(player.playerID) > -1, // not sure if should save on the model itself
    hasRolled:        game.state.hasRolled,
    canAcceptTrade:   player.canAcceptTrade,
    hasHeavyPurse:    player.hasHeavyPurse,
    canPlayDC:        player.canPlayDC,
    canBuild:         player.canBuild,
    canBuy:           player.canBuy,
    isHuman:          player.isHuman
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
  }
  launch : function(game, next) {
    //
  }

}
