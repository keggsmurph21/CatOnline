const funcs  = require('../funcs');
const config = require('./config');

const _STATE_GRAPH = require('./graph/graph');

function accrue(player, windfall) {
  let resources = Object.assign({}, player.resources);
  for (let res in windfall) {
    resources[res] += windfall[res];
  }
  player.resources = resources;
}
function spend(player, cost) {
  if (!funcs.canAfford(player, cost))
    throw new PovertyError(player, cost);
  let resources = Object.assign({}, player.resources);
  for (let res in cost) {
    resources[res] -= cost[res];
  }
  player.resources = resources;
}

function collectResource(messenger, game, player, hex) {
  let res = game.board.hexes[hex].resource,
    resources = Object.assign({}, player.resources);
  if (res !== 'desert') {
    messenger.list.push([player.playerID, `collected ${res}.`]);
    resources[res] += 1;
  }
  player.resources = resources;
}
function isGameOver(game) {
  for (let p=0; p<game.state.players.length; p++) {
    if (game.state.players[p].privateScore >= game.meta.settings.victoryPointsGoal)
      game.state.isGameOver = true;
  }
}
function pave(messenger, game, player, road, pay=true) {
  if (pay) {
    let cost = getCost(game, 'build', 'road');
    spend(player, cost);
    updateBuyOptions(game, player);
  }

  messenger.list.push([player.playerID, `built a road.`]);
  player.roads.push(road.num);
  road.owner = player.playerID;
  calcLongestRoad(messenger, game);

  return { road:road.num,
    hasLongestRoad:game.state.hasLongestRoad,
    longestRoad:player.longestRoad };
}
function settle(messenger, game, player, junc, pay=true) {
  //console.log('in settle:',junc);
  // TODO: update bank trade rates

  if (junc.owner === player.playerID)
    throw new InvalidChoiceError('junc', junc, 'You have already settled here.');
  if (junc.owner > -1)
    throw new InvalidChoiceError('junc', junc, 'Someone has already settled here.');
  if (!junc.isSettleable)
    throw new InvalidChoiceError('junc', junc, 'You can\'t settle next to another settlement.');

  if (pay) {
    let cost = getCost(game, 'build', 'settlement');
    spend(player, cost);
    updateBuyOptions(game, player);
  }

  messenger.list.push([player.playerID, `built a settlement.`]);
  player.settlements.push(junc.num);
  junc.owner = player.playerID;

  junc.isSettleable = false;
  funcs.juncGetAdjJuncs(game.board, junc.num).forEach( function(adj) {
    game.board.juncs[adj].isSettleable = false;
  });

  player.publicScore += 1;
  player.privateScore+= 1;
  calcLongestRoad(messenger, game);
  isGameOver(game);

  return { junc:junc.num };
}
function rollDice() {
  return [ funcs.getRandomInt(min=1,max=6), funcs.getRandomInt(min=1,max=6) ];
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
    canTrade         : (sumResources(player) > 0),
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
function calcLargestArmy(messenger, game) {
  let la = game.state.hasLargestArmy;

  for (let p=0; p<game.state.players.length; p++) {
    let player = game.state.players[p];

    // only change on strictly gt
    if (player.numKnights > game.state.largestArmy) {
      game.state.largestArmy = player.numKnights;

      // if it's a change
      if (la !== player.playerID) {
        messenger.list.push([player.playerID, `took Largest Army.`]);
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
function calcLongestRoad(messenger, game) {
  let lr = game.state.hasLongestRoad;

  for (let p=0; p<game.state.players.length; p++) {
    let player = game.state.players[p];
    let longest= calcPlayerLongestRoad(game, player);
    player.longestRoad = longest;

    if (longest > game.state.longestRoad) {
      game.state.longestRoad = longest;

      if (lr !== player.playerID) {
        messenger.list.push([player.playerID, `took Longest Road.`]);
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
function DFS(game, player, node, visited) {

  // visit our current node
  visited.add(node);

  // check each neighbor
  let neighbors = funcs.roadGetAdjRoads(game.board, node);
  for (let i=0; i<neighbors.length; i++) {
    let n = neighbors[i];
    if (game.board.roads[n].owner === player.playerID) {

      // this node is in our road network, so recursively
      // visit it if we haven't already
      if (!visited.has(n))
        return 1 + DFS(game, player, n, visited);
    }
  }

  // base case, have visited everything reachable from here
  return 1;
}
function calcPlayerLongestRoad(game, player) {
  let max = 0;

  // start a DFS from each road in our network
  for (let r=0; r<player.roads.length; r++) {
    let source = player.roads[r],
      visited  = new Set(),
      localmax = DFS(game, player, source, visited);

    max = Math.max(max, localmax);
  }

  return max;
}
function updateGameStates(game) {
  let waiting = { forWho:[], forWhat:[] };
  for (let i=0; i<game.state.players.length; i++) {
    let player = game.state.players[i];
    let flags = getFlags(game, i);
    player.flags = flags;
    let adjacents = getAdjacentGameStates(flags);
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
        + (game.board.hexes.length-1) + '.');
    return game.board.hexes[hex];
  },
  junc(game, j) {
    let junc = parseInt(j);
    if (isNaN(junc))
      throw new EdgeArgumentError('junc',j,j+' is not a number.');
    if (junc<0 || game.board.juncs.length<=junc)
      throw new EdgeArgumentError('junc',j,'Value must be between 0 and '
        + (game.board.juncs.length-1) + '.');
    return game.board.juncs[junc];
  },
  player(game, p) {
    let player = parseInt(p);
    if (isNaN(p))
      throw new GetPlayerError(p, p+' is not a number.');
    if (player<0 || game.state.players.length<=player)
      throw new GetPlayerError(p, 'Value must be between 0 and '
        + (game.state.players.length-1) + '.');
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
      throw new EdgeArgumentError('road',r,''+r+' is not a number.');
    if (road<0 || game.board.roads.length<=road)
      throw new EdgeArgumentError('road',r,'Value must be between 0 and '
        + (game.board.roads.length-1) + '.');
    return game.board.roads[road];
  }
}


const helpers = {
  acceptTradeAsOffer(messenger, game, player) {
    spend(player, game.state.currentTrade.out);
    accrue(player, game.state.currentTrade.in);
    updateBuyOptions(game, player);
    messenger.list.push([player.playerID, `accepted a trade.`]);

    helpers.cancelTrade(game);
  },

  acceptTradeAsOther(messenger, game, player) {
    spend(player, game.state.currentTrade.in);
    accrue(player, game.state.currentTrade.out);
    updateBuyOptions(game, player);
    messenger.list.push([player.playerID, `accepted a trade.`]);

    game.state.tradeAccepted = true;
  },

  buyDevCard(messenger, game, player) {
    let cost = getCost(game, 'buy', 'dc');
    spend(player, cost);
    updateBuyOptions(game, player);

    if (!game.board.dcdeck.length)
      throw new InvalidChoiceError('No more development cards.');

    messenger.list.push([player.playerID, `bought a development card.`]);
    let dc = game.board.dcdeck.pop();
    if (dc === 'vp') {
      player.unplayedDCs[dc] += 1;
      player.privateScore += 1;
      isGameOver(game);
    } else {
      player.unplayableDCs[dc] += 1;
    }
  },

  cancelTrade(messenger, game) {
    game.state.tradeAccepted = false;
    game.state.currentTrade = { in:null, out:null };

    messenger.list.push([player.playerID, `cancelled the trade.`]);
    for (let p=0; p<game.state.players.length; p++) {
      game.state.players[p].canAcceptTrade = false;
    }
  },

  collectResources(messenger, game) {
    let sum = game.board.dice.values.reduce((acc,i)=>(acc+=i));
    for (let h=0; h<game.board.hexes.length; h++) {
      let hex = game.board.hexes[h];
      if (hex.roll === sum) {
        for (let j=0; j<hex.juncs.length; j++) {
          let junc = game.board.juncs[hex.juncs[j]];
          if (junc.owner > -1) {
            let player = game.state.players[junc.owner];
            collectResource(messenger, game, player, hex.num);
            updateBuyOptions(game, player);
            //console.log( player.lobbyData.name,'collects a',hex.resource);
          }
        }
      }
    }
  },

  discard(messenger, game, player, cards) {
    let discarding = sumObject(cards);
    if (discarding > player.discard)
      throw new InvalidChoiceError('resources',cards,'You only need to discard '
        +player.discard+' card'+(player.discard>1 ? 's' : '')+'.');

    spend(player, cards);
    updateBuyOptions(game, player);

    messenger.list.push([player.playerID, `discarded ${discard} card${(discard>1 ? 's' : '')}.`]);
    player.discard -= discarding;

    game.state.waitForDiscard = false;
    if (player.discard) {
      for (let p=0; p<game.state.players.length; p++) {
        if (game.state.players[p].discard > 0)
          game.state.waitForDiscard = true;
      }
    }

    return { cards:cards };
  },

  end(messenger, game) {
    console.log('game is over');
    throw new NotImplementedError();
  },

  fortify(messenger, game, player, junc) {
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
    messenger.list.push([player.playerID, `built a city.`]);

    player.publicScore += 1;
    player.privateScore+= 1;
    isGameOver(game);

    return { junc:junc.num };
  },

  initCollect(messenger, game, player) {
    let j = player.settlements.slice(0).pop();
    for (let h=0; h<game.board.juncs[j].hexes.length; h++) {
      collectResource(messenger, game, player, game.board.juncs[j].hexes[h]);
    }
    updateBuyOptions(game, player);
  },

  initPave(messenger, game, player, road) {
    if (road.owner === player.playerID)
      throw new InvalidChoiceError('road',road,'You\'ve already paved here!');
    if (road.owner > -1)
      throw new InvalidChoiceError('road',road,'Someone has already paved here.');

    let valid=false, match=player.settlements.slice(0).pop();
    for (let j=0; j<road.juncs.length; j++) {
      if (road.juncs[j] === match)
        valid=true;
    }
    if (!valid)
      throw new InvalidChoiceError('road',road,'You must pave a road next to your last settlement.');

    return pave(messenger, game, player, road, pay=false);
  },

  initSettle(messenger, game, player, junc) {
    return settle(messenger, game, player, junc, pay=false);
  },

  iterateTurn(messenger, game, player) {
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

  moveRobber(messenger, game, player, hex) {

    if (hex.num===game.board.robber)
      throw new InvalidChoiceError('robber',hex,'The robber is already here.');
    game.board.robber=hex.num;

    // check if there is anyone to steal from
    let juncs = game.board.hexes[game.board.robber].juncs;
    game.state.canSteal = false;
    for (let j=0; j<juncs.length; j++) {
      let owner = game.board.juncs[juncs[j]].owner;
      if (owner > -1 && owner !== player.playerID)
        game.state.canSteal = true;
    }

    messenger.list.push([player.playerID, `moved the robber.`]);
    return { hex:hex.num };
  },

  offerTrade(messenger, game, player, trade) {
    game.state.currentTrade = trade;
    for (let q=0; q<game.state.players.length; q++) {
      let other = game.state.players[q];
      other.canAcceptTrade = false;
      if (player !== other) {
        other.canAcceptTrade = funcs.canAfford(other, trade.in);
      }
    }

    messenger.list.push([player.playerID, `has offered a trade.`]);
    //console.log('offer', trade);

    return { trade:trade };
  },

  pave(messenger, game, player, road) {
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

    return pave(messenger, game, player, road);
  },

  playDC(messenger, game, player, card, args) {
    player.unplayedDCs[card]  -= 1;
    player.playedDCs[card]    += 1;

    switch (card) {
      case ('vp'):
        player.publicScore        += 1;
        messenger.list.push([player.playerID, `played a Victory Point.`]);
        return;

      case ('knight'):
        player.numKnights += 1;
        messenger.list.push([player.playerID, `played a Knight.`]);
        calcLargestArmy(messenger, game);
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
        messenger.list.push([player.playerID, `played a Monopoly on ${res}.`]);
        break;
      case ('rb'):
        let rollback = player.roads.slice(0);
        try {
          messenger.list.push([player.playerID, `played Road Building.`]);
          helpers.pave(messenger, game, player, args[0]);
          helpers.pave(messenger, game, player, args[1]);
        } catch (e) {
          player.roads = rollback;
          throw e;
        }
        break;
      case ('yop'):
        player.resources[args[0]] += 1;
        player.resources[args[1]] += 1;
        messenger.list.push([player.playerID, `played a Year of Plenty and selected ${res} and ${res}.`]);
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

    return { args:args, hasLargestArmy:game.state.hasLargestArmy };
  },

  roll(messenger, game, player, args) {

    let rolls;
    try {
      rolls = (isNaN(args[0]) ? rollDice() : args);
    } catch (e) {
      rolls = rollDice();
    }
    let roll = rolls[0] + rolls[1];
    game.board.dice.values = rolls;
    game.state.hasRolled   = true;
    game.state.isRollSeven = false;
    game.state.waitForDiscard = false;
    if (roll === 7) {
      game.state.isRollSeven = true
      for (let p=0; p<game.state.players.length; p++) {
        let player = game.state.players[p];
        if (player.hasHeavyPurse) {
          game.state.waitForDiscard = true;
          player.discard = Math.floor(sumResources(player)/2);
        }
      }
    }
    messenger.list.push([player.playerID, `rolled a ${roll}.`]);
    return { values:rolls };
  },

  settle(messenger, game, player, junc, pay=true) {
    // check if close to a road
    for (let r=0; r<junc.roads.length; r++) {
      let road = game.board.roads[junc.roads[r]];
      if (road.owner === player.playerID)
        return settle(messenger, game, player, junc);
    }
    throw new InvalidChoiceError('junc',junc,'You need to build a road here before you can settle.');
  },

  steal(messenger, game, player, other) {
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

        messenger.list.push([player.playerID, `stole a card from ${other.lobbyData.name}.`]);
        return { other:other.playerID };
      }
    }
    throw new InvalidChoiceError('player',other,other.lobbyData.name+' is not adjacent to the robber.');
  },

  tradeWithBank(messenger, game, player, trade) {
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

    messenger.list.push([player.playerID, `traded ${trade.out[outResource]} ${outResource} with the bank for ${trade.in[inResource]} ${inResource}.`]);
    return { trade:trade };
  },

  validateTrade(messenger, game, player, trade) {
    //console.log(trade);
    if (!funcs.canAfford(player, trade.out))
      throw new PovertyError(player, trade.out);
  },




  parse : parse

}

function getAdjacentGameStates(flags) {
  let edges = [];
  for (let e=0; e<_STATE_GRAPH.vertices[flags.vertex].edges.length; e++) {
    let ename = _STATE_GRAPH.vertices[flags.vertex].edges[e];
    let edge = _STATE_GRAPH.edges[ename];
    if (edge.evaluate(flags)) {
      if (edge.isPriority)
        return [ename];
      edges.push(ename);
    }
  }
  return edges;
}
function getStateEdge(edge) {
  let e = _STATE_GRAPH.edges[edge];
  if (e === undefined)
    throw new GameLogicError('Invalid edge name: '+edge);
  return e;
}


module.exports = {

  execute(game, p, estring, args, messages=[]) {

    let player = parse.player(game, p);//game.state.players[p];
    edge = getStateEdge(estring);

    let messenger = { list:messages };

    let ret = edge.execute(messenger, game, player, args);
    storeHistory(game, estring, args, ret);

    player.vertex = edge.target;
    game.state.waiting = updateGameStates(game);

    for (let q=0; q<game.state.players.length; q++) {
      for (let a=0; a<game.state.players[q].adjacents.length; a++) {
        let adj_estring = game.state.players[q].adjacents[a];
        if (getStateEdge(adj_estring).isPriority)
          module.exports.execute(game, q, adj_estring, [], messenger.list);
      }
    }

    return { ret:ret, messages:messenger.list, adjs:player.adjacents };
  },
  helpers : helpers,

  getAdjacentGameStates(game,p) {
    let flags = getFlags(game,p);
    return getAdjacentGameStates(flags);
  },
  getFlags(game,p) {
    return getFlags(game,p);
  },
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
    let e_args = getStateEdge(edge).arguments.split(' ');
    if (e_args[0] === 'trade') {
      return parseTrade(game, args.slice(0));
    }

    for (let a=0; a<e_args.length; a++) {
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
  },


}
