// game/sockets.js
var funcs = require('../app/funcs.js');
var config = require('../config/catan.js');
//var DEFUNCTS = require('./DEFUNCTS.js');

// socket helper functions
function socketAuthorizationCallback(handshake, sessionStore, next) {
  // probably want to do more authentication here
  if (handshake.headers.cookie) {

    // for some reason we're getting issues parsing the cookie correctly
    handshake.sid = handshake.cookies['express.sid'].substring(2,34);
    sessionStore.get(handshake.sid, function (err, session) {
      if (err || !session) { // if we cannot grab a session, turn down the connection
        next('Socket authorization error: cannot find session.', false);
      } else {
        if (session.user) { // only accept sessions w/ authenticated users
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
          next(null, true); // SUCCESS

        } else {
          next( 'Socket authorization error: no user data', false );
        }
      }
    });
  } else {
    return next( 'Socket authorization error: no cookie transmitted', false );
  }
}
function socketHandleNewConnection(socket) {

  let req = socket.request;

  socket.join( req.ref );
  numUsersByPage[req.ref] = numUsersByPage[req.ref]+1 || 1;
  console.log('User ' + req.session.user.name + ' connected to ' + req.ref + ' (' + numUsersByPage[req.ref] + ' total)');

  // prepare data
  prepareForLobby( req.session.user, function(err,users,games) {

    if (err) return console.log(err);

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
function userPushChanges(user, next) {
  // update the meta.author
  userGetGamesAsAuthor( user, function(err,games) {
    if (err) next(err);
    for (let g=0; g<games.length; g++) {
      games[g].meta.author = user.getLobbyData();
      games[g].meta.updated = new Date;
      games[g].save( function(err) { if (err) next(err); });
    }
  });
  // update the meta.players
  userGetGamesAsPlayer( user, function(err,games) {
    if (err) next(err);
    for (let g=0; g<games.length; g++) {
      for (let p=0; p<games[g].meta.players.length; p++) {
        if ( funcs.usersCheckEqual(games[g].meta.players[p], user) ) {
          games[g].meta.players[p] = user.getLobbyData();
        }
      }
      games[g].meta.updated = new Date;
      games[g].save( function(err) { if (err) { next(err); } else {
        next(null, games[g]);
      }});
    }
  });
}
function userGetGamesAsAuthor(user, next) {
  funcs.Game.find({ "meta.author.id" : user.id }, function(err,games) {
    next(err,games);
  });
}
function userGetGamesAsPlayer(user, next) {
  // for some reason IDs weren't working here so names are used instead
  funcs.Game.find({ "meta.players" : { $elemMatch: { "name":user.name }}}, function(err,games) {
    next(err,games);
  });
}
function prepareForLobby(agent, next) {
  prepareUsersData( function(err,users) {
    if (err) next(err);
    prepareGamesData( agent, function(err,games) {
      next(err,users,games);
    });
  });
}
function prepareUsersData(next) {
  // only pass relevent information to the admin.ejs page for each user
  funcs.User.find({}, function(err,users) {
    if (err) next(err);

    let data = [];
    for (let u=0; u<users.length; u++) {
      data.push( users[u].getExtendedLobbyData() );
    }
    next(null,data);
  });
}
function prepareGamesData(agent, next) {
  // only pass relevant information to the lobby.ejs page for each game
  funcs.Game.find({}, function(err,games) {
    if (err) next(err);

    let data = [];
    for (let g=0; g<games.length; g++) {
      if ( games[g].checkIsActive() || agent.isAdmin) {
        data.push( games[g].getLobbyData() );
      }
    }
    next(null,data);
  });
}

// multiple-actionset helper functions
// these are the functions that actually do the work
// note: _CreateNewUser equiv. exists in /app/config/passport.js
function _DeleteUser(agent, user, next) {
  // takes a user (Model) parameter and tries to delete it,
  // updating all relevant records
  if (user.isSuperAdmin) {
    return next('Superadmin accounts cannot be deleted.' );
  } else {
    userGetGamesAsPlayer( user, function(err,games) {
      if (err) { next(err); } else {
        for (let g=0; g<games.length; g++) {
          _KickUserFromGame(agent, user, games[g], next);
        }
      }
    });
    userGetGamesAsAuthor( user, function(err,games) {
      if (err) { next(err); } else {
        for (let g=0; g<games.length; g++) {
          _DeleteGame(agent, games[g], next);
        }
      }
    });
    user.remove( function(err,user) {
      if (err) return next(err);
      funcs.log( 'user '+agent.id+' ('+agent.name+') deleted user '+user.name+'~'+user.id );
      next(null, { action:'REMOVE', udata:[user], gdata:[] }); // SUCCESS
    });
  }
}
function _CreateNewGame(agent, author, data, next) {
  config.getNewGame(author, data, function(err,game) {
    if (err) return next(err);
    funcs.saveAndCatch(game, function(err) {
      if (err) return next(err);
      author.activeGamesAsAuthor += 1;
      funcs.saveAndCatch(author, function(err) {
        if (err) return next(err);

        // SUCCESS
        next(null, { action:'ADD', udata:[author], gdata:[game] });

      });
    })
  });
}
function _DeleteGame(agent, game, next) {
  // takes an agent (Model) and a game (Model) and attempts to
  // delete the game
  funcs.requireUserById( game.meta.author.id, function(err,author) {
    if (err) return next(err);
    if ( !funcs.usersCheckEqual(agent, author) || agent.isSuperAdmin )
      return next( 'Only superadmins or owners can delete games.' );
    author.activeGamesAsAuthor -= 1;
    funcs.saveAndCatch(author, function(err) {
      if (err) { next(err); } else {
        next(null, { action:'UPDATE', udata:[author], gdata:[] });
      }
    });
    funcs.iteratePlayers(game, function(err,player) {
      if (err) { next(err); } else {
        player.activeGamesAsPlayer -= 1;
        funcs.saveAndCatch(player, function(err) {
          if (err) { next(err); } else {
            next(null, { action:'UPDATE', udata:[player], gdata:[] });
          }
        });
      }
    });
    game.remove( function(err,game) {
      if (err) return next(err);
      funcs.log( 'user '+agent.id+' ('+agent.name+') deleted game '+game.id );
      next(null, { action:'UPDATE', udata:[author], gdata:[] });
      next(null, { action:'REMOVE', udata:[], gdata:[game] });
      return;
    });
  });
}
function _JoinUserToGame(agent, user, game, next) {
  if ( !game.checkIsActive() )
    return next('Unable to join: game is not active.');
  if ( funcs.checkIfUserInGame(user,game) )
    return next('Unable to join: you have already joined!' );
  if ( game.checkIsFull() )
    return next('Unable to join: game is full.' );
  if ( game.state.status==='in-progress' )
    return next('Unable to join: you can\'t join a game once it starts!' );
  game.state.players.push( config.getNewPlayerData(user,game) );
  game.state.status = ( game.checkIsFull() ? 'ready' : 'pending' );
  game.meta.updated = new Date;
  funcs.saveAndCatch(game, function(err) {
    if (err) return next(err);
    user.activeGamesAsPlayer -= 1;
    funcs.saveAndCatch(user, function(err) {
      if (err) return next(err);

      // SUCCESS
      next(null, { action:'UPDATE', udata:[user], gdata:[game] });

    });
  });
}
function _KickUserFromGame(agent, user, game, next) {
  // takes a user (Model) and a game (Model) and attempts to kick the
  // user from that game
  if ( !game.checkIsActive() )
    return next('Unable to leave: game is not active.' );
  if ( !funcs.checkIfUserInGame(user,game) )
    return next("Unable to leave: you can't leave a game you haven't joined!" );
  if ( game.state.status==='in-progress' )
    return next("Unable to leave: you can't leave a game once it starts!  Try quitting instead." );
  if ( funcs.usersCheckEqual( user, game.meta.author ) )
    return next("Unable to leave: this user is the author.  Try deleting instead." );
  if ( !funcs.usersCheckEqual( user, agent ) && !agent.isSuperAdmin && user.isAdmin )
    return next("Unable to leave: only superadmins may perform this operation." )
  let newlist = [];
  for (let p=0; p<game.state.players.length; p++) {
    if ( !funcs.usersCheckEqual(game.state.players[p].lobbyData, user) ) {
      newlist.push( game.state.players[p] );
    }
  }
  game.state.players = newlist;
  game.state.status = ( game.checkIsFull() ? 'ready' : 'pending' );
  game.meta.updated = new Date;
  funcs.saveAndCatch(game, function(err) {
    if (err) return next(err);
    user.activeGamesAsPlayer -= 1;
    funcs.saveAndCatch(user, function(err) {
      if (err) return next(err);

      // SUCCESS
      next(null, { action:'UPDATE', udata:[user], gdata:[game] });

    });
  });
}
function _LaunchGame(agent, user, game, next) {
  if (!funcs.checkIfUserInGame(user, game) && !agent.isAdmin)
    return next( 'You can\'t launch a game you haven\'t joined!' );
  if (game.state.status==='in-progress')
    return next(null, { action:'PLAY', url:game._id }); // redirect to /play
  if (game.state.status!=='ready')
    return next( 'Unable to launch until enough players have joined.' );
  game.state.status = 'in-progress';
  game.meta.updated = new Date;
  funcs.saveAndCatch( game, function(err) {
    if (err) return next(err);

    funcs.log( 'user '+user.id+' ('+user.name+') launched game '+game.id );
    next(null, { action:'UPDATE', udata:[], gdata:[game] });
    next(null, { action:'PLAY', url:game._id }); // redirect to /play
    return;

  });
}

// function actionset for ADMIN ACTION socket events
function tryPromoteUserToAdmin(agent, data, next) {
  // takes a userid and attempts to promote the corresponding user
  if (!agent.isSuperAdmin) return next('Only superadmins can perform this operation.'); // 403
  funcs.requireUserById( data.userid, function(err,user) {
    if (err) return next(err);
    if (user.isAdmin) return next('User '+user.name+' is already an admin.' );
    user.isAdmin = true;
    user.isMuted = false;
    funcs.saveAndCatch(user, function(err) {
      if (err) return next(err);

      // SUCCESS
      userPushChanges( user, function(err,game) {
        if (err) next(err);
        next(null, { action:'UPDATE', udata:[user], gdata:[game] });
      });

    });
  });
}
function tryDemoteAdminToUser(agent, data, next) {
  // takes a userid and attempts to demote the corresponding user
  if (!agent.isSuperAdmin) return next('Only superadmins can perform this operation.'); // 403
  funcs.requireUserById( data.userid, function(err,user) {
    if (err) return next(err);
    if (user.isSuperAdmin) return next('Superadmins cannot be demoted.' );
    if (!user.isAdmin) return next('User '+user.name+' is not an admin.' );
    user.isAdmin = false;
    funcs.saveAndCatch(user, function(err) {
      if (err) return next(err);

      // SUCCESS
      userPushChanges( user, function(err,game) {
        if (err) next(err);
        next(null, { action:'UPDATE', udata:[user], gdata:[game] });
      });

    });
  });
}
function tryMuteUser(agent, data, next) {
  // takes a userid and attempts to mute the corresponding user
  if (!agent.isAdmin) return next('Only admins can perform this operation.'); // 403
  funcs.requireUserById( data.userid, function(err,user) {
    if (err) return next(err);
    if (user.isSuperAdmin) return next('Superadmins cannot be muted.' );
    if (user.isAdmin && !agent.isSuperAdmin) return next('Only superadmins can mute admins.' );
    if (user.isMuted) return next(user.name+' is already muted.' );
    user.isMuted = true;
    funcs.saveAndCatch(user, function(err) {
      if (err) return next(err);

      // SUCCESS
      userPushChanges( user, function(err,game) {
        if (err) next(err);
        next(null, { action:'UPDATE', udata:[user], gdata:[game] });
      });

    });
  });
}
function tryUnmuteUser(agent, data, next) {
  // takes a userid and attempts to unmute the corresponding user
  if (!agent.isAdmin) return next('Only admins can perform this operation.'); // 403
  funcs.requireUserById( data.userid, function(err,user) {
    if (err) return next(err);
    if (user.isSuperAdmin) return next('Superadmins are never muted.' );
    if (user.isAdmin && !agent.isSuperAdmin) return next('Only superadmins can unmute admins.' );
    if (!user.isMuted) return next(user.name+' is not muted.' );
    user.isMuted = false;
    funcs.saveAndCatch(user, function(err) {
      if (err) return next(err);

      // SUCCESS
      userPushChanges( user, function(err,game) {
        if (err) next(err);
        next(null, { action:'UPDATE', udata:[user], gdata:[game] });
      });

    });
  });
}
function trySetUserFlair(agent, data, next) {
  // takes a userid and a string and attempts to
  // set the string as flair for the corresponding user
  if (!agent.isAdmin) return next('Only admins can perform this operation.'); // 403
  funcs.requireUserById( data.userid, function(err,user) {
    if (err) return next(err);
    if (data.flair===user.flair)
      return next('No changes to be made!' );
    if (user.isSuperAdmin && !funcs.usersCheckEqual(user,agent))
      return next('Superadmin flair can only be edited by that superadmin.' );
    if (user.isAdmin && !(agent.isSuperAdmin || funcs.usersCheckEqual(user,agent)) )
      return next('Admin flair can only be edited by that admin or superadmins.' );
    if (data.flair.match(/[⚡️,👑,🔇]./)) // reserved characters
      return next('Sorry, but you can\'t use that flair!' );
    user.flair = data.flair;
    funcs.saveAndCatch(user, function(err) {
      if (err) return next(err);

      // SUCCESS
      userPushChanges( user, function(err,game) {
        if (err) next(err);
        next(null, { action:'UPDATE', udata:[user], gdata:[game] });
      });

    });
  });
}
function tryToggleUserPasswordReset(agent, data, next) {
  // takes a userid and attempts to toggle the corresponding user's
  // setting regarding whether their password can be reset
  if (!agent.isSuperAdmin) return next('Only admins can perform this operation.'); // 403
  funcs.requireUserById( data.userid, function(err,user) {
    if (err) return next(err);
    if ((data.enabled!=='true')===user.allowResetPassword)
      return next('No changes to be made!' );
    if (user.isSuperAdmin && !funcs.usersCheckEqual(user,agent))
      return next('Superadmin passwords can only be reset by that superadmin.' );
    user.allowResetPassword = (data.enabled!=='true');
    funcs.saveAndCatch(user, function(err) {
      if (err) return next(err);

      // SUCCESS (don't need to push changes here)
      next(null, { action:'UPDATE', udata:[user], gdata:[] });

    });
  });
}
function tryRefreshGameCounts(agent, data, next) {
  // takes no parameters, tries to query all of the users and
  // update their "activeGamesAsAuthor" and "activeGamesAsPlayer"
  // values, which sometimes get out of sync after batch actions
  // or direct database queries
  if (!agent.isAdmin) return next('Only admins can perform this operation.'); // 403
  funcs.User.find({}, function(err,users) {
    if (err) { next(err); }
    else {
      for (let u=0; u<users.length; u++) {
        userGetGamesAsAuthor( users[u], function(err,games) {
          if (err) { next(err); }
          else {
            users[u].activeGamesAsAuthor = games.length;
            userGetGamesAsPlayer( users[u], function(err,games) {
              if (err) { next(err); }
              else {
                users[u].activeGamesAsPlayer = games.length;
                funcs.saveAndCatch( users[u], function(err) {
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
  if (!agent.isSuperAdmin)
    return next('Only admins can perform this operation.'); // 403
  if (!data.selected.length)
    return next('No items selected.');
  for (let s=0; s<data.selected.length; s++) {
    funcs.requireUserById( data.selected[s], function(err,user) {
      if (err) { next(err); } else {
        _DeleteUser(agent, user, next);
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
    funcs.requireUserById( data.selected[s], function(err,user) {
      if (err) {
        next(err);
      } else if (user.isSuperAdmin) {
        next('Superadmin games cannot be batch-deleted.' );
      } else {
        userGetGamesAsAuthor( user, function(err,games) {
          if (err) { next(err); }
          else {
            for (let g=0; g<games.length; g++) {
              _DeleteGame(agent, games[g], next);
            }
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
    funcs.requireGameById( data.selected[s], function(err,game) {
      if (err) { next(err); } else {
        _DeleteGame(agent, game, next);
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
    funcs.requireGameById( data.selected[s], function(err,game) {
      if (err) { next(err); } else {
        game.meta.settings.isPublic = true;
        funcs.saveAndCatch( game, function(err) {
          if (err) { next(err); } else {
            next(null, { action:'UPDATE', udata:[], gdata:[game] });
          }
        });
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
    funcs.requireGameById( data.selected[s], function(err,game) {
      if (err) { next(err); } else {
        game.meta.settings.isPublic = false;
        funcs.saveAndCatch( game, function(err) {
          if (err) { next(err); } else {
            next(null, { action:'UPDATE', udata:[], gdata:[game] });
          }
        });
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
    funcs.requireUserById( data.selected[s], function(err,user) {
      if (err) {
        next(err);
      } else if (user.isSuperAdmin) {
        next('Superadmin accounts cannot be deleted.' );
      } else {
        userGetGamesAsPlayer( user, function(err,games) {
          if (err) { next(err); }
          else {
            for (let g=0; g<games.length; g++) {
              _KickUserFromGame(agent, user, games[g], next);
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
    funcs.requireGameById( data.gameids[i], function(err,game) {
      if (err) { next(err); } else {
        funcs.iteratePlayers(game, function(err,player) {
          if (err) { next(err); }
          else {
            _KickUserFromGame(agent, player, game, next);
          }
        });
      }
    });
  }
  for (let j=0; j<data.gameidDashUserids.length; j++) {
    let [ gameid, userid ] = data.gameidDashUserids[j].split('-');
    funcs.requireGameById( gameid, function(err,game) {
      if (err) { next(err); } else {
        funcs.requireUserById( userid, function(err,user) {
          if (err) { next(err); } else {
            _KickUserFromGame(agent, user, game, next);
          }
        });
      }
    });
  }
}
function adminCallback(err, data, socket, agent, request) {
  let response;
  if (err) {
    console.log( 'ERR AT ADMIN CALLBACK ', err  )
    response = {
      user    : agent,
      request : request,
      action  :'ERROR',
      message : err
    };
  } else {

    let udata=[], gdata=[];
    for (let u=0; u<data.udata.length; u++) {
      udata.push( data.udata[u].getExtendedLobbyData() ); }
    for (let g=0; g<data.gdata.length; g++) {
      gdata.push( data.gdata[g].getLobbyData() ); }
    response = {
      user   : agent,
      request: request,
      action : data.action,
      users  : udata,
      games  : gdata
    };
    funcs.log( 'user '+agent.id+' ('+agent.name+') ran ADMIN ACTION "'+request+'" affecting \n - '
      +data.udata.length+' USERS ('+data.udata.map(u=>u.name+'~'+u.id)+')\n - '
      +data.gdata.length+' GAMES ('+data.gdata.map(g=>g.id)+')' );

  }
  socket.broadcast.to('admin').emit( 'admin callback', response );
  socket.emit( 'admin callback', response);
}

// function actionset for LOBBY ACTION socket events
function tryJoin(agent, data, next) {
  funcs.requireUserById( agent.id, function(err,user) {
    if (err) return next(err);
    if (user.activeGamesAsPlayer >= user.maxActiveGamesAsPlayer && !agent.isAdmin)
      return next('Unable to join: you are already in the maximum number of games.');
    funcs.requireGameById( data.args.gameid, function(err,game) {
      if (err) return next(err);
      _JoinUserToGame(agent, user, game, next);
    });
  });
}
function tryLeave(agent, data, next) {
  funcs.requireUserById( agent.id, function(err,user) {
    if (err) return next(err);
    funcs.requireGameById( data.args.gameid, function(err,game) {
      if (err) return next(err);
      _KickUserFromGame(agent, user, game, next);
    });
  });
}
function tryHostNewGame(agent, data, next) {
  funcs.requireUserById( agent.id, function(err,user) {
    if (err) return next(err);
    if (user.activeGamesAsAuthor >= user.maxActiveGamesAsAuthor && !agent.isAdmin)
      return next('Unable to create new game: you already own the maximum number of games.');
    if (user.activeGamesAsPlayer >= user.maxActiveGamesAsPlayer && !agent.isAdmin)
      return next('Unable to create new game: you are already in the maximum number of games.');
    _CreateNewGame(agent, user, data.args, next);
  });
}
function tryDeleteGame(agent, data, next) {
  funcs.requireUserById( agent.id, function(err,user) {
    if (err) return next(err);
    funcs.requireGameById( data.args.gameid, function(err,game) {
      if (err) return next(err);
      _DeleteGame(agent, game, next);
    });
  });
}
function tryLaunch(agent, data, next) {
  funcs.requireUserById( agent.id, function(err,user) {
    if (err) return next(err);
    funcs.requireGameById( data.args.gameid, function(err,game) {
      if (err) return next(err);
      _LaunchGame(agent, user, game, next);
    });
  });
}
function tryPlay(agent, data, next) {
  tryLaunch(agent,data,next); // _LaunchGame will catch this correctly
}
function tryShare(agent, data, next) {
  funcs.requireUserById( agent.id, function(err,user) {
    if (err) return next(err);
    funcs.requireGameById( data.args.gameid, function(err,game) {
      if (err) return next(err);
      if (!game.checkIsActive())
        return next( 'Cannot share game: it is not active.' );
      if (game.state.status==='in-progress')
        return next( 'Cannot share game: it is already in progress.' );
      if (game.checkIsFull())
        return next( 'Cannot share game: it is already full.' );
      next(null, { action:'SHARE', udata:[user], gdata:[game] });
    });
  });
}
function lobbyCallback(err, data, socket, agent, request) {
  let response;
  if (err) {
    console.log( 'ERR AT LOBBY CALLBACK ', err  )
    response = {
      user    : agent,
      request : request,
      action  :'ERROR',
      message : err
    };
  } else if (data.action==='PLAY') {

    let response = {
      user    : agent,
      request : request,
      action  : data.action,
      url     : data.url
    };
    return socket.emit( 'lobby callback', response );

  } else {

    let udata=[], gdata=[];
    for (let u=0; u<data.udata.length; u++) {
      udata.push( data.udata[u].getExtendedLobbyData() ); }
    for (let g=0; g<data.gdata.length; g++) {
      gdata.push( data.gdata[g].getLobbyData() ); }
    response = {
      user   : agent,
      request: request,
      action : data.action,
      users  : udata,
      games  : gdata
    };
    funcs.log( 'user '+agent.id+' ('+agent.name+') ran ADMIN ACTION "'+request+'" affecting \n - '
      +data.udata.length+' USERS ('+data.udata.map(u=>u.name+'~'+u.id)+')\n - '
      +data.gdata.length+' GAMES ('+data.gdata.map(g=>g.id)+')' );

  }
  socket.broadcast.to('lobby').emit( 'lobby callback', response );
  socket.broadcast.to('admin').emit( 'lobby callback', response );
  socket.emit( 'lobby callback', response);
}

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
      funcs.log( 'user '+req.session.user.name+'~'+req.session.user.id+' sent "'+data+'" to '+req.ref );
      socket.broadcast.to(req.ref).emit('new message', {
        user : req.session.user,
        message: data
      });
    });

    socket.on('lobby action', function(data) {
      console.log('received lobby action',data);
      const map = {
        'join': tryJoin,
        'leave': tryLeave,
        'new-game': tryHostNewGame,
        'delete-game': tryDeleteGame,
        'launch': tryLaunch,
        'play': tryPlay,
        'share': tryShare
      }
      const func = map[ data.action ];
      try {
        func( req.session.user, data, function(err, result) {
          lobbyCallback(err, result, socket, req.session.user, data.action);
        });
      } catch(err) {
        if (err instanceof TypeError) {
          lobbyCallback( 'Malformed admin action ('+err+')', null, socket, req.session.user, data.action );
        }
      }
    })

    socket.on('admin action', function(data) {
      // validate data is well-formed

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
      try {
        func( req.session.user, data, function(err, result) {
          adminCallback(err, result, socket, req.session.user, data.action);
        });
      } catch(err) {
        if (err instanceof TypeError) {
          adminCallback( 'Malformed admin action: '+err, null, socket, req.session.user, data.action );
        }
      }
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
