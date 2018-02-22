// load stuff
var funcs = require('../app/funcs.js');

// config data
//const newGameParams = require('../config/new-game-form.json');

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

var _SCENARIOS = {
  standard : {
    buildObjects: {
		 road: {
		 max: 15,
		 cost : {
			brick: 1,
			wood: 1
		 }
		 },
		 settlement: {
		 max: 5,
		 cost: {
			wheat: 1,
			sheep: 1,
			brick: 1,
			wood: 1
		 }
		 },
		 city: {
		 max: 4,
		 cost: {
			wheat: 2,
			ore: 3
		 }
		 }
    },
    buyObjects: {
		 dc: {
		 max: 25,
		 cost: {
			wheat: 1,
			sheep: 1,
			ore: 1
		 }
		 }
    },
    playObjects: {
		 dcs: {
		 vp: {
			nameShort: "VP",
			namePlural: "VPs",
			count: 5,
			textColor: "&at",
			nameLong: "Victory Point"
		 },
		 knight: {
			nameShort: "Knight",
			namePlural: "Knights",
			count: 14,
			textColor: "&p0t",
			nameLong: "Knight"
		 },
		 monopoly: {
			nameShort: "Monopoly",
			namePlural: "Monopolies",
			count: 2,
			textColor: "&wt",
			nameLong: "Monopoly"
		 },
		 rb: {
			nameShort: "RB",
			namePlural: "Road Builders",
			count: 2,
			textColor: "&wt",
			nameLong: "Road Building"
		 },
		 yop: {
			nameShort: "YoP",
			namePlural: "YoPs",
			count: 2,
			textColor: "&wt",
			nameLong: "Year of Plenty"
		 }
		 }
    },
    resources: {
		 sheep: {
		 count: 4
		 },
		 wheat: {
		 count: 4
		 },
		 wood: {
		 count: 4
		 },
		 brick: {
		 count: 3
		 },
		 ore: {
		 count: 3
		 },
		 desert: {
		 count: 1
		 }
    },
    dice: [
		 { roll:9, dots:4 },
		 { roll:5, dots:4 },
		 { roll:2, dots:1 },
		 { roll:6, dots:5 },
		 { roll:3, dots:2 },
		 { roll:8, dots:5 },
		 { roll:10, dots:3 },
		 { roll:12, dots:1 },
		 { roll:11, dots:2 },
		 { roll:4, dots:3 },
		 { roll:8, dots:5 },
		 { roll:10, dots:3 },
		 { roll:9, dots:4 },
		 { roll:4, dots:3 },
		 { roll:5, dots:4 },
		 { roll:6, dots:5 },
		 { roll:3, dots:2 },
		 { roll:11, dots:2 }
    ],
    gameState: {
		 vertices: [

		 ],
		 edges: [

		 ]
    },
    gameBoard: {
		 vertices: {
		 hexes: 19,
		 juncs: 54,
		 //roads: 72,
		 //conns: 114,
		 ports: {
			types: [
			  "mystery",
			  "wheat",
			  "ore",
			  "wood",
			  "mystery",
			  "brick",
			  "sheep",
			  "mystery",
			  "mystery"
			],
			locations : [
			  {
				 orientation: 11,
				 juncs: [1,4]
			  },
			  {
				 orientation: 1,
				 juncs: [2,6]
			  },
			  {
				 orientation: 1,
				 juncs: [7,11]
			  },
			  {
				 orientation: 9,
				 juncs: [15,20]
			  },
			  {
				 orientation: 3,
				 juncs: [21,27]
			  },
			  {
				 orientation: 9,
				 juncs: [37,42]
			  },
			  {
				 orientation: 5,
				 juncs: [38,43]
			  },
			  {
				 orientation: 7,
				 juncs: [48,52]
			  },
			  {
				 orientation: 5,
				 juncs: [50,53]
			  }
			]
		 },
		 },
		 edges: {
  		 roads: [
      			{
  			  u: 3,
  			  v: 0
  			},
      			{
  			  u: 0,
  			  v: 4
  			},
      			{
  			  u: 4,
  			  v: 1
  			},
      			{
  			  u: 1,
  			  v: 5
  			},
      			{
  			  u: 5,
  			  v: 2
  			},
      			{
  			  u: 2,
  			  v: 6
  			},
      			{
  			  u: 3,
  			  v: 7
  			},
      			{
  			  u: 4,
  			  v: 8
  			},
      			{
  			  u: 5,
  			  v: 9
  			},
      			{
  			  u: 6,
  			  v: 10
  			},
      			{
  			  u: 11,
  			  v: 7
  			},
      			{
  			  u: 7,
  			  v: 12
  			},
      			{
  			  u: 12,
  			  v: 8
  			},
      			{
  			  u: 8,
  			  v: 13
  			},
      			{
  			  u: 13,
  			  v: 9
  			},
      			{
  			  u: 9,
  			  v: 14
  			},
      			{
  			  u: 14,
  			  v: 10
  			},
      			{
  			  u: 10,
  			  v: 15
  			},
      			{
  			  u: 11,
  			  v: 16
  			},
      			{
  			  u: 12,
  			  v: 17
  			},
      			{
  			  u: 13,
  			  v: 18
  			},
      			{
  			  u: 14,
  			  v: 19
  			},
      			{
  			  u: 15,
  			  v: 20
  			},
      			{
  			  u: 21,
  			  v: 16
  			},
      			{
  			  u: 16,
  			  v: 22
  			},
      			{
  			  u: 22,
  			  v: 17
  			},
      			{
  			  u: 17,
  			  v: 23
  			},
      			{
  			  u: 23,
  			  v: 18
  			},
      			{
  			  u: 18,
  			  v: 24
  			},
      			{
  			  u: 24,
  			  v: 19
  			},
      			{
  			  u: 19,
  			  v: 25
  			},
      			{
  			  u: 25,
  			  v: 20
  			},
      			{
  			  u: 20,
  			  v: 26
  			},
      			{
  			  u: 21,
  			  v: 27
  			},
      			{
  			  u: 22,
  			  v: 28
  			},
      			{
  			  u: 23,
  			  v: 29
  			},
      			{
  			  u: 24,
  			  v: 30
  			},
      			{
  			  u: 25,
  			  v: 31
  			},
      			{
  			  u: 26,
  			  v: 32
  			},
      			{
  			  u: 27,
  			  v: 33
  			},
      			{
  			  u: 33,
  			  v: 28
  			},
      			{
  			  u: 28,
  			  v: 34
  			},
      			{
  			  u: 34,
  			  v: 29
  			},
      			{
  			  u: 29,
  			  v: 35
  			},
      			{
  			  u: 35,
  			  v: 30
  			},
      			{
  			  u: 30,
  			  v: 36
  			},
      			{
  			  u: 36,
  			  v: 31
  			},
      			{
  			  u: 31,
  			  v: 37
  			},
      			{
  			  u: 37,
  			  v: 32
  			},
      			{
  			  u: 33,
  			  v: 38
  			},
      			{
  			  u: 34,
  			  v: 39
  			},
      			{
  			  u: 35,
  			  v: 40
  			},
      			{
  			  u: 36,
  			  v: 41
  			},
      			{
  			  u: 37,
  			  v: 42
  			},
      			{
  			  u: 38,
  			  v: 43
  			},
      			{
  			  u: 43,
  			  v: 39
  			},
      			{
  			  u: 39,
  			  v: 44
  			},
      			{
  			  u: 44,
  			  v: 40
  			},
      			{
  			  u: 40,
  			  v: 45
  			},
      			{
  			  u: 45,
  			  v: 41
  			},
      			{
  			  u: 41,
  			  v: 46
  			},
      			{
  			  u: 46,
  			  v: 42
  			},
      			{
  			  u: 43,
  			  v: 47
  			},
      			{
  			  u: 44,
  			  v: 48
  			},
      			{
  			  u: 45,
  			  v: 49
  			},
      			{
  			  u: 46,
  			  v: 50
  			},
      			{
  			  u: 47,
  			  v: 51
  			},
      			{
  			  u: 51,
  			  v: 48
  			},
      			{
  			  u: 48,
  			  v: 52
  			},
      			{
  			  u: 52,
  			  v: 49
  			},
      			{
  			  u: 49,
  			  v: 53
  			},
      			{
  			  u: 53,
  			  v: 50
  			}
  		 ],
  		 conns: [
      			{
  			  u: 0,
  			  v: 0
  			},
      			{
  			  u: 4,
  			  v: 0
  			},
      			{
  			  u: 8,
  			  v: 0
  			},
      			{
  			  u: 12,
  			  v: 0
  			},
      			{
  			  u: 7,
  			  v: 0
  			},
      			{
  			  u: 3,
  			  v: 0
  			},
      			{
  			  u: 1,
  			  v: 1
  			},
      			{
  			  u: 5,
  			  v: 1
  			},
      			{
  			  u: 9,
  			  v: 1
  			},
      			{
  			  u: 13,
  			  v: 1
  			},
      			{
  			  u: 8,
  			  v: 1
  			},
      			{
  			  u: 4,
  			  v: 1
  			},
      			{
  			  u: 2,
  			  v: 2
  			},
      			{
  			  u: 6,
  			  v: 2
  			},
      			{
  			  u: 10,
  			  v: 2
  			},
      			{
  			  u: 14,
  			  v: 2
  			},
      			{
  			  u: 9,
  			  v: 2
  			},
      			{
  			  u: 5,
  			  v: 2
  			},
      			{
  			  u: 7,
  			  v: 3
  			},
      			{
  			  u: 12,
  			  v: 3
  			},
      			{
  			  u: 17,
  			  v: 3
  			},
      			{
  			  u: 22,
  			  v: 3
  			},
      			{
  			  u: 16,
  			  v: 3
  			},
      			{
  			  u: 11,
  			  v: 3
  			},
      			{
  			  u: 8,
  			  v: 4
  			},
      			{
  			  u: 13,
  			  v: 4
  			},
      			{
  			  u: 18,
  			  v: 4
  			},
      			{
  			  u: 23,
  			  v: 4
  			},
      			{
  			  u: 17,
  			  v: 4
  			},
      			{
  			  u: 12,
  			  v: 4
  			},
      			{
  			  u: 9,
  			  v: 5
  			},
      			{
  			  u: 14,
  			  v: 5
  			},
      			{
  			  u: 19,
  			  v: 5
  			},
      			{
  			  u: 24,
  			  v: 5
  			},
      			{
  			  u: 18,
  			  v: 5
  			},
      			{
  			  u: 13,
  			  v: 5
  			},
      			{
  			  u: 10,
  			  v: 6
  			},
      			{
  			  u: 15,
  			  v: 6
  			},
      			{
  			  u: 20,
  			  v: 6
  			},
      			{
  			  u: 25,
  			  v: 6
  			},
      			{
  			  u: 19,
  			  v: 6
  			},
      			{
  			  u: 14,
  			  v: 6
  			},
      			{
  			  u: 16,
  			  v: 7
  			},
      			{
  			  u: 22,
  			  v: 7
  			},
      			{
  			  u: 28,
  			  v: 7
  			},
      			{
  			  u: 33,
  			  v: 7
  			},
      			{
  			  u: 27,
  			  v: 7
  			},
      			{
  			  u: 21,
  			  v: 7
  			},
      			{
  			  u: 17,
  			  v: 8
  			},
      			{
  			  u: 23,
  			  v: 8
  			},
      			{
  			  u: 29,
  			  v: 8
  			},
      			{
  			  u: 34,
  			  v: 8
  			},
      			{
  			  u: 28,
  			  v: 8
  			},
      			{
  			  u: 22,
  			  v: 8
  			},
      			{
  			  u: 18,
  			  v: 9
  			},
      			{
  			  u: 24,
  			  v: 9
  			},
      			{
  			  u: 30,
  			  v: 9
  			},
      			{
  			  u: 35,
  			  v: 9
  			},
      			{
  			  u: 29,
  			  v: 9
  			},
      			{
  			  u: 23,
  			  v: 9
  			},
      			{
  			  u: 19,
  			  v: 10
  			},
      			{
  			  u: 25,
  			  v: 10
  			},
      			{
  			  u: 31,
  			  v: 10
  			},
      			{
  			  u: 36,
  			  v: 10
  			},
      			{
  			  u: 30,
  			  v: 10
  			},
      			{
  			  u: 24,
  			  v: 10
  			},
      			{
  			  u: 20,
  			  v: 11
  			},
      			{
  			  u: 26,
  			  v: 11
  			},
      			{
  			  u: 32,
  			  v: 11
  			},
      			{
  			  u: 37,
  			  v: 11
  			},
      			{
  			  u: 31,
  			  v: 11
  			},
      			{
  			  u: 25,
  			  v: 11
  			},
      			{
  			  u: 28,
  			  v: 12
  			},
      			{
  			  u: 34,
  			  v: 12
  			},
      			{
  			  u: 39,
  			  v: 12
  			},
      			{
  			  u: 43,
  			  v: 12
  			},
      			{
  			  u: 38,
  			  v: 12
  			},
      			{
  			  u: 33,
  			  v: 12
  			},
      			{
  			  u: 29,
  			  v: 13
  			},
      			{
  			  u: 35,
  			  v: 13
  			},
      			{
  			  u: 40,
  			  v: 13
  			},
      			{
  			  u: 44,
  			  v: 13
  			},
      			{
  			  u: 39,
  			  v: 13
  			},
      			{
  			  u: 34,
  			  v: 13
  			},
      			{
  			  u: 30,
  			  v: 14
  			},
      			{
  			  u: 36,
  			  v: 14
  			},
      			{
  			  u: 41,
  			  v: 14
  			},
      			{
  			  u: 45,
  			  v: 14
  			},
      			{
  			  u: 40,
  			  v: 14
  			},
      			{
  			  u: 35,
  			  v: 14
  			},
      			{
  			  u: 31,
  			  v: 15
  			},
      			{
  			  u: 37,
  			  v: 15
  			},
      			{
  			  u: 42,
  			  v: 15
  			},
      			{
  			  u: 46,
  			  v: 15
  			},
      			{
  			  u: 41,
  			  v: 15
  			},
      			{
  			  u: 36,
  			  v: 15
  			},
      			{
  			  u: 39,
  			  v: 16
  			},
      			{
  			  u: 44,
  			  v: 16
  			},
      			{
  			  u: 48,
  			  v: 16
  			},
      			{
  			  u: 51,
  			  v: 16
  			},
      			{
  			  u: 47,
  			  v: 16
  			},
      			{
  			  u: 43,
  			  v: 16
  			},
      			{
  			  u: 40,
  			  v: 17
  			},
      			{
  			  u: 45,
  			  v: 17
  			},
      			{
  			  u: 49,
  			  v: 17
  			},
      			{
  			  u: 52,
  			  v: 17
  			},
      			{
  			  u: 48,
  			  v: 17
  			},
      			{
  			  u: 44,
  			  v: 17
  			},
      			{
  			  u: 41,
  			  v: 18
  			},
      			{
  			  u: 46,
  			  v: 18
  			},
      			{
  			  u: 50,
  			  v: 18
  			},
      			{
  			  u: 53,
  			  v: 18
  			},
      			{
  			  u: 49,
  			  v: 18
  			},
      			{
  			  u: 45,
  			  v: 18
  			}
  		 ]
  		}
    },
    defaultGlobalState: {
		 status: null,
		 turn: 0,
		 history: [],
		 isFirstTurn: true,
		 isSecondTurn: false,
		 isGameOver: false,
		 isRollSeven: false,
		 waiting: {
		 forWho: [],
		 forWhat: null
		 },
		 currentPlayerID: null,
		 initialGameConditions : null,
		 players: [],
     hasRolled : false
    },
    defaultPlayerState: {

		 // user.getLobbyData() fields
		 lobbyData: null,/*{
		 id : null,
		 name : null,
		 isAdmin : null,
		 isSuperAdmin : null,
		 isMuted : null,
		 flair : null },*/
     adjacents: [],
     vertex: '_v_init',

		 // actual state data that should be sent to the client on change
		 isHuman: null,
		 canAcceptTrade : false,
		 hasHeavyPurse : false,
		 bankTradeRates: 4, // build
		 canPlayDC: false,  // build
		 canBuild: false,   // build
		 canBuy: false,		// build

		 // fields that would probably logically make more
		 // sense in the board graph, and can be built from that;
		 // should not persist after endgame
		 unplayedDCs: 0,		// build
		 playedDCs: 0,		 // build
		 playedKnights: 0,
		 hasLargestArmy: false,
		 resources: 0,		// build
		 settlements: [],
		 roads: [],
		 hasLongestRoad: false,
		 publicScore: 0,
		 privateScore: 0,

    }
  }
}
var _GUIS = {
  svg: {
    standard: {
		 "tiles" : [
		 [-3,-4],
		 [-1,-4],
		 [ 1,-4],
		 [-4,-2],
		 [-2,-2],
		 [ 0,-2],
		 [2,-2],
		 [-5,0],
		 [-3,0],
		 [-1,0],
		 [1,0],
		 [3,0],
		 [-4,2],
		 [-2,2],
		 [ 0,2],
		 [2,2],
		 [-3,4],
		 [-1,4],
		 [ 1,4]
		 ],
		 "ports" : [
		 [-1,-4,0],
		 [3,-4,1],
		 [-4,-2,0],
		 [4,-1,2],
		 [-5,1,3],
		 [4,3,2],
		 [-4,3,4],
		 [-1,5,4],
		 [3,5,5]
		 ],
		 "spots" : [
		 [-2,-5],
		 [0,-5],
		 [2,-5],
		 [-3,-4],
		 [-1,-4],
		 [1,-4],
		 [3,-4],
		 [-3,-3],
		 [-1,-3],
		 [1,-3],
		 [3,-3],
		 [-4,-2],
		 [-2,-2],
		 [0,-2],
		 [2,-2],
		 [4,-2],
		 [-4,-1],
		 [-2,-1],
		 [0,-1],
		 [2,-1],
		 [4,-1],
		 [-5,0],
		 [-3,0],
		 [-1,0],
		 [1,0],
		 [3,0],
		 [5,0],
		 [-5,1],
		 [-3,1],
		 [-1,1],
		 [1,1],
		 [3,1],
		 [5,1],
		 [-4,2],
		 [-2,2],
		 [0,2],
		 [2,2],
		 [4,2],
		 [-4,3],
		 [-2,3],
		 [0,3],
		 [2,3],
		 [4,3],
		 [-3,4],
		 [-1,4],
		 [1,4],
		 [3,4],
		 [-3,5],
		 [-1,5],
		 [1,5],
		 [3,5],
		 [-2,6],
		 [0,6],
		 [2,6]
		 ],
		 "roadkeys" : [
		 0,
		 0,
		 0,
		 1,
		 1,
		 1,
		 1,
		 0,
		 0,
		 0,
		 0,
		 1,
		 1,
		 1,
		 1,
		 1,
		 0,
		 0,
		 0,
		 0,
		 0,
		 1,
		 1,
		 1,
		 1,
		 1,
		 1,
		 4,
		 4,
		 4,
		 4,
		 4,
		 4,
		 2,
		 2,
		 2,
		 2,
		 2,
		 3,
		 3,
		 3,
		 3,
		 3,
		 2,
		 2,
		 2,
		 2,
		 3,
		 3,
		 3,
		 3,
		 2,
		 2,
		 2
		 ]
    }
  },
  pythonAPI: {

  }
}
const _STATE_GRAPH = require('states.js')/*{
	edges : {
		"_e_trade_bank": {
			isMulti: false,
			evaluate: function (f) { return true; },
			isPriority: false
		},
		"_e_take_turn": {
			isMulti: false,
			evaluate: function (f) { return f.isCurrentPlayer; },
			isPriority: false
		},
		"_e_play_knight": {
			isMulti: false,
			evaluate: function (f) { return f.canPlay.knight; },
			isPriority: false
		},
		"_e_end_turn": {
			isMulti: false,
			evaluate: function (f) { return f.hasRolled; },
			isPriority: false
		},
		"_e_cancel_trade": {
			isMulti: false,
			evaluate: function (f) { return f.isHuman; },
			isPriority: false
		},
		"_e_play_yop": {
			isMulti: false,
			evaluate: function (f) { return f.canPlay.yop; },
			isPriority: false
		},
		"_e_init2_build_road": {
			isMulti: false,
			evaluate: function (f) { return f.isSecondTurn; },
			isPriority: false
		},
		"_e_roll_discard": {
			isMulti: true,
			evaluate: function (f) { return f.hasHeavyPurse; },
			isPriority: true
		},
		"_e_play_monopoly": {
			isMulti: false,
			evaluate: function (f) { return f.canPlay.monopoly; },
			isPriority: false
		},
		"_e_accept_trade": {
			isMulti: true,
			evaluate: function (f) { return f.canAcceptTrade; },
			isPriority: false
		},
		"_e_play_yop_choose": {
			isMulti: false,
			evaluate: function (f) { return true; },
			isPriority: false
		},
		"_e_move_robber_after_knight": {
			isMulti: false,
			evaluate: function (f) { return true; },
			isPriority: false
		},
		"_e_build_city": {
			isMulti: false,
			evaluate: function (f) { return f.hasRolled && f.canBuild.city; },
			isPriority: false
		},
		"_e_build_road": {
			isMulti: false,
			evaluate: function (f) { return f.hasRolled && f.canBuild.road; },
			isPriority: false
		},
		"_e_play_vp": {
			isMulti: false,
			evaluate: function (f) { return f.canPlay.vp; },
			isPriority: false
		},
		"_e_offer_trade": {
			isMulti: false,
			evaluate: function (f) { return true; },
			isPriority: false
		},
		"_e_init_collect": {
			isMulti: false,
			evaluate: function (f) { return f.isSecondTurn; },
			isPriority: false
		},
		"_e_init_settle": {
			isMulti: false,
			evaluate: function (f) { return f.isFirstTurn || f.isSecondTurn; },
			isPriority: true
		},
		"_e_roll": {
			isMulti: false,
			evaluate: function (f) { return !f.hasRolled; },
			isPriority: false
		},
		"_e_steal_robber": {
			isMulti: false,
			evaluate: function (f) { return true; },
			isPriority: false
		},
		"_e_buy_dc": {
			isMulti: false,
			evaluate: function (f) { return f.hasRolled && f.canBuy.dc; },
			isPriority: false
		},
		"_e_cancel_monopoly": {
			isMulti: false,
			evaluate: function (f) { return f.isHuman; },
			isPriority: false
		},
		"_e_cancel_knight": {
			isMulti: false,
			evaluate: function (f) { return f.isHuman; },
			isPriority: false
		},
		"_e_end_game": {
			isMulti: false,
			evaluate: function (f) { return f.isGameOver; },
			isPriority: true
		},
		"_e_cancel_yop": {
			isMulti: false,
			evaluate: function (f) { return f.isHuman; },
			isPriority: false
		},
		"_e_play_monopoly_choose": {
			isMulti: false,
			evaluate: function (f) { return true; },
			isPriority: false
		},
		"_e_init_build_road": {
			isMulti: false,
			evaluate: function (f) { return f.isFirstTurn; },
			isPriority: true
		},
		"_e_move_robber_no_discard": {
			isMulti: false,
			evaluate: function (f) { return f.isCurrentPlayer && f.isWaitingFor; },
			isPriority: false
		},
		"_e_build_settlement": {
			isMulti: false,
			evaluate: function (f) { return f.hasRolled && f.canBuild.settlement; },
			isPriority: false
		},
		"_e_end_init": {
			isMulti: false,
			evaluate: function (f) { return f.isFirstTurn || f.isSecondTurn; },
			isPriority: true
		},
		"_e_to_root": {
			isMulti: false,
			evaluate: function (f) { return true; },
			isPriority: false
		},
		"_e_roll_collect": {
			isMulti: false,
			evaluate: function (f) { return !f.isRollSeven; },
			isPriority: false
		},
		"_e_move_robber_after_discard": {
			isMulti: false,
			evaluate: function (f) { return f.isCurrentPlayer; },
			isPriority: false
		},
    "_e_init_turns": {
      isMulti: false,
      evaluate: function (f) { return f.isCurrentPlayer; },
      isPriority: false
    }
	},
	vertices: {
		"_v_end_game": {
			"edges": []
		},
		"_v_end_turn": {
			"edges": [
			   "_e_take_turn"
			]
		},
		"_v_trade_with_bank": {
			"edges": [
			   "_e_to_root"
			]
		},
		"_v_roll": {
			"edges": [
			   "_e_move_robber_no_discard",
			   "_e_roll_collect",
			   "_e_roll_discard"
			]
		},
		"_v_steal_from_player": {
			"edges": [
			   "_e_to_root"
			]
		},
		"_v_offer_trade": {
			"edges": [
			   "_e_accept_trade",
			   "_e_cancel_trade"
			]
		},
		"_v_play_monopoly": {
			"edges": [
			   "_e_cancel_monopoly",
			   "_e_play_monopoly_choose"
			]
		},
		"_v_play_yop": {
			"edges": [
			   "_e_cancel_yop",
			   "_e_play_yop_choose"
			]
		},
		"_v_choose_resource_type": {
			"edges": [
			   "_e_to_root"
			]
		},
		"_v_buy_dc": {
			"edges": [
			   "_e_end_game",
			   "_e_to_root"
			]
		},
		"_v_root": {
			"edges": [
			   "_e_build_city",
			   "_e_build_road",
			   "_e_build_settlement",
			   "_e_buy_dc",
			   "_e_end_turn",
			   "_e_init_settle",
			   "_e_offer_trade",
			   "_e_play_knight",
			   "_e_play_monopoly",
			   "_e_play_vp",
			   "_e_play_yop",
			   "_e_roll",
			   "_e_trade_bank"
			]
		},
		"_v_accept_trade": {
			"edges": [
			   "_e_to_root"
			]
		},
		"_v_play_knight": {
			"edges": [
			   "_e_cancel_knight",
			   "_e_end_game",
			   "_e_move_robber_after_knight"
			]
		},
		"_v_init": {
			"edges": [
			   "_e_init_turns"
			]
		},
		"_v_play_vp": {
			"edges": [
			   "_e_end_game",
			   "_e_to_root"
			]
		},
		"_v_pave": {
			"edges": [
			   "_e_end_game",
			   "_e_end_init",
			   "_e_to_root"
			]
		},
		"_v_fortify": {
			"edges": [
			   "_e_end_game",
			   "_e_to_root"
			]
		},
		"_v_settle": {
			"edges": [
			   "_e_end_game",
			   "_e_init_build_road",
			   "_e_init_collect",
			   "_e_to_root"
			]
		},
		"_v_collect_resources_(single)": {
			"edges": [
			   "_e_init2_build_road"
			]
		},
		"_v_move_robber": {
			"edges": [
			   "_e_steal_robber"
			]
		},
		"_v_collect_resources_(all)": {
			"edges": [
			   "_e_to_root"
			]
		},
		"_v_choose_2_resources": {
			"edges": [
			   "_e_to_root"
			]
		},
		"_v_discard": {
			"edges": [
			   "_e_move_robber_after_discard",
			   "_e_roll_discard"
			]
		}
	}
}*/
var _NEW_GAME_FORM = {
  strings : {
    scenario : {
		 label  : "Choose a scenario",
		 default: "standard",
		 options: null
    },
    portStyle : {
		 label  : "Port placement style",
		 default: "fixed",
		 options: [
		 "fixed",
		 "random"
		 ]
    },
    tileStyle : {
		 label  : "Tile placement style",
		 default: "random",
		 options: [
		 "fixed",
		 "random"
		 ]
    }
  },
  ints : {
    numHumans : {
		 label  : "Number of humans",
		 default: 4,
		 min    : 0,
		 max    : 5
    },
    victoryPointsGoal : {
		 label  : "Victory points",
		 default: 10,
		 min    : 8,
		 max    : 12
    },
    numCPUs : {
		 label  : "Number of CPUs",
		 default: 0,
		 min    : 0,
		 max    : 0
    }
  },
  bools : {
    isPublic : {
		 label  : "Public",
		 default: true
    }
  }
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
