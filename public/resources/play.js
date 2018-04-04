
function emitAction(data) {
  console.log('player',data.player,'fired an action:',data);
  socket.emit('play action', data);
}
function setStatusMessage(adjs) {
  let options = new Set();
  for (let i=0; i<adjs.length; i++) {
    let description = _STATE_GRAPH.edges[adjs[i]].description;
    if (description.length)
      options.add(description);
  }
  options = Array.from(options);
  let message = `available actions: <strong>${options.join('</strong>, <strong>')}</strong>`;
  _M.addMessage(message);
}
function updateButtons() {
  function isAdjacent(edge) {
    return (game.private.adjacents.indexOf(edge) > -1);
  }

  $('#buyDevelopmentCard')
    .prop('disabled', !isAdjacent('_e_buy_dc'));
  $('#endTurn')
    .prop('disabled', !isAdjacent('_e_end_turn'));
  $('#offerTrade')
    .prop('disabled', !isAdjacent('_e_offer_trade'));
  $('#')
  $('#tradeBank')
    .prop('disabled', !isAdjacent('_e_trade_bank'));

  if (game.private.flags.disabled > 0) {
    $('button.discard').show();
    for (let res in game.private.resources) {
      $(`button.discard[name=${res}]`)
        .css('visibility', (game.private.resources[res] > 0)
          ? 'visible'
          : 'hidden' );
    }
  } else {
    $('button.discard').hide();
  }

  let canPlayDC = false;
  for (let dc in game.private.flags.canPlayDC) {
    if (game.private.flags.canPlayDC[dc]) {
      canPlayDC = true;
      $(`button.play[name=${dc}]`)
        .css('visiblity', 'visible');
    } else {
      $(`button.play[name=${dc}]`)
        .css('visiblity', 'visible');
    }
  }
  if (canPlayDC) {
    $('button.play').show();
  } else {
    $('button.play').hide();
  }
}
function onConnect(data) {

  game = data;

  function buildGameBoard(game) {

    function buildDice(dice) {
      for (let i=0; i<dice.values.length; i++) {
        let dots = dieValueToCoordinates[dice.values[i]],
          svg  = '';
        for (let j=0; j<dots.length; j++) {
          svg += `<circle class="die-dot" cx="${dots[j][0]}" cy="${dots[j][1]}" r="0.3"> </circle>`;
        }
        $(`#dice > :nth-child(${i+1}) g.die-dots`).html(svg);
      }
    }

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
    buildDice(game.public.dice);

    player = game.private.playerID;
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
  function bindListeners() {

    function getTypeAndNum(str) {
      let type = str.slice(0,4);
      let num  = parseInt(str.slice(4));
      if (isNaN(num))
        throw new GUIError('Unable to parse num for '+str);

      return [type, num];
    }

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

    $('button.play').click( (i) => {
  		listen.to('playYearOfPlenty');
  	});

    $('#dice').click( (i) => {
  		listen.to('dice');
  	});

    $('button.discard').click( (i) => {
  		listen.to('discard');
  	});

    $('#player').click( (i) => {
  		listen.to('player');
  	});

    $('#tradeBank').click( (i) => {
  		listen.to('tradeBank');
  	});

  }

  buildGameBoard(game);

  for (let i=0; i< game.public.players.length; i++) {
    // public game content rows
    let tr = buildPublicDataTR(i, game.public.players[i], game.private);
    $('#public-data tr:last').after(tr);
  }

  if (game.private !== null) {

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
      str +=   `<td><button type="button" class="discard" name="${res}" disabled="disabled">discard</button>`;
      str += `</tr>`;

      return str;
    }
    function buildDevCardTR(dc, num) {
      let str = ``;

      str += `<tr class="${dc}">`;
      str +=   `<td>${dc}</td>`;
      str +=   `<td>${num}</td>`;
      str +=   `<td><button type="button" class="play" name="${dc}" disabled="disabled">play</button>`;
      str += `</tr>`;

      return str;
    }
    function buildButtons() {

      function buildButton(id, text, type='button', enabled=false) {
        return `<button type="${type}" id="${id}"${(enabled
          ? `` : ` disabled="disabled"`)}>${text}</button>`;
      }

      let buttons = [];
      buttons.push( buildButton('buyDevelopmentCard', 'Buy development card') );
      buttons.push( buildButton('endTurn', 'End turn') );
      buttons.push( buildButton('viewTrade', 'View trade') );
      buttons.push( buildButton('offerTrade', 'Offer trade') );
      buttons.push( buildButton('tradeBank', 'Trade bank') );

      for (let i=0; i<buttons.length; i++) {
        $('#buttons button:last').after( buttons[i] );
      }
    }

    // table skeletons and header rows
    let tables = buildPrivateTables();
    $('#private-data').html(tables);

    // resources content rows
    for (let res in game.private.resources) {
      let tr = buildResourceTR(res, game.private.resources[res], enabled=true);
      $('#private-resources tr:last').after(tr);
    }

    // development cards content rows
    for (let dc in game.private.unplayedDCs) {
      let tr = buildDevCardTR(dc, game.private.unplayedDCs[dc], enabled=true);
      $('#private-dev-cards tr:last').after(tr);
    }

    buildButtons();
    updateButtons();
    setStatusMessage(game.private.adjacents);
  }

  bindListeners();
  listen.set(game);
}
function onUpdate(data) {
  if (data.success) {

    function renderClientResponse(message, opts={ class:'normal' }) {

      // send message from the server to the message interface
      let who = ( message[0] === player
        ? '<strong>you</strong>'
        : game.public.players[message[0]].lobbyData.name);
      _M.addMessage(` &mdash; ${who} ${message[1]}`);

    }

    for (let i=0; i<data.args.messages.length; i++) {
      renderClientResponse(data.args.messages[i]);
    }

    if (game.private !== null) {

      function _() {

      }

      let edge = _STATE_GRAPH.edges[data.edge];

      edge.onSuccess(data.args.ret);
      game.private.vertex    = edge.target;
      game.private.adjacents = data.args.adjs;

      updateButtons();
      setStatusMessage(game.private.adjacents);
      listen.set(game);

    }
  } else {

    _M.addMessage(data.args, { class:'error' });

  }
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
      if (game.private !== null) {
        for (let i=0; i<game.private.adjacents.length; i++) {
          let edge = _STATE_GRAPH.edges[game.private.adjacents[i]];
          listen.for[edge.listen] = edge.name;
          console.log(edge.name);
        }
      }
    },

    reset() {
      listen.for = {};
    },

    for : {}

  };
const dieValueToCoordinates = {
  0 : [],
  1 : [[1.5,1.5]],
  2 : [[0.75,2.25],[2.25,0.75]],
  3 : [[0.75,2.25],[1.5,1.5],  [2.25,0.75]],
  4 : [[0.75,0.75],[0.75,2.25],[2.25,0.75],[2.25,2.25]],
  5 : [[0.75,0.75],[0.75,2.25],[1.5,1.5],  [2.25,0.75],[2.25,2.25]],
  6 : [[0.75,0.75],[0.75,1.5], [0.75,2.25],[2.25,0.75],[2.25,1.5],[2.25,2.25]]
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
