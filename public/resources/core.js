// CORE functionality that should be available even when messaging isn't

// FUNCTIONS
function forceTwoDigits(num) {
  return num > 9 ? '' + num : '0' + num;
}
function getTimeStr() {
  let datetime = new Date();
  let datestr =
    forceTwoDigits(datetime.getHours()%12) + ':' +
    forceTwoDigits(datetime.getMinutes()) + ':' +
    forceTwoDigits(datetime.getSeconds()) + ' ' +
    (datetime.getHours() > 12 ? 'pm' : 'am');
  return datestr;
}
function hashStringToHex(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}
function windowResizeWide() {
  $('.lobby.content').css('flex-flow',  'row-reverse nowrap');
  $('.frame#messages').css('border-left-width', '2px');
  $('button.switch-view').prop('id', 'wide').html('Switch to wide view');
};
function windowResizeNarr() {
  $('.lobby.content').css('flex-flow',  'column-reverse nowrap');
  $('.frame#messages').css('border-left-width', '0px');
  $('button.switch-view').prop('id', 'narrow').html('Switch to narrow view');
};
function checkForMobile() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};
function forceSwitchView() {
  let domobj = $('button.switch-view');
  if (domobj.prop('id') === 'wide') {
    maxWidthForNarrView = Math.max( maxWidthForNarrView, $(window).width()*1.11 );
    windowResizeNarr();
  } else if (domobj.prop('id') === 'narrow') {
    minWidthForWideView = Math.min( minWidthForWideView, $(window).width()*0.9 );
    windowResizeWide();
  }
};
function formatUsername(user) {
  if (!user) return '';
  let color = hashStringToHex(user.name);
  let prespan = '';
  if (user.isSuperAdmin) {
    prespan = '<span class="admin">⚡️</span>';
  } else if (user.isAdmin) {
    prespan = '<span class="superadmin">👑</span>';
  }
  if (user.isMuted)       prespan += '<span class="muted">🔇</span>';
  if (user.flair.length)  prespan += '<span class="flair">'+user.flair+'&nbsp;</span>';
  return '<a href="/profile/' + user.name + '"><strong class="username" style="color:' + color + '">' + prespan + user.name + '</strong></a>';
}
function isValidID(id) {
  // mongo IDs are always 24 alphanumeric chars
  return (id.length===24 && id.match(/^[a-z0-9]+$/i));
}
function usersCheckEqual( u, v ) {
  return ( u.id.toString()===v.id.toString() );
}
function checkIfUserInGame(user,game) {
  for (let p=0; p<game.meta.players.length; p++) {
    if ( usersCheckEqual(game.meta.players[p], user) ) {
      return true;
    }
  }

  return false;
}
