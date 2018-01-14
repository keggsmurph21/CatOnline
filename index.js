// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

// Setup log file
server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Setup database
var mongoose = require('mongoose');
mongoose.connect( 'mongodb://localhost/test' );

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log( 'database connection established' );

  var UserSchema = new mongoose.Schema({
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
    },
    passwordConf: {
      type: String,
      required: true,
    }
  });
  var User = mongoose.model('User', UserSchema);
  module.exports = User;
  /*
  var kittySchema = mongoose.Schema({
      name: String
  });
  kittySchema.methods.speak = function() {
    var greeting = this.name
      ? "Meow name is " + this.name
      : "I don't have a name";
    console.log(greeting);
  }
  var Kitten = mongoose.model('Kitten', kittySchema);
  var silence = new Kitten({ name: 'Silence' });
  var fluffy = new Kitten({ name: 'fluffy' });
  fluffy.save(function (err, fluffy) {
    if (err) return console.error(err);
    fluffy.speak();
  });*/
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

/*
// Setup postgreSQL DB
var pg = require('pg');

app.get('/db', function (request, response) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM test_table', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.render('pages/db', {results: result.rows} ); }
    });
  });
});*/

// Setup GameCollection object to hold currently active games
var GameCollection = new function() {
  this.totalGameCount = 0;
  this.gameList = {};
}

io.sockets.on('connection', function(socket) {

});
