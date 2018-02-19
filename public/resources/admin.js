// FUNCTIONS
function logToConsole(data) {
  let str = '<li class="message ';

  if (data.action==='ERROR') {

    str += 'error">';
    str += '<span class="timestamp">' + getTimeStr() + '</span>';
    str += (data.user ? formatUsername(data.user) + ' ' : '' );
    str += (data.request ? '<strong>' + data.request + '</strong> ' : '' );
    str += (data.action ? '<strong>&rarr; ' + data.action + ' </strong> ' : '' );
    str += data.message

  } else {

    str += 'log">';
    str += '<span class="timestamp">' + getTimeStr() + '</span>';
    str += (data.user ? formatUsername(data.user) + ' ' : '' );
    str += (data.request ? '<strong>' + data.request + '</strong> ' : '' );
    str += (data.action ? '<strong>&rarr; ' + data.action + ' </strong> ' : '' );
    let count = 0;
    for (let u=0; u<data.users.length; u++) {
      if (count) { str += ', '; }
      else { str += 'users: '; }
      str += formatUsername(data.users[u]);
      count += 1;
    }
    count = 0;
    for (let g=0; g<data.games.length; g++) {
      if (count) { str += ', '; }
      else { str += '; games: '; }
      str += '<strong>' + data.games[g].id + '</strong>';
      count += 1
    }
  }

  str += '</li>';
  $('ul li:last').after('<li>'+str+'</li>');
  let scroll = $('div.panel.messages.public');
  scroll.scrollTop( scroll[0].scrollHeight );
}
function sendAdminAction(data) {
  socket.emit('admin action', data);
}
function bindButtons() {
  $( 'button.update' ).unbind().click( function(event) {
    let data = { action:$(event.target).prop( 'name' ) };
    $(event.target).siblings().each( function(key,value) {
      data[ $(value).prop( 'name' ) ] = $(value).val();
    });
    sendAdminAction(data);
  });
  $( 'button.batch' ).unbind().click( function(event) {
    let data = { action:$(event.target).prop( 'name' ), selected:[] };
    $(event.target).closest( 'form' ).find( 'input.batch' ).each( function(key,value) {
      if ($(value).is( ':checked' ))
        data.selected.push( $(value).prop( 'name' ) );
    });
    sendAdminAction(data);
  });
  $( 'button.kick' ).unbind().click( function(event) {
    let data = { action:'batch-kick', gameids:[], gameidDashUserids:[] };
    let form = $(event.target).closest( 'form' );
    form.find( 'input.batch' ).each( function(key,value) {
      if ( $(value).is( ':checked' ) )
        data.gameids.push( $(value).prop( 'name' ) );
    });
    form.find( 'input.kick' ).each( function(key,value) {
      if ( $(value).is( ':checked' ) )
        data.gameidDashUserids.push( $(value).prop( 'name' ) );
    });
    sendAdminAction(data);
  });
  $( 'tr' ).click( function(event) {
    let target = $(event.target);
    if (target.is('input')) return;
    let cb = $( '#cb' + target.closest('tr').prop('id') );
    cb.prop( 'checked', !cb.prop('checked') );
  })
}
function outputPlayersListSpanString(data) {
  let str = '', count = 0;


  for (let p=0; p< data.numHumans; p++) {
    if (count) str += '<strong>, </strong>';
    if (data.players[p]) {
      if ( data.status!=='in-progress' && (!data.players[p].isAdmin || user.isSuperAdmin) && !usersCheckEqual(data.players[p],data.author) ) {
        str += '<input type="checkbox" class="kick" name="' + data.id + '-' + data.players[p].id + '" />';
      }
      if ( usersCheckEqual(data.players[p], data.author) ) {
        str += '<span class="is-owner">';
        str += formatUsername(data.players[p]);
        str += '</span>';
      } else {
        str += formatUsername(data.players[p]);
      }
    } else {
      str += '<span class="empty">?</span>';
    }
    count += 1;
  }
  for (let p=0; p< data.numCPUs; p++) {
    if (count) str += ', ';
    str += '<span class="cpu">CPU</span>';
    count += 1;
  }

  return str;
}
function outputUserRowString(data) {
  let str = '';

  let exceededAsAuthor = data.activeGamesAsAuthor > data.maxActiveGamesAsAuthor && !data.isAdmin;
  let exceededAsPlayer = data.activeGamesAsPlayer > data.maxActiveGamesAsPlayer && !data.isAdmin;

  str += '<th><input type="checkbox" class="batch" name="' + data.id + '" id="cb' + data.id + '" /></th>';
  str += '<th>' + formatUsername(data) + '</th>';
  str += '<th>';
  str +=   (exceededAsAuthor ? '<strong class="false">' : '') ;
  str +=   data.activeGamesAsAuthor + '/';
  str +=   (data.isAdmin ? '&#x221e;' : data.maxActiveGamesAsAuthor);
  str +=   (exceededAsAuthor ? '</strong>' : '') ;
  str += '</th>';
  str += '<th>';
  str +=   (exceededAsPlayer ? '<strong class="false">' : '') ;
  str +=   data.activeGamesAsPlayer + '/';
  str +=   (data.isAdmin ? '&#x221e;' : data.maxActiveGamesAsPlayer);
  str +=   (exceededAsPlayer ? '</strong>' : '') ;
  str += '</th>';
  str += '<th><strong class="isSuperAdmin ' + data.isSuperAdmin + '">' + data.isSuperAdmin + '</strong></th>';
  str += '<th>';
  str +=   '<strong class="isAdmin ' + data.isAdmin + '">' + data.isAdmin + '</strong>';
  if (!data.isSuperAdmin && user.isSuperAdmin) {
    // only superadmins can pro-/de-mote nonsuperadmins
    if (data.isAdmin) {
      str += '<form class="admin" method="post" action="/admin/demote">';
      str +=   '<input type="hidden" name="userid" value="' + data.id + '" />';
      str +=   '&nbsp;<button type="button" class="admin update" name="demote">demote</button>';
      str += '</form>';
    } else {
      str += '<form class="admin" method="post" action="/admin/promote">';
      str +=   '<input type="hidden" name="userid" value="' + data.id + '" />';
      str +=   '&nbsp;<button type="button" class="admin update" name="promote">promote</button>';
      str += '</form>';
    }
  }
  str += '</th>';
  str += '<th>';
  str +=   '<strong class="isMuted ' + data.isMuted + '">' + data.isMuted + '</strong>';
  if (!data.isSuperAdmin && (user.isSuperAdmin || !data.isAdmin)) {
    // superadmins can un-/mute nonsuperadmins, admins can un-/mute users
    if (data.isMuted) {
      str += '<form class="admin" method="post" action="/admin/unmute">';
      str +=   '<input type="hidden" name="userid" value="' + data.id + '" />';
      str +=   '&nbsp;<button type="button" class="admin update" name="unmute">unmute</button>';
      str += '</form>';
    } else {
      str += '<form class="admin" method="post" action="/admin/mute">';
      str +=   '<input type="hidden" name="userid" value="' + data.id + '" />';
      str +=   '&nbsp;<button type="button" class="admin update" name="mute">mute</button>';
      str += '</form>';
    }
  }
  str += '</th>';
  str += '<th>';
  if ( (!data.isSuperAdmin && (user.isSuperAdmin || !data.isAdmin)) || usersCheckEqual(user,data) ) {
    // superadmins can nonsuperadmin flair, admins can change user flair, everyone can change their own flair
    str += '<form class="admin" method="post" action="/admin/flair">';
    str +=   '<input class="lr" type="text" name="flair" style="width:8ch;" maxlength="8" value="' + data.flair + '" />';
    str +=   '<input type="hidden" name="userid" value="' + data.id + '" />';
    str +=   '&nbsp;<button type="button" class="admin update" name="set-flair">set</button>';
    str += '</form>';
  }
  str += '</th>';
  str += '<th><form class="admin" method="post" action="/admin/toggle-password-reset"><strong class="';
  if ( data.allowResetPassword ) {
    str += 'true">enabled';
  } else {
    str += 'false">disabled';
  }
  str += '<form class="admin">';
  str +=   '<input type="hidden" name="enabled" value="' + data.allowResetPassword + '" />';
  if ( user.isSuperAdmin ) {
    str += '<input type="hidden" name="userid" value="' + data.id + '" />';
    str += '<button type="button" class="admin update" name="toggle-password-reset">toggle</button></strong></form></th>';
  }
  str += '</form>';

  return str;
}
function outputGameRowString(data) {
  let str = '';

  str += '<th><input type="checkbox" class="batch" name="' + data.id + '" id="cb' + data.id + '" ></th>';
  str += '<th><strong class="status ' + data.status + '">' + data.status + '</strong></th>';
  str += '<th><strong class="' + (data.turn>0) + '">' + data.turn + '</strong></th>';
  str += '<th><strong class="' + data.public + '">' + data.public + '</strong></th>';
  str += '<th><strong>' + data.scenario + '</strong></th>';
  str += '<th><span class="players-list">' + outputPlayersListSpanString(data) + '</span></th>';
  str += '<th><strong>' + data.VPs + '</strong></th>';
  str += '<th><span class="date">' + data.updated + '</span></th>';

  return str;
}
function updateTables(games, users) {
  /***
    take incoming data from socket connection and use it to populate our lobby tables
    ***/

  // remove the "no current games ..." displays
  $('tr.admin.null').detach();

  // iterate over each incoming user
  for (let u=0; u<users.length; u++) {
    // and add it to the table if it's not there
    if (!$('table.userlist').has( '#' + users[u].id ).length)
      addUserTableRow( users[u] );
  }

  // iterate over each incoming game
  for (let g=0; g<games.length; g++) {
    // and add it to the table if it's not there
    if (!$('table.gamelist').has( '#' + games[g].id ).length)
      addGameTableRow( games[g] );
  }

  bindButtons();
  checkIfEmptyTables();

}
function checkIfEmptyTables() {
  // check if we need to add the "no current games ..." displays
  for (let i=0; i<2; i++) {
    let type = ['game', 'user'][i];
    if ( $('table.' + type + 'list').find('tr').length===1 ) {
      let table = $('table.' + type + 'list tr:last');
      table.after( '<tr class="admin null"><th colspan="10"><div class="admin null-container">no current ' + type + 's ...</div></th></tr>' );
    }
  }
}
function removeTableRow(id) {
  $('#'+id).detach();
}
function updateUserTableRow(data) {

  $('#' + data.id).html( outputUserRowString(data) );
  bindButtons();

}
function updateGameTableRow(data) {

  $('#' + data.id).html( outputGameRowString(data) );
  bindButtons();

}
function addUserTableRow(data) {

  let row = ''
  row += '<tr class="admin user" id="' + data.id + '" title="' + data.id + '">';
  row +=   outputUserRowString(data);
  row += '</tr>';

  $('table.userlist tr:last').after( row );

}
function addGameTableRow(data) {

  let row = '';
  row += '<tr class="admin game" id="' + data.id + '" title="' + data.id + '">';
  row +=   outputGameRowString(data);
  row += '</tr>';

  $('table.gamelist tr:last').after( row );

}

// GLOBALS
var user, socket = io();

// ON READY
$( function() {

  // Socket events
  socket.on('on connection', function(data) {
    user = data.user;
    updateTables(data.games, data.users);
  });
  socket.on('new connection', function(data) {
    //updateTables(data.games, data.users);
  });
  socket.on('admin callback', function(data) {
    switch (data.action) {
      case ('ERROR'): break;
      case ('ADD'):
        break;
      case ('UPDATE'):
        for (let u=0; u<data.users.length; u++) {
          updateUserTableRow( data.users[u] );
        }
        for (let g=0; g<data.games.length; g++) {
          updateGameTableRow( data.games[g] );
        }
        break;
      case ('REMOVE'):
        for (let u=0; u<data.users.length; u++) {
          removeTableRow( data.users[u].id );
        }
        for (let g=0; g<data.games.length; g++) {
          removeTableRow( data.games[g].id );
        }
        break;
      default:
        data = {
          action  : 'ERROR',
          request : 'MALFORMED SERVER RESPONSE',
          message : '<br />'+JSON.stringify(data)
        };
    }
    $('input[type=checkbox]').prop( 'checked', false );
    logToConsole(data);
  });

});
