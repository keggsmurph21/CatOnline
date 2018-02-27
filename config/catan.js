// get core functions
const funcs = require('../app/funcs.js');

// load config files
const _NEW_GAME_FORM  = require('./newgame.js');
const _SCENARIOS      = require('./scenarios.js');
const _STATE_GRAPH    = require('./states.js');
const _GUIS           = require('./guis.js');

// helper function generate/validate new game forms
function populateNewGameForm() {
  _NEW_GAME_FORM.strings.scenario.options = Object.keys( _SCENARIOS );
}
function validateNewGameParams(data, next) {

  let validated = {};

  try {
    for (let datatype in _NEW_GAME_FORM) {
		 if (datatype==='strings') {

		 for (let param in _NEW_GAME_FORM[datatype]) {
			let value = data[param];
			let options = _NEW_GAME_FORM[datatype][param].options;
			if (options.indexOf( value ) < 0)
			  return next( 'Data validation error (expected one of['+options+'], got '+value+' for '+param+')' );
			validated[param] = value;
		 }

		 } else if (datatype==='ints') {

		 for (let param in _NEW_GAME_FORM[datatype]) {
			let value = parseInt(data[param]),
			  min=_NEW_GAME_FORM[datatype][param].min,
			  max=_NEW_GAME_FORM[datatype][param].max;
			if (isNaN(value) || value<min || value>max )
			  return next( 'Data validation error (expected integer between '+min+' and '+max+', got '+data[param]+' for '+param+')' );
			validated[param] = value;
		 }

		 } else if (datatype==='bools') {

		 for (let param in _NEW_GAME_FORM[datatype]) {
			let value = data[param];
			if (typeof value !== 'boolean')
			  return next( 'Data validation error (expected boolean, got '+value+' for '+param+')' );
			validated[param] = value;
		 }

		 }
    }
  } catch(err) {
    return next( 'Data validation error ('+err+')' );
  }

  return next(null,validated);

}

// helper functions to build the state & board graphs
function initGameState(user, settings) {
  let state = _SCENARIOS[settings.scenario].defaultGlobalState;
  state.status = ( settings.numHumans+settings.numCPUs===1 ? 'ready' : 'pending' );
  state.players = [ buildInitialPlayerState(user, settings, true) ];
  return state;
}
function initGameBoard(settings) {
  let board, scenario = _SCENARIOS[settings.scenario];
  board = buildGameBoard(scenario);
  board = randomizeGameBoard(scenario, board, settings);
  return board;
}
function buildGameBoard(scenario) {

  let board = {
    dcdeck : [],
    dice   : {
		 values: null,
		 roll: function() {
		 return [ funcs.getRandomInt(1,6), funcs.getRandomInt(1,6) ] }},
    hexes  : [],
    juncs  : [],
    roads  : []
  };

  // make the Dice
  board.dice.values = [0,0];

  // make the Dev Cards
  for (let dc in scenario.playObjects.dcs) {
    for (let i=0; i<scenario.playObjects.dcs[dc].count; i++) {
		 board.dcdeck.push( dc );
    }
  }

  // make the Hexes
  for (let i=0; i<scenario.gameBoard.vertices.hexes; i++) {
    board.hexes.push({
		 num: i,
		 resource: null,
		 roll: null,
		 dots: null,
		 juncs: []
    });
  }

  // make the Juncs
  for (let i=0; i<scenario.gameBoard.vertices.juncs; i++) {
    board.juncs.push({
		 num : i,
		 port : null,
		 roads : [],
		 hexes : [],
    });
  }

  // make the Roads
  for (let i=0; i<scenario.gameBoard.edges.roads.length; i++) {
    board.roads.push({
		 num : i,
		 juncs : []
    });
  }

  // put the ports on the juncs
  for (let i=0; i<scenario.gameBoard.vertices.ports.locations.length; i++) {
    let port = scenario.gameBoard.vertices.ports.locations[i];
    for (let j=0; j<port.juncs.length; j++) {
		 board.juncs[ port.juncs[j] ].port = {
		 num : i,
		 type : null,
		 orientation : port.orientation
		 };
    }
  }

  // set the edge data for Roads
  for (let i=0; i<scenario.gameBoard.edges.roads.length; i++) {
    let edge = scenario.gameBoard.edges.roads[i];
    board.roads[i].juncs = [ edge.u, edge.v ];
    board.juncs[edge.u].roads.push(i);
    board.juncs[edge.v].roads.push(i);
  }

  // use the edge data for Conns to build the edges b/w Hexes & Juncs
  for (let i=0; i<scenario.gameBoard.edges.conns.length; i++) {
    let edge = scenario.gameBoard.edges.conns[i];
    board.juncs[edge.u].hexes.push(edge.v);
    board.hexes[edge.v].juncs.push(edge.u);
  }

  return board;
}
function checkIsGameBoardLegal(board) {
  for (let i=0; i<board.hexes.length; i++) {
    if ( [6,8].indexOf(board.hexes[i].roll) > -1 ) {
      let adjs = funcs.hexGetAdjHexes(board, i);
      for (let adj of adjs) {
        if ( [6,8].indexOf(board.hexes[ adj ].roll) > -1 )
          return false;
      }
    }
  }
  return true;
}
function randomizeGameBoard(scenario, board, settings) {

  // shuffle the resources (and also the dicevalues?)
  let resources = [], dicevalues = [];
  for (let resource in scenario.resources) {
    for (let i=0; i<scenario.resources[resource].count; i++) {
		 resources.push( resource );
    }
  }
  for (let i=0; i<scenario.dice.length; i++) {
    dicevalues.push({
		 roll : scenario.dice[i].roll,
		 dots : scenario.dice[i].dots
    });
  }
  funcs.shuffle(resources);
  if (settings.tileStyle==='random') {
    funcs.shuffle(dicevalues);
  }
  for (let i=0; i<board.hexes.length; i++) {
    let resource = resources.pop();
    board.hexes[i].resource = resource;
    if ( resource==='desert' ) {
		 board.hexes[i].roll = 0;
		 board.hexes[i].dots = 0;
    } else {
		 let dicevalue = dicevalues.pop();
		 board.hexes[i].roll = dicevalue.roll;
		 board.hexes[i].dots = dicevalue.dots;
    }
  }
  if (!checkIsGameBoardLegal(board)) {
    console.log('illegal game board, reshuffling');
    return randomizeGameBoard(scenario, board, settings);
  }

  // shuffle dev cards
  funcs.shuffle( board.dcdeck );

  let ports = scenario.gameBoard.vertices.ports.types.splice(0);
  if ( settings.portStyle==='random' ) {
    funcs.shuffle( ports );
  }
  for (let i=0; i<board.juncs.length; i++) {
    if (board.juncs[i].port !== null) {
		 board.juncs[i].port.type = ports.pop();
    }
  }

  return board;

}
function saveInitialGameBoardToState(game) {
  let hexes = [], ports = [], dcdeck = game.board.dcdeck.slice(0);
  for (let i=0; i<game.board.hexes.length; i++) {
    let hex = game.board.hexes[i];
    hexes.push({ resource:hex.resource, roll:hex.roll });
  }
  for (let i=0; i<game.board.juncs.length; i++) {
    let junc = game.board.juncs[i];
    if (junc.port)
		 ports.push({ type:game.board.juncs[i].port.type });
  }
  game.state.initialGameConditions = { hexes:hexes, ports:ports, dcdeck:dcdeck };
}

function buildInitialPlayerState(user, settings, isHuman) {
  let scenario = _SCENARIOS[settings.scenario],
    playerState = Object.assign({}, scenario.defaultPlayerState),
    bankTradeRates={}, canPlayDC={}, canBuild={},
    canBuy={}, unplayedDCs={}, playedDCs={}, resources={};

  for (let resource in scenario.resources) {
    if (!scenario.resources[resource].ignore) {
      bankTradeRates[resource] = playerState.bankTradeRates;
      resources[resource] = playerState.resources;
    }
  }
  for (let dc in scenario.playObjects.dcs) {
    canPlayDC[dc] = playerState.canPlayDC;
    unplayedDCs[dc] = playerState.unplayedDCs;
    playedDCs[dc] = playerState.playedDCs;
  }
  for (let build in scenario.buildObjects) {
    canBuild[build] = playerState.canBuild;
  }
  for (let buy in scenario.buyObjects) {
    canBuy[buy] = playerState.canBuy;
  }

  playerState.isHuman = isHuman;
  playerState.bankTradeRates = bankTradeRates;
  playerState.canPlayDC = canPlayDC;
  playerState.canBuild = canBuild;
  playerState.canBuy = canBuy;
  playerState.unplayedDCs = unplayedDCs;
  playerState.playedDCs = playedDCs;
  playerState.resources = resources;

  if (isHuman) {
    playerState.isHuman = true;
    playerState.lobbyData = user.getLobbyData();
  } else {
    throw Error( 'adding CPUs is not yet implemented' );
  }

  return playerState;
}

populateNewGameForm();

// expose some functionality to the environment
module.exports = {

  // output the necessary objects to make the host-new-game
  getNewGameForm : function() {
    // populate with available scenarios
    return _NEW_GAME_FORM;
  },

  // build the meta, game graph, and state graph
  getNewGame : function(user, settings, next) {

    try {
		 validateNewGameParams(settings, function(err,settings) {
		 if (err) return next(err);

		 let game = new funcs.Game();
		 game.state = initGameState(user, settings);
		 game.board = initGameBoard(settings);
		 game.meta = {
			author: user.getLobbyData(),
			created: new Date,
			updated: new Date,
			settings: settings
		 };

		 saveInitialGameBoardToState(game);
		 next(null, game);

		 });
    } catch(err) {
		 return next( 'Data validation error (uncaught '+err+')' );
    }
  },
  getNewPlayerData : function(user, game, human=true) {
    return buildInitialPlayerState(user, game.meta.settings, human);
  },
  getAdjacentGameStates : function(flags) {
    let edges = [];
    for (let e=0; e<_STATE_GRAPH.vertices[flags.vertex].edges.length; e++) {
      let ename = _STATE_GRAPH.vertices[flags.vertex].edges[e];
      let edge = _STATE_GRAPH.edges[ename];
      console.log((edge.isImportant?'!!':'')+ename+'\t\t'+edge.evaluate(flags));
      if (edge.evaluate(flags)) {
        if (edge.isPriority)
          return [ename];
        edges.push(ename);
      }
    }
    return edges;
  },
  getStateVertices : function() {
    return _STATE_GRAPH.vertices;
  },
  getStateEdges : function() {
    return _STATE_GRAPH.edges;
  },
  getColors : function(game) {
    let i=0;
    while (!_SCENARIOS[game.meta.settings.scenario].colors[i]) { i++; }
    let colors = _SCENARIOS[game.meta.settings.scenario].colors[i].splice(0);
    funcs.shuffle(colors);
    return colors.slice(0,game.state.players.length);
  }

}
