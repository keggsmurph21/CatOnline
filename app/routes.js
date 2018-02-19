// load stuff
var aSync = require('async');
var funcs = require('./funcs.js');
var logic = require('../game/logic.js');
var config= require('../config/new-game-form.json');

// app/routes.js
module.exports = function(app, passport) {

  // LOBBY PAGE
  app.get('/lobby', funcs.isLoggedIn, function(req,res) {
    res.render('lobby.ejs', {
      message: req.flash('lobbyMessage'),
      user: req.user,
      //games: data,
      config: config
    });
  });

  // JOIN PAGE
  /*app.post('/join', funcs.isLoggedIn, function(req,res) {
    funcs.User.findById( req.user.id, function(err,user) {
      if (err) throw err;
      if (!user) throw 'Error: unable to find user.';
      let data = user.getExtendedPublicData();
      if (data.activeGamesAsPlayer < data.maxActiveGamesAsPlayer || user.isAdmin) {
        funcs.Game.findById(req.body.gameid, function(err,game) {
          if (err) throw err;
          if (!game) {
            req.flash( 'lobbyMessage', 'Unable to find game ' + req.body.gameid );
            res.redirect( '/lobby' );
          } else if ( DEFUNCTS.checkIsActive(game) ) {
            if (!DEFUNCTS.checkIfUserInGame(req.user, game) && !game.checkIsFull()) {
              game.meta.players.push( req.user );
              game.meta.status = ( game.checkIsFull() ? 'ready' : 'pending' );
              game.meta.updated = new Date;
              game.save( function(err) {
                if (err) throw err;
                user.activeGamesAsPlayer += 1;
                user.save( function(err) {
                  if (err) throw err;

                  // SUCCESS
                  funcs.log( 'user '+user.id+' ('+user.name+') joined game '+game.id );
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
  });*/

  // LEAVE PAGE
  /*app.post('/leave', funcs.isLoggedIn, function(req,res) {
    DEFUNCTS.tryKickUserFromGame( req.user, req.user.id, req.body.gameid,
      function(err, success, message) {
        if (err) throw err;
        funcs.log( 'user '+user.id+' ('+user.name+') left game '+game.id );
        req.flash( 'lobbyMessage', message );
        res.redirect( '/lobby' );
      }
    );
  });*/

  // LAUNCH PAGE
  /*app.post('/launch', funcs.isLoggedIn, function(req,res) {
    funcs.Game.findById(req.body.gameid, function(err,game) {
      if (err) throw err;
      if (!game) {
        req.flash( 'lobbyMessage', 'Unable to find game ' + req.body.gameid );
        res.redirect( '/lobby' );
      } else {

        if ( DEFUNCTS.checkIfUserInGame( req.user, game ) ) {
          if (game.meta.status==='in-progress') {
            res.redirect('/play/'+req.body.gameid);
          } else if (game.meta.status==='ready') {

            game.meta.status = 'in-progress';
            game.meta.updated = new Date;
            game.save( function(err) {
              if (err) throw err;
              funcs.log( 'user '+user.id+' ('+user.name+') launched game '+game.id );
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
  });*/

  // DELETE PAGE
  /*app.post('/delete', funcs.isLoggedIn, function(req,res) {
    funcs.User.findById( req.user.id, function(err,user) {
      if (err) throw err;
      if (!user) throw 'Error: unable to find user.';
      funcs.Game.findById(req.body.gameid, function(err,game) {
        if (err) throw err;
        if (!game) {
          req.flash( 'lobbyMessage', 'Unable to find game ' + req.body.gameid );
          res.redirect( '/lobby' );
        } else if ( DEFUNCTS.usersCheckEqual(game.meta.author, req.user) || req.user.isSuperAdmin ) {
          funcs.User.findById( game.meta.author.id, function(err,user) {
            if (err) throw err;
            if (!user) throw 'Error: unable to find user.';
            user.activeGamesAsAuthor -= 1;
            user.save( function(err) { if (err) throw err; });
          });
          for (let p=0; p<game.meta.players.length; p++) {
            funcs.User.findById( game.meta.players[p].id, function(err,user) {
              if (err) throw err;
              if (!user) throw 'Error: unable to find user.';
              user.activeGamesAsPlayer -= 1;
              user.save( function(err) { if (err) throw err; });
            });
          }
          game.remove( function(err,game) {
            if (err) throw err;
            funcs.log( 'user '+user.id+' ('+user.name+') deleted game '+game.id );
            req.flash('lobbyMessage', 'Deleted a game.');
            res.redirect('/lobby#'+req.body.gameid);
          });
        } else {
          req.flash( 'lobbyMessage', 'Only the owner can delete this game.' );
          res.redirect('/lobby');
        }
      });
    });
  });*/

  // NEWGAME PAGES
  /*app.post('/newgame', funcs.isLoggedIn, function(req,res) {
    funcs.User.findById( req.user.id, function(err,user) {
      if (err) throw err;
      if (!user) throw 'ERROR: unable to find user.';
      let data = user.getExtendedPublicData();
      if ( data.activeGamesAsAuthor < data.maxActiveGamesAsAuthor || req.user.isAdmin ) {
        if ( data.activeGamesAsPlayer < data.maxActiveGamesAsPlayer || req.user.isAdmin ) {

          let game = DEFUNCTS.initGameNoPlayers( req.user, req.body );
          game.save( function(err) {
            if (err) throw err;
            user.activeGamesAsAuthor += 1;
            user.activeGamesAsPlayer += 1;
            user.save( function(err) {
              if (err) throw err;

              // SUCCESS
              funcs.log( 'user '+user.id+' ('+user.name+') initialized game '+game.id );
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
  });*/

  // PLAY PAGES
  app.get('/play/:gameid', funcs.isLoggedIn, function(req,res) {

    if ( funcs.isValidID(req.params.gameid) ) {
      funcs.Game.findById( req.params.gameid, function(err,game) {

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
              svg: logic.prepareDataForSVG( data ),
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
  app.get('/admin', funcs.isAdmin, function(req,res) {
    res.render('admin.ejs', {
      user: req.user,
      message: req.flash( 'adminMessage' )
    });
  });

  // LOGIN PAGES
  app.get('/login', funcs.notLoggedIn, function(req,res) {
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
  app.get('/register', funcs.notLoggedIn, function(req,res) {
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
  app.get('/profile', funcs.isLoggedIn, function(req,res) {
    res.redirect( '/profile/' + req.user.name );
  });
  app.get('/profile/:username', funcs.isLoggedIn, function(req,res) {
    funcs.User.findOne({ name:req.params.username }, function(err,user) {
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
