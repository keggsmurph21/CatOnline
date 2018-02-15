// load stuff
var aSync = require('async');
var tools = require('./tools.js');
var funcs = require('../game/funcs.js');
var config= require('../config/scenario.json');

// app/routes.js
module.exports = function(app, passport) {

  // LOBBY PAGE
  app.get('/lobby', isLoggedIn, function(req,res) {
    games = tools.models.Game.find({}, function(err,games) {
      if (err) throw err;

      funcs.prepareForLobby( req.user.id, games, function(data) {

        res.render('lobby.ejs', {
          message: req.flash('lobbyMessage'),
          user: req.user,
          games: data,
          config: config
        });

      });
    });
  });

  // JOIN PAGE
  app.post('/join', isLoggedIn, function(req,res) {
    games = tools.models.Game.findById(req.body.gameid, function(err,game) {
      if (err) throw err;

      if (game.meta.active) {

        let found = funcs.checkIfUserIDInGame( req.user.id, game );

        if (!found && !funcs.checkIsFull(game)) {
          game.meta.players.push({ id:req.user.id, name:req.user.username });
          game.meta.status = ( funcs.checkIsFull(game) ? 'ready' : 'pending' );
          game.meta.updated = new Date;
          game.save( function(err) {
            if (err) throw err;

            req.flash('lobbyMessage', 'You have joined a game.');
            res.redirect('/lobby');

          });
        } else {

          req.flash( 'lobbyMessage', "You've already joined this game!" );
          res.redirect('/lobby');

        }
      }

    });
  });

  // LEAVE PAGE
  app.post('/leave', isLoggedIn, function(req,res) {
    games = tools.models.Game.findById(req.body.gameid, function(err,game) {
      if (err) throw err;
      if (game.meta.active) {

        let found = funcs.checkIfUserIDInGame( req.user.id, game );
        if (found) {
          if (game.meta.status!=='in-progress') {

            let newlist = [];
            for (let p=0; p<game.meta.players.length; p++) {
              if (game.meta.players[p].id.toString()!==req.user.id.toString()) {
                newlist.push( game.meta.players[p] );
              }
            }
            game.meta.players = newlist;
            game.meta.status = ( funcs.checkIsFull(game) ? 'ready' : 'pending' );
            game.meta.updated = new Date;
            game.save( function(err) {
              if (err) throw err;

              req.flash('lobbyMessage', 'You have joined a game.');
              res.redirect('/lobby');
            });

          } else {
            req.flash('lobbyMessage', "You can't leave a game once it starts!  Try quitting instead");
            res.redirect('/lobby');
          }
        } else {
          req.flash('lobbyMessage', "You can't leave a game you haven't joined!");
          res.redirect('/lobby');
        }

      }
    });
  });

  // LAUNCH PAGE
  app.post('/launch', isLoggedIn, function(req,res) {
    games = tools.models.Game.findById(req.body.gameid, function(err,game) {
      if (err) throw err;
      if (game.meta.active) {

        let found = funcs.checkIfUserIDInGame( req.user.id, game );
        if (found) {
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
    games = tools.models.Game.findById(req.body.gameid, function(err,game) {
      if (err) throw err;
      if (game.meta.author.id.toString()===req.user.id.toString() || req.user.isAdmin) {
        game.remove( function(err,game) {
          if (err) throw err;
          console.log( 'User',req.user.username,'deleted game',req.body.gameid );
          req.flash('lobbyMessage', 'Deleted a game.');
        });
      } else {
        req.flash( 'lobbyMessage', 'Only the owner can delete this game.' );
      }
      res.redirect('/lobby');
    });
  });

  // NEWGAME PAGES
  app.post('/newgame', isLoggedIn, function(req,res) {

    tools.models.Game.find({ "meta.author" : { "id" : req.user.id, "name" : req.user.username } }, function(err,games) {
      if(err) throw err;

      if (games.length < 10 || req.user.isAdmin) {

        var game = new tools.models.Game();
        game.meta = { // from the SESSION
          author: {
            id : req.user._id,
            name : req.user.username
          },
          players: [{
            id:req.user._id,
            name:req.user.username
          }],
          active: true,
          created: new Date,
          publiclyViewable: (req.body.publiclyViewable === 'on'),
          waitfor: { id:'', name:'' }
        };
        game.settings = { // from the POST
          scenario: req.body.scenario,
          victoryPointsGoal: req.body.victoryPointsGoal,
          numHumans: req.body.numHumans,
          numCPUs: req.body.numCPUs,
          portStyle: req.body.portStyle,
          tileStyle: req.body.tileStyle
        };
        game.state = funcs.initGameStateNoPlayers(req.body, function(State) {

          // save gameid to the session
          req.session.gameid = game._id;

          // save the user
          game.meta.status = ( funcs.checkIsFull(game) ? 'ready' : 'pending' );
          game.meta.updated = new Date;
          game.state = State;
          game.save( function(err) {
            if (err) throw err;

            //console.log(req.body);
            //console.log(game.meta);
            req.flash('lobbyMessage', 'Your game has been created.');
            res.redirect('/lobby');

          });

        });

      } else {

        req.flash('lobbyMessage', 'Cannot create new game: limit reached.');
        res.redirect('/lobby');

      }

    });

  });

  // PLAY PAGES
  app.get('/play/:gameid', isLoggedIn, function(req,res) {

    tools.models.Game.findById( req.params.gameid, function(err,game) {

      if (err) throw err;

      if (!game) {
        req.flash('lobbyMessage', 'Unable to find game ' + req.params.gameid );
        res.redirect('/lobby');
      }

      if (funcs.checkIfUserIDInGame( req.user.id, game ) || req.user.isAdmin) {
        game.getDataForUser( req.user._id, function(data) {

          res.render('play.ejs', {
            message: req.flash('playMessage'),
            user: req.user,
            svg: funcs.prepareForSvg( data ),
            data: data
          });

        });
      } else {
        req.flash( 'lobbyMessage', 'You need to join the game before you can play it!' );
        res.redirect( '/lobby' );
      }

    });
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

  // PROFILE PAGE
  app.get('/profile', isLoggedIn, function(req,res) {
    res.render('profile.ejs', {
      message: req.flash('profileMessage'),
      user: req.user
    })
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

  req.flash('profileMessage', "You're already logged in!");
  res.redirect('/lobby');
}
