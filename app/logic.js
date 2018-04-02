const funcs  = require('./funcs');
const config = require('../config/catan.js');

require('./errors'); // get all your tasty errors here

function accrue(player, windfall) {
  for (let res in windfall) {
    player.resources[res] += windfall[res];
  }
}
function spend(player, cost) {
  if (!funcs.canAfford(player, cost))
    throw new PovertyError(player, cost);
  for (let res in cost) {
    player.resources[res] -= cost[res];
  }
}

function collectResource(game, player, hex) {
  let res = game.board.hexes[hex].resource;
  if (res !== 'desert')
    player.resources[res] += 1;
}
function isGameOver(game) {
  for (let p=0; p<game.state.players.length; p++) {
    if (game.state.players[p].privateScore >= game.meta.settings.victoryPointsGoal)
      game.state.isGameOver = true;
  }
}
function pave(game, player, road, pay=true) {
  if (pay) {
    let cost = getCost(game, 'build', 'road');
    spend(player, cost);
    updateBuyOptions(game, player);
  }

  player.roads.push(road.num);
  road.owner = player.playerID;
  calcLongestRoad(game);
}
function settle(game, player, junc, pay=true) {
  if (!junc.isSettleable)
    throw new InvalidChoiceError('junc', junc, 'Someone has already settled here.');

  if (pay) {
    let cost = getCost(game, 'build', 'settlement');
    spend(player, cost);
    updateBuyOptions(game, player);
  }

  player.settlements.push(junc.num);
  junc.owner = player.playerID;

  junc.isSettleable = false;
  funcs.juncGetAdjJuncs(game.board, junc.num).forEach( function(adj) {
    game.board.juncs[adj].isSettleable = false;
  });

  player.publicScore += 1;
  player.privateScore+= 1;
  calcLongestRoad(game);
  isGameOver(game);
}




function getCanTradeBank(player) {
  for (let res in player.resources) {
    if (player.resources[res] >= player.bankTradeRates[res])
      return true;
  }
  return false;
}
function getCost(game, type, item) {
  if (type==='build') {
    let costs = config.getBuildObjects(game);
    return costs[item].cost;
  } else if (type==='buy') {
    let costs = config.getBuyObjects(game);
    return costs[item].cost;
  }
  throw new GameLogicError();
}
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
    canSteal         : game.state.canSteal,
    waitForDiscard   : game.state.waitForDiscard,
    tradeAccepted    : game.state.tradeAccepted,
    vertex           : player.vertex,
    discard          : player.discard,
    canAcceptTrade   : player.canAcceptTrade,
    hasHeavyPurse    : player.hasHeavyPurse,
    canPlayDC        : {},
    canBuild         : player.canBuild,
    canBuy           : player.canBuy,
    canTradeBank     : getCanTradeBank(player),
    isHuman          : player.isHuman,
    isCurrentPlayer  : game.state.currentPlayerID===player.playerID,
    isWaitingFor     : false
  }
  //console.log('flags', data);
  for (let dc in player.unplayedDCs) {
    data.canPlayDC[dc] = (player.unplayedDCs[dc] > 0);
  }
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




function sumObject(obj) {
  let acc = 0;
  for (let key in obj) {
    acc += obj[key];
  }
  return acc;
}
function sumDevCards(player) {
  let acc = 0;
  acc += sumObject(player.unplayableDCs);
  acc += sumObject(player.unplayedDCs);
  acc += sumObject(player.playedDCs);
  return acc;
}
function sumResources(player) {
  return sumObject(player.resources);
}




function storeHistory(game, estring, args, ret) {
  while (game.state.history.length <= game.state.turn) {
    game.state.history.push([]);
  }
  let index = (estring === '_e_end_turn' ? game.state.turn - 1 : game.state.turn);
  let extra = '';
  if (args) {
    try {
      extra += ' '+args.map((arg)=>{ return (arg.num!==undefined ? arg.num : arg); }).join(' ');
    } catch (e) { // catch objects (i.e. trades)
      for (let res in args.out) {
        extra += ' '+args.out[res]+' '+res;
      }
      extra += ' =';
      for (let res in args.in) {
        extra += ' '+args.in[res]+' '+res;
      }
    }
  }
  if (ret !== undefined)
    extra += ' >> '+JSON.stringify(ret);

  game.state.history[index].push( estring + extra );
}
function calcLargestArmy(game) {
  let la = game.state.hasLargestArmy;

  for (let p=0; p<game.state.players.length; p++) {
    let player = game.state.players[p];

    // only change on strictly gt
    if (player.playedDCs.knight > game.state.largestArmy) {
      game.state.largestArmy = player.playedDCs.knight;

      // if it's a change
      if (la !== player.playerID) {
        if (la > -1) { // la initialized to -1 (no leader to start)
          game.state.players[la].publicScore -= 2;
          game.state.players[la].privateScore-= 2;
        }
        game.state.hasLargestArmy = player.playerID;
        player.publicScore += 2;
        player.privateScore+= 2;

        isGameOver(game);
      }
    }
  }
}
function calcLongestRoad(game) {
  let lr = game.state.hasLongestRoad;

  for (let p=0; p<game.state.players.length; p++) {
    let player = game.state.players[p];
    let longest= calcPlayerLongestRoad(game, player);
    player.longestRoad = longest;

    if (longest > game.state.longestRoad) {
      game.state.longestRoad = longest;

      if (lr !== player.playerID) {
        if (lr > -1) {
          game.state.players[lr].publicScore -= 2;
          game.state.players[lr].privateScore+= 2;
        }
        game.state.hasLongestRoad = player.playerID;
        player.publicScore += 2;
        player.privateScore+= 2;

        isGameOver(game);
      }
    }
  }
}
function calcComponentLongestRoad(game, player, component) {

  // loop thru starting at each road and get max distances
  // to the other nodes in this component
  let localmax = 0;
  for (let c=0; c<component.length; c++) {
    let s = component[c], distances = {},
      visited = new Set(), stack = [s];

    visited.add(s);

    // set up distances
    for (let r=0; r<player.roads.length; r++) {
      distances[player.roads[r]] = 1;
    }

    while (stack.length) {
      let current = stack.pop();
      let distance= distances[current];

      let neighbors = funcs.roadGetAdjRoads(game.board, current);
      for (let i=0; i<neighbors.length; i++) {
        let n = neighbors[i];
        if (game.board.roads[n].owner === player.playerID) {

          if (!visited.has(n)) {
            visited.add(n);
            distances[n] = Math.max( distances[n], distance+1 );
            stack.push(n);
          }

        }
      }

      //console.log(distances);
      localmax = Math.max(localmax
        , Math.max(...Object.values(distances)));
    }
  }

  return localmax;
}
function calcPlayerLongestRoad(game, player) {

  // split into connected components and get a localmax for each
  let localmax = 0, components = [],
    visited = new Set();

  while (visited.size < player.roads.length) {
    for (let r=0; r<player.roads.length; r++) {
      let R = player.roads[r];
      if (!visited.has(R)) {

        // make a new component
        let component = new Set();
        component.add(R);
        visited.add(R);
        for (let s=0; s<player.roads.length; s++) {
          let S = player.roads[s];

          // if it's reachable, add it to this component
          if (funcs.roadsGetDistance(game.board, player, R, S) < Infinity) {
            component.add(S);
            visited.add(S);
          }
        }

        components.push(component);
      }
    }
  }
  //console.log('roads: '+player.roads.join(', '), '\ncomps:', components);

  // for each component, calculate its individual longest road
  for (let c=0; c<components.length; c++) {
    let component = Array.from(components[c]),
      componentmax = calcComponentLongestRoad(game,player,component);
    localmax = Math.max(localmax, componentmax);
  }

  return localmax;
}
function updateGameStates(game) {
  let waiting = { forWho:[], forWhat:[] };
  for (let i=0; i<game.state.players.length; i++) {
    let player = game.state.players[i];
    let flags = getFlags(game, i);
    player.flags = flags;
    let adjacents = config.getAdjacentGameStates(flags);
    player.adjacents = adjacents;
    if (adjacents.length) {
      waiting.forWho.push( player.lobbyData );
      waiting.forWhat.push( adjacents );
    }
  }
  return waiting;
}
function updateBuyOptions(game, player) {
  //console.log('update buy options');
  // check if > 7 cards
  player.hasHeavyPurse = (sumResources(player) > 7);

  // check build things
  let buildable = config.getBuildObjects(game);
  for (let build in buildable) {
    let canAfford = funcs.canAfford(player, buildable[build].cost),
      propName = (build=='city' ? 'cities' : build+'s'),
      available = player[propName].length < buildable[build].max;

    player.canBuild[build] = canAfford && available;
  }

  // check buy things
  let buyable   = config.getBuyObjects(game);
  for (let buy in buyable) {
    switch (buy) {
      case ('dc'):
        let canAfford = funcs.canAfford(player, buyable.dc.cost),
          available = sumDevCards(player) < buyable.dc.max;

        player.canBuy.dc = canAfford && available && game.board.dcdeck.length;
        break;
      default:
        throw new GameLogicError();
    }
  }
}


const parse = {
  trade(game, args) {
    if (!args.length)
      throw new EdgeArgumentError('trade',[],'Nothing to trade.');
    let trade = { in:{}, out:{} },
      parsing = trade.out,
      expecting ='int';
    for (let a=0; a<args.length; a++) {
      if (args[a]==='=') {
        parsing = trade.in;
      } else {
        let res = parse.resource(game, args[a+1]),
          num = funcs.toInt(args[a]);
        parsing[res] = (parsing[res] ? parsing[res]+num : num);
        a += 1;
      }
    }
    return trade;
  },
  hex(game, h) {
    let hex = parseInt(h);
    if (isNaN(hex))
      throw new EdgeArgumentError('hex',h,h+' is not a number.');
    if (hex<0 || game.board.hexes.length<=hex)
      throw new EdgeArgumentError('hex',h,'Value must be between 0 and '
        + game.board.hexes.length-1 + '.');
    return game.board.hexes[hex];
  },
  junc(game, j) {
    let junc = parseInt(j);
    if (isNaN(junc))
      throw new EdgeArgumentError('junc',j,j+' is not a number.');
    if (junc<0 || game.board.juncs.length<=junc)
      throw new EdgeArgumentError('junc',j,'Value must be between 0 and '
        + game.board.juncs.length-1 + '.');
    return game.board.juncs[junc];
  },
  player(game, p) {
    let player = parseInt(p);
    if (isNaN(p))
      throw new GetPlayerError(p, p+' is not a number.');
    if (player<0 || game.state.players.length<=player)
      throw new GetPlayerError(p, 'Value must be between 0 and '
        + game.state.players.length-1 + '.');
    return game.state.players[player];
  },
  resource(game, res) {
    if (config.validateResource(game, res))
      return res;
    throw new EdgeArgumentError('res',res,res+' is not a resource.');
  },
  road(game, r) {
    let road = parseInt(r);
    if (isNaN(road))
      throw new EdgeArgumentError('road',r,r+' is not a number.');
    if (road<0 || game.board.roads.length<=road)
      throw new EdgeArgumentError('road',r,'Value must be between 0 and '
        + game.board.roads.length-1 + '.');
    return game.board.roads[road];
  }
}


const helpers = {
  acceptTradeAsOffer(game, player) {
    spend(player, game.state.currentTrade.out);
    accrue(player, game.state.currentTrade.in);
    updateBuyOptions(game, player);

    helpers.cancelTrade(game);
  },

  acceptTradeAsOther(game, player) {
    spend(player, game.state.currentTrade.in);
    accrue(player, game.state.currentTrade.out);
    updateBuyOptions(game, player);

    game.state.tradeAccepted = true;
  },

  buyDevCard(game, player) {
    let cost = getCost(game, 'buy', 'dc');
    spend(player, cost);
    updateBuyOptions(game, player);

    if (!game.board.dcdeck.length)
      throw new GameLogicError('No more development cards.');
    let dc = game.board.dcdeck.pop();
    if (dc === 'vp') {
      player.unplayedDCs[dc] += 1;
      player.privateScore += 1;
      isGameOver(game);
    } else {
      player.unplayableDCs[dc] += 1;
    }
  },

  cancelTrade(game) {
    game.state.tradeAccepted = false;
    game.state.currentTrade = { in:null, out:null };
    for (let p=0; p<game.state.players.length; p++) {
      game.state.players[p].canAcceptTrade = false;
    }
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
            collectResource(game, player, hex.num);
            updateBuyOptions(game, player);
            //console.log( player.lobbyData.name,'collects a',hex.resource);
          }
        }
      }
    }
  },

  discard(game, player, cards) {
    let discarding = sumObject(cards);
    if (discarding > player.discard)
      throw new InvalidChoiceError('resources',cards,'You only need to discard '
        +player.discard+' card'+(player.discard>1 ? 's' : '')+'.');

    spend(player, cards);
    updateBuyOptions(game, player);

    player.discard -= discarding;

    game.state.waitForDiscard = false;
    if (player.discard) {
      for (let p=0; p<game.state.players.length; p++) {
        if (game.state.players[p].discard > 0)
          game.state.waitForDiscard = true;
      }
    }
  },

  end(game) {
    console.log('game is over');
    throw new NotImplementedError();
  },

  fortify(game, player, junc) {
    if (player.settlements.indexOf(junc.num) === -1)
      throw new InvalidChoiceError('junc',junc,'Cities must be built on existing settlements.');

    // remove from settlements
    let index = player.settlements.indexOf(junc.num);
    player.settlements.splice(index, 1);

    // add to cities
    player.cities.push(junc.num);

    let cost = getCost(game, 'build', 'city');
    spend(player, cost);
    updateBuyOptions(game, player);

    player.publicScore += 1;
    player.privateScore+= 1;
    isGameOver(game);
  },

  initCollect(game, player) {
    let j = player.settlements.slice(0).pop();
    for (let h in game.board.juncs[j].hexes) {
      collectResource(game, player, game.board.juncs[j].hexes[h]);
    }
    updateBuyOptions(game, player);
  },

  initPave(game, player, road) {
    if (road.owner === player.playerID)
      throw new InvalidChoiceError('road',road,'You\'ve already paved here!');
    if (road.owner > -1)
      throw new InvalidChoiceError('road',road,'Someone has already paved here.');

    let valid=false, match=player.settlements.slice(0).pop();
    for (let j in road.juncs) {
      if (road.juncs[j] === match)
        valid=true;
    }
    if (!valid)
      throw new InvalidChoiceError('road',road,'You must pave a road next to your last settlement.');

    pave(game, player, road, pay=false);
  },

  initSettle(game, player, junc) {
    settle(game, player, junc, pay=false);
  },

  iterateTurn(game, player) {
    let turnset = (game.state.turn/game.state.players.length);
    if (turnset < 1) {
      game.state.isFirstTurn  = true;
      game.state.isSecondTurn = false;
      game.state.currentPlayerID = game.state.turn % game.state.players.length;
    } else if (turnset < 2) {
      game.state.isFirstTurn  = false;
      game.state.isSecondTurn = true;
      game.state.currentPlayerID-= game.state.turn % game.state.players.length;
    } else {
      game.state.isFirstTurn  = false;
      game.state.isSecondTurn = false;
      game.state.currentPlayerID = game.state.turn % game.state.players.length;
    }
    game.state.turn += 1;
    game.state.hasRolled = false;
    for (let dc in player.unplayableDCs) {
      player.unplayedDCs[dc] += player.unplayableDCs[dc];
      player.unplayableDCs[dc] = 0;
    }
  },

  moveRobber(game, player, hex) {

    if (hex.num===game.board.robber)
      throw new InvalidChoiceError('robber',hex,'The robber is already here.');
    game.board.robber=hex.num;

    // check if there is anyone to steal from
    let juncs = game.board.hexes[game.board.robber].juncs;
    for (let j=0; j<juncs.length; j++) {
      let owner = game.board.juncs[juncs[j]].owner;
      game.state.canSteal = (owner > -1 && owner !== player.playerID);
    }
  },

  offerTrade(game, player, trade) {
    game.state.currentTrade = trade;
    for (let q=0; q<game.state.players.length; q++) {
      let other = game.state.players[q];
      other.canAcceptTrade = false;
      if (player !== other) {
        other.canAcceptTrade = funcs.canAfford(other, trade.in);
      }
    }
    //console.log('offer', trade);
  },

  pave(game, player, road) {
    if (road.owner === player.playerID)
      throw new InvalidChoiceError('road',road,'You\'ve already paved here!');
    if (road.owner > -1)
      throw new InvalidChoiceError('road',road,'Someone has already paved here.');

    let valid = false, adjs = funcs.roadGetAdjRoads(game.board, road.num);
    for (let a=0; a<adjs.length; a++) {
      if (game.board.roads[adjs[a]].owner === player.playerID)
        valid = true;
    }

    if (!valid)
      throw new InvalidChoiceError('road',road,'You can only pave near roads and settlements you own.');

    pave(game, player, road);
  },

  playDC(game, player, card, args) {
    player.unplayedDCs[card]  -= 1;
    player.playedDCs[card]    += 1;

    switch (card) {
      case ('vp'):
        player.publicScore        += 1;
        return;

      case ('knight'):
        calcLargestArmy(game);
        break;
      case ('monopoly'):
        let res = args;
        for (let p=0; p<game.state.players.length; p++) {
          let other = game.state.players[p];
          if (other !== player) {
            player.resources[res] += other.resources[res];
            other.resources[res]    = 0;
            updateBuyOptions(game, player);
            updateBuyOptions(game, other);
          }
        }
        break;
      case ('rb'):
        let rollback = player.roads.slice(0);
        try {
          helpers.pave(game, player, args[0]);
          helpers.pave(game, player, args[1]);
        } catch (e) {
          player.roads = rollback;
          throw e;
        }
        break;
      case ('yop'):
        player.resources[args[0]] += 1;
        player.resources[args[1]] += 1;
        updateBuyOptions(game, player);
        break;

      default:
        throw new GameLogicError('Unrecognized development card: '+card);
    }
    for (let dc in player.unplayedDCs) {
      if (dc !== 'vp') {
        player.unplayableDCs[dc] += player.unplayedDCs[dc];
        player.unplayedDCs[dc] = 0;
      }
    }
  },

  roll(game, r1, r2) {
    r1 = r1 || funcs.getRandomInt(min=1,max=6);
    r2 = r2 || funcs.getRandomInt(min=1,max=6);
    game.board.dice.values = [r1,r2];
    game.state.hasRolled   = true;
    game.state.isRollSeven = false;
    game.state.waitForDiscard = false;
    if ((r1+r2) === 7) {
      game.state.isRollSeven = true
      for (let p=0; p<game.state.players.length; p++) {
        let player = game.state.players[p];
        if (player.hasHeavyPurse) {
          game.state.waitForDiscard = true;
          player.discard = Math.floor(sumResources(player)/2);
        }
      }
    }
    return game.board.dice.values;
    //console.log('roll='+(r1+r2));
  },

  settle(game, player, junc, pay=true) {
    // check if close to a road
    for (let r=0; r<junc.roads.length; r++) {
      let road = game.board.roads[junc.roads[r]];
      if (road.owner === player.playerID)
        return settle(game, player, junc);
    }
    throw new InvalidChoiceError('junc',junc,'You need to build a road here before you can settle.');
  },

  steal(game, player, other) {
    if (player === other)
      throw new InvalidChoiceError('player',other,'You can\'t steal from yourself!');
    let juncs = game.board.hexes[game.board.robber].juncs;
    for (let j=0; j<juncs.length; j++) {
      if (game.board.juncs[juncs[j]].owner === other.playerID) {
        let list = [];
        for (let res in other.resources) {
          for (let i=0; i<other.resources[res]; i++) {
            list.push(res);
          }
        }
        let res = funcs.getRandomChoice(list);
        player.resources[res] += 1;
        other.resources[res] -= 1;

        updateBuyOptions(game, player);
        updateBuyOptions(game, other);

        return;
      }
    }
    throw new InvalidChoiceError('player',other,other.lobbyData.name+' is not adjacent to the robber.');
  },

  tradeWithBank(game, player, trade) {
    let rate = {},
      outResource = Object.keys(trade.out)[0],
      inResource  = Object.keys(trade.in)[0];
    rate[outResource] = player.bankTradeRates[outResource];

    if (outResource===inResource)
      throw new InvalidChoiceError('trade',trade,'You can\'t trade these resources.');
    if (trade.out[outResource]*trade.in[inResource]
      < rate[outResource]*trade.in[inResource])
      throw new InvalidChoiceError('trade',trade,'The bank will trade you ' + outResource
        + ' at a ' + rate[outResource] + '-to-1 rate.');

    spend(player, trade.out);
    accrue(player, trade.in);
    updateBuyOptions(game, player);
  },

  validateTrade(game, player, trade) {
    //console.log(trade);
    if (!funcs.canAfford(player, trade.out))
      throw new PovertyError(player, trade.out);
  },




  parse : parse

}


module.exports = {

  execute(game, p, estring, args) {

    let player = parse.player(game, p);//game.state.players[p];
    edge = config.getStateEdge(estring);

    let ret = edge.execute(game, player, args);
    storeHistory(game, estring, args, ret);

    player.vertex = edge.target;
    game.state.waiting = updateGameStates(game);

    for (let q=0; q<game.state.players.length; q++) {
      for (let a=0; a<game.state.players[q].adjacents.length; a++) {
        let adj_estring = game.state.players[q].adjacents[a];
        if (config.getStateEdge(adj_estring).isPriority)
          module.exports.execute(game, q, adj_estring, []);
      }
    }

  },
  helpers : helpers,

  getAdjacentGameStates(game,p) {
    let flags = getFlags(game,p);
    return config.getAdjacentGameStates(flags);
  },
  getFlags(game,p) { return getFlags(game,p); },
  getGameData(user, game) {
    return {
      public  : game.getPublicGameData(),
      private : game.getPrivateGameData(user)
    };
  },

  launch(game, next) {

    console.log('launching');
    for (let i=0; i<game.meta.settings.numCPUs; i++) {
      game.state.players.push( config.getNewPlayerData(user,game,false) );
    }

    funcs.shuffle(game.state.players);
    colors = config.getColors(game);

    for (let i=0; i<colors.length; i++) {
      let player = game.state.players[i];
      player.playerID = i;
      player.color    = colors[i];
    }

    game.state.currentPlayerID = 0;
    game.state.waiting= updateGameStates(game);
    game.state.turn   = 1;
    game.state.status = 'in-progress';
    game.meta.updated = new Date;

    module.exports.execute(game, 0, '_e_take_turn', null);

    return next(null);
  },

  validateEdgeArgs(game, edge, args) {
    let e_args = config.getStateEdge(edge).arguments.split(' ');
    if (e_args[0] === 'trade') {
      return parseTrade(game, args.slice(0));
    }

    for (let a in e_args) {
      let arg = e_args[a];
      switch (arg) {
        case ('resource'):
          e_args[a] = parse.resource(game, args[a]);
          break;
        case ('int'):
          try {
            e_args[a] = funcs.toInt(args[a]);
          } catch (e) {
            throw new EdgeArgumentError('int',args[a],e.message);
          }
          break;
        case ('hex'):
          e_args[a] = parse.hex(game, args[a]);
          break;
        case ('player'):
          e_args[a] = parse.player(game, args[a]);
          break;
        case ('road'):
          e_args[a] = parse.road(game, args[a]);
          break;
        case ('settlement'):
          e_args[a] = parse.junc(game, args[a]);
          break;
        case (''):
          return [];
        default:
          throw new EdgeArgumentError(null,arg,'Unrecognized argument type: '+arg);
      }
    }
    return e_args;
  },
  validateEdgeIsAdjacent(game, i, edge) {
    return game.state.players[i].adjacents.indexOf(edge) > -1;
  }

}
