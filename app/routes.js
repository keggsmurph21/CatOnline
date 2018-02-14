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
  app.get('/lobby/:gameid', isLoggedIn, function(req,res) {
    // reqs.params.gameid
    games = tools.models.Game.findById(req.params.gameid, function(err,game) {
      if (err) throw err;

      console.log(game);
      if (game.meta.active) {

        let found = false;
        for (let p=0; p<game.meta.players.length; p++) {
          if (game.meta.players[p].name === req.user.username) {
            found = true;
          }
        }

        if (!found && game.meta.players.length < game.settings.numHumans) {
          game.meta.players.push({ id:req.user.id, name:req.user.username });
          game.save( function(err) {
            if (err) throw err;

            req.flash('lobbyMessage', 'You have joined a game.');
            res.redirect('/lobby');

          });
        }
      }

    });
  });
  app.get('/lobby', isLoggedIn, function(req,res) {
    games = tools.models.Game.find({}, function(err,games) {
      if (err) throw err;

      stripDataForLobby( req.user, games, function(data) {

        res.render('lobby.ejs', {
          message: req.flash('lobbyMessage'),
          user: req.user,
          games: data
        });

      });
    });
  });

  // JOIN PAGE
  app.post('/join', isLoggedIn, function(req,res) {
    games = tools.models.Game.find( {}, function(err,games) {
      if (err) throw err;

      stripDataForLobby( games, function(data) {

        res.render('lobby.ejs', {
          message: 'attempting to join a game',
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
      players: [{
        id:req.user._id,
        name:req.user.username
      }],
      active: true,
      created: new Date,
      publiclyViewable: (req.body.publiclyViewable === 'on')
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

        console.log(req.body);
        console.log(game.meta);
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

// only pass relevant information to the lobby.ejs page for each game
function stripDataForLobby(user, games,callback) {
  data = { 'current':[], 'available':[] };
  for (let g=0; g<games.length; g++) {
    datum = {
      _id      : games[g]._id,
      scenario : games[g].settings.scenario,
      numHumans: games[g].settings.numHumans,
      numCPUs  : games[g].settings.numCPUs,
      players  : games[g].meta.players,
      author   : games[g].meta.author.name,
      VPs      : games[g].settings.victoryPointsGoal,
      turn     : games[g].state.public.turn,
      created  : tools.formatDate( games[g].meta.created ),
      updated  : tools.formatDate( games[g].meta.updated )
    }
    //console.log( games[g].meta );
    //console.log( datum );
    //console.log({id:user.id, name:user.username});
    if (games[g].meta.active) {
      let found = false;
      for (let p=0; p<games[g].meta.players.length; p++) {
        if (games[g].meta.players[p].name === user.username) {
          data.current.push( datum );
          found = true;
        }
      }
      if (!found) {
        if (datum.players.length < datum.numHumans && games[g].meta.publiclyViewable) {
          data.available.push( datum );
        }
      }
    }
  }
  callback(data);
}
