const funcs = require('../app/funcs');

function accrue(player, windfall) {
  for (let res in windfall) {
    player.resources[res] += windfall[res];
  }
}
function calculateLongestRoads(game) {
  console.log('calc longest road');
}
function getCost(game, type, item) {
  const config = require('../config/catan');
  if (type==='build') {
    let costs = config.getBuildObjects(game);
    return costs[item].cost;
  } else if (type==='buy') {
    let costs = config.getBuyObjects(game);
    return costs[item].cost;
  }
  throw Error('unable to get cost to '+type+' '+item);
}
function pave(game, player, road, pay=true) {
  if (pay) {
    let cost = getCost(game, 'build', 'road');
    spend(player, cost);
  }

  player.roads.push(road.num);
  road.owner = player.playerID;

  calculateLongestRoads(game);
}
function settle(game, player, junc, pay=true) {
  if (!junc.isSettleable)
    throw Error('junc cannot be settled');

  if (pay) {
    let cost = getCost(game, 'build', 'settlement');
    spend(player, cost);
  }

  player.settlements.push(junc.num);
  junc.owner = player.playerID;

  junc.isSettleable = false;
  funcs.juncGetAdjJuncs(game.board, junc.num).forEach( function(adj) {
    game.board.juncs[adj].isSettleable = false;
  });
}
function spend(player, cost) {
  if (!funcs.canAfford(player, cost))
    throw Error(`can't afford, insufficient funds (`+JSON.stringify(cost)+`)`);
  for (let res in cost) {
    player.resources[res] -= cost[res];
  }
}

module.exports = {

  acceptTradeAsOffer(game, player) {
    spend(player, game.state.currentTrade.out);
    accrue(player, game.state.currentTrade.in);

    module.exports.cancelTrade(game);
  },

  acceptTradeAsPartner(game, player) {
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

  collectResource(game, player, hex) {
    let res = game.board.hexes[hex].resource;
    if (res !== 'desert')
      player.resources[res] += 1;
  },

  collectResources(game) {
    let sum = game.board.dice.values.reduce((acc,i)=>(acc+=i));
    for (let h=0; h<game.board.hexes.length; h++) {
      let hex = game.board.hexes[h];
      if (hex.roll === sum) {
        for (let j=0; j<hex.juncs.length; j++) {
          let junc = game.board.juncs[hex.juncs[j]];
          if (junc.owner > -1) {
            let player = game.state.players[junc.owner];
            module.exports.collectResource(game, player, hex.num);
            console.log( player.lobbyData.name,'collects a',hex.resource);
          }
        }
      }
    }
  },

  fortify(game, player, junc) {
    if (player.settlements.indexOf(junc.num) === -1)
      throw Error('cities must be built on existing settlements');

    // remove from settlements
    let index = player.settlements.indexOf(junc.num);
    player.settlements.splice(index, 1);

    // add to cities
    player.cities.push(junc.num);

    let cost = getCost(game, 'build', 'city');
    spend(player, cost);
  },

  getLastSettlement : function(game, player) {
    return player.settlements.slice(-1).pop();
  },

  initPave : function(game, player, road) {
    if (road.owner > -1)
      throw Error('road is already owned');

    let valid=false, match=module.exports.getLastSettlement(game,player);
    for (let j in road.juncs) {
      if (road.juncs[j] === match)
        valid=true;
    }
    if (!valid)
      throw Error('this junc is not adjacent');

    pave(game, player, road, pay=false);
  },

  initSettle : function(game, player, junc) {
    settle(game, player, junc, pay=false);
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

  offerTrade : function(game, player, trade) {
    game.state.currentTrade = trade;
    for (let q=0; q<game.state.players.length; q++) {
      let partner = game.state.players[q];
      partner.canAcceptTrade = false;
      if (player !== partner) {
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

  pave : function(game, player, road) {
    if (road.owner > -1)
      throw Error('road is already owned');

    let valid = false, adjs = Array.from(
      funcs.roadGetAdjRoads(game.board, road.num));

    for (let r=0; r<player.roads.length; r++) {
      if (adjs.indexOf(r) > -1)
        valid=true;
    }
    if (!valid)
      throw Error('this road is not adjacent');

    pave(game, player, road);
  },

  roll : function(game, r1, r2) {
    r1 = r1 || funcs.getRandomInt(min=1,max=6);
    r2 = r2 || funcs.getRandomInt(min=1,max=6);
    game.board.dice.values = [r1,r2];
    game.state.isRollSeven = (r1+r2)===7;
    game.state.hasRolled   = true;
    console.log('roll='+(r1+r2));
  },

  settle : function(game, player, junc, pay=true) {
    // check if close to a road
    for (let r=0; r<junc.roads.length; r++) {
      let road = game.board.roads[junc.roads[r]];
      if (road.owner === player.playerID)
        return settle(game, player, junc);
    }
    throw Error('you can only settle near your roads');
  },

  steal : function(game, player, from) {
    let juncs = game.board.hexes[game.board.robber].juncs;
    for (let j=0; j<juncs.length; j++) {
      if (game.board.juncs[juncs[j]].owner === from.playerID) {
        let list = [];
        for (let res in from.resources) {
          for (let i=0; i<from.resources[res]; i++) {
            list.push(res);
          }
        }
        let res = funcs.getRandomChoice(list);
        player.resources[res] += 1;
        from.resources[res] -= 1;
        return;
      }
    }
    throw Error(from.lobbyData.name+' is not adjacent to the robber');
  },

  tradeWithBank : function(game, player, trade) {
    let rate = {},
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
    return game.state.players[p];
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

  validateTrade : function(game, player, trade) {
    if (!funcs.canAfford(player, trade.out))
      throw Error(`can't afford, insufficient funds (`+JSON.stringify(trade.out)+`)`);
  }

}
