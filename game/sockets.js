// game/sockets.js
var tools = require('../app/tools.js');
var funcs = require('./funcs.js');

// socket helper functions
function socketAuthorizationCallback(handshake, sessionStore, next) {
  // probably want to do more authentication here
  if (handshake.headers.cookie) {

    // for some reason we're getting issues parsing the cookie correctly
    handshake.sessionID = handshake.cookies['express.sid'].substring(2,34);
    sessionStore.get(handshake.sessionID, function (err, session) {

      if (err || !session) {

        // if we cannot grab a session, turn down the connection
        next('Error', false);

      } else {

        // only accept sessions w/ authenticated users
        if (session.user) {
          // make sure we know which page this socket is connecting from
          let referer = handshake.headers.referer;
          if (referer.includes( '/lobby' )) {
            handshake.ref = 'lobby';
            handshake.url = referer;
          } else if (referer.includes( '/play' )) {
            handshake.ref = 'play';
            handshake.url = referer;
          } else if (referer.includes( '/admin' )) {
            handshake.ref = 'admin';
            handshake.url = referer;
          }

          // save the session data and accept the connection
          handshake.session = session;
          next(null, true);
        } else {

          next( 'No user data', false );

        }
      }
    });

  } else {
    return next( 'No cookie transmitted', false );
  }
}
function socketHandleNewConnection( socket ) {

  let req = socket.request;

  socket.join( req.ref );
  numUsersByPage[req.ref] = numUsersByPage[req.ref]+1 || 1;
  console.log('User ' + req.session.user.name + ' connected to ' + req.ref + ' (' + numUsersByPage[req.ref] + ' total)');

  // prepare data
  prepareForLobby( req.session.user, function(users,games) {

    let response = {
      user : req.session.user,
      numUsers: numUsersByPage[req.ref],
      games: games,
      users: users
    };

    // broadcast out (to other clients)
    socket.broadcast.to('admin').emit('new connection', response);
    socket.broadcast.to('lobby').emit('new connection', response);

    // emit back (to original client)
    socket.emit('on connection', response);

  });
}
function prepareForLobby(user, next) {
  funcs.prepareUsersData( function(users) {
    funcs.prepareGamesData( user, function(games) {
      next(users,games);
    });
  });
}

// multiple-actionset helper functions
function _DeleteUser(agent, user, next) {
  // takes a user (Model) parameter and tries to delete it,
  // updating all relevant records
  if (user.isSuperAdmin) {
    return next('Superadmin accounts cannot be deleted.' );
  } else {
    funcs.userGetGamesAsPlayer( user, function(err,games) {
      if (err) { next(err); }
      else {
        for (let g=0; g<games.length; g++) {
          _KickUserFromGame(agent, user, games[g], function(err,result) {
            if (err) { next(err); }
            else { next(null, result); } // SUCCESS
          });
        }
      }
    });
    funcs.userGetGamesAsAuthor( user, function(err,games) {
      if (err) next(err);
      for (let g=0; g<games.length; g++) {
        _DeleteGame(agent, user, games[g], function(err,result) {
          if (err) { next(err); }
          else { next(null, result); } // SUCCESS
        });
      }
    });
    user.remove( function(err,user) {
      if (err) return next(err);
      tools.log( 'user '+agent.id+' ('+agent.name+') deleted user '+user.name+'~'+user.id );
      return next(null, { action:'REMOVE', udata:[user], gdata:[] }); // SUCCESS
    });
  }
}
function _DeleteGame(agent, user, game, next) {
  // takes a user (Model) and a game (Model) and attempts to
  // delete the game ... need the user parameter to ensure that
  // the user has correct permissions (not always the same as agent)
  if ( funcs.usersCheckEqual(agent, user) || agent.isSuperAdmin ) {
    user.activeGamesAsAuthor -= 1;
    tools.saveAndCatch(user, function(err) {
      if (err) { next(err); }
      else { next(null, { action:'UPDATE', udata:[user], gdata:[game] }); }
    });
    for (let p=0; p<game.meta.players.length; p++) {
      tools.requireUserById( game.meta.players[p].id, function(err,user) {
        if (err) next(err);
        if (!user) next('Error: unable to find user.');
        user.activeGamesAsPlayer -= 1;
        tools.saveAndCatch(user, function(err) {
          if (err) { next(err); }
          else { next(null, { action:'UPDATE', udata:[user], gdata:[game] }); }
        });
      });
    }
    game.remove( function(err,game) {
      if (err) return next(err);
      tools.log( 'user '+agent.id+' ('+agent.name+') deleted game '+game.id );
      next(null, { action:'UPDATE', udata:[user], gdata:[] });
      next(null, { action:'REMOVE', udata:[], gdata:[game] });
      return;
    });
  } else {
    return next( 'Only superadmins or owners can delete games.' );
  }
}
function _KickUserFromGame(agent, user, game, next) {
  // takes a user (Model) and a game (Model) and attempts to kick the
  // user from that game
  if ( funcs.checkIsActive(game) ) {
    if ( funcs.checkIfUserInGame( user, game ) ) {
      if ( game.meta.status!=='in-progress' ) {
        if ( !funcs.usersCheckEqual( user, game.meta.author ) ) {
          if ( funcs.usersCheckEqual( user, agent ) || agent.isSuperAdmin || !user.isAdmin ) {
            let newlist = [];
            for (let p=0; p<game.meta.players.length; p++) {
              if ( !funcs.usersCheckEqual(game.meta.players[p], user) ) {
                newlist.push( game.meta.players[p] );
              }
            }
            game.meta.players = newlist;
            game.meta.status = ( game.checkIsFull() ? 'ready' : 'pending' );
            game.meta.updated = new Date;
            tools.saveAndCatch(game, function(err) {
              if (err) return next(err);
              user.activeGamesAsPlayer -= 1;
              tools.saveAndCatch(user, function(err) {
                if (err) return next(err);

                // SUCCESS
                funcs.userPushChanges( user, function(err,games) {
                  if (err) return next(err);
                  return next(null, { action:'UPDATE', udata:[user], gdata:[game] });
                });

              });
            });
          } else {
            return next("Unable to leave: only superadmins may perform this operation." )
          }
        } else {
          return next("Unable to leave: this user is the author.  Try deleting instead." );
        }
      } else {
        return next("Unable to leave: you can't leave a game once it starts!  Try quitting instead." );
      }
    } else {
      return next("Unable to leave: you can't leave a game you haven't joined!" );
    }
  } else {
    return next('Unable to leave: game is not active.' );
  }
}

// function actionset for ADMIN ACTION socket events
function tryPromoteUserToAdmin(agent, data, next) {
  // takes a userid and attempts to promote the corresponding user
  if (!agent.isSuperAdmin) return next('Only superadmins can perform this operation.'); // 403
  tools.requireUserById( data.userid, function(err,user) {
    if (err) return next(err);
    if (user.isAdmin) return next('User '+user.name+' is already an admin.' );
    user.isAdmin = true;
    user.isMuted = false;
    tools.saveAndCatch(user, function(err) {
      if (err) return next(err);

      // SUCCESS
      funcs.userPushChanges( user, function(err,games) {
        if (err) next(err);
        return next(null, { action:'UPDATE', udata:[user], gdata:games });
      });

    });
  });
}
function tryDemoteAdminToUser(agent, data, next) {
  // takes a userid and attempts to demote the corresponding user
  if (!agent.isSuperAdmin) return next('Only superadmins can perform this operation.'); // 403
  tools.requireUserById( data.userid, function(err,user) {
    if (err) return next(err);
    if (user.isSuperAdmin) return next('Superadmins cannot be demoted.' );
    if (!user.isAdmin) return next('User '+user.name+' is not an admin.' );
    user.isAdmin = false;
    tools.saveAndCatch(user, function(err) {
      if (err) return next(err);

      // SUCCESS
      funcs.userPushChanges( user, function(err,games) {
        if (err) next(err);
        return next(null, { action:'UPDATE', udata:[user], gdata:games });
      });

    });
  });
}
function tryMuteUser(agent, data, next) {
  // takes a userid and attempts to mute the corresponding user
  if (!agent.isAdmin) return next('Only admins can perform this operation.'); // 403
  tools.requireUserById( data.userid, function(err,user) {
    if (err) return next(err);
    if (user.isSuperAdmin) return next('Superadmins cannot be muted.' );
    if (user.isAdmin && !agent.isSuperAdmin) return next('Only superadmins can mute admins.' );
    if (user.isMuted) return next(user.name+' is already muted.' );
    user.isMuted = true;
    tools.saveAndCatch(user, function(err) {
      if (err) return next(err);

      // SUCCESS
      funcs.userPushChanges( user, function(err,games) {
        if (err) next(err);
        return next(null, { action:'UPDATE', udata:[user], gdata:games });
      });

    });
  });
}
function tryUnmuteUser(agent, data, next) {
  // takes a userid and attempts to unmute the corresponding user
  if (!agent.isAdmin) return next('Only admins can perform this operation.'); // 403
  tools.requireUserById( data.userid, function(err,user) {
    if (err) return next(err);
    if (user.isSuperAdmin) return next('Superadmins are never muted.' );
    if (user.isAdmin && !agent.isSuperAdmin) return next('Only superadmins can unmute admins.' );
    if (!user.isMuted) return next(user.name+' is not muted.' );
    user.isMuted = false;
    tools.saveAndCatch(user, function(err) {
      if (err) return next(err);

      // SUCCESS
      funcs.userPushChanges( user, function(err,games) {
        if (err) next(err);
        return next(null, { action:'UPDATE', udata:[user], gdata:games });
      });

    });
  });
}
function trySetUserFlair(agent, data, next) {
  // takes a userid and a string and attempts to
  // set the string as flair for the corresponding user
  if (!agent.isAdmin) return next('Only admins can perform this operation.'); // 403
  tools.requireUserById( data.userid, function(err,user) {
    if (err) return next(err);
    if (data.flair===user.flair) return next('No changes to be made!' );
    if (user.isSuperAdmin && !funcs.usersCheckEqual(user,agent))
      return next('Superadmin flair can only be edited by that superadmin.' );
    if (user.isAdmin && !(agent.isSuperAdmin || funcs.usersCheckEqual(user,agent)) )
      return next('Admin flair can only be edited by that admin or superadmins.' );
    if (data.flair.match(/[⚡️,👑,🔇]./)) // reserved characters
      return next('Sorry, but you can\'t use that flair!' );
    user.flair = data.flair;
    tools.saveAndCatch(user, function(err) {
      if (err) return next(err);

        // SUCCESS
        funcs.userPushChanges( user, function(err,games) {
          if (err) next(err);
          return next(null, { action:'UPDATE', udata:[user], gdata:games });
        });

    });
  });
}
function tryToggleUserPasswordReset(agent, data, next) {
  // takes a userid and attempts to toggle the corresponding user's
  // setting regarding whether their password can be reset
  if (!agent.isSuperAdmin) return next('Only admins can perform this operation.'); // 403
  tools.requireUserById( data.userid, function(err,user) {
    if (err) return next(err);
    if ((data.enabled!=='true')===user.allowResetPassword) return next('No changes to be made!' );
    if (user.isSuperAdmin && !funcs.usersCheckEqual(user,agent))
      return next('Superadmin passwords can only be reset by that superadmin.' );
    user.allowResetPassword = (data.enabled!=='true');
    tools.saveAndCatch(user, function(err) {
      if (err) return next(err);

      // SUCCESS (don't need to push changes here)
      return next(null, { action:'UPDATE', udata:[user], gdata:[] });

    });
  });
}
function tryRefreshGameCounts(agent, data, next) {
  // takes no parameters, tries to query all of the users and
  // update their "activeGamesAsAuthor" and "activeGamesAsPlayer"
  // values, which sometimes get out of sync after batch actions
  // or direct database queries
  if (!agent.isAdmin) return next('Only admins can perform this operation.'); // 403
  tools.User.find({}, function(err,users) {
    if (err) { next(err); }
    else {
      for (let u=0; u<users.length; u++) {
        funcs.userGetGamesAsAuthor( users[u], function(err,games) {
          if (err) { next(err); }
          else {
            users[u].activeGamesAsAuthor = games.length;
            funcs.userGetGamesAsPlayer( users[u], function(err,games) {
              if (err) { next(err); }
              else {
                users[u].activeGamesAsPlayer = games.length;
                tools.saveAndCatch( users[u], function(err) {
                  if (err) { next(err); }
                  else {
                    next(null, { action:'UPDATE', udata:[users[u]], gdata:[] }); // SUCCESS
                  }
                })
              }
            });
          }
        });
      }
    }
  });
}
function tryDeleteUsers(agent, data, next) {
  // takes a list of userids and attempts to delete each one
  if (!agent.isSuperAdmin) return next('Only admins can perform this operation.'); // 403
  if (!data.selected.length) return next('No items selected.');
  for (let s=0; s<data.selected.length; s++) {
    tools.requireUserById( data.selected[s], function(err,user) {
      if (err) { next(err); }
      else if (!user) { next('Unable to find user: '+data.selected[s]); }
      else {
        _DeleteUser(agent, user, function(err,result) {
          if (err) { next(err); }
          else { next(null, result); } // SUCCESS
        })
      }
    });
  }
}
function tryDeleteUserAuthoredGames(agent, data, next) {
  // takes a list of userids and attempts to delete all of the
  // games for which the corresponding user is the author
  if (!agent.isSuperAdmin) return next('Only admins can perform this operation.'); // 403
  if (!data.selected.length) return next('No items selected.');
  for (let s=0; s<data.selected.length; s++) {
    tools.requireUserById( data.selected[s], function(err,user) {
      if (err) { next(err); }
      else if (!user) { next('Unable to find user: '+data.selected[s]); }
      else if (user.isSuperAdmin) {
        return next('Superadmin games cannot be batch-deleted.' );
      } else {
        funcs.userGetGamesAsAuthor( user, function(err,games) {
          if (err) next(err);
          for (let g=0; g<games.length; g++) {
            _DeleteGame(agent, user, games[g], function(err,result) {
              if (err) { next(err); }
              else { next(null, result); } // SUCCESS
            });
          }
        });
      }
    });
  }
}
function tryDeleteGames(agent, data, next) {
  // takes a list of gameids and tries to delete each of them
  if (!agent.isSuperAdmin) return next('Only superadmins can perform this operation.'); // 403
  if (!data.selected.length) return next('No items selected.');
  for (let s=0; s<data.selected.length; s++) {
    tools.requireGameById( data.selected[s], function(err,game) {
      if (err) { next(err); }
      else if (!game) { next('Unable to find game: '+data.selected[s]); }
      else {
        tools.requireUserById( game.meta.author.id, function(err,user) {
          if (err) { next(err); }
          else if (!user) { next('Unable to find author: '+user.name); }
          else {
            _DeleteGame(agent, user, game, function(err,result) {
              if (err) { next(err); }
              else { next(null, result); } // SUCCESS
            })
          }
        });
      }
    });
  }
}
function tryMakeGamesPublic(agent, data, next) {
  // takes a list of gameids and tries to make each of them publicly viewable
  // i.e. will show up in the "available" table in the /lobby
  if (!agent.isAdmin) return next('Only admins can perform this operation.'); // 403
  if (!data.selected.length) return next('No items selected.');
  for (let s=0; s<data.selected.length; s++) {
    tools.requireGameById( data.selected[s], function(err,game) {
      if (err) { next(err); }
      else if (!game) { next('Unable to find game: '+data.selected[s]); }
      else {
        game.meta.publiclyViewable = true;
        tools.saveAndCatch( game, function(err) {
          if (err) { next(err); }
          else { next(null, { action:'UPDATE', udata:[], gdata:[game] }); }
        })
      }
    });
  }
}
function tryMakeGamesPrivate(agent, data, next) {
  // takes a list of gameids and tries to make each of them not publicly viewable
  // i.e. will not show up in the "available" table in the /lobby
  if (!agent.isAdmin) return next('Only admins can perform this operation.'); // 403
  if (!data.selected.length) return next('No items selected.');
  for (let s=0; s<data.selected.length; s++) {
    tools.requireGameById( data.selected[s], function(err,game) {
      if (err) { next(err); }
      else if (!game) { next('Unable to find game: '+data.selected[s]); }
      else {
        game.meta.publiclyViewable = false;
        tools.saveAndCatch( game, function(err) {
          if (err) { next(err); }
          else { next(null, { action:'UPDATE', udata:[], gdata:[game] }); }
        })
      }
    });
  }
}
function tryKickByUsers(agent, data, next) {
  // takes a list of users and tries to kick those users from
  // each of the games in which s/he is a player
  if (!agent.isAdmin) return next('Only admins can perform this operation.'); // 403
  if (!data.selected.length) return next('No items selected.');
  for (let s=0; s<data.selected.length; s++) {
    tools.requireUserById( data.selected[s], function(err,user) {
      if (err) { next(err); }
      else if (!user) { next('Unable to find user: '+data.selected[s]); }
      else if (user.isSuperAdmin) {
        return next('Superadmin accounts cannot be deleted.' );
      } else {
        funcs.userGetGamesAsPlayer( user, function(err,games) {
          if (err) { next(err); }
          else {
            for (let g=0; g<games.length; g++) {
              _KickUserFromGame(agent, user, games[g], function(err,result) {
                if (err) { next(err); }
                else { next(null, result); } // SUCCESS
              });
            }
          }
        });
      }
    });
  }
}
function tryKickBatch(agent, data, next) {
  // takes two lists ... one list is of gameids, so this function tries
  // to kick all the users from each game ... the other is a list of gameid-userid
  // "-" separated pairs for which we should try to kick the userid from the gameid
  if (!agent.isAdmin) return next('Only admins can perform this operation.');
  if (!data.gameids.length && !data.gameidDashUserids.length) return next('No items selected');
  for (let i=0; i<data.gameids.length; i++) {
    tools.requireGameById( data.gameids[i], function(err,game) {
      if (err) { console.log('1'); next(err); }
      else if (!game) { console.log('2'); next('Unable to find game: '+data.selected[s]); }
      else {
        console.log('3');
        for (let p=0; p<game.meta.players.length; p++) {
          tools.requireUserById( game.meta.players[p].id, function(err,user) {
            if (err) { console.log('4'); next(err); }
            else if (!user) { console.log('5'); next('Unable to find player: '+user.name); }
            else {
              console.log('6');
              _KickUserFromGame(agent, user, game, function(err,result) {
                if (err) { console.log('7'); next(err); }
                else { console.log('8'); next(null, result); } // SUCCESS
              });
            }
          });
        }
      }
    });
  }
  for (let j=0; j<data.gameidDashUserids.length; j++) {
    let [ gameid, userid ] = data.gameidDashUserids[j].split('-');
    tools.requireGameById( gameid, function(err,game) {
      if (err) { next(err); }
      else if (!game) { next('Unable to find game: '+gameid); }
      else {
        tools.requireUserById( userid, function(err,user) {
          if (err) { next(err); }
          else if (!user) { next('Unable to find user: '+userid); }
          else {
            _KickUserFromGame(agent, user, game, function(err,result) {
              if (err) { next(err); }
              else { next(null, result); } // SUCCESS
            });
          }
        });
      }
    });
  }
}
function adminCallback(err, data, socket, agent, request) {
  console.log( 'ERR AT CALLBACK ', err  )
  console.log( 'DATA AT CALLBACK', data )
  if (err) {
    let response = {
      user    : agent,
      request : request,
      action  :'ERROR',
      message : err
    };
    socket.broadcast.to('admin').emit( 'admin callback', response );
    socket.emit( 'admin callback', response);
  } else {
    let udata=[], gdata=[];
    for (let u=0; u<data.udata.length; u++) {
      udata.push( data.udata[u].getExtendedPublicData() ); }
    for (let g=0; g<data.gdata.length; g++) {
      gdata.push( data.gdata[g].getPublicData() ); }
    let response = {
      user   : agent,
      request: request,
      action : data.action,
      users  : udata,
      games  : gdata
    };
    socket.broadcast.to('admin').emit( 'admin callback', response ); // io.in
    socket.emit( 'admin callback', response );
    tools.log( 'user '+agent.id+' ('+agent.name+') ran ADMIN ACTION "'+request+'" affecting \n - '
      +data.udata.length+' USERS ('+data.udata.map(u=>u.name+'~'+u.id)+')\n - '
      +data.gdata.length+' GAMES ('+data.gdata.map(g=>g.id)+')' );
  }
}

// function actionset for LOBBY ACTION socket events
function tryJoin(agent, data, next) { }
function tryLeave(agent, data, next) { }
function tryHostNewGame(agent, data, next) { }
function tryDeleteGame(agent, data, next) { }
function tryLaunch(agent, data, next) { }
function tryPlay(agent, data, next) { }
function lobbyCallback(err, data, socket, agent, request) { }

var numUsersByPage = {};

module.exports = function(io, sessionStore) {

  io.set( 'authorization', function(handshake,next) {
    socketAuthorizationCallback(handshake, sessionStore, next);
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
      tools.log( 'user '+req.session.user.name+'~'+req.session.user.id+' sent "'+data+'" to '+req.ref );
      socket.broadcast.to(req.ref).emit('new message', {
        user : req.session.user,
        message: data
      });
    });

    socket.on('lobby action', function(data) {
      console.log('received lobby action');
      console.log(data);
      const map = {
        'join': tryJoin,
        'leave': tryLeave,
        'new-game': tryHostNewGame,
        'delete-game': tryDeleteGame,
        'launch': tryLaunch,
        'play': tryPlay
      }
      const func = map[ data.action ];
      if (!func) { return console.log( 'unrecognized lobby action:', data.action ); }
      func( req.session.user, data, function(err, result) {
        lobbyCallback(err, result, socket, req.session.user, data.action);
      });
    })

    socket.on('admin action', function(data) {
      console.log(data);
      const map = {
        'promote': tryPromoteUserToAdmin,
        'demote': tryDemoteAdminToUser,
        'mute': tryMuteUser,
        'unmute': tryUnmuteUser,
        'set-flair': trySetUserFlair,
        'toggle-password-reset': tryToggleUserPasswordReset,
        'users-delete': tryDeleteUsers,
        'users-delete-authored': tryDeleteUserAuthoredGames,
        'users-kick': tryKickByUsers,
        'users-refresh-counts': tryRefreshGameCounts,
        'games-delete': tryDeleteGames, // don't confuse this with tryDeleteGame() or _DeleteGame()
        'games-make-public': tryMakeGamesPublic,
        'games-make-private': tryMakeGamesPrivate,
        'batch-kick': tryKickBatch
      }
      const func = map[ data.action ];
      if (!func) { return console.log( 'unrecognized admin action:', data.action ); }
      func( req.session.user, data, function(err, result) {
        adminCallback(err, result, socket, req.session.user, data.action);
      });
    });

    socket.on('play action', function(data) {
      console.log('received play action');
      console.log(data);
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
