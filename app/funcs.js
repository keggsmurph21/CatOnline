// public/resources/js/funcs.js
// keep functions here that are not necessarily strictly game logic

// setup logs
const dateformat = require('dateformat');
const fs = require('fs');

module.exports = {

  canAfford(player, cost) {
    for (let res in cost) {
      //console.log('need '+cost[res]+' '+res+' have '+player.resources[res]);
      if (player.resources[res] < cost[res])
        return false;
    }
    return true;
  },
  getRandomInt : function(min=0, max=1) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  getRandomChoice : function(list) {
    let i = module.exports.getRandomInt(min=0, max=(list.length-1));
    return list[i];
  },
  shuffle : function(arr) {
    for (let i =arr.length-1; i>0; i--) {
      const j = Math.floor(Math.random() * (i+1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr
  },
  isValidID : function(id) {
    // mongo IDs are always 24 alphanumeric chars
    return (id.length===24 && id.match(/^[a-z0-9]+$/i));
  },
  saveAndCatch : function(Model, next) {
    try {
      Model.save( function(err) {
        next(err);
      });
    } catch(err) {
      next(err);
    }
  },
  checkIfUserInGame : function( user, game ) {
    for (let p=0; p<game.state.players.length; p++) {
      if ( module.exports.usersCheckEqual(game.state.players[p].lobbyData, user) ) {
        return true;
      }
    }

    return false;
  },
  usersCheckEqual : function( u, v ) {
    return ( u.id.toString()===v.id.toString() );
  },
  iteratePlayers : function(game, next) {
    for (let p=0; p<game.state.players.length; p++) {
      module.exports.requireUserById( game.state.players[p].lobbyData.id, function(err,player) {
        next(err, player);
      });
    }
  },
  requireUserById : function(id, next) {
    // success: next( null, user )
    // failure: next( err|message )
    // note: fails on database error AND null result
    if ( module.exports.isValidID(id) ) {
      module.exports.User.findById(id, function(err,user) {
        if (err) return next('require: '+err);
        if (!user) return next('require: Unable to find user '+id);
        return next(null, user); // Success
      });
    } else {
      return next('require: Invalid user id '+id);
    }
  },
  requireGameById : function(id, next) {
    // success: next( null, user )
    // failure: next( err|message )
    // note: fails on database error AND null result
    if ( module.exports.isValidID(id) ) {
      module.exports.Game.findById(id, function(err,game) {
        if (err) return next('require: '+err);
        if (!game) return next('require: Unable to find game '+id);
        return next(null, game); // Success
      });
    } else {
      return next('require: Invalid game id '+id);
    }
  },
  isLoggedIn : function(req,res,next) {
    // route middleware to make sure user is logged in

    if (req.isAuthenticated()) {
      req.user = req.user.getLobbyData();
      return next();
    }

    // 403
    req.flash('loginMessage', 'You must be logged in to view this page!');
    res.redirect('/login');

  },
  notLoggedIn : function(req,res,next) {
    // route middleware to disallow login page to those already logged in

    if (!req.isAuthenticated()) {
      return next();
    }

    req.flash('lobbyMessage', "You're already logged in!");
    res.redirect('/lobby');
  },
  isAdmin : function(req,res,next) {

    if (req.user) {
      if (req.user.isAdmin) {
        return next();
      }
    }

    // 403
    req.flash( 'lobbyMessage', 'Unable to access admin pages: forbidden.' );
    res.redirect( '/lobby' );

  },
  isSuperAdmin : function(req,res,next) {

    if (req.user) {
      if (req.user.isSuperAdmin) {
        return next();
      }
    }

    // 403
    req.flash( 'adminMessage', 'Unable to access superadmin pages: forbidden.' );
    res.redirect( '/admin' );

  },
  log : function(line, log=null) {
    let datetime = new Date();
    datetime = dateformat( datetime, "default" );
    line = '[' + datetime + '] ' + line + '\n';
    if (!fs.existsSync('./logs')) {
      fs.mkdirSync('./logs');
    }
    if (log)
      fs.appendFile( './logs/'+log+'.log', line, 'utf8', function(err) {
        if (err) throw err;
      });
    fs.appendFile( './logs/core.log', line, 'utf8', function(err) {
      if (err) throw err;
    });
  },
  hexGetAdjHexes : function(board, h) {
    let adjs = new Set();
    for (let i=0; i<board.hexes[h].juncs.length; i++) {
      for (let j=0; j<board.juncs[ board.hexes[h].juncs[i] ].hexes.length; j++) {
        let hex = board.juncs[ board.hexes[h].juncs[i] ].hexes[j];
        if (hex !== h)
          adjs.add( hex );
      }
    }
    return adjs;
  },
  juncGetAdjJuncs : function(board, j) {
    let adjs = new Set();
    for (let r=0; r<board.juncs[j].roads.length; r++) {
      for (let k=0; k<board.roads[ board.juncs[j].roads[r] ].juncs.length; k++) {
        let junc = board.roads[ board.juncs[j].roads[r] ].juncs[k];
        if (junc !== j)
          adjs.add( junc );
      }
    }
    return adjs;
  },
  roadGetAdjRoads : function(board, r) {
    let adjs = new Set();
    for (let j=0; j<board.roads[r].juncs.length; j++) {
      for (let k=0; k<board.juncs[ board.roads[r].juncs[j] ].roads.length; k++) {
        let road = board.juncs[ board.roads[r].juncs[j] ].roads[k];
        if (road !== r)
          adjs.add( road );
      }
    }
    return adjs;
  },
  toInt : function(str) {
    let i = parseInt(str);
    if (isNaN(i))
      throw Error('unable to parse int: '+str);
    return i;
  },

  User : require('./models/user'),
  Game : require('./models/game')

}
