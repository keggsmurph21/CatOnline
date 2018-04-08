// server.js

// setup
const funcs         = require('./app/funcs.js');
const express       = require('express');
const app           = express();
const port          = process.env.PORT || 3000;
const mongoose      = require('mongoose');
const passport      = require('passport');
const flash         = require('connect-flash');

const http          = require('http');
const io            = require('socket.io');

const morgan        = require('morgan');
const cookieParser  = require('cookie-parser');
const sioCookieParser=require('socket.io-cookie-parser');
const bodyParser    = require('body-parser');
const session       = require('express-session');

const configDB      = require('./config/database.js');

const sessionStore   = new express.session.MemoryStore();

// configuration
require('./app/errors');
require('./config/logger.js');
configDB.config( mongoose, funcs );
require('./config/passport.js')(passport);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser());

app.set('view engine', 'ejs');

app.use(session({
  store:  sessionStore,
  secret: 'testsecret',
  key: 'express.sid'
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// routes
require('./app/routes.js')(app, passport);
app.use(express.static(__dirname + '/public'));

// launch server
const server = http.createServer(app).listen(port, function() {
  console.log( 'Express server listening on port ' + port );
  funcs.log( 'Express server listening on port '+port );
})

// setup sockets
const sio = io.listen(server);
sio.use(sioCookieParser());

// handle socket requests
require('./app/sockets.js')(sio, sessionStore);
