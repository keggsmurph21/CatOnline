'use strict';

// load stuff
const funcs = require('../funcs');
const config= require('../logic/init');


// web routing middleware
const isLoggedIn = (req,res,next) => {
  // route middleware to make sure user is logged in
  if (req.isAuthenticated()) {
    req.user = req.user;
    return next();
  }

  // 403
  req.flash('loginMessage', 'You must be logged in to view this page!');
  res.redirect('/login');

};
const notLoggedIn = (req,res,next) => {
  // route middleware to disallow login page to those already logged in

  if (!req.isAuthenticated()) {
    return next();
  }

  req.flash('lobbyMessage', "You're already logged in!");
  res.redirect('/lobby');

};



// app/routes.js
module.exports = function(app, passport) {

  app.get('/jqjo-gEFKp9PTWrcSkUvGGWoq5LYKSvBeJjI_PrptzU', (req, res) => {
    res.send('jqjo-gEFKp9PTWrcSkUvGGWoq5LYKSvBeJjI_PrptzU.6hXgxEs2WZWPOb4c4dj-Jo_cpcW10BizUWfwti3eHKA');
  })

  // LOBBY PAGE
  app.get('/lobby', isLoggedIn, function(req,res) {
    res.render('lobby.ejs', {
      message: req.flash('lobbyMessage'),
      user: req.user,
      //games: data,
      config: config.getNewGameForm()
    });
  });

  app.get('/dev', function(req,res) {
    funcs.requireGameById( '5a9b2b85b375470058ae4142', function(err,game) {
      if (err) {
        req.flash('lobbyMessage', 'Error loading development environment');
        res.redirect('/lobby');
      } else {
        res.render('dev.ejs', {
          message: req.flash('devMessage'),
          user: null,
          public: game.getPublicGameData(),
          private: null
        });
      }
    });
  });

  // PLAY PAGES
  app.get('/play/:gameid', isLoggedIn, function(req,res) {
    funcs.requireGameById(req.params.gameid, function(err,game) {
      if (err) {
        req.flash('lobbyMessage', 'Unable to find game ' + req.params.gameid );
        res.redirect('/lobby');
      } else if (game.state.status==='in-progress' && (funcs.checkIfUserInGame( req.user, game ) || req.user.isAdmin) ) {

        let playerID = game.getPlayerIDByUser(req.user);
        res.render('play.ejs', {
          message:  req.flash('playMessage'),
          user:     req.user,
          public:   game.getPublicGameData(),
          private:  (playerID===null ? null : game.getPrivateGameData(playerID))
        });

      } else {
        req.flash( 'lobbyMessage', 'Game could not be played.' );
        res.redirect('/lobby');
      }
    });
  });

  // ADMIN PAGES
  app.get('/admin', funcs.isAdmin, function(req,res) {
    res.render('admin.ejs', {
      user: req.user,
      message: req.flash( 'adminMessage' )
    });
  });

  // LOGIN PAGES
  app.get('/login', notLoggedIn, function(req,res) {
    res.render('login.ejs', {
      message: req.flash('loginMessage'),
      user: req.user
    });
  });
  app.post('/login', passport.authenticate('web-login', {
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
  app.post('/register', passport.authenticate('web-signup', {
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
