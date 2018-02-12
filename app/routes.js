// load stuff
var aSync = require('async');
var tools = require('./tools.js');
var funcs = require('../game/funcs.js');
var config= require('../config/scenario.json');

// app/routes.js
module.exports = function(app, passport) {

  // HOME PAGE
  app.get('/', function(req, res) {
    res.render('index.ejs', {
      message: req.flash('homepageMessage'),
      user: req.user
    });
  });

  // LOBBY PAGE
  app.get('/lobby', isLoggedIn, function(req,res) {
    games = tools.models.Game.find( {}, function(err,games) {
      if (err) throw err;

      stripDataForLobby( games, function(data) {

        res.render('lobby.ejs', {
          message: req.flash('lobbyMessage'),
          user: req.user,
          games: data
        });

      });
    });
  });

  // NEWGAME PAGES
  app.get('/newgame', isLoggedIn, function(req,res) {

    res.render('newgame.ejs', {
      message: req.flash('newgameMessage'),
      user: req.user,
      config: config
    });

  });
  app.post('/newgame', isLoggedIn, function(req,res) {

    var game = new tools.models.Game();
    game.meta = { // from the SESSION
      author: {
        id : req.user._id,
        name : req.user.username
      },
      players: [req.user._id],
      active: true,
      created: new Date
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
      game.meta.updated = new Date;
      game.state = State;
      game.save( function(err) {
        if (err) throw err;

        req.flash('lobbyMessage', 'Your game has been created.');
        res.redirect('/lobby');

      });

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

      game.getAccessibleData( req.user._id, function(data) {

        res.render('play.ejs', {
          message: req.flash('playMessage'),
          user: req.user,
          svg: funcs.prepareForSvg( data ),
          data: data
        });

      });
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
  app.post('/register', passport.authenticate('local-register', {
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
};

// route middleware to make sure user is logged in
function isLoggedIn(req,res,next) {

  if (req.isAuthenticated()) {
    return next();
  }

  req.flash('homepageMessage', 'You must be logged in to view this page!');
  res.redirect('/');

}

// route middleware to disallow login page to those already logged in
function notLoggedIn(req,res,next) {

  if (!req.isAuthenticated()) {
    return next();
  }

  req.flash('profileMessage', "You're already logged in!");
  res.redirect('/profile');
}

// only pass relevant information to the lobby.ejs page for each game
function stripDataForLobby(games,callback) {
  data = [];
  for (let g=0; g<games.length; g++) {
    datum = {
      _id      : games[g]._id,
      scenario : games[g].settings.scenario,
      numHumans: games[g].settings.numHumans,
      numCPUs  : games[g].settings.numCPUs,
      author   : games[g].meta.author.name,
      VPs      : games[g].settings.victoryPointsGoal,
      turn     : games[g].state.public.turn,
      created  : tools.formatDate( games[g].meta.created )
    }
    if (games[g].meta.active) {
      data.push( datum );
    }
  }
  callback(data);
}
