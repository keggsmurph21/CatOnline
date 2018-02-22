// get core functions
const funcs = require('../app/funcs.js');

// load config files
const _NEW_GAME_FORM  = require('./newgame.js');
const _SCENARIOS      = require('./scenarios.js');
const _STATE_GRAPH    = require('./states.js');
const _GUIS           = require('./guis.js');

// SVG helper functions
function tileAnchorToPointsStr( coords ) {
  const translations = [ [0,0], [1,-1], [2,0], [2,1], [1,2], [0,1] ];
  let str = '';
  for (let i=0; i<translations.length; i++) {
    const transformedCoords = anchorToPoints([ coords[0] + translations[i][0], coords[1] + translations[i][1] ]);
    str += transformedCoords[0] + ' ' + transformedCoords[1] + ' ';
  }
  return str;
}
function roadAnchorToPathStr( coords, dir ) {
  var [x1,y1] = anchorToPoints( coords );
  switch (dir) {
    case 2:
		 [dx,dy] = [1,-1]; break;
    case 4:
		 [dx,dy] = [1,1];  break;
    case 6:
		 [dx,dy] = [0,1];  break;
    case 8:
		 [dx,dy] = [-1,1]; break;
    case 10:
		 [dx,dy] = [-1,-1];break;
    case 12:
		 [dx,dy] = [0,-1]; break;
  }
  var [x2,y2] = anchorToPoints([ coords[0]+dx, coords[1]+dy ])
  return 'M '+x1+' '+y1+' L '+x2+' '+y2;
}
function portAnchorToPathStr( key ) {
  let [x1,y1] = key; // note: key has len 3
  let x2, y2, x3, y3;
  switch (key[2]) {
    case 0:
		 [x2,y2] = [ x1+0.1, y1-0.9 ];
		 [x3,y3] = [ x1+1.0, y1-1.0 ];
		 break;
    case 1:
		 [x2,y2] = [ x1-0.1, y1-0.9 ];
		 [x3,y3] = [ x1-1.0, y1-1.0 ];
		 break;
    case 2:
		 [x2,y2] = [ x1+0.5, y1-0.5 ];
		 [x3,y3] = [ x1,		y1-1.0 ];
		 break;
    case 3:
		 [x2,y2] = [ x1-0.5, y1-0.5 ];
		 [x3,y3] = [ x1,		y1-1.0 ];
		 break;
    case 4:
		 [x2,y2] = [ x1+0.1, y1+0.9 ];
		 [x3,y3] = [ x1+1.0, y1+1.0 ];
		 break;
    case 5:
		 [x2,y2] = [ x1-0.1, y1+0.9 ];
		 [x3,y3] = [ x1-1.0, y1+1.0 ];
		 break;
  }
  [x1,y1] = anchorToPoints([ x1,y1 ]);
  [x2,y2] = anchorToPoints([ x2,y2 ]);
  [x3,y3] = anchorToPoints([ x3,y3 ]);
  return 'M '+x1+' '+y1+' L '+x2+' '+y2+' L '+x3+' '+y3+' L '+x1+' '+y1;
}
function anchorToPoints( coords, scale=1.5 ) {
  return [ coords[0]*scale, coords[1]*Math.sqrt(3)/2*scale ];
}

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
    roads  : [],
    conns  : []
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
		 conns: []
    });
  }

  // make the Juncs
  for (let i=0; i<scenario.gameBoard.vertices.juncs; i++) {
    board.juncs.push({
		 num : i,
		 port : null,
		 roads : [],
		 conns : [],
		 isCity : false,
    });
  }

  // make the Roads
  for (let i=0; i<scenario.gameBoard.edges.roads.length; i++) {
    board.roads.push({
		 num : i,
		 juncs : [],
		 owner : null,
    });
  }

  // make the Connections
  for (let i=0; i<scenario.gameBoard.edges.conns.length; i++) {
    board.conns.push({
		 num : i,
		 junc : null,
		 hex : null,
		 owner : null,
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

  // set the edge data for Conns
  for (let i=0; i<scenario.gameBoard.edges.conns.length; i++) {
    let edge = scenario.gameBoard.edges.conns[i];
    board.conns[i].junc = edge.u;
    board.conns[i].hex  = edge.v;
    board.juncs[edge.u].conns.push(i);
    board.hexes[edge.v].conns.push(i);
  }

  return board;
}
function checkIsGameBoardLegal(board) {
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
  let hexes = [], ports = [], dcdeck = game.board.dcdeck.splice(0);
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

function buildInitialPlayerState(user, settings, isHuman=true) {
  let scenario = _SCENARIOS[settings.scenario],
    playerState = scenario.defaultPlayerState,
    bankTradeRates={}, canPlayDC={}, canBuild={},
    canBuy={}, unplayedDCs={}, playedDCs={}, resources={};

  for (let resource in scenario.resources) {
    bankTradeRates[resource] = playerState.bankTradeRates;
    resources[resource] = playerState.resources;
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
  // build the meta, settings, and state
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
  getNewPlayerData : function(user, game) {
    return buildInitialPlayerState(user, game.meta.settings, true);
  },
  getAdjacentGameStates : function(flags) {
    let edges = [];
    //console.log('FLAGS', flags);
    //console.log('ALL EDGES', _STATE_GRAPH.vertices[flags.vertex])
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

  // SVG-based GUI functions
  prepareDataForSVG : function(data, next) {
    // get the svg data

    guidefs = require('../config/gui/standard');

    svgData = {
		 'tiles': [],
		 'roads': [],
		 'ports': [],
		 'spots': []
    };

    // data for tiles
    for (let i=0; i<data.publ.hexes.length; i++) {
		 const textCoords = anchorToPoints([ guidefs.tiles[i][0]+1, guidefs.tiles[i][1]+0.5 ]);
		 svgData.tiles.push({
		 'resource': data.publ.hexes[i].resource,
		 'points': tileAnchorToPointsStr( guidefs.tiles[i] ),
		 'roll': data.publ.hexes[i].roll,
		 'x': textCoords[0],
		 'y': textCoords[1],
		 'conns': data.publ.hexes[i].conns.join(',')
		 });
    }

    // data for roads
    let r = 0; // keep track of our road-indexer
    for (let i=0; i<guidefs.spots.length; i++) {
		 let owner = data.publ.roads[r].owner;
		 switch (guidefs.roadkeys[i]) {
		 case 0: // 0-> draw legs at 8:00, 4:00  /\
			svgData.roads.push({
			  'owner': owner ? data.publ.players[ owner ].hashcode : 'none',
			  'path' : roadAnchorToPathStr( guidefs.spots[i], 8 ),
			  'juncs': data.publ.roads[r].juncs.join(',')
			});
			svgData.roads.push({
			  'owner': owner ? data.publ.players[ owner ].hashcode : 'none',
			  'path' : roadAnchorToPathStr( guidefs.spots[i], 4 ),
			  'juncs': data.publ.roads[r].juncs.join(',')
			});
			r += 2;
			break;
		 case 1: // 0-> draw leg at 6:00 |
			svgData.roads.push({
			  'owner': owner ? data.publ.players[ owner ].hashcode : 'none',
			  'path' : roadAnchorToPathStr( guidefs.spots[i], 6 ),
			  'juncs': data.publ.roads[r].juncs.join(',')
			});
			r += 1;
			break;
		 case 2: // 0-> draw legs at 10:00, 2:00  /\
			svgData.roads.push({
			  'owner': owner ? data.publ.players[ owner ].hashcode : 'none',
			  'path' : roadAnchorToPathStr( guidefs.spots[i], 10 ),
			  'juncs': data.publ.roads[r].juncs.join(',')
			});
			svgData.roads.push({
			  'owner': owner ? data.publ.players[ owner ].hashcode : 'none',
			  'path' : roadAnchorToPathStr( guidefs.spots[i], 2 ),
			  'juncs': data.publ.roads[r].juncs.join(',')
			});
			r += 2;
			break;
		 case 3: // 0-> draw leg at 12:00
			svgData.roads.push({
			  'owner': owner ? data.publ.players[ owner ].hashcode : 'none',
			  'path' : roadAnchorToPathStr( guidefs.spots[i], 12 ),
			  'juncs': data.publ.roads[r].juncs.join(',')
			});
			r += 1;
			break; // ignore 4
		 }
    }

    // build port skeleton
    for (let i=0; i<guidefs.ports.length; i++) {
		 svgData.ports.push({ 'type':null, 'path':null, 'juncs':[] })
    }

    // data for spots
    for (let i=0; i<data.publ.juncs.length; i++) {
		 let junc = data.publ.juncs[i];
		 const coords = anchorToPoints( guidefs.spots[i] );

		 let hexes = [];
		 for (let j=0; j<junc.conns.length; j++) {
		 hexes.push( data.publ.conns[ junc.conns[j] ].hex );
		 }
		 svgData.spots.push({
		 'owner': junc.owner ? data.publ.players[ junc.owner ].hashcode : 'none',
		 'x': coords[0],
		 'y': coords[1],
		 'isCity': junc.isCity,
		 'roads': junc.roads.join(','),
		 'hexes': hexes.join(',')
		 });

		 // use this to build port data (check if empty object)
		 if ( Object.keys(junc.port).length > 0 ) {
		 let portid = junc.port.num;
		 const portkey = guidefs.ports[portid];
		 svgData.ports[ junc.port.num ].type = junc.port.type;
		 svgData.ports[ junc.port.num ].path = portAnchorToPathStr( portkey );
		 svgData.ports[ junc.port.num ].juncs.push( junc.num );
		 }
    }

    return svgData;
  }

}
