// game/sockets.js
var tools = require('../app/tools.js');
var funcs = require('./funcs.js');

module.exports = function(sio, sessionStore) {

  var numUsersByPage = { 'lobby':0 };

  sio.set( 'authorization', function(handshake, next) {

    // probably want to do more authentication here
    if (handshake.headers.cookie) {

      // for some reason we're getting issues parsing the cookie correctly
      handshake.sessionID = handshake.cookies['express.sid'].substring(2,34);
      sessionStore.get(handshake.sessionID, function (err, session) {

        if (err || !session) {

          // if we cannot grab a session, turn down the connection
          next('Error', false);

        } else {

          // make sure we know which page this socket is connecting from
          if (handshake.headers.referer.includes( '/lobby' )) {
            handshake.ref = 'lobby';
          } else if (handshake.headers.referer.includes( '/play' )) {
            handshake.ref = 'play';
          }

          // save the session data and accept the connection
          handshake.session = session;
          next(null, true);

        }
      });

    } else {
      return next( 'No cookie transmitted', false );
    }
  });

  sio.sockets.on('connection', function (socket) {

    var req = socket.request;
    socket.join( req.ref );

    numUsersByPage[req.ref] = numUsersByPage[req.ref]+1 || 1;

    /*// setup an inteval that will keep our session fresh
    var intervalID = setInterval(function () {
      // reload the session (just in case something changed,
      // we don't want to override anything, but the age)
      // reloading will also ensure we keep an up2date copy
      // of the session with our connection.

      /* this isn't working
      req.session.reload( function () {
        // "touch" it (resetting maxAge and lastAccess)
        // and save it back again.
        req.session.touch().save();
      });
    }, 60 * 1000);*/

    games = tools.models.Game.find({}, function(err,games) {
      if (err) throw err;

      funcs.prepareForLobby( req.session.user, games, function(games) {
        console.log('User ' + req.session.userid + ' connected to ' + req.ref + ' (' + numUsersByPage[req.ref] + ' total)');
        console.log( req.session );
        socket.broadcast.to(req.ref).emit('new connection', {
          username: req.session.user,
          userid: req.session.userid,
          numUsers: numUsersByPage[req.ref],
          games: games
        });
        socket.emit('on connection', {
          username: req.session.user,
          userid: req.session.userid,
          numUsers: numUsersByPage[req.ref],
          games: games
        });

      });


    });

    socket.on('disconnect', function() {
      numUsersByPage[req.ref]--;
      console.log('User ' + req.session.userid + ' disconnected from ' + req.ref + ' (' + numUsersByPage[req.ref] + ' total)');
      // clear the socket interval to stop refreshing the session
      //clearInterval(intervalID);

      socket.broadcast.to(req.ref).emit('end connection', {
        username: req.session.user,
        userid: req.session.userid,
        numUsers: numUsersByPage[req.ref]
      });
    });

    socket.on('new message', function(data) {

      // check if data begins with "!!" and if emitting user is an admin
      // if so then execute it as a command

      socket.broadcast.to(req.ref).emit('new message', {
        username: req.session.user,
        userid: req.session.userid,
        message: data
      });
    });

  });



    // COPIED STUFF BELOW
    /*

    var addedUser = false;

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
      // we tell the client to execute 'new message'
      socket.broadcast.emit('new message', {
        username: socket.username,
        message: data
      });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (username) {
      if (addedUser) return;

      // we store the username in the socket session for this client
      socket.username = username;
      ++numUsers;
      addedUser = true;
      socket.emit('login', {
        numUsers: numUsers
      });
      // echo globally (all clients) that a person has connected
      socket.broadcast.emit('user joined', {
        username: socket.username,
        numUsers: numUsers
      });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function () {
      socket.broadcast.emit('typing', {
        username: socket.username
      });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function () {
      socket.broadcast.emit('stop typing', {
        username: socket.username
      });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
      if (addedUser) {
        --numUsers;

        // echo globally that this client has left
        socket.broadcast.emit('user left', {
          username: socket.username,
          numUsers: numUsers
        });
      }
    });
  });*/

};
