'use strict';

const fs = require('fs');
const net = require('net');
const path = require('path');
const api = require('./api');
const jwt = require('jsonwebtoken');
const config = require('../logic/init');
const lobby = require('../logic/lobby');
const logic = require('../logic/logic');

const apiSecret = process.env.API_SECRET || 'default';
const socketPath = process.env.CATONLINE_UDP_SOCKET;

const authenticate = (token, next) => {
  if (token) {
    jwt.verify(token, apiSecret, function(err, decoded) {
      if (err)
        return next('Invalid token', null);
      return next(null, decoded);
    });
  } else {
    return next('No token provided', null);
  }
};

const login = (passport, req, next) => {
  passport.authenticate('api-login', { session: false }, function(err, user, message) {
    if (err)
      return next(err.message, null);
    if (!user)
      return next(message, null);
    return next(null, user);
  })(req, null, next);
}

module.exports = function(app, passport) {

  // only init UDP for local
  if (process.env.APP !== 'local')
    return null

  log.udp.info(`initializing UDP socket server at ${socketPath}`);

  if (fs.existsSync(socketPath)) {
    log.udp.info(`found existing socket, removing ...`);
    fs.unlinkSync(socketPath);
  }

  app.udp = net.createServer((client) => {
    log.udp.info(`client connected`);

    client.on('data', (data) => {
      data = JSON.parse(data.toString());

      let location = data.location;
      log.udp.info(`received data: ${JSON.stringify(data)}`);

      app.post('/api/login', passport.authenticate('api-login', { session: false }), function(req,res) {
        req.token = jwt.sign({ id : req.user.id }, apiSecret);
        res.json({
          user: req.user,
          token:req.token,
          config: config.getNewGameForm()
        });
      });

      switch (data.location) {
        case 'login':
          login(passport, data, function(message, user) {
            if (user) {

              // success
              const token = jwt.sign({ id : user.id }, apiSecret);
              let response = JSON.stringify({
                user: user,
                token: token,
                config: config.getNewGameForm()
              });
              log.udp.info(`response: ${response}`);
              return client.write(response);
            }

            // error, no user found
            let response = JSON.stringify(message);
            log.udp.info(`response: ${response}`);
            return client.write(JSON.stringify(message));
          });
          break;
        case 'lobby':
          authenticate(data.token, function(err, token) {
            if (err) throw err;
            if (data.body) {
              lobby.post(token.id, data.body, function(err, data) {
                console.log('body', data.body)
                if (err) throw err;

                // success
                return client.write(JSON.stringify(data));
              });
            } else {
              lobby.get(function(err, data) {
                if (err) throw err;

                // success
                return client.write(JSON.stringify(data));

              });
            }
          });
          break;
        case 'play':
          break;
        default:
          throw new APIError(`Unrecognized packet location: ${data.location}.`);
      }
    });

  });

  app.udp.listen(socketPath, () => {
    log.udp.info(`UDP server listening at ${socketPath}`);
  });


/*
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
*/
}
