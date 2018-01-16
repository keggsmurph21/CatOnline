// load stuff
var funcs = require('../game/logic/funcs.js');
var Game = require('../app/models/game.js');
var User = require('../app/models/user.js');
var Options = require('../app/models/options.js');
var Settings = require('../app/models/settings.js');

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
    Game.find( {}, function(err,games) {
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
    Options.findOne({ "availableRulesSets" : {$exists:true} }, function(err, options) {
      if (err) throw err;

      Settings.findOne({ "availableRulesSets" : {$exists:false} }, function(err, settings) {
        if (err) throw err;

        res.render('newgame.ejs', {
          message: req.flash('newgameMessage'),
          user: req.user,
          options: options.availableRulesSets,
          defaultSetting: options.availableRulesSets.default,
          settings: settings
        });

      });
    });
  });
  app.post('/newgame', isLoggedIn, function(req,res) {
    var newGame = new Game();

    newGame.meta = {
      author: {
        id : req.user._id,
        name : req.user.username
      },
      players: [req.user._id],
      active: true,
      created: new Date,
      updated: new Date,
    };

    newGame.settings = {
      rules: req.body.rules,
      victoryPointsGoal: req.body.victoryPointsGoal,
      humans: req.body.humans,
      CPUs: req.body.CPUs,
      portStrategy: req.body.portStyle,
      resourceStrategy: req.body.resourceSetup
    };

    console.log( funcs.initGameStateNoPlayers );
    newGame.state = new funcs.initGameStateNoPlayers(req.body.rules);

    // save gameid to the session
    req.session.game = newGame._id;

    // save the user
    newGame.save(function(err) {
      if (err) throw err;

      req.flash('lobbyMessage', 'Your game has been created.');
      res.redirect('/lobby');

    });

  })

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

// database queries
function queryDB( collection, query, callback ) {
  mongoose.connection.db.collection( collection, function(err, collection) {
    collection.find(query).toArray(callback);
  });
}
