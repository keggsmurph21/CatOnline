// load stuff
const funcs = require('./funcs');
const lobby = require('./logic/lobby');
const logic = require('./logic/logic');
const config= require('./logic/init');

// api token stuff
const apiSecret = 'api-secret-69';
const jwt       = require('jsonwebtoken');
//const authenticateAPI = require('express-jwt')({secret : apiSecret});
const authenticateAPI = function(req,res,next) {
  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, apiSecret, function(err, decoded) {
      if (err)
        return res.status(401).json({ success: false, message: 'Failed to authenticate token.' });

      // if everything is good, save to request for use in other routes
      req.token = decoded;
      next();
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    });
  }
}

// app/routes.js
module.exports = function(app, passport) {

  app.get('/.well-known/acme-challenge/DYvcG5J-RSVY7_YlEOUjU9R4miAKWBtMcGaWl2y8diA', (req, res) => {
    res.send('DYvcG5J-RSVY7_YlEOUjU9R4miAKWBtMcGaWl2y8diA.6hXgxEs2WZWPOb4c4dj-Jo_cpcW10BizUWfwti3eHKA');
  })


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

  app.post('/api/login', passport.authenticate('api-login', { session: false }), function(req,res) {
    req.token = jwt.sign({ id : req.user.id }, apiSecret);
    res.json({
      user: req.user,
      token:req.token
    });
  });
  app.get('/api/lobby', authenticateAPI, function(req,res) {
    lobby.get(function(err, data) {
      if (err) throw err;
      res.json(data);
    });
  });
  app.post('/api/lobby', authenticateAPI, function(req,res) {
    lobby.post(req.token.id, req.body, function(err, data) {
      console.log('body', req.body)
      if (err) throw err;

      res.json(data);
    });
  });

  // PLAY PAGES
  app.get('/play/:gameid', funcs.isLoggedIn, function(req,res) {
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
