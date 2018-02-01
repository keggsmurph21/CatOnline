// load stuff
var aSync = require('async');
var Classes  = require('./classes.js');
var tools = require('../app/tools.js');

// define lots of game logic here
module.exports = {

  initGameStateNoPlayers:function(form, callback) {
    console.log('initializing game state for ' + form.scenario);
    State = {
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

    tools.models.Scenario.findOne( { name:form.scenario }, function(err, scenario) {
      if (err) throw err;

      // need to keep our database calls in order
      aSync.waterfall([

        // calls for Dice, Dev Cards, Hexes, Juncs, Roads, Conns
        function( callback ) {

          // make the Dice
          var Dice = new Classes.Dice();
          State.public.dice = Dice.values;

          // make the Dev Cards
          aSync.eachOf( scenario.devCards, function( value, key ) {
            for (let i=0; i<value.count; i++) {
              State.hidden.dcDeck.push( key );
            }
          });
          tools.shuffle( State.hidden.dcDeck );

          // make the Hexes

          // first do our database queries
          var resources = [];
          aSync.eachOf( scenario.resources, function( value, key ){
            for (let i=0; i<value.count; i++) {
              resources.push( key );
            }
          });

          var diceValues = [];
          aSync.each( scenario.diceData, function( value ) {
            diceValues.push({
              roll : value.roll,
              dots : value.dots
            });
          });

          // then work with the queried data
          tools.shuffle(resources);
          tools.shuffle(diceValues); // resource place strategy in form.tileStyle

          for (let i=0; i<scenario.counts.hexes; i++) {

            resource = resources.pop();
            diceValue = ( resource === 'desert' ) ? { roll:0, dots:0 } : diceValues.pop()

            hex = new Classes.Hex(i, resource, diceValue);
            State.public.hexes.push( hex );

          }

          // make the Juncs
          for (let i=0; i<scenario.counts.juncs; i++) {

            junc = new Classes.Junc(i);
            State.public.juncs.push( junc );

          }

          // make the Roads
          for (let i=0; i<scenario.counts.roads; i++) {

            road = new Classes.Road(i);
            State.public.roads.push( road );

          }

          // make the Connections
          for (let i=0; i<scenario.counts.conns; i++) {

            conn = new Classes.Conn(i);
            State.public.conns.push( conn );

          }

          callback(null, State);
        },

        // set the ports
        function( State, callback ) {


          // make the Ports

          // first do our database queries
          types = [];
          aSync.each( scenario.ports.types, function( value ) {
            types.push( value );
          });
          locations = [];
          aSync.each( scenario.ports.locations, function( value ) {
            locations.push( value );
          });

          // only shuffle our port types if the user wanted us to
          if ( form.portStyle == 'random' ) {
            tools.shuffle( types );
          }

          // instead of saving a port class, put all this data right on the Junc
          for (let i=0; i<scenario.counts.ports; i++) {
            for (let j=0; j<locations[i].juncs.length; j++) {
              var jid = locations[i].juncs[j];
              State.public.juncs[jid].setPort( types[i], locations[i].orientation );
            }
          }

          callback(null, State);
        },

        // set the edge data for Road and Conn guys
        function( State, callback ) {


          // save the ids (nums) of two juncs to each Road
          aSync.eachOf( scenario.edgeData.roads, function( value, key ) {
            State.public.roads[key].setVertices( value.u.id, value.v.id );
          })

          // save the id (num) of a hex and a junc to each conn
          aSync.eachOf( scenario.edgeData.conns, function( value, key ) {
            State.public.conns[key].setVertices( value.u.id, value.v.id );
          })

          callback(null, State);
        }


      ], function(err, State) {
        if (err) throw err;

      });

      // send it along!
      callback( State );

    });
  },

  prepareForSvg:function(data) {

    guidefs = require('../config/gui/standard');

    svgData = {
      'tiles': [],
      'roads': [],
      'ports': [],
      'spots': []
    };

    // data for tiles
    for (let i=0; i<data.publ.hexes.length; i++) {
      const textCoords = module.exports.anchorToPoints([ guidefs.tiles[i][0]+1, guidefs.tiles[i][1]+0.5 ]);
      svgData.tiles.push({
        'resource': data.publ.hexes[i].resource,
        'points': module.exports.tileAnchorToPointsStr( guidefs.tiles[i] ),
        'roll': data.publ.hexes[i].roll,
        'x': textCoords[0],
        'y': textCoords[1]
      });
    }

    // data for ports
    for (let i=0; i<guidefs.ports.length; i++) {
      let key = guidefs.ports[i];
      svgData.ports.push({
        'path' :  module.exports.portAnchorToPathStr( key ) });
    }

    // data for roads
    var r = 0; // keep track of our road-indexer
    for (let i=0; i<guidefs.spots.length; i++) {
      switch (guidefs.roadkeys[i]) {
        case 0: // 0-> draw legs at 8:00, 4:00  /\
          svgData.roads.push({
            'owner': data.publ.roads[r].owner,
            'path' : module.exports.roadAnchorToPathStr( guidefs.spots[i], 8 )
          });
          svgData.roads.push({
            'owner': data.publ.roads[r].owner,
            'path' : module.exports.roadAnchorToPathStr( guidefs.spots[i], 4 )
          });
          break;
        case 1: // 0-> draw leg at 6:00 |
          svgData.roads.push({
            'owner': data.publ.roads[r].owner,
            'path' : module.exports.roadAnchorToPathStr( guidefs.spots[i], 6 )
          });
          break;
        case 2: // 0-> draw legs at 10:00, 2:00  /\
          svgData.roads.push({
            'owner': data.publ.roads[r].owner,
            'path' : module.exports.roadAnchorToPathStr( guidefs.spots[i], 10 )
          });
          svgData.roads.push({
            'owner': data.publ.roads[r].owner,
            'path' : module.exports.roadAnchorToPathStr( guidefs.spots[i], 2 )
          });
          break;
        case 3: // 0-> draw leg at 12:00
          svgData.roads.push({
            'owner': data.publ.roads[r].owner,
            'path' : module.exports.roadAnchorToPathStr( guidefs.spots[i], 12 )
          });
          break; // ignore 4
      }
    }

    // data for spots
    for (let i=0; i<data.publ.juncs.length; i++) {
      const coords = module.exports.anchorToPoints( guidefs.spots[i] );
      svgData.spots.push({
        'owner': data.publ.juncs[i].owner,
        'x': coords[0],
        'y': coords[1]
      });
    }

    return svgData;
  },

  tileAnchorToPointsStr:function( coords ) {
    const translations = [ [0,0], [1,-1], [2,0], [2,1], [1,2], [0,1] ];
    let str = '';
    for (let i=0; i<translations.length; i++) {
      const transformedCoords = module.exports.anchorToPoints([ coords[0] + translations[i][0], coords[1] + translations[i][1] ]);
      str += transformedCoords[0] + ' ' + transformedCoords[1] + ' ';
    }
    return str;
  },

  roadAnchorToPathStr:function( coords, dir ) {
    var [x1,y1] = module.exports.anchorToPoints( coords );
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
    var [x2,y2] = module.exports.anchorToPoints([ coords[0]+dx, coords[1]+dy ])
    return 'M '+x1+' '+y1+' L '+x2+' '+y2;
  },

  portAnchorToPathStr:function( key ) {
    let [x1,y1] = module.exports.anchorToPoints([ key[0], key[1] ]);
    let [x2,y2] = module.exports.anchorToPoints([ key[0], key[1]-1 ])
    let offset3 = ( key[2] ? -1 : 1 );
    let [x3,y3] = module.exports.anchorToPoints([ key[0]+offset3, key[1]-1 ]);
    return 'M '+x1+' '+y1+' L '+x2+' '+y2+' L '+x3+' '+y3;
  },

  anchorToPoints:function( coords, scale=1.5 ) {
    return [ coords[0]*scale, coords[1]*Math.sqrt(3)/2*scale ];
  },

  getObj:function( gameid, userid, type, id, callback ) {

    //tools.models.Game.findOne( {})


    callback(err,obj);
  }
}
