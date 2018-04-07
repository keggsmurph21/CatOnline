const funcs  = require('../../funcs');
const config = require('../init');

function _accrue(player, windfall) {
  let resources = Object.assign({}, player.resources);
  for (let res in windfall) {
    resources[res] += windfall[res];
  }
  player.resources = resources;
}
function _spend(player, cost) {
  if (!funcs.canAfford(player, cost))
    throw new PovertyError(player, cost);
  let resources = Object.assign({}, player.resources);
  for (let res in cost) {
    resources[res] -= cost[res];
  }
  player.resources = resources;
}
function _collectResource(messenger, game, player, hex, acc=[]) {
  let res = game.board.hexes[hex].resource,
    resources = Object.assign({}, player.resources);
  if (res !== 'desert') {
    messenger.list.push(`%%${player.playerID}%% collected %%${res}%%.`);
    resources[res] += 1;
    acc.push(res);
  }
  player.resources = resources;
}
function _isGameOver(game) {
  for (let p=0; p<game.state.players.length; p++) {
    console.log('check game over', game.state.players[p].privateScore, game.meta.settings.victoryPointsGoal);
    if (game.state.players[p].privateScore >= game.meta.settings.victoryPointsGoal)
      game.state._isGameOver = true;
  }
}
function _pave(messenger, game, player, road, pay=true) {
  let cost;
  if (pay) {
    cost = _getCost(game, 'build', 'road');
    _spend(player, cost);
    _updateBuyOptions(game, player);
  }

  messenger.list.push(`%%${player.playerID}%% built a road.`);
  player.roads.push(road.num);
  road.owner = player.playerID;
  _calcLongestRoad(messenger, game);

  let longestRoads = [];
  for (let p=0; p<game.state.players.length; p++) {
    longestRoads.push(game.state.players[p].longestRoad);
  }
}
function _settle(messenger, game, player, junc, pay=true) {
  //console.log('in settle:',junc);

  if (junc.owner === player.playerID)
    throw new InvalidChoiceError('junc', junc, 'You have already settled here.');
  if (junc.owner > -1)
    throw new InvalidChoiceError('junc', junc, 'Someone has already settled here.');
  if (!junc.isSettleable)
    throw new InvalidChoiceError('junc', junc, 'You can\'t settle next to another settlement.');

  let cost;
  if (pay) {
    cost = _getCost(game, 'build', 'settlement');
    _spend(player, cost);
    _updateBuyOptions(game, player);
  }

  messenger.list.push(`%%${player.playerID}%% built a settlement.`);
  player.settlements.push(junc.num);
  junc.owner = player.playerID;

  junc.isSettleable = false;
  funcs.juncGetAdjJuncs(game.board, junc.num).forEach( function(adj) {
    game.board.juncs[adj].isSettleable = false;
  });

  player.publicScore += 1;
  player.privateScore+= 1;
  _calcLongestRoad(messenger, game);
  _isGameOver(game);

  if (junc.port !== null) {
    let rates = Object.assign({}, player.bankTradeRates);
    if (junc.port.type === 'mystery') {
      for (let res in rates) {
        if (3 < rates[res]) {
          rates[res] = 3;
          messenger.list.push(`%%${player.playerID}%% can now trade 3 %%${res}%% for any resource with the bank.`);
        }
      }
    } else {
      if (2 < rates[junc.port.type]) {
        rates[junc.port.type] = 2;
        messenger.list.push(`%%${player.playerID}%% can now trade 2 %%${junc.port.type}%% for any resource with the bank.`);
      }
    }
    player.bankTradeRates = rates;
  }

  let longestRoads = [];
  for (let p=0; p<game.state.players.length; p++) {
    longestRoads.push(game.state.players[p].longestRoad);
  }
}
function _updateBuyOptions(game, player) {

  function sumDevCards(player) {
    let acc = 0;
    acc += funcs.sumObject(player.unplayableDCs);
    acc += funcs.sumObject(player.unplayedDCs);
    acc += funcs.sumObject(player.playedDCs);
    return acc;
  }

  //console.log('update buy options');
  // check if > 7 cards
  player.hasHeavyPurse = (_sumResources(player) > 7);

  // check build things
  let buildable = config.getBuildObjects(game), canBuild = {};
  for (let build in buildable) {
    let canAfford = funcs.canAfford(player, buildable[build].cost),
      propName = (build=='city' ? 'cities' : build+'s'),
      available = player[propName].length < buildable[build].max;

    canBuild[build] = canAfford && available;
  }
  canBuild.city   = canBuild.city && play.settlements.length;
  player.canBuild = canBuild;

  // check buy things
  let buyable   = config.getBuyObjects(game);
  for (let buy in buyable) {
    switch (buy) {
      case ('dc'):
        let canAfford = funcs.canAfford(player, buyable.dc.cost),
          available = sumDevCards(player) < buyable.dc.max;

        console.log(canAfford, available, game.board.dcdeck.length);
        player.canBuy.dc = canAfford && available && game.board.dcdeck.length;
        break;
      default:
        throw new GameLogicError();
    }
  }
}
function _getCost(game, type, item) {
  if (type==='build') {
    let costs = config.getBuildObjects(game);
    return costs[item].cost;
  } else if (type==='buy') {
    let costs = config.getBuyObjects(game);
    return costs[item].cost;
  }
  throw new GameLogicError();
}
function _sumResources(player) {
  return funcs.sumObject(player.resources);
}
function _calcLargestArmy(messenger, game) {
  let la = game.state.hasLargestArmy;

  for (let p=0; p<game.state.players.length; p++) {
    let player = game.state.players[p];

    // only change on strictly gt
    if (player.numKnights > game.state.largestArmy) {
      game.state.largestArmy = player.numKnights;

      // if it's a change
      if (la !== player.playerID) {
        messenger.list.push(`%%${player.playerID}%% took %%Largest Army%%.`);
        if (la > -1) { // la initialized to -1 (no leader to start)
          game.state.players[la].publicScore -= 2;
          game.state.players[la].privateScore-= 2;
        }
        game.state.hasLargestArmy = player.playerID;
        player.publicScore += 2;
        player.privateScore+= 2;

        _isGameOver(game);
      }
    }
  }
}
function _calcLongestRoad(messenger, game) {

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

  let lr = game.state.hasLongestRoad;

  for (let p=0; p<game.state.players.length; p++) {
    let player = game.state.players[p];
    let longest= calcPlayerLongestRoad(game, player);
    player.longestRoad = longest;

    if (longest > game.state.longestRoad) {
      game.state.longestRoad = longest;

      if (lr !== player.playerID) {
        messenger.list.push(`%%${player.playerID}%% took %%Longest Road%%.`);
        if (lr > -1) {
          game.state.players[lr].publicScore -= 2;
          game.state.players[lr].privateScore+= 2;
        }
        game.state.hasLongestRoad = player.playerID;
        player.publicScore += 2;
        player.privateScore+= 2;

        _isGameOver(game);
      }
    }
  }
}









function acceptTradeAsOffer(messenger, game, player) {
  _spend(player, game.state.currentTrade.out);
  _accrue(player, game.state.currentTrade.in);
  _updateBuyOptions(game, player);
  messenger.list.push(`%%${player.playerID}%% accepted a trade.`);

  cancelTrade(messenger, game, player, silent=true);
}

function acceptTradeAsOther(messenger, game, player) {
  _spend(player, game.state.currentTrade.in);
  _accrue(player, game.state.currentTrade.out);
  _updateBuyOptions(game, player);
  messenger.list.push(`%%${player.playerID}%% accepted a trade.`);

  game.state.tradeAccepted = true;
}

function buyDevCard(messenger, game, player) {
  let cost = _getCost(game, 'buy', 'dc');
  _spend(player, cost);
  _updateBuyOptions(game, player);

  if (!game.board.dcdeck.length)
    throw new InvalidChoiceError('No more development cards.');

  messenger.list.push(`%%${player.playerID}%% bought a development card.`);
  let dc = game.board.dcdeck.pop(),
    unplayableDCs=Object.assign({},player.unplayableDCs),
    unplayedDCs=Object.assign({}, player.unplayedDCs);
  if (dc === 'vp') {
    unplayedDCs[dc] += 1;
    player.privateScore += 1;
    _isGameOver(game);
  } else {
    unplayableDCs[dc] += 1;
  }
  player.unplayedDCs = unplayedDCs;
  player.unplayableDCs = unplayableDCs;

  return dc;
}

function cancelTrade(messenger, game, player, silent=false) {
  game.state.tradeAccepted = false;
  game.state.currentTrade = { in:{}, out:{}, with:[] };

  for (let p=0; p<game.state.players.length; p++) {
    game.state.players[p].canAcceptTrade = false;
    game.state.players[p].hasDeclinedTrade = false;
  }

  if (!silent)
    messenger.list.push(`%%${player.playerID}%% cancelled the trade.`);
}

function collectResources(messenger, game) {
  let sum = game.board.dice.values.reduce((acc,i)=>(acc+=i));
  for (let h=0; h<game.board.hexes.length; h++) {
    let hex = game.board.hexes[h];
    if (hex.roll === sum) {
      for (let j=0; j<hex.juncs.length; j++) {
        let junc = game.board.juncs[hex.juncs[j]];
        if (junc.owner > -1) {
          let player = game.state.players[junc.owner];
          _collectResource(messenger, game, player, hex.num);
          if (junc.isCity)
            _collectResource(messenger, game, player, hex.num);
          _updateBuyOptions(game, player);
          //console.log( player.lobbyData.name,'collects a',hex.resource);
        }
      }
    }
  }
}

function declineTrade(messenger, game, player) {

  player.canAcceptTrade = false;
  player.hasDeclinedTrade = true;
  messenger.list.push(`%%${player.playerID}%% declined a trade.`);

}

function discard(messenger, game, player, cards) {
  let discarding = funcs.sumObject(cards);
  if (discarding > player.discard)
    throw new InvalidChoiceError('resources',cards,'You only need to discard '
      +player.discard+' card'+(player.discard>1 ? 's' : '')+'.');

  _spend(player, cards);
  _updateBuyOptions(game, player);

  messenger.list.push(`%%${player.playerID}%% discarded ${discarding} card${(discarding>1 ? 's' : '')}.`);
  player.discard -= discarding;

  game.state.waitForDiscard = false;
  if (player.discard) {
    for (let p=0; p<game.state.players.length; p++) {
      if (game.state.players[p].discard > 0)
        game.state.waitForDiscard = true;
    }
  }

  return { cards:cards };
}

function end(messenger, game) {
  console.log('game is over');
  throw new NotImplementedError();
}

function failTrade(messenger, game, player) {
  messenger.list.push(`%%${player.playerID}%% was unable to find a trade partner.`);
  cancelTrade(messenger, game, player, silent=true);
}

function fortify(messenger, game, player, junc) {
  if (player.settlements.indexOf(junc.num) === -1)
    throw new InvalidChoiceError('junc',junc,'Cities must be built on existing settlements.');

  // remove from settlements
  let index = player.settlements.indexOf(junc.num);
  player.settlements.splice(index, 1);

  // add to cities
  player.cities.push(junc.num);
  junc.isCity = true;

  let cost = _getCost(game, 'build', 'city');
  _spend(player, cost);
  _updateBuyOptions(game, player);
  messenger.list.push(`%%${player.playerID}%% built a city.`);

  player.publicScore += 1;
  player.privateScore+= 1;
  _isGameOver(game);

}

function initCollect(messenger, game, player) {
  let j = player.settlements.slice(0).pop();
  let acc = [];
  for (let h=0; h<game.board.juncs[j].hexes.length; h++) {
    _collectResource(messenger, game, player, game.board.juncs[j].hexes[h]);
  }
  _updateBuyOptions(game, player);
}

function initPave(messenger, game, player, road) {
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

  _pave(messenger, game, player, road, pay=false);
}

function initSettle(messenger, game, player, junc) {
  _settle(messenger, game, player, junc, pay=false);
}

function iterateTurn(messenger, game, player) {
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
  let unplayedDCs = Object.assign({}, player.unplayedDCs),
    unplayableDCs = Object.assign({}, player.unplayableDCs);
  for (let dc in player.unplayableDCs) {
    unplayedDCs[dc] += unplayableDCs[dc];
    unplayableDCs[dc] = 0;
  }
  player.unplayedDCs = unplayedDCs;
  player.unplayableDCs = unplayableDCs;
}

function moveRobber(messenger, game, player, hex) {

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

  messenger.list.push(`%%${player.playerID}%% moved the robber.`);
}

function offerTrade(messenger, game, player, trade) {

  if (!funcs.canAfford(player, trade.out))
    throw new PovertyError(player, trade.out);

  game.state.currentTrade = trade;
  console.log('CURRENT TRADE',game.state.currentTrade);

  for (let q=0; q<game.state.players.length; q++) {
    let other = game.state.players[q];

    other.canAcceptTrade = false;
    other.hasDeclinedTrade = true;

    if (player !== other) {
      if ((trade.with.length === 0 || trade.with.indexOf(q) > -1)) {
        if (funcs.canAfford(other, trade.in)) {
          other.canAcceptTrade = true;
          other.hasDeclinedTrade = false;
        }
      }
    }
  }

  messenger.list.push(`%%${player.playerID}%% offered a trade.`);
  //console.log('offer', trade);
}

function pave(messenger, game, player, road) {
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

  _pave(messenger, game, player, road);
}

function playDC(messenger, game, player, card, args) {

  switch (card) {
    case ('vp'):
      player.publicScore        += 1;
      messenger.list.push(`%%${player.playerID}%% played a %%Victory Point%%.`);
      break;

    case ('knight'):
      player.numKnights += 1;
      messenger.list.push(`%%${player.playerID}%% played a %%Knight%%.`);
      _calcLargestArmy(messenger, game);
      moveRobber(messenger, game, player, args);
      break;
    case ('monopoly'):
      let res = args;
      for (let p=0; p<game.state.players.length; p++) {
        let other = game.state.players[p];
        if (other !== player) {
          player.resources[res] += other.resources[res];
          other.resources[res]    = 0;
          _updateBuyOptions(game, player);
          _updateBuyOptions(game, other);
        }
      }
      messenger.list.push(`%%${player.playerID}%% played a %%Monopoly%% on %%${res}%%.`);
      break;
    case ('rb'):
      let rollback = player.roads.slice(0);
      try {
        messenger.list.push(`%%${player.playerID}%% played %%Road Building%%.`);
        _pave(messenger, game, player, args[0], pay=false);
        _pave(messenger, game, player, args[1], pay=false);
      } catch (e) {
        player.roads = rollback;
        throw e;
      }
      break;
    case ('yop'):
      player.resources[args[0]] += 1;
      player.resources[args[1]] += 1;
      messenger.list.push(`%%${player.playerID}%% played a %%Year of Plenty%% and selected %%${res}%% and %%${res}%%.`);
      _updateBuyOptions(game, player);
      break;

    default:
      throw new GameLogicError('Unrecognized development card: '+card);
  }

  let playedDCs = Object.assign({}, player.playedDCs),
    unplayedDCs = Object.assign({}, player.unplayedDCs),
    unplayableDCs = Object.assign({}, player.unplayableDCs);

  unplayedDCs[card]  -= 1;
  playedDCs[card]    += 1;
  if (card !== 'vp') {
    for (let dc in player.unplayedDCs) {
      if (dc !== 'vp') {
        unplayableDCs[dc] += unplayedDCs[dc];
        unplayedDCs[dc] = 0;
      }
    }
  }

  player.playedDCs = playedDCs;
  player.unplayedDCs = unplayedDCs;
  player.unplayableDCs = unplayableDCs;
}

function roll(messenger, game, player, args) {

  function rollDice() {
    return [ funcs.getRandomInt(min=1,max=6), funcs.getRandomInt(min=1,max=6) ];
  }

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
        player.discard = Math.floor(_sumResources(player)/2);
      }
    }
  }
  messenger.list.push(`%%${player.playerID}%% rolled a ${roll}.`);
  return rolls;
}

function settle(messenger, game, player, junc, pay=true) {
  // check if close to a road
  for (let r=0; r<junc.roads.length; r++) {
    let road = game.board.roads[junc.roads[r]];
    if (road.owner === player.playerID)
      return _settle(messenger, game, player, junc);
  }
  throw new InvalidChoiceError('junc',junc,'You need to build a road here before you can settle.');
}

function steal(messenger, game, player, other) {
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

      _updateBuyOptions(game, player);
      _updateBuyOptions(game, other);

      messenger.list.push(`%%${player.playerID}%% stole a card from %%${other.playerID}%%.`);

      return;
    }
  }
  throw new InvalidChoiceError('player',other,other.lobbyData.name+' is not adjacent to the robber.');
}

function tradeWithBank(messenger, game, player, trade) {
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

  _spend(player, trade.out);
  _accrue(player, trade.in);
  _updateBuyOptions(game, player);

  messenger.list.push(`%%${player.playerID}%% traded ${trade.out[outResource]} %%${outResource}%% with the bank for ${trade.in[inResource]} %%${inResource}%%.`);
}
