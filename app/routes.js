// load stuff
var aSync = require('async');
var tools = require('../app/tools.js');
var funcs = require('../game/funcs.js');

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

      res.render('lobby.ejs', {
        message: req.flash('lobbyMessage'),
        user: req.user,
        games: games
      });

    });
  });

  // NEWGAME PAGES
  app.get('/newgame', isLoggedIn, function(req,res) {

    tools.models.Config.findOne( {}, function(err,config) {
      if (err) throw err;

      res.render('newgame.ejs', {
        message: req.flash('newgameMessage'),
        user: req.user,
        config: config.toJSON()
      });

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
      scenario: req.body.scenarios,
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

    console.log( 'game : ' + req.params.gameid );
    console.log( 'user : ' + req.user._id);
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
          data: data
        });

      });
    });
  });

  // LOGIN PAGES
  app.get('/login', function(req,res) {
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

  // SIGNUP PAGES
  app.get('/signup', function(req,res) {
    res.render('signup.ejs', {
      message: req.flash('signupMessage'),
      user: req.user
    });
  });
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/lobby',
    failureRedirect : '/signup',
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

  req.flash('homepageMessage', 'You must be logged this page!');
  res.redirect('/');

}
