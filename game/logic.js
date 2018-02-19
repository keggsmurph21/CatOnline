// load stuff
var funcs = require('../app/funcs.js');
var Classes  = require('./classes.js');

// config data
const newGameParams = require('../config/new-game-form.json');

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
      [x3,y3] = [ x1,     y1-1.0 ];
      break;
    case 3:
      [x2,y2] = [ x1-0.5, y1-0.5 ];
      [x3,y3] = [ x1,     y1-1.0 ];
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

// game logic helper functions
function validateNewGameParams(data, params, next) {

  let validated = {};

  try {
    for (let datatype in params) {
      if (datatype==='strings') {

        for (let param in params[datatype]) {
          let value = data[param];
          let options = params[datatype][param].options;
          if (options.indexOf( value ) < 0)
            return next( 'Data validation error (expected one of['+options+'], got '+value+' for '+param+')' );
          validated[param] = value;
        }

      } else if (datatype==='ints') {

        for (let param in params[datatype]) {
          let value = parseInt(data[param]),
            min=params[datatype][param].min,
            max=params[datatype][param].max;
          if (isNaN(value) || value<min || value>max )
            return next( 'Data validation error (expected integer between '+min+' and '+max+', got '+data[param]+' for '+param+')' );
          validated[param] = value;
        }

      } else if (datatype==='bools') {

        for (let param in params[datatype]) {
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

// define lots of game logic here
module.exports = {

  // build the meta, settings, and state
  initGameNoPlayers : function(user, data, next) {

    try {
      validateNewGameParams(data, newGameParams, function(err,data) {
        if (err) return next(err);

        let scenario;
        try {
          scenario = require( '../config/scenarios/'+data.scenario+'.json' );
        } catch(err) {
          if (err) return next( 'Data validation error (could not load data for scenario "'+data.scenario+'")' );
        }

        let game = new funcs.Game();

        game.meta = {
          author: user.getPublicData(),
          players: [ user.getPublicData() ],
          active: true,
          created: new Date,
          publiclyViewable: data.publiclyViewable,
          waitfor: null
        };
        game.settings = {
          scenario: data.scenario,
          victoryPointsGoal: data.victoryPointsGoal,
          numHumans: data.numHumans,
          numCPUs: data.numCPUs,
          portStyle: data.portStyle,
          tileStyle: data.tileStyle
        };
        game.state = {
          hidden : {
            dcDeck : []
          },
          public : {
            turn   : 0,
            dice   : [],
            hexes  : [],
            juncs  : [],
            roads  : [],
            conns  : [],
          },
          private: {},
        };

        // make the Dice
        let Dice = new Classes.Dice();
        game.state.public.dice = Dice.values;

        // make the Dev Cards
        for (let devCard in scenario.devCards) {
          for (let i=0; i<scenario.devCards[devCard].count; i++) {
            game.state.hidden.dcDeck.push( devCard );
          }
        }
        funcs.shuffle( game.state.hidden.dcDeck );

        // make the Hexes
        let resources = [], diceValues = [];
        for (let resource in scenario.resources) {
          for (let i=0; i<scenario.resources[resource].count; i++) {
            resources.push( resource );
          }
        }
        for (let i=0; i<scenario.diceData.length; i++) {
          diceValues.push({
            roll : scenario.diceData[i].roll,
            dots : scenario.diceData[i].dots
          });
        }
        funcs.shuffle(resources);
        if (true/*data.tileStyle==='random'*/) {
          funcs.shuffle(diceValues);
        }
        for (let i=0; i<scenario.counts.hexes; i++) {
          let resource = resources.pop();
          let diceValue = ( resource==='desert' ? { roll:0, dots:0 } : diceValues.pop() );
          let hex = new Classes.Hex(i, resource, diceValue);
          game.state.public.hexes.push( hex );
        }

        // make the Juncs
        for (let i=0; i<scenario.counts.juncs; i++) {
          let junc = new Classes.Junc(i);
          game.state.public.juncs.push( junc );
        }

        // make the Roads
        for (let i=0; i<scenario.counts.roads; i++) {
          let road = new Classes.Road(i);
          game.state.public.roads.push( road );
        }

        // make the Connections
        for (let i=0; i<scenario.counts.conns; i++) {
          let conn = new Classes.Conn(i);
          game.state.public.conns.push( conn );
        }

        // make the Ports (instead of saving a port class, put all this data right on the Junc)
        if ( data.portStyle==='random' ) {
          funcs.shuffle( scenario.ports.types );
        }
        for (let i=0; i<scenario.ports.types.length; i++) {
          for (let j=0; j<scenario.ports.locations[i].juncs.length; j++) {
            let jid = scenario.ports.locations[i].juncs[j];
            game.state.public.juncs[jid].setPort( i, scenario.ports.types[i], scenario.ports.locations[i].orientation );
          }
        }

        // set the edge data for Roads
        for (let i=0; i<scenario.edgeData.roads.length; i++) {
          let edge = scenario.edgeData.roads[i];
          game.state.public.roads[i].setVertices( edge.u, edge.v );
          game.state.public.juncs[edge.u].roads.push(i);
          game.state.public.juncs[edge.v].roads.push(i);
        }

        // set the edge data for Conns
        for (let i=0; i<scenario.edgeData.conns.length; i++) {
          let edge = scenario.edgeData.conns[i];
          game.state.public.conns[i].setVertices( edge.u, edge.v );
          game.state.public.juncs[edge.u].conns.push(i);
          game.state.public.hexes[edge.v].conns.push(i);
        }

        game.meta.status = ( game.checkIsFull() ? 'ready' : 'pending' );
        game.meta.updated = new Date;

        return next(null,game);

      });
    } catch(err) {
      return next( 'Data validation error (uncaught '+err+')' );
    }
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
