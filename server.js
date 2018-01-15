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
var bodyParser    = require('body-parser');
var session       = require('express-session');

var configDB      = require('./config/database.js');

// configuration
mongoose.connect(configDB.url);

require('./config/passport.js')(passport);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser());

app.set('view engine', 'ejs');

app.use(session({ secret: 'testsecret', key: 'express.sid' }));
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

// handle sockets
var socket = io.listen(server);
socket.sockets.on('connection', function() {
  console.log( 'a socket connected');
})
