// load stuff
var aSync = require('async');
var tools = require('./tools.js');
var funcs = require('../game/funcs.js');
var config= require('../config/new-game-form.json');

// app/routes.js
module.exports = function(app, passport) {

  // LOBBY PAGE
  app.get('/lobby', isLoggedIn, function(req,res) {
    res.render('lobby.ejs', {
      message: req.flash('lobbyMessage'),
      user: req.user,
      //games: data,
      config: config
    });
  });

  // JOIN PAGE
  app.post('/join', isLoggedIn, function(req,res) {
    tools.User.findById( req.user.id, function(err,user) {
      if (err) throw err;
      if (!user) throw 'Error: unable to find user.';
      let data = user.getExtendedPublicData();
      if (data.activeGamesAsPlayer < data.maxActiveGamesAsPlayer || user.isAdmin) {
        tools.Game.findById(req.body.gameid, function(err,game) {
          if (err) throw err;
          if (!game) {
            req.flash( 'lobbyMessage', 'Unable to find game ' + req.body.gameid );
            res.redirect( '/lobby' );
          } else if ( funcs.checkIsActive(game) ) {
            if (!funcs.checkIfUserInGame(req.user, game) && !funcs.checkIsFull(game)) {
              game.meta.players.push( req.user );
              game.meta.status = ( funcs.checkIsFull(game) ? 'ready' : 'pending' );
              game.meta.updated = new Date;
              game.save( function(err) {
                if (err) throw err;
                user.activeGamesAsPlayer += 1;
                user.save( function(err) {
                  if (err) throw err;

                  // SUCCESS
                  req.flash('lobbyMessage', 'You have joined a game.');
                  res.redirect('/lobby#'+req.body.gameid);

                });
              });
            } else {
              req.flash( 'lobbyMessage', "Unable to join: game is full or you have already joined." );
              res.redirect('/lobby');
            }
          } else {
            req.flash( 'lobbyMessage', 'Unable to join: game is not active.' );
            res.redirect( '/lobby' );
          }
        });
      } else {
        req.flash('lobbyMessage', 'Unable to join: you are already in the maximum number of games.');
        res.redirect('/lobby');
      }
    });
  });

  // LEAVE PAGE
  app.post('/leave', isLoggedIn, function(req,res) {
    funcs.tryRemoveUserFromGame(
      req.user, req.user.id, req.body.gameid,
      function(err, message) {
        if (err) throw err;
        req.flash( 'lobbyMessage', message );
        res.redirect( '/lobby' ); },
      function(message) {
        req.flash( 'lobbyMessage', message );
        res.redirect( '/lobby/#'+req.body.gameid );
      }
    );
  });

  // LAUNCH PAGE
  app.post('/launch', isLoggedIn, function(req,res) {
    tools.Game.findById(req.body.gameid, function(err,game) {
      if (err) throw err;
      if (!game) {
        req.flash( 'lobbyMessage', 'Unable to find game ' + req.body.gameid );
        res.redirect( '/lobby' );
      } else {

        if ( funcs.checkIfUserInGame( req.user, game ) ) {
          if (game.meta.status==='in-progress') {
            res.redirect('/play/'+req.body.gameid);
          } else if (game.meta.status==='ready') {

            game.meta.status = 'in-progress';
            game.meta.updated = new Date;
            game.save( function(err) {
              if (err) throw err;
              res.redirect('/play/'+req.body.gameid);
            });

          } else {
            req.flash('lobbyMessage', 'Unable to launch until enough players have joined.' );
            res.redirect('/lobby');
          }
        } else {
          req.flash('lobbyMessage', "You can't launch a game you haven't joined!");
          res.redirect('/lobby');
        }

      }
    });
  });

  // DELETE PAGE
  app.post('/delete', isLoggedIn, function(req,res) {
    tools.User.findById( req.user.id, function(err,user) {
      if (err) throw err;
      if (!user) throw 'Error: unable to find user.';
      tools.Game.findById(req.body.gameid, function(err,game) {
        if (err) throw err;
        if (!game) {
          req.flash( 'lobbyMessage', 'Unable to find game ' + req.body.gameid );
          res.redirect( '/lobby' );
        } else if ( funcs.usersCheckEqual(game.meta.author, req.user) || req.user.isSuperAdmin ) {
          tools.User.findById( game.meta.author.id, function(err,user) {
            if (err) throw err;
            if (!user) throw 'Error: unable to find user.';
            user.activeGamesAsAuthor -= 1;
            user.save( function(err) { if (err) throw err; });
          });
          for (let p=0; p<game.meta.players.length; p++) {
            tools.User.findById( game.meta.players[p].id, function(err,user) {
              if (err) throw err;
              if (!user) throw 'Error: unable to find user.';
              user.activeGamesAsPlayer -= 1;
              user.save( function(err) { if (err) throw err; });
            });
          }
          game.remove( function(err,game) {
            if (err) throw err;
            req.flash('lobbyMessage', 'Deleted a game.');
            res.redirect('/lobby#'+req.body.gameid);
          });
        } else {
          req.flash( 'lobbyMessage', 'Only the owner can delete this game.' );
          res.redirect('/lobby');
        }
      });
    });
  });

  // NEWGAME PAGES
  app.post('/newgame', isLoggedIn, function(req,res) {
    tools.User.findById( req.user.id, function(err,user) {
      if (err) throw err;
      if (!user) throw 'ERROR: unable to find user.';
      let data = user.getExtendedPublicData();
      if ( data.activeGamesAsAuthor < data.maxActiveGamesAsAuthor || req.user.isAdmin ) {
        if ( data.activeGamesAsPlayer < data.maxActiveGamesAsPlayer || req.user.isAdmin ) {

          let game = funcs.initGameNoPlayers( req.user, req.body );
          game.save( function(err) {
            if (err) throw err;
            user.activeGamesAsAuthor += 1;
            user.activeGamesAsPlayer += 1;
            user.save( function(err) {
              if (err) throw err;

              // SUCCESS
              req.flash('lobbyMessage', 'Your game has been created.');
              res.redirect('/lobby#'+req.body.gameid);

            });
          });
        } else {
          req.flash('lobbyMessage', 'Cannot create new game: you are already in the maximum number of games.');
          res.redirect('/lobby');
        }
      } else {
        req.flash('lobbyMessage', 'Cannot create new game: you already own maximum number of games.');
        res.redirect('/lobby');
      }
    });
  });

  // PLAY PAGES
  app.get('/play/:gameid', isLoggedIn, function(req,res) {

    if ( tools.isValidID(req.params.gameid) ) {
      tools.Game.findById( req.params.gameid, function(err,game) {

        if (err) throw err;

        if (!game) {
          req.flash('lobbyMessage', 'Unable to find game ' + req.params.gameid );
          res.redirect('/lobby');
        }

        if ((funcs.checkIfUserInGame( req.user, game ) && game.meta.status==='in-progress') || req.user.isAdmin) {
          game.getDataForUser( req.user, function(data) {

            res.render('play.ejs', {
              message: req.flash('playMessage'),
              user: req.user,
              svg: funcs.prepareGamesForPlay( data ),
              data: data
            });

          });
        } else {
          req.flash( 'lobbyMessage', 'This game is not yet playable!' );
          res.redirect( '/lobby' );
        }

      });
    } else {
      req.flash( 'lobbyMessage', 'Invalid game id ' + req.params.gameid );
      res.redirect('/lobby');
    }

  });

  // ADMIN PAGES
  app.get('/admin', isLoggedIn, function(req,res) {
    if (req.user.isAdmin) {
      res.render('admin.ejs', {
        user: req.user,
        message: req.flash( 'adminMessage' )
      });
    } else {
      // throw a 403 here
      req.flash( 'lobbyMessage', 'Unable to access admin pages: forbidden.' );
      res.redirect( '/lobby' );
    }
  });
  app.post('/admin/promote', isLoggedIn, function(req,res) {
    if (req.user.isAdmin) {
      if (req.user.isSuperAdmin) {
        let id = req.body.userid;
        if ( tools.isValidID(id) ) {
          tools.User.findById(id, function(err,user) {
            if (err) throw err;
            if (!user) {
              req.flash( 'adminMessage', 'Unable to find user '+id );
              res.redirect( '/admin' );
            } else if (user.isAdmin) {
              req.flash( 'adminMessage', 'User '+user.name+' is already an admin.' );
              res.redirect( '/admin' );
            }

            user.isAdmin = true;
            user.isMuted = false;
            user.save( function(err) {
              if (err) throw err;

              // SUCCESS
              funcs.userPushChanges( user );
              req.flash( 'adminMessage', 'Successfully promoted '+user.name+' to admin.' );
              res.redirect( '/admin' );

            });
          });
        } else {
          req.flash( 'adminMessage', 'Invalid user id '+id );
          res.redirect( '/admin' );
        }
      } else {
        // throw a 403 here
        req.flash( 'adminMessage', 'Unable to access superadmin pages: forbidden.' );
        res.redirect( '/admin' );
      }
    } else {
      // throw a 403 here
      req.flash( 'lobbyMessage', 'Unable to access admin pages: forbidden.' );
      res.redirect( '/lobby' );
    }
  });
  app.post('/admin/demote', isLoggedIn, function(req,res) {
    if (req.user.isAdmin) {
      if (req.user.isSuperAdmin) {
        let id = req.body.userid;
        if ( tools.isValidID(id) ) {
          tools.User.findById(id, function(err,user) {
            if (err) throw err;
            if (!user) {
              req.flash( 'adminMessage', 'Unable to find user '+id );
              res.redirect( '/admin' );
            } else if (user.isSuperAdmin) {
              req.flash( 'adminMessage', 'Superadmins cannot be demoted.' );
              res.redirect( '/admin' );
            } else if (!user.isAdmin) {
              req.flash( 'adminMessage', 'User '+user.name+' is not an admin.' );
              res.redirect( '/admin' );
            }
            user.isAdmin = false;
            user.save( function(err) {
              if (err) throw err;

              // SUCCESS
              funcs.userPushChanges( user );
              req.flash( 'adminMessage', 'Successfully demoted '+user.name+' to peon.' );
              res.redirect( '/admin' );

            });
          });
        } else {
          req.flash( 'adminMessage', 'Invalid user id '+id );
          res.redirect( '/admin' );
        }
      } else {
        // throw a 403 here
        req.flash( 'adminMessage', 'Unable to access superadmin pages: forbidden.' );
        res.redirect( '/admin' );
      }
    } else {
      // throw a 403 here
      req.flash( 'lobbyMessage', 'Unable to access admin pages: forbidden.' );
      res.redirect( '/lobby' );
    }
  });
  app.post('/admin/mute', isLoggedIn, function(req,res) {
    if (req.user.isAdmin) {
      let id = req.body.userid;
      if ( tools.isValidID(id) ) {
        tools.User.findById(id, function(err,user) {
          if (err) throw err;
          if (!user) {
            req.flash( 'adminMessage', 'Unable to find user '+id );
            res.redirect( '/admin' );
          } else if (user.isSuperAdmin) {
            req.flash( 'adminMessage', 'Superadmins cannot be muted.' );
            res.redirect( '/admin' );
          } else if (user.isAdmin && !req.user.isSuperAdmin) {
            req.flash( 'adminMessage', 'Only superadmins can mute admins.' );
            res.redirect( '/admin' );
          } else if (user.isMuted) {
            req.flash( 'adminMessage', user.name+' is already muted.' );
            res.redirect( '/admin' );
          }

          user.isMuted = true;
          user.save( function(err) {
            if (err) throw err;

            // SUCCESS
            funcs.userPushChanges( user );
            req.flash( 'adminMessage', 'Muted '+user.name+'.' );
            res.redirect( '/admin' );

          });
        });
      } else {
        req.flash( 'adminMessage', 'Invalid user id '+id );
        res.redirect( '/admin' );
      }
    } else {
      // throw a 403 here
      req.flash( 'lobbyMessage', 'Unable to access admin pages: forbidden.' );
      res.redirect( '/lobby' );
    }
  });
  app.post('/admin/unmute', isLoggedIn, function(req,res) {
    if (req.user.isAdmin) {
      let id = req.body.userid;
      if ( tools.isValidID(id) ) {
        tools.User.findById(id, function(err,user) {
          if (err) throw err;
          if (!user) {
            req.flash( 'adminMessage', 'Unable to find user '+id );
            res.redirect( '/admin' );
          } else if (user.isSuperAdmin) {
            req.flash( 'adminMessage', 'Superadmins are never muted.' );
            res.redirect( '/admin' );
          } else if (user.isAdmin && !req.user.isSuperAdmin) {
            req.flash( 'adminMessage', 'Only superadmins can unmute admins.' );
            res.redirect( '/admin' );
          } else if (!user.isMuted) {
            req.flash( 'adminMessage', user.name+' is not muted.' );
            res.redirect( '/admin' );
          }

          user.isMuted = false;
          user.save( function(err) {
            if (err) throw err;

            // SUCCESS
            funcs.userPushChanges( user );
            req.flash( 'adminMessage', 'Unmuted '+user.name+'.' );
            res.redirect( '/admin' );

          });
        });
      } else {
        req.flash( 'adminMessage', 'Invalid user id '+id );
        res.redirect( '/admin' );
      }
    } else {
      // throw a 403 here
      req.flash( 'lobbyMessage', 'Unable to access admin pages: forbidden.' );
      res.redirect( '/lobby' );
    }
  });
  app.post('/admin/flair', isLoggedIn, function(req,res) {
    if (req.user.isAdmin) {
      let id = req.body.userid;
      if ( tools.isValidID(id) ) {
        tools.User.findById(id, function(err,user) {
          if (err) throw err;
          let flair = req.body.flair;

          if (!user) {
            req.flash( 'adminMessage', 'Unable to find user '+id );
            res.redirect( '/admin' );
          } else if (flair===user.flair) {
            req.flash( 'adminMessage', 'No changes to be made!' );
            res.redirect( '/admin' );
          } else if (user.isSuperAdmin && !funcs.usersCheckEqual(user,req.user)) {
            req.flash( 'adminMessage', 'Superadmin flair can only be edited by that superadmin.' );
            res.redirect( '/admin' );
          } else if (user.isAdmin && !(user.isSuperAdmin || funcs.usersCheckEqual(user,req.user)) ) {
            req.flash( 'adminMessage', 'Admin flair can only be edited by that admin or superadmins.' );
            res.redirect( '/admin' );
          } else if ((flair.match(/[⚡️,👑,🔇]./) || []).length) {
            req.flash( 'adminMessage', 'Sorry, but you can\'t use that flair!' );
            res.redirect( '/admin' );
          } else {
            user.flair = flair;
            user.save( function(err) {
              if (err) throw err;

              // SUCCESS
              funcs.userPushChanges( user );
              req.flash( 'adminMessage', 'Successfully promoted '+user.name+' to admin.' );
              res.redirect( '/admin' );

            });
          }
        });
      } else {
        req.flash( 'adminMessage', 'Invalid user id '+id );
        res.redirect( '/admin' );
      }
    } else {
      // throw a 403 here
      req.flash( 'lobbyMessage', 'Unable to access admin pages: forbidden.' );
      res.redirect( '/lobby' );
    }
  });
  app.post('/admin/batch/users', isLoggedIn, function(req,res) {
    console.log( req.body );
  });
  app.post('/admin/kick', isLoggedIn, function(req,res) {
    if (req.user.isAdmin) {
      for (let kickid in req.body) {
        if (req.body[kickid]==='on') {
          funcs.tryRemoveUserFromGame(
            req.user, kickid.replace(/user/, ''), req.body.gameid,
            function(err, message) {
              if (err) throw err;
              console.log( message ); },
            function(message) {
              console.log( message );
            }
          );
        }
      }
      res.redirect('/admin');
    } else {
      // throw a 403 here
      req.flash( 'lobbyMessage', 'Unable to access admin pages: forbidden.' );
      res.redirect( '/lobby' );
    }
  });
  app.post('/admin/batch/games', isLoggedIn, function(req,res) {
    console.log( req.body );
  });
  // LOGIN PAGES
  app.get('/login', notLoggedIn, function(req,res) {
    res.render('login.ejs', {
      message: req.flash('loginMessage'),
      user: req.user
    });
  });
  app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/lobby',
    failureRedirect : '/login',
    failureFlash : true
  }));

  // REGISTER PAGES
  app.get('/register', notLoggedIn, function(req,res) {
    res.render('register.ejs', {
      message: req.flash('registerMessage'),
      user: req.user
    });
  });
  app.post('/register', passport.authenticate('local-signup', {
    successRedirect : '/lobby',
    failureRedirect : '/register',
    failureFlash : true
  }));

  // LOGOUT PAGE
  app.get('/logout', function(req,res) {
    req.logout();
    res.redirect('/');
  });

  // PROFILE PAGES
  app.get('/profile', isLoggedIn, function(req,res) {
    res.redirect( '/profile/' + req.user.name );
  });
  app.get('/profile/:username', isLoggedIn, function(req,res) {
    tools.User.findOne({ name:req.params.username }, function(err,user) {
      if (err) throw err;
      if (!user) {
        req.flash( 'lobbyMessage', 'Unable to find user ' + req.params.username );
        res.redirect( '/lobby' );
      } else {
        res.render('profile.ejs', {
          message: req.flash('profileMessage'),
          user: user
        });
      }
    });
  });

  // HOME PAGE
  app.get('/', function(req, res) {
    res.render('index.ejs', {
      message: req.flash('homepageMessage'),
      user: req.user
    });
  });

  // 404
  app.all('/:calledPage', function(req,res) {
    res.render('index.ejs', {
      message: '404 "/' + req.params.calledPage + '" not found',
      user: req.user
    });
  });
};

// route middleware to make sure user is logged in
function isLoggedIn(req,res,next) {

  if (req.isAuthenticated()) {
    req.user = req.user.getPublicData();
    return next();
  }

  req.flash('loginMessage', 'You must be logged in to view this page!');
  res.redirect('/login');

}

// route middleware to disallow login page to those already logged in
function notLoggedIn(req,res,next) {

  if (!req.isAuthenticated()) {
    return next();
  }

  req.flash('lobbyMessage', "You're already logged in!");
  res.redirect('/lobby');
}
