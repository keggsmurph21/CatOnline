// load stuff
var aSync = require('async');
var Classes  = require('./classes.js');
var tools = require('../app/tools.js');

// define lots of game logic here
module.exports = {

  checkIsActive : function( game ) {
    return [ 'pending', 'ready', 'in-progress' ].indexOf( game.meta.status ) > -1;
  },

  checkIsFull : function( game ) {
    return ( game.meta.players.length === (game.settings.numHumans+game.settings.numCPUs) );
  },

  checkIfUserInGame : function( user, game ) {
    for (let p=0; p<game.meta.players.length; p++) {
      if ( module.exports.usersCheckEqual(game.meta.players[p], user) ) {
        return true;
      }
    }

    return false;
  },

  usersCheckEqual : function( u, v ) {
    return ( u.id.toString()===v.id.toString() );
  },

  tryRemoveUserFromGame : function( agent, userid, gameid, onFailure, onSuccess ) {
    console.log( 'try remove', agent, userid, gameid );
    tools.User.findById( userid, function(err,user) {
      if (err) return onFailure( err, null );
      if (!user) return onFailure( 'Error: unable to find user.', null );
      tools.Game.findById( gameid, function(err,game) {
        if (err) return onFailure( err, null );
        if (!game) return onFailure( null, 'Unable to leave: could not find game '+gameid );
        if ( module.exports.checkIsActive(game) ) {
          if ( module.exports.checkIfUserInGame( user, game ) ) {
            if ( game.meta.status!=='in-progress' ) {
              if ( !module.exports.usersCheckEqual( user, game.meta.author ) ) {
                if ( module.exports.usersCheckEqual( user, agent ) || agent.isSuperAdmin || (!user.isAdmin && agent.isAdmin) ) {
                  let newlist = [];
                  for (let p=0; p<game.meta.players.length; p++) {
                    if ( !module.exports.usersCheckEqual(game.meta.players[p], user) ) {
                      newlist.push( game.meta.players[p] );
                    }
                  }
                  game.meta.players = newlist;
                  game.meta.status = ( module.exports.checkIsFull(game) ? 'ready' : 'pending' );
                  game.meta.updated = new Date;
                  game.save( function(err) {
                    if (err) return onFailure( err, null );
                    user.activeGamesAsPlayer -= 1;
                    user.save( function(err) {
                      if (err) return onFailure( err, null );

                      return onSuccess( user.name+' left game '+game.id );

                    });
                  });
                } else {
                  return onFailure( null, "Unable to leave: only superadmins may perform this operation." )
                }
              } else {
                return onFailure( null, "Unable to leave: this user is the author.  Try deleting instead." );
              }
            } else {
              return onFailure( null, "Unable to leave: you can't leave a game once it starts!  Try quitting instead." );
            }
          } else {
            return onFailure( null, "Unable to leave: you can't leave a game you haven't joined!" );
          }
        } else {
          return onFailure( null, 'Unable to leave: game is not active.' );
        }
      });
    });
  },

  initGameNoPlayers : function( user, form ) {
    let game = new tools.Game();

    game.meta = {
      author: user,
      players: [ user ],
      active: true,
      created: new Date,
      publiclyViewable: (form.publiclyViewable === 'on'),
      waitfor: null
    };
    game.settings = {
      scenario: form.scenario,
      victoryPointsGoal: form.victoryPointsGoal,
      numHumans: form.numHumans,
      numCPUs: form.numCPUs,
      portStyle: form.portStyle,
      tileStyle: form.tileStyle
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

    let scenario = require( '../config/scenarios/' + form.scenario + '.json' );

    // make the Dice
    let Dice = new Classes.Dice();
    game.state.public.dice = Dice.values;

    // make the Dev Cards
    for (let devCard in scenario.devCards) {
      for (let i=0; i<scenario.devCards[devCard].count; i++) {
        game.state.hidden.dcDeck.push( devCard );
      }
    }
    tools.shuffle( game.state.hidden.dcDeck );

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
    tools.shuffle(resources);
    if (true/*form.tileStyle==='random'*/) {
      tools.shuffle(diceValues);
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
    if ( form.portStyle==='random' ) {
      tools.shuffle( scenario.ports.types );
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

    game.meta.status = ( module.exports.checkIsFull(game) ? 'ready' : 'pending' );
    game.meta.updated = new Date;

    return game;

  },

  userGetGamesAsAuthor : function( user, callback ) {
    tools.Game.find({ "meta.author.id" : user.id }, function(err,games) {
      if (err) throw err;
      callback(games);
    });
  },

  userGetGamesAsPlayer : function( user, callback ) {
    // for some reason IDs weren't working here so names are used instead
    tools.Game.find({ "meta.players" : { $elemMatch: { "name":user.name }}}, function(err,games) {
      if (err) throw err;
      callback(games);
    });
  },

  userPushChanges : function( user ) {
    // update the meta.author
    module.exports.userGetGamesAsAuthor( user, function(games) {
      for (let g=0; g<games.length; g++) {
        games[g].meta.author = user.getPublicData();
        games[g].meta.updated = new Date;
        games[g].save( function(err) { if (err) throw err; });
      }
    });

    // update the meta.players
    module.exports.userGetGamesAsPlayer( user, function(games) {
      for (let g=0; g<games.length; g++) {
        for (let p=0; p<games[g].meta.players.length; p++) {
          if ( module.exports.usersCheckEqual(games[g].meta.players[p], user) ) {
            games[g].meta.players[p] = user.getPublicData();
          }
        }
        games[g].meta.updated = new Date;
        games[g].save( function(err) { if (err) throw err; });
      }
    });
  },

  prepareUsersData : function( callback ) {
    // only pass relevent information to the admin.ejs page for each user
    tools.User.find({}, function(err,users) {
      if (err) throw err;

      let data = [];
      for (let u=0; u<users.length; u++) {
        data.push( users[u].getExtendedPublicData() );
      }
      callback(data);
    });
  },

  prepareGamesData :  function( user, callback ) {
    // only pass relevant information to the lobby.ejs page for each game
    tools.Game.find({}, function(err,games) {
      if (err) throw err;

      let data = [];
      for (let g=0; g<games.length; g++) {
        datum = {
          id       : games[g]._id,
          scenario : games[g].settings.scenario,
          numHumans: games[g].settings.numHumans,
          numCPUs  : games[g].settings.numCPUs,
          players  : games[g].meta.players,
          author   : games[g].meta.author,
          VPs      : games[g].settings.victoryPointsGoal,
          turn     : games[g].state.public.turn,
          status   : games[g].meta.status,
          public   : games[g].meta.publiclyViewable,
          waitfor  : games[g].meta.waitfor,
          created  : tools.formatDate( games[g].meta.created ),
          updated  : tools.formatDate( games[g].meta.updated ),
          isFull   : module.exports.checkIsFull(games[g])
        }

        if ( module.exports.checkIsActive(games[g]) || user.isAdmin) {
          data.push( datum );
        }
      }
      callback(data);
    });
  },

  prepareGamesForPlay : function( data ) {
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
      const textCoords = module.exports.anchorToPoints([ guidefs.tiles[i][0]+1, guidefs.tiles[i][1]+0.5 ]);
      svgData.tiles.push({
        'resource': data.publ.hexes[i].resource,
        'points': module.exports.tileAnchorToPointsStr( guidefs.tiles[i] ),
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
            'path' : module.exports.roadAnchorToPathStr( guidefs.spots[i], 8 ),
            'juncs': data.publ.roads[r].juncs.join(',')
          });
          svgData.roads.push({
            'owner': owner ? data.publ.players[ owner ].hashcode : 'none',
            'path' : module.exports.roadAnchorToPathStr( guidefs.spots[i], 4 ),
            'juncs': data.publ.roads[r].juncs.join(',')
          });
          r += 2;
          break;
        case 1: // 0-> draw leg at 6:00 |
          svgData.roads.push({
            'owner': owner ? data.publ.players[ owner ].hashcode : 'none',
            'path' : module.exports.roadAnchorToPathStr( guidefs.spots[i], 6 ),
            'juncs': data.publ.roads[r].juncs.join(',')
          });
          r += 1;
          break;
        case 2: // 0-> draw legs at 10:00, 2:00  /\
          svgData.roads.push({
            'owner': owner ? data.publ.players[ owner ].hashcode : 'none',
            'path' : module.exports.roadAnchorToPathStr( guidefs.spots[i], 10 ),
            'juncs': data.publ.roads[r].juncs.join(',')
          });
          svgData.roads.push({
            'owner': owner ? data.publ.players[ owner ].hashcode : 'none',
            'path' : module.exports.roadAnchorToPathStr( guidefs.spots[i], 2 ),
            'juncs': data.publ.roads[r].juncs.join(',')
          });
          r += 2;
          break;
        case 3: // 0-> draw leg at 12:00
          svgData.roads.push({
            'owner': owner ? data.publ.players[ owner ].hashcode : 'none',
            'path' : module.exports.roadAnchorToPathStr( guidefs.spots[i], 12 ),
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
      const coords = module.exports.anchorToPoints( guidefs.spots[i] );

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
        svgData.ports[ junc.port.num ].path = module.exports.portAnchorToPathStr( portkey );
        svgData.ports[ junc.port.num ].juncs.push( junc.num );
      }
    }

    return svgData;
  },

  tileAnchorToPointsStr : function( coords ) {
    const translations = [ [0,0], [1,-1], [2,0], [2,1], [1,2], [0,1] ];
    let str = '';
    for (let i=0; i<translations.length; i++) {
      const transformedCoords = module.exports.anchorToPoints([ coords[0] + translations[i][0], coords[1] + translations[i][1] ]);
      str += transformedCoords[0] + ' ' + transformedCoords[1] + ' ';
    }
    return str;
  },

  roadAnchorToPathStr : function( coords, dir ) {
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

  portAnchorToPathStr : function( key ) {
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
    [x1,y1] = module.exports.anchorToPoints([ x1,y1 ]);
    [x2,y2] = module.exports.anchorToPoints([ x2,y2 ]);
    [x3,y3] = module.exports.anchorToPoints([ x3,y3 ]);
    return 'M '+x1+' '+y1+' L '+x2+' '+y2+' L '+x3+' '+y3+' L '+x1+' '+y1;
  },

  anchorToPoints : function( coords, scale=1.5 ) {
    return [ coords[0]*scale, coords[1]*Math.sqrt(3)/2*scale ];
  },

}
