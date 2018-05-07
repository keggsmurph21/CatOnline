'use strict';

// load stuff
const funcs = require('../funcs');
const lobby = require('../logic/lobby');
const config= require('../logic/init');

// api token stuff
const jwt       = require('jsonwebtoken');
const apiSecret = process.env.API_SECRET || 'default';
const authenticate = (req,res,next) => {
  // check header or url parameters or post parameters for token
  const token = req.body.token || req.query.token || req.headers['x-access-token'];

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

    // if there is no token return an error
    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    });
  }
};

// app/routes.js
module.exports = function(app, passport) {

  app.post('/api/login', passport.authenticate('api-login', { session: false }), function(req,res) {
    req.token = jwt.sign({ id : req.user.id }, apiSecret);
    res.json({
      user: req.user,
      token:req.token,
      config: config.getNewGameForm()
    });
  });
  app.get('/api/lobby', authenticate, function(req,res) {
    lobby.get(function(err, data) {
      if (err) throw err;
      res.json(data);
    });
  });
  app.post('/api/lobby', authenticate, function(req,res) {
    lobby.post(req.token.id, req.body, function(err, data) {
      console.log('body', req.body)
      if (err) throw err;

      res.json(data);
    });
  });

};
