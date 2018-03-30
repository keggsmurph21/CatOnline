const funcs = require('../app/funcs');

module.exports = {

  collectResource(game, p, hex) {
    let res = game.board.hexes[hex].resource;
    if (res !== 'desert')
      game.state.players[p].resources[res] += 1;
  },

  juncGetAdjJuncs : function(board, j) {
    return funcs.juncGetAdjJuncs(board, j);
  },

  getLastSettlement : function(game, p) {
    return game.state.players[p].settlements.slice(-1).pop();
  },

  iterateTurn : function(game) {
    let turnset = (game.state.turn/game.state.players.length);
    game.state.isFirstTurn = false;
    game.state.isSecondTurn = false;
    if (turnset < 1) {
      game.state.isFirstTurn  = true;
    } else if (turnset < 2) {
      game.state.isSecondTurn = true;
    }
    game.state.currentPlayerID = game.state.turn % game.state.players.length;
    game.state.turn += 1;
  },

  paveRoad : function(game, p, road) {
    game.state.players[p].roads.push(road.num);
    road.owner = p;
  },

  requireRoadNearLastSettlement : function(game, p, road) {
    let valid=false, match=module.exports.getLastSettlement(game,p);
    if (road.owner > -1)
      throw Error('road is already owned');
    for (let j in road.juncs) {
      if (road.juncs[j] === match)
        valid=true;
    }
    if (!valid)
      throw Error('this junc is not adjacent');
    module.exports.paveRoad(game,p,road);
  },

  trySettle : function(game, p, junc) {
    if (!junc.isSettleable)
      throw Error('junc cannot be settled');
    game.state.players[p].settlements.push(junc.num);
    junc.owner = p;
    junc.isSettleable = false;
    module.exports.juncGetAdjJuncs(game.board,junc.num).forEach( function(adj) {
      game.board.juncs[adj].isSettleable = false;
    });
  },

  validateJunc : function(game, j) {
    j = parseInt(j);
    if (isNaN(j) || j<0 || game.board.juncs.length<=j)
      throw Error('invalid junc: '+j);
    return game.board.juncs[j];
  },

  validateRoad : function(game, r) {
    r = parseInt(r);
    if (isNaN(r) || r<0 || game.board.roads.length<=r)
      throw Error('invalid road: '+r);
    return game.board.roads[r];
  }


}
