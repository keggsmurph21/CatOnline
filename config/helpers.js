const funcs = require('../app/funcs');

module.exports = {

  collectResource(game, p, hex) {
    let res = game.board.hexes[hex].resource;
    if (res !== 'desert')
      game.state.players[p].resources[res] += 1;
  },

  collectResources(game) {
    let sum = game.board.dice.values.reduce((acc,i)=>(acc+=i));
    for (let h=0; h<game.board.hexes.length; h++) {
      let hex = game.board.hexes[h];
      if (hex.roll === sum) {
        for (let j=0; j<hex.juncs.length; j++) {
          let junc = game.board.juncs[hex.juncs[j]];
          if (junc.owner > -1) {
            module.exports.collectResource(game, junc.owner, hex.num);
          }
        }
      }
    }
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
    game.state.hasRolled = false;
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

  roll : function(game, r1, r2) {
    r1 = r1 || funcs.getRandomInt(min=1,max=6);
    r2 = r2 || funcs.getRandomInt(min=1,max=6);
    game.board.dice.values = [r1,r2];
    game.state.isRollSeven = (r1+r2)===7;
    game.state.hasRolled   = true;
    console.log('roll='+(r1+r2));
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

  trySteal : function(game, p, q) {
    let juncs = game.board.hexes[game.board.robber].juncs;
    for (let j=0; j<juncs.length; j++) {
      if (game.board.juncs[juncs[j]].owner === q) {
        let list = [];
        for (let res in game.state.players[q].resources) {
          for (let i=0; i<game.state.players[q].resources[res]; i++) {
            list.push(res);
          }
        }
        let res = funcs.getRandomChoice(list);
        game.state.players[p].resources[res] += 1;
        game.state.players[q].resources[res] -= 1;
        return;
      }
    }
    throw Error('player '+q+' is not adjacent to the robber');
  },

  validateHex : function(game, h) {
    h = parseInt(h);
    if (isNaN(h) || h<0 || game.board.hexes.length<=h)
      throw Error('invalid hex: '+h);
    return game.board.hexes[h];
  },

  validateJunc : function(game, j) {
    j = parseInt(j);
    if (isNaN(j) || j<0 || game.board.juncs.length<=j)
      throw Error('invalid junc: '+j);
    return game.board.juncs[j];
  },

  validatePlayer : function(game, p) {
    p = parseInt(p);
    if (isNaN(p) || p<0 || game.state.players.length<=p)
      throw Error('invalid player: ', p);
    return p;
  },

  validateRoad : function(game, r) {
    r = parseInt(r);
    if (isNaN(r) || r<0 || game.board.roads.length<=r)
      throw Error('invalid road: '+r);
    return game.board.roads[r];
  }


}
