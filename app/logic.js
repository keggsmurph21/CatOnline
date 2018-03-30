var funcs = require('./funcs.js');
var config = require('../config/catan.js');

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
    vertex           : player.vertex,
    canAcceptTrade   : player.canAcceptTrade,
    hasHeavyPurse    : player.hasHeavyPurse,
    canPlayDC        : player.canPlayDC,
    canBuild         : player.canBuild,
    canBuy           : player.canBuy,
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
function _validateArgs(edge,args) {
  let e_args = edge.arguments.split(' ');
  for (let a in e_args) {
    let arg = e_args[a];
    switch (arg) {
      case ('int'):
        let int = parseInt(args[a])
        if (isNaN(int))
          throw Error('unable to parse int: '+args[a]);
        e_args[a] = int;
        break;
      case (''):
        return [];
      default:
        throw Error('does this ever happen?');
        return undefined;
    }
  }
  return e_args;
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
  validateEdgeIsAdjacent : function(game, i, edge) {
    return game.state.players[i].adjacents.indexOf(edge) > -1;
  },
  executeEdge : function(game, p, edge, args, validate=true) {
    let player = game.state.players[p];
    edge = config.getStateEdge(edge);
    args = (validate ? _validateArgs(edge, args) : args.map(a=>parseInt(a)));
    args.unshift(p); // add playerid as first arg
    //console.log(args);
    try {
      edge.execute(game, args);
    } catch (e) {
      console.log(edge.name);
      throw e;
    }
    //console.log(game.state.players);

    player.vertex = edge.target;
    game.state.waiting = _updateGameStates(game);

    for (let a in game.state.players[p].adjacents) {
      let adj = game.state.players[p].adjacents[a];
      if (config.getStateEdge(adj).isPriority)
        module.exports.executeEdge(game, p, adj, null);
    }

  }

}
