// all chat/messaging functionality lives here

// FUNCTIONS
function addChatMessage(data) {
  if ( !data.user.isMuted || data.class == 'admin' || usersCheckEqual(data.user, user) || user.isAdmin ) {
    let msgText = '<li class="';
    msgText += 'message ' + data.class + '">';
    if (!data.omitTimestamp) {
      msgText += '<span class="timestamp">' + getTimeStr() + '</span>';
    }
    if (!data.omitUsername) {
      msgText += formatUsername( data.user ) + '&nbsp;';
    }
    msgText += '<span class="body">' + escapeMessageBody(data.body) + '</span></li>';
    $('ul.messages').append( msgText );
    let messagesDiv = $('div.messages.public');
    messagesDiv.scrollTop( messagesDiv[0].scrollHeight );
  }
}
function escapeMessageBody(str) {

  let repl;
  const reg = (str.match(/@\(.*?\)/g) || []);

  for (let r=0; r<reg.length; r++) {

    const regr= reg[r].substring( 2, reg[r].length-1 );
    const split = regr.split(',');
    repl = '<strong style="color:'

    switch (split.length) {
      case 1:
        repl += hashStringToHex(split[0]) + '">';
        repl += regr;
        break;
      case 2:
        repl += hashStringToHex(split[1]) + '">';
        if ( isValidID(split[1]) ) { // i.e. it's a /join link
          repl += '<a class="chat-link" href="javascript:void(0);" onclick="javascript:$(`#private-code-input`).val(`' + split[1] + '`);">' + split[0] + '</a>';
        } else {
          repl += hashStringToHex(split[0]) + '">';
          repl += split[0];
        }
        break;
      default:
        repl += split.join(' ');
        break;
    }

    repl += '</strong>';
    str = str.replace( reg[r], repl );

  }
  return str;
}
function updateCurrentlyOnline(num) {
  $('span.currently-online').html(num);
}
function sendChatMessage() {
  var message = msginput.val();
  message = cleanInput(message);
  if (message) {
    msginput.val('');
    addChatMessage({ body:message, user:user });
    socket.emit('new message', message);
  }
}
function cleanInput (input) {
  // prevent markup injections and such
  return $('<div/>').text(input).html();
}
function addAdminChatMessage(data) {
  let bodies = {
    'mute'    : '🔇Oh no, you\'ve been muted by $$! Your messages won\'t be visible to anyone except admins.🔇',
    'unmute'  : 'Hoorah! You\'ve been unmuted by $$.',
    'admin'   : 'Hoorah! You\'ve been promoted to admin by $$!',
    'unadmin' : 'Oh no, you\'ve been demoted to user by $$!',
    'flair'   : 'Your flair has been changed by $$.'
  }
  let body = bodies[data.key];
  if (!body) return; // invalid key
  let username = data.user ? formatUsername(data.user) : 'an admin';
  body = body.replace(/\$\$/, username);
  addChatMessage({ body:body, user:user, omitUsername:true, class:'admin' });
}
function scanDataForUserUpdates(data) {
  for (let u=0; u<data.users.length; u++) {
    if ( usersCheckEqual(user, data.users[u]) ) {
      if (user.flair !== data.users[u].flair) {
        addAdminChatMessage({ key:'flair', user:data.user });
      }
      if (user.isMuted !== data.users[u].isMuted) {
        addAdminChatMessage({ key:(data.users[u].isMuted ? 'mute' : 'unmute'), user:data.user });
      }
      if (user.isAdmin !== data.users[u].isAdmin) {
        addAdminChatMessage({ key:(data.users[u].isAdmin ? 'admin' : 'unadmin'), user:data.user });
      }
      user = data.users[u];
    }
  }
}

// GLOBALS
var user, socket = io();

// ON READY
$( function() {

  // focus message input
  msginput = $('input.messages');
  msginput.focus();

  // Keyboard/window events
  $(window).keydown( function(event) {
    if (event.which === 13) { // ENTER
      if (msginput.is(':focus')) {
        sendChatMessage();
      }
    }
  });

  // Socket events
  socket.on('on connection', function(data) {
    user = data.user;
    if (user.isMuted) {
      addAdminChatMessage({ key:'mute' });
    }
    updateCurrentlyOnline(data.numUsers);
  });
  socket.on('new connection', function(data) {
    updateCurrentlyOnline(data.numUsers);
    scanDataForUserUpdates(data);
    //addChatMessage({ body:'has connected!', user:data.user });
  });
  socket.on('end connection', function(data) {
    updateCurrentlyOnline(data.numUsers);
    //addChatMessage({ body:'has disconnected', user:data.user });
  });
  socket.on('new message', function(data) {
    addChatMessage({ body:data.message, user:data.user });
  });

});
