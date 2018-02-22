// load stuff
var aSync = require('async');
var funcs = require('./funcs.js');
var logic = require('./logic.js');
var config = require('../config/catan.js');
//var config= require('../config/new-game-form.json');

// app/routes.js
module.exports = function(app, passport) {

  // LOBBY PAGE
  app.get('/lobby', funcs.isLoggedIn, function(req,res) {
    res.render('lobby.ejs', {
      message: req.flash('lobbyMessage'),
      user: req.user,
      //games: data,
      config: config.getNewGameForm()
    });
  });

  app.get('/dev', function(req,res) {
    funcs.requireUserById( '5a88f82d931f760c16c3417c', function(err,user) {
      if (err) throw err;
      funcs.requireGameById( '5a8cf31b53a9b0027c8e322b', function(err,game) {
        if (err) throw err;
        logic.launch(game, function(err,data) {
          res.render('dev.ejs', {
            user: user,
            data: data//logic.getFlagsForUser(user, game)
          });
        });
      });
    });
  });


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


  // PLAY PAGES
  app.get('/play/:gameid', funcs.isLoggedIn, function(req,res) {

    if ( funcs.isValidID(req.params.gameid) ) {
      funcs.Game.findById( req.params.gameid, function(err,game) {

        if (err) throw err;

        if (!game) {
          req.flash('lobbyMessage', 'Unable to find game ' + req.params.gameid );
          res.redirect('/lobby');
        }

        if ((funcs.checkIfUserInGame( req.user, game ) && game.state.status==='in-progress') || req.user.isAdmin) {
          game.getDataForUser( req.user, function(data) {

            res.render('play.ejs', {
              message: req.flash('playMessage'),
              user: req.user,
              svg: config.prepareDataForSVG( data ),
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
