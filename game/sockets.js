// game/sockets.js

module.exports = function(sio, sessionStore) {

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
    console.log('User ' + req.session.userid + ' connected to ' + req.ref);
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
      }); */
    }, 60 * 1000);

    socket.on('disconnect', function () {
      console.log('User ' + req.session.userid + ' disconnected from ' + req.ref);
      // clear the socket interval to stop refreshing the session
      clearInterval(intervalID);
    });
  });

};
