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
    console.log('preparing for svg');
    return 69;
  },

  getObj:function( gameid, userid, type, id, callback ) {

    //tools.models.Game.findOne( {})


    callback(err,obj);
  }
}
