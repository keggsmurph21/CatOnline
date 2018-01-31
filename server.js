// server.js

// setup
var express       = require('express');
var app           = express();
var port          = process.env.PORT || 3000;
var mongoose      = require('mongoose');
var passport      = require('passport');
var flash         = require('connect-flash');

var http          = require('http');
var io            = require('socket.io');

var morgan        = require('morgan');
var cookieParser  = require('cookie-parser');
var sioCookieParser=require('socket.io-cookie-parser');
var bodyParser    = require('body-parser');
var session       = require('express-session');

var configDB      = require('./config/database.js');

var sessionStore   = new express.session.MemoryStore();

// configuration
mongoose.connect(configDB.url, function(err) {
  if (err) console.log(err);
});

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
var server = http.createServer(app).listen(port, function() {
  console.log( 'Express server listening on port ' + port );
})

// setup sockets
var sio = io.listen(server);
sio.use(sioCookieParser());

// handle socket requests
require('./game/sockets.js')(sio, sessionStore);
