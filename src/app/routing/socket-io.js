// game/sockets.js
const funcs = require('../funcs');
const lobby = require('../logic/lobby');
const logic = require('../logic/logic');

// socket helper functions
function socketHandleNewConnection(socket) {

  let req = socket.request;

  socket.join( req.ref );
  numUsersByPage[req.ref] = numUsersByPage[req.ref]+1 || 1;
  console.log(`User ${req.session.user.name} connected to ${req.ref} (${numUsersByPage[req.ref]} total)`);

  let response = {
    user : req.session.user,
    numUsers: numUsersByPage[req.ref]
  };

  // broadcast out (to other clients)
  socket.broadcast.to('admin').emit('new connection', response);
  socket.broadcast.to('lobby').emit('new connection', response);

  // emit back (to original client)
  socket.emit('on connection', response);

}





var numUsersByPage = {};

module.exports = function(io, sessionStore) {

  io.set( 'authorization', function(handshake, next) {

    // probably want to do more authentication here
    if (handshake.headers.cookie) {

      // for some reason we're getting issues parsing the cookie correctly
      handshake.sid = handshake.cookies['express.sid'].substring(2,34);
      sessionStore.get(handshake.sid, function (err, session) {
        if (err || !session) { // if we cannot grab a session, turn down the connection
          next('Socket authorization error: cannot find session.', false);
        } else {
          if (session.user) { // only accept sessions w/ authenticated users

            handshake.session = session;

            // make sure we know which page this socket is connecting from
            let referer = handshake.headers.referer;
            console.log(referer);
            if (referer.includes( '/lobby' )) {
              handshake.ref = 'lobby';
              handshake.url = referer;
            } else if (referer.includes( '/play' )) {
              let gameid = referer.slice(referer.indexOf('play'));
              gameid = gameid.split('/')[1];
              handshake.session.gameid = gameid;
              handshake.ref = `${gameid}-authorization`;
              handshake.url = referer;
            } else if (referer.includes( '/admin' )) {
              handshake.ref = 'admin';
              handshake.url = referer;
            }

            // save the session data and accept the connection
            handshake.session = session;
            next(null, true); // SUCCESS

          } else {
            next( 'Socket authorization error: no user data', false );
          }
        }
      });
    } else {
      return next( 'Socket authorization error: no cookie transmitted', false );
    }

  });

  io.sockets.on('connection', function (socket) {

    let req = socket.request;

    socketHandleNewConnection( socket );

    socket.on('disconnect', function() {
      numUsersByPage[req.ref]--;
      console.log('User ' + req.session.user.name + ' disconnected from ' + req.ref + ' (' + numUsersByPage[req.ref] + ' total)');

      socket.broadcast.to(req.ref).emit('end connection', {
        user : req.session.user,
        numUsers: numUsersByPage[req.ref]
      });
    });

    socket.on('new message', function(data) {
      funcs.log( 'user '+req.session.user.name+'~'+req.session.user.id+' sent "'+data+'" to '+req.ref );

      log.debug( `message from ${req.session.user.name} to ${req.ref}: ${data}`, 'messages' );

      let room = (req.ref.indexOf('_')>-1 ? req.msock : req.ref);
      socket.broadcast.to(room).emit('new message', {
        user : req.session.user,
        message: data
      });
    });

    socket.on('lobby connect', function() {

      console.log('LOBBY CONNECT');

      lobby.get(function(err, response) {
        if (err) console.log('ERROR!',err);

        response.user = req.session.user;
        socket.emit( 'lobby connect', response );
        console.log('RESPONSE', response);
      });

    });

    socket.on('lobby action', function(data) {

      console.log('received lobby action',data);
      funcs.requireUserById(req.session.user.id, function(err,user) {
        funcs.requireGameById(data.args.gameid, function(err, game) {

          lobby.do(user, game, data, function(response) {

            console.log('lobby do callback', response);
            socket.broadcast.to('lobby').emit( 'lobby callback', response );
            socket.broadcast.to('admin').emit( 'lobby callback', response );
            socket.emit( 'lobby callback', response);

          });
        });
      });
    });

    socket.on('admin action', function(data) {

      console.log('received admin action',data);
      funcs.requireUserById( req.session.user.id, function(err,user) {
        if (err) throw new LobbyLogicError();

        lobby.sudo(user, data, function(response) {

          socket.broadcast.to('admin').emit( 'admin callback', response );
          socket.emit( 'admin callback', response);

        });
      });
    });

    socket.on('play connect', function(data) {

      funcs.requireGameById(req.session.gameid, function(err,game) {
        socket.leave(req.ref);
        req.session.p = game.getPlayerIDByUser(req.session.user);
        req.ref = `${req.session.gameid}_${req.session.p}`;
        socket.join(req.ref);
        req.msock = req.ref.slice(0,req.ref.indexOf('_'));
        socket.join(req.msock);

        socket.emit('play connect', {
          public: game.getPublicGameData(),
          private:game.getPrivateGameData(req.session.p)
        });
      });
    });

    socket.on('play action', function(data) {

      console.log('received play action',data);
      log.debug( `received play action from ${req.session.user.name}: ${JSON.stringify(data)}`, 'play' );

      funcs.requireGameById(req.session.gameid, function(err,game) {
        if (err) throw err;

        try {
          let args= logic.validate(game, data.player, data.edge, data.args);
          let ret = logic.execute( game, data.player, data.edge, args);

          funcs.saveAndCatch(game, function(err) {
            if (err) throw err;

            for (let p=0; p<game.state.players.length; p++) {
              let response = {
                player  : data.player,
                edge    : data.edge,
                success : true,
                messages: ret.messages,
                ret     : ret.ret,
                game    : {
                  public: game.getPublicGameData(),
                  private:game.getPrivateGameData(p)
                }
              };
              log.debug( `play action response for ${req.session.user.name}: ${ret.ret}`, 'play' );
              log.debug( `play action messages for ${req.session.user.name}: ${JSON.stringify(ret.messages)}`, 'play' );

              if (p === req.session.p) {
                socket.emit('play callback', response)
              } else {
                socket.broadcast.to(`${req.session.gameid}_${p}`)
                  .emit( 'play callback', response );
              }
            }
          });
        } catch (e) {
          log.debug( `play action error for ${req.session.user.name}: ${e}`, 'play' );

          if (e instanceof UserInputError) {
            socket.emit('play callback', {
              player  : data.player,
              edge    : data.edge,
              success : false,
              message : e.message
            });

          } else { throw e; }
        }
      });
    });

    socket.on('profile action', function(data) {
      console.log('received profile action');
      console.log(data);
    });

  });

};

// COPIED STUFF BELOW
/*
// setup an inteval that will keep our session fresh
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
  }, 60 * 1000);
  // clear the socket interval to stop refreshing the session
  //clearInterval(intervalID);


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
