const funcs  = require('../funcs');
const config = require('./init');

const _STATE_GRAPH = require('./graph/graph');

function getFlags(game, i) {
  console.log('update flags for',game.state.players[i].lobbyData.name);
  function getCanTradeBank(player) {
    for (let res in player.resources) {
      if (player.resources[res] >= player.bankTradeRates[res])
        return true;
    }
    return false;
  }
  function getWaitForTrade() {
    for (let p=0; p<game.state.players.length; p++) {
      if (!game.state.players[p].hasDeclinedTrade) {
        return true;
      }
    }
    return false;
  }

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
    waitForTrade     : getWaitForTrade(),
    tradeAccepted    : game.state.tradeAccepted,
    vertex           : player.vertex,
    discard          : player.discard,
    canAcceptTrade   : player.canAcceptTrade,
    hasHeavyPurse    : player.hasHeavyPurse,
    canPlayDC        : {},
    canBuild         : player.canBuild,
    canBuy           : player.canBuy,
    canTrade         : (funcs.sumObject(player.resources) > 0),
    canTradeBank     : getCanTradeBank(player),
    isHuman          : player.isHuman,
    isCurrentPlayer  : game.state.currentPlayerID===player.playerID,
    isWaitingFor     : (game.state.waiting.indexOf(player.playerID) > -1)
  }
  //console.log('flags', data);
  for (let dc in player.unplayedDCs) {
    data.canPlayDC[dc] = (player.unplayedDCs[dc] > 0);
  }
  console.log('can buy dev cards flag:',data.canBuy,'bound:',player.canBuy);
  return data;
}





function storeHistory(game, p, estring, args, ret) {

  let data = {
    player: p,
    edge:   estring,
    args:   args
  }
  if (ret)
    data.result = ret;

  game.state.history.push(data);
  /*
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

  game.state.history[index].push( estring + extra );*/
}
function updateGameStates(game) {
  let waiting = [];
  for (let i=0; i<game.state.players.length; i++) {
    let flags = getFlags(game, i);
    game.state.players[i].flags = flags;
    game.state.players[i].adjacents = getAdjacentGameStates(flags);
    console.log(game.state.players[i].adjacents);
    if (game.state.players[i].adjacents.length)
      waiting.push( i );
  }
  game.state.waiting = waiting;
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


function validateEdgeArgs(game, edge, args) {
  let e_args = getStateEdge(edge).arguments.split(' ');
  if (e_args[0] === 'trade') {
    return funcs.parse.trade(game, args.slice(0));
  }

  for (let a=0; a<e_args.length; a++) {
    let arg = e_args[a];
    switch (arg) {
      case ('resource'):
        e_args[a] = funcs.parse.resource(game, args[a]);
        break;
      case ('int'):
        try {
          e_args[a] = funcs.toInt(args[a]);
        } catch (e) {
          throw new EdgeArgumentError('int',args[a],e.message);
        }
        break;
      case ('hex'):
        e_args[a] = funcs.parse.hex(game, args[a]);
        break;
      case ('player'):
        e_args[a] = funcs.parse.player(game, args[a]);
        break;
      case ('road'):
        e_args[a] = funcs.parse.road(game, args[a]);
        break;
      case ('settlement'):
        e_args[a] = funcs.parse.junc(game, args[a]);
        break;
      case (''):
        return [];
      default:
        throw new EdgeArgumentError(null,arg,'Unrecognized argument type: '+arg);
    }
  }
  return e_args;
}
function validateEdgeIsAdjacent(game, p, edge) {
  return (game.state.players[p].adjacents.indexOf(edge) > -1);
}

module.exports = {

  play : {
    execute(game, p, estring, args, messages=[]) {

      let player = funcs.parse.player(game, p);//game.state.players[p];
      edge = getStateEdge(estring);

      let messenger = { list:messages };

      let ret = edge.execute(messenger, game, player, args);
      storeHistory(game, p, estring, args, ret);

      player.vertex = edge.target;
      updateGameStates(game);

      for (let q=0; q<game.state.players.length; q++) {
        for (let a=0; a<game.state.players[q].adjacents.length; a++) {
          let adj_estring = game.state.players[q].adjacents[a];
          if (getStateEdge(adj_estring).isPriority)
            module.exports.execute(game, q, adj_estring, [], messenger.list);
        }
      }

      game.meta.updated = new Date;

      return {
        ret:ret,
        messages:messenger.list }/*,
        flags:player.flags,
        adjs:player.adjacents };*/
    },
    validate(game, p, estring, args) {
      if (!validateEdgeIsAdjacent(game, p, estring)) {
        console.log(game.state.players[p].flags);
        throw new UserInputError( `Player ${p} is not adjacent to ${estring} (only ${game.state.players[p].adjacents.join(', ')}).` );
      }
      return validateEdgeArgs(game, estring, args);
    }
  },

  lobby : {
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
      game.state.turn   = 1;
      game.state.status = 'in-progress';

      updateGameStates(game);
      game.meta.updated = new Date;

      module.exports.execute(game, 0, '_e_take_turn', null);

      return next(null);
    }
  }

}
