
function emit(data) {
  console.log('player',data.player,'fired an action:',data);
  socket.emit('play action', data);
}
function bindGameData(game) {
  console.log(game);
  // use public and private data from the server
  // to build our visible game board
  for (let i=0; i<game.public.hexes.length; i++) {
    let hex = game.public.hexes[i];
    $('#tile'+i+' polygon')
      .attr( 'resource', hex.resource )
      .attr( 'class', hex.resource );
    $('#tile'+i+' text')
      .attr( 'class', [6,8].indexOf(hex.roll) > -1 ? 'red' : '' )
      .text( hex.roll ? hex.roll : '' );
  }
  for (let i=0; i<game.public.juncs.length; i++) {
    let spot = $('#spot'+i),
        data = game.public.juncs[i],
        owner= (data.owner>-1 ? game.public.players[data.owner] : null);

    if (owner!==null)
      spot.addClass(owner.color);
    if (data.isCity)
      spot.addClass('city');
    if (data.port !== null) {
      $('#port'+data.port.num).attr( 'class', 'port '+data.port.type );
    }
  }
  for (let i=0; i<game.public.roads.length; i++) {
    let road = $('#road'+i),
        data = game.public.roads[i],
        owner= (data.owner>-1 ? game.public.players[data.owner] : null);

    if (owner!==null)
      road.addClass(owner.color);
  }
  /*for (let i=0; i<game.public.players.length; i++) {
    let player = game.public.players[i];
    for (let j=0; j<player.roads.length; j++) {
      $('#road'+j).attr( 'class', 'road player_'+player.color );
    }
    for (let j=0; j<player.settlements.length; j++) {
      $('#spot'+j).attr( 'class', 'spot player_'+player.color );
    }
    for (let j=0; j<player.cities.length; j++) {
      $('#spot'+j).attr( 'class', 'spot city player_'+player.color );
    }
    //console.log('`player`');
    //console.log(player);
  }*/
  //console.log('`private`');
  //console.log(game.private);
  player = game.private.playerID;
  listen.set(game);
}
function getTypeAndNum(str) {
  let type = str.slice(0,4);
  let num  = parseInt(str.slice(4));
  if (isNaN(num))
    throw new GUIError('Unable to parse num for '+str);

  return [type, num];
}
function bindListeners() {

  // listeners for SVG elements
  let selectors = ['.road', '.spot', '.port'];
  for (let i=0; i<selectors.length; i++) {
    $(selectors[i]).click( (j) => {
      let [type, num] = getTypeAndNum(j.target.id);
      listen.to(type, [num]);
    });
  }
  $('.tile *').click( (t) => {
    let [type, num] = getTypeAndNum(
      $(t.target).closest('.tile').attr('id'));
    listen.to(type, [num]);
  });

  // listeners for buttons
  $('#acceptTrade').click( (i) => {
		listen.to('acceptTrade');
	});

  $('#buyDevelopmentCard').click( (i) => {
		listen.to('buyDevelopmentCard');
	});

  $('#cancelTrade').click( (i) => {
		listen.to('cancelTrade');
	});

  $('#endTurn').click( (i) => {
		listen.to('endTurn');
	});

  $('#offerTrade').click( (i) => {
		listen.to('offerTrade');
	});

  $('#playMonopoly').click( (i) => {
		listen.to('playMonopoly');
	});

  $('#playRoadBuilder').click( (i) => {
		listen.to('playRoadBuilder');
	});

  $('#playVictoryPoint').click( (i) => {
		listen.to('playVictoryPoint');
	});

  $('#playYearOfPlenty').click( (i) => {
		listen.to('playYearOfPlenty');
	});

  $('#dice').click( (i) => {
		listen.to('dice');
	});

  $('#discard').click( (i) => {
		listen.to('discard');
	});

  $('#player').click( (i) => {
		listen.to('player');
	});

  $('#tradeBank').click( (i) => {
		listen.to('tradeBank');
	});

}
function update(data) {
  listen.set(data);
}

// set global variables
let gameid, game, panzoom, player;

let listen = {

  to(source, args) {
    console.log(source, args);
    if (listen.for[source]!==undefined) {
      emit({
        gameid:gameid,
        player:player,
        edge:listen.for[source],
        args:args });
    }
  },

  set(game) {
    listen.reset();
    for (let i=0; i<game.private.adjacents.length; i++) {
      let edge = STATE_GRAPH.edges[game.private.adjacents[i]];
      listen.for[edge.listen] = edge.name;
      console.log(edge.name);
    }
  },

  reset() {
    listen.for = {};
  },

  for : {}

}

// once all DOM is rendered
$( function(){

  // set semiglobal objects
  panzoom = svgPanZoom('svg#gameboard');

  game = JSON.parse( $('#json').text() );
  gameid = game.gameid;
  bindGameData(game);
  bindListeners();
  //console.log(STATE_GRAPH);

  socket.on('play callback', function(data) {
    console.log(data);
    bindGameData(data);
  })

});
