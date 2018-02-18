// public/resources/js/tools.js
// keep functions here that are not necessarily strictly game logic

// setup logs
var dateformat = require('dateformat');
var fs = require('fs');

module.exports = {

  getRandomInt : function(min=0, max=1) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
  requireUserById : function(id, next) {
    // success: next( null|false, user )
    // failure: next( true, err|message )
    if ( module.exports.isValidID(id) ) {
      module.exports.User.findById(id, function(err,user) {
        if (err) return next(true, err);
        if (!user) return next(true, 'Unable to find user '+id);
        return next(false, user); // Success
      });
    } else {
      return next(true, 'Invalid user id '+id);
    }
  },
  saveAndCatch : function(object, next) {
    try {
      object.save( function(err) {
        next(err);
      });
    } catch(err) {
      next(err);
    }
  },
  requireGameById : function(id, next) {
    // success: next( null|false, user )
    // failure: next( true, err|message )
    if ( module.exports.isValidID(id) ) {
      module.exports.Game.findById(id, function(err,game) {
        if (err) return next(true, err);
        if (!game) return next(true, 'Unable to find game '+id);
        return next(false, game); // Success
      });
    } else {
      return next(true, 'Invalid game id '+id);
    }
  },
  isLoggedIn : function(req,res,next) {
    // route middleware to make sure user is logged in

    if (req.isAuthenticated()) {
      req.user = req.user.getPublicData();
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
  log : function(line) {
    let datetime = new Date();
    datetime = dateformat( datetime, "default" );
    line = '[' + datetime + '] ' + line + '\n';
    fs.appendFile( './logs/debug.log', line, 'utf8', function(err) {
      if (err) throw err;
    });
  },

  User : require('./models/user'),
  Game : require('./models/game')

}
