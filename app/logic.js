var funcs = require('./funcs.js');
var config = require('../config/catan.js');

function _getCanTradeBank(player) {
  for (let res in player.resources) {
    if (player.resources[res] >= player.bankTradeRates[res])
      return true;
  }
  return false;
}
function _getFlags(game, i) {
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
    tradeAccepted    : game.state.tradeAccepted,
    vertex           : player.vertex,
    canAcceptTrade   : player.canAcceptTrade,
    hasHeavyPurse    : player.hasHeavyPurse,
    canPlayDC        : player.canPlayDC,
    canBuild         : player.canBuild,
    canBuy           : player.canBuy,
    canTradeBank     : _getCanTradeBank(player),
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
function _getAllPlayerData(player, game) {
  for (let i=0; i<game.state.players.length; i++) {
    if (funcs.usersCheckEqual(player, game.state.players[i].lobbyData)) {
      return game.state.players[i];
    }
  }
}
function _storeHistory(game, edge, args) {
  while (game.state.history.length <= game.state.turn) {
    game.state.history.push([]);
  }
  let extra = (args.length > 1 ? ' '+args.slice(1).join(' ') : '')
  game.state.history[game.state.turn].push( edge.name + extra );
}
function _sumTotalDevCards(player) {
  let acc = 0;
  for (let dc in player.unplayedDCs) {
    acc += player.unplayedDCs[dc];
  }
  for (let dc in player.playedDCs) {
    acc += player.playedDCs[dc];
  }
  return acc;
}
function _updateGameStates(game) {
  let waiting = { forWho:[], forWhat:[] };
  for (let i=0; i<game.state.players.length; i++) {
    let player = game.state.players[i];
    let flags = _getFlags(game, i);
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
function _updateBuyOptions(game, player) {
  let buildable = config.getBuildObjects(game);
  let buyable   = config.getBuyObjects(game);

  for (let build in buildable) {
    let canAfford = funcs.canAfford(player, buildable[build].cost),
      propName = (build=='city' ? 'cities' : build+'s'),
      available = player[propName].length < buildable[build].max;

    player.canBuild[build] = canAfford && available;
  }

  for (let buy in buyable) {
    switch (buy) {
      case ('dc'):
        let canAfford = funcs.canAfford(player, buyable.dc.cost),
          available = _sumTotalDevCards(player) < buyable.dc.max;

        player.canBuy.dc = canAfford && available;
        break;
      default:
        throw Error('unrecognized `buy` item: '+buy);
    }
  }
}
function _updateCanPlay(player, except={}) {
  for (let dc in player.unplayedDCs) {
    player.canPlayDC[dc] = (player.unplayedDCs[dc] - (except[dc]||0) > 0);
  }
}

module.exports = {

  launch : function(game, next) {
    for (let i=0; i<game.meta.settings.numCPUs; i++) {
      game.state.players.push( config.getNewPlayerData(user,game,false) );
    }

    console.log('launching');
    funcs.shuffle(game.state.players);
    colors = config.getColors(game);

    for (let i=0; i<colors.length; i++) {
      let player = game.state.players[i];
      player.playerID = i;
      player.color    = colors[i];
    }

    game.state.currentPlayerID = 0;
    game.state.waiting= _updateGameStates(game);
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
  getFlags : function(game,p) { return _getFlags(game,p); },
  getAdjacentGameStates : function(game,p) {
    let flags = _getFlags(game,p);
    return config.getAdjacentGameStates(flags);
  },
  validateArguments : function(player, edge, args) {
    let e_args = config.getStateEdge(edge).arguments.split(' ');
    if (e_args[0] === '*') return args; // opt out of this scheme for complex args (for now?)
    for (let a in e_args) {
      let arg = e_args[a];
      switch (arg) {
        case ('int'):
        case ('hex'):
        case ('player'):
        case ('road'):
        case ('settlement'):
          e_args[a] = funcs.toInt(args[a]);
          break;
        case ('resource'):
          e_args[a] = args[a];
          break;
        case (''):
          return [];
        default:
          throw Error('unrecognized argument type: '+arg);
      }
    }
    return e_args;
  },
  validateEdgeIsAdjacent : function(game, i, edge) {
    return game.state.players[i].adjacents.indexOf(edge) > -1;
  },
  executeEdge : function(game, p, edge, args) {
    let player = game.state.players[p];
    edge = config.getStateEdge(edge);
    args.unshift(p);
    try {
      _storeHistory(game, edge, args);
      edge.execute(game, args);
    } catch (e) {
      console.log(edge.name);
      console.log(e);
      throw e;
    }

    player.vertex = edge.target;
    game.state.waiting = _updateGameStates(game);

    for (let q=0; q<game.state.players.length; q++) {
      _updateBuyOptions(game, player);
      _updateCanPlay(player);
      for (let a in game.state.players[q].adjacents) {
        let adj = game.state.players[q].adjacents[a];
        if (config.getStateEdge(adj).isPriority)
          module.exports.executeEdge(game, q, adj, []);
      }
    }

  }

}
