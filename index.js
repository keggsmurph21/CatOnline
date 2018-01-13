// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function() {
  console.log('Server listening at port %d', port);
});

// Setup postgreSQL DB
var pg = require('pg');
var pool = new pg.Pool();

app.get('/db', function (request, response) {
  pool.connect(function(err, client, done) {
    client.query('SELECT * FROM test_table', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.render('pages/db', {results: result.rows} ); }
    });
  });
});

pool.end()

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

var numUsers = 0

io.sockets.on('connection', function(socket) {

 console.log('a new client connected');
 var addedUser = false;

 socket.on('new message', function(data) {
   socket.broadcast.emit('new message', {
     username: socket.username,
     message: data
   });
 });

  socket.on('add user', function(username) {
    if (addedUser) return;

    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });

    socket.broadcast.emit('user joined', {
        username: socket.username,
        numUsers: numUsers
    });
  });

  socket.on('typing', function() {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  socket.on('stop typing', function() {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  socket.on('disconnect', function() {
    if (addedUser) {
      --numUsers;

      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });

});
