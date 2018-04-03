
function emitAction(data) {
  console.log('player',data.player,'fired an action:',data);
  socket.emit('play action', data);
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
function buildGameBoard(game) {

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

  player = game.private.playerID;
  listen.set(game);
}
function buildPublicDataTR(i, player, priv) {
  let str = ``;

  str += `<tr class="${player.color}">`;
  str +=   `<td>${player.lobbyData.name}</td>`;

  // get the score ... if this is the private player and the private
  // score is different from the public score (e.g. if holding a VP dev card)
  // then display it like "publicScore (privateScore)"
  let pubScore = player.publicScore,
    privScore  = '';
  if (priv) {
    if (i === priv.playerID && pubScore !== priv.privateScore)
      privScore = ` (${priv.privateScore})`;
  }
  str +=   `<td>${pubScore + privScore}</td>`;
  str +=   `<td>${player.resourcesInHand}</td>`;
  str +=   `<td>${player.longestRoad}</td>`;
  str +=   `<td>${player.devCardsInHand}</td>`;
  str +=   `<td>${player.numKnights}</td>`;
  str += `</tr>`;

  return str;
}
function buildPrivateTables() {
  return `` +
  `<table id="private-resources">
    <tr class="header">
      <th colspan="100">resources</th>
    </tr>
  </table>
  <table id="private-dev-cards">
    <tr class="header">
      <th colspan="100">dev cards</th>
    </tr>
  </table>`;
}
function buildResourceTR(res, num) {
  let str = ``;

  str += `<tr class="${res}">`;
  str +=   `<td>${res}</td>`;
  str +=   `<td>${num}</td>`;
  str += `</tr>`;

  return str;
}
function buildDevCardTR(dc, num) {
  let str = ``;

  str += `<tr class="${dc}">`;
  str +=   `<td>${dc}</td>`;
  str +=   `<td>${num}</td>`;
  str += `</tr>`;

  return str;
}
function onConnect(data) {

  game = data;
  buildGameBoard(game);

  for (let i=0; i< game.public.players.length; i++) {
    // public game content rows
    let tr = buildPublicDataTR(i, game.public.players[i], game.private);
    $('#public-data tr:last').after(tr);
  }

  if (game.private !== null) {
    // table skeletons and header rows
    let tables = buildPrivateTables();
    $('#private-data').html(tables);

    // resources content rows
    for (let res in game.private.resources) {
      let tr = buildResourceTR(res, game.private.resources[res]);
      $('#private-resources tr:last').after(tr);
    }

    // development cards content rows
    for (let dc in game.private.unplayedDCs) {
      let tr = buildDevCardTR(dc, game.private.unplayedDCs[dc]);
      $('#private-dev-cards tr:last').after(tr);
    }

  }

  bindListeners();
}

function onUpdate(data) {
  //listen.set(data);
}

// set global variables
let gameid, game, panzoom, player,
  listen = {

    to(source, args) {
      console.log(source, args);
      if (listen.for[source]!==undefined) {
        emitAction({
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

  };

// once all DOM is rendered
$( function(){

  // tell the socket that we're here to request game data
  // so that we can populate our html
  socket.emit('play connect', null);
  // socket response
  socket.on('play connect', function(data) {
    onConnect(data);
  });

  // set semiglobal objects
  panzoom = svgPanZoom('svg#gameboard');

  socket.on('play callback', function(data) {
    console.log(data);
    onUpdate(data);
  });

});
