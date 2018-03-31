const funcs = require('../app/funcs');

function accrue(player, windfall) {
  for (let res in windfall) {
    player.resources[res] += windfall[res];
  }
}
function getCost(game, item) {

}
function spend(player, cost) {
  if (!funcs.canAfford(player, cost))
    throw Error(`can't afford, insufficient funds (`+JSON.stringify(cost)+`)`);
  for (let res in cost) {
    player.resources[res] -= cost[res];
  }
}

module.exports = {

  acceptTradeAsOffer(game, p) {
    let player = game.state.players[p];

    spend(player, game.state.currentTrade.out);
    accrue(player, game.state.currentTrade.in);

    module.exports.cancelTrade(game);
  },

  acceptTradeAsPartner(game, p) {
    let player = game.state.players[p];

    spend(player, game.state.currentTrade.in);
    accrue(player, game.state.currentTrade.out);

    game.state.tradeAccepted = true;
  },

  cancelTrade(game) {
    game.state.tradeAccepted = false;
    game.state.currentTrade = { in:null, out:null };
    for (let p=0; p<game.state.players.length; p++) {
      game.state.players[p].canAcceptTrade = false;
    }
  },

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
            console.log( game.state.players[junc.owner].lobbyData.name,'collects a',hex.resource);
            module.exports.collectResource(game, junc.owner, hex.num);
          }
        }
      }
    }
  },

  fortify(game, p, junc) {
    
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

  juncGetAdjJuncs : function(board, j) {
    return funcs.juncGetAdjJuncs(board, j);
  },

  offerTrade : function(game, p, trade) {
    game.state.currentTrade = trade;
    for (let q=0; q<game.state.players.length; q++) {
      let partner = game.state.players[q];
      partner.canAcceptTrade = false;
      if (p !== q) {
        partner.canAcceptTrade = funcs.canAfford(partner, trade.out);
      }
    }
    //console.log('offer', trade);
  },

  parseTrade : function(game, args) {
    let trade = { in:{}, out:{} },
      parsing = trade.out,
      expecting ='int';
    for (let a=0; a<args.length; a++) {
      if (args[a]==='=') {
        parsing = trade.in;
      } else {
        let res = module.exports.validateResource(game, args[a+1]),
          num = funcs.toInt(args[a]);
        parsing[res] = (parsing[res] ? parsing[res]+num : num);
        a += 1;
      }
    }
    return trade;
  },

  pave : function(game, p, road, pay=true) {
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
    module.exports.pave(game,p,road,pay=false);
  },

  roll : function(game, r1, r2) {
    r1 = r1 || funcs.getRandomInt(min=1,max=6);
    r2 = r2 || funcs.getRandomInt(min=1,max=6);
    game.board.dice.values = [r1,r2];
    game.state.isRollSeven = (r1+r2)===7;
    game.state.hasRolled   = true;
    console.log('roll='+(r1+r2));
  },

  tradeWithBank : function(game, p, trade) {
    let player = game.state.players[p], rate = {},
      outResource = Object.keys(trade.out)[0],
      inResource  = Object.keys(trade.in)[0];
    rate[outResource] = player.bankTradeRates[outResource];

    if (outResource===inResource)
      throw Error(`can't trade these resources:`);
    if (trade.out[outResource]*trade.in[inResource]
      < rate[outResource]*trade.in[inResource])
      throw Error(`bank rate: `+rate[o_res]);

    spend(player, trade.out);
    accrue(player, trade.in);
  },

  settle : function(game, p, junc, pay=true) {
    if (!junc.isSettleable)
      throw Error('junc cannot be settled');
    game.state.players[p].settlements.push(junc.num);
    junc.owner = p;
    junc.isSettleable = false;
    module.exports.juncGetAdjJuncs(game.board,junc.num).forEach( function(adj) {
      game.board.juncs[adj].isSettleable = false;
    });
  },

  steal : function(game, p, q) {
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
      throw Error('invalid player: '+p);
    return p;
  },

  validateResource : function(game, res) {
    if (require('../config/catan.js').validateResource(game, res))
      return res;
    throw Error('invalid resource: '+res);
  },

  validateRoad : function(game, r) {
    r = parseInt(r);
    if (isNaN(r) || r<0 || game.board.roads.length<=r)
      throw Error('invalid road: '+r);
    return game.board.roads[r];
  },

  validateTrade : function(game, p, trade) {
    if (!funcs.canAfford(game.state.players[p], trade.out))
      throw Error(`can't afford, insufficient funds (`+JSON.stringify(trade.out)+`)`);
  }

}
