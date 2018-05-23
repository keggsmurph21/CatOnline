'use strict';

// setup
const funcs         = require('./funcs');
const express       = require('express');
const mongoose      = require('mongoose');
const passport      = require('passport');
const flash         = require('connect-flash');
const http          = require('http');
const io            = require('socket.io');
const ip            = require('ip');
const morgan        = require('morgan');
const cookieParser  = require('cookie-parser');
const sioCookieParser=require('socket.io-cookie-parser');
const bodyParser    = require('body-parser');
const session       = require('express-session');
const sessionStore  = new express.session.MemoryStore();

// configuration
const port   = process.env.APP_PORT   || 49160;
const secret = process.env.APP_SECRET || 'default';
require('./errors');
require('./logger');
require('./config/passport')(passport);
require('./config/database');

// express setup
const app = express();
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', './src/app/views');
app.use(session({
  store:  sessionStore,
  secret: secret,
  key: 'express.sid',
  saveUninitialized: true,
  resave: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// routes
require('./routing/web')(app, passport);
require('./routing/api')(app, passport);
require('./routing/udp-socket')(app, passport);
app.use(express.static(__dirname + '/public'));

// launch server
const server = http.createServer(app).listen(port, function() {
  log.app.info(`express server listening on port ${port}`)
});

// setup socket-io
const sio = io.listen(server);
sio.use(sioCookieParser());
require('./routing/socket-io')(sio, sessionStore);
