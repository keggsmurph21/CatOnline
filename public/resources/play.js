
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
  let message;
  if (options.length) {
    message = `available actions: <strong>${options.join('</strong>, <strong>')}</strong>`;
  } else {
    message = `waiting for ${game.public.waiting.forWho.map( (player) => {
      return player.name;
    }).join(', ')}...`;
  }
  _M.addMessage(message);
}
function setDice(values) {
  for (let i=0; i<values.length; i++) {
    let dots = dieValueToCoordinates[values[i]],
      svg  = '';
    for (let j=0; j<dots.length; j++) {
      svg += `<circle class="die-dot" cx="${dots[j][0]}" cy="${dots[j][1]}" r="0.3"> </circle>`;
    }
    $(`#dice > :nth-child(${i+1}) g.die-dots`).html(svg);
  }
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
  $('#viewTrade')
    .prop('disabled', (game.public.trade.in===null));
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
function build() {
  function buildPublicDataTR(i) {
    let str = ``;

    str += `<tr class="${game.public.players[i].color}">`;
    str +=   `<td>${game.public.players[i].lobbyData.name}</td>`;
    str +=   `<td id="${i}-score"></td>`;
    str +=   `<td id="${i}-resources"></td>`;
    str +=   `<td id="${i}-longest-road"></td>`;
    str +=   `<td id="${i}-dev-cards"></td>`;
    str +=   `<td id="${i}-knights"></td>`;
    str += `</tr>`;

    return str;
  }
  for (let i=0; i<game.public.hexes.length; i++) {
    let hex = game.public.hexes[i];
    $('#tile'+i+' polygon')
      .attr( 'resource', hex.resource )
      .attr( 'class', hex.resource );
    $('#tile'+i+' text')
      .attr( 'class', [6,8].indexOf(hex.roll) > -1 ? 'red' : '' )
      .text( hex.roll ? hex.roll : '' );
  }
  for (let i=0; i< game.public.players.length; i++) {
    // public game content rows
    let tr = buildPublicDataTR(i);
    $('#public-data tr:last').after(tr);
  }

  if (game.private !== null) {

    function buildResourceTR(res) {
      let str = ``;

      str += `<tr class="${res}">`;
      str +=   `<td>${res}</td>`;
      str +=   `<td id="num-${res}"></td>`;
      str +=   `<td><button type="button" class="discard" name="${res}" disabled="disabled">discard</button>`;
      str += `</tr>`;

      return str;
    }
    function buildDevCardTR(dc) {
      let str = ``;

      str += `<tr class="${dc}">`;
      str +=   `<td>${dc}</td>`;
      str +=   `<td id="num-${dc}"></td>`;
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
    $('#private-data').html(`<table id="private-resources">
      <tr class="header">
        <th colspan="100">resources</th>
      </tr>
    </table>
    <table id="private-dev-cards">
      <tr class="header">
        <th colspan="100">dev cards</th>
      </tr>
    </table>`);

    // resources content rows
    for (let res in game.private.resources) {
      let tr = buildResourceTR(res);
      $('#private-resources tr:last').after(tr);
    }

    // development cards content rows
    for (let dc in game.private.unplayedDCs) {
      let tr = buildDevCardTR(dc);
      $('#private-dev-cards tr:last').after(tr);
    }

    buildButtons();
  }

}
function populate() {
  function board() {

    //
    for (let i=0; i<game.public.juncs.length; i++) {
      let spot = $('#spot'+i),
          data = game.public.juncs[i],
          owner= (data.owner>-1 ? game.public.players[data.owner] : null);

      if (owner!==null)
        spot.addClass(owner.color);
      if (data.isCity)
        spot.addClass('city');
      if (data.port !== null)
        $('#port'+data.port.num).attr( 'class', 'port '+data.port.type );

    }
    for (let i=0; i<game.public.roads.length; i++) {
      let road = $('#road'+i),
          data = game.public.roads[i],
          owner= (data.owner>-1 ? game.public.players[data.owner] : null);

      if (owner!==null)
        road.addClass(owner.color);
    }
    setDice(game.public.dice.values);

  }
  function publicInfo() {

    function getVPString(i) {
      // get the score ... if this is the private player and the private
      // score is different from the public score (e.g. if holding a VP dev card)
      // then display it like "publicScore (privateScore)"
      let pubScore = game.public.players[i].publicScore,
        privScore  = '';
      if (game.private !== null) {
        if (i === game.private.playerID && pubScore !== game.private.privateScore)
          privScore = ` (${game.private.privateScore})`;
      }
      return (pubScore + privScore);
    }
    function getLRString(i) {
      let str = game.public.players[i].longestRoad;
      if (game.public.hasLongestRoad === game.private.playerID)
        str += '🚗';
      return str;
    }
    function getLAString(i) {
      let str = game.public.players[i].numKnights;
      if (game.public.hasLargestArmy === game.private.playerID)
        str += '⚔️';
      return str;
    }

    for (let i=0; i<game.public.players.length; i++) {
      $(`#${i}-score`).html( getVPString(i) );
      $(`#${i}-resources`).html( game.public.players[i].resourcesInHand );
      $(`#${i}-longest-road`).html( getLRString(i) );
      $(`#${i}-dev-cards`).html( game.public.players[i].devCardsInHand );
      $(`#${i}-knights`).html( getLAString(i) );
    }
  }
  function privateInfo() {
    if (game.private !== null) {

      for (let res in game.private.resources) {
        $(`#num-${res}`).html( game.private.resources[res] );
      }
      for (let dc in game.private.unplayedDCs) {
        $(`#num-${dc}`).html( game.private.unplayedDCs[dc] );
      }

      setStatusMessage(game.private.adjacents);
      updateButtons();

    }
  }

  board();
  publicInfo();
  privateInfo();
  listen.set(game);
}
function onConnect(data) {
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
  		//listen.to('offerTrade');
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
  		//listen.to('tradeBank');
  	});
  }

  game = data;
  console.log(game);

  build();
  populate();
  bindListeners();
}
function onUpdate(data) {


  if (data.success) {

    function renderClientResponse(message, opts={ class:'normal' }) {

      // send message from the server to the message interface
      let who = game.public.players[message[0]].lobbyData.name;
      if (game.private !== null) {
        if (message[0] === game.private.playerID)
          who = 'you';
      }
      _M.addMessage(` &mdash; <strong>${who}</strong> ${message[1]}`);

    }
    for (let i=0; i<data.messages.length; i++) {
      renderClientResponse(data.messages[i]);
    }

    game = data.game;
    populate();

  } else {

    _M.addMessage(data.message, { class:'error' });

  }
}

// set global variables
let gameid, game, panzoom,
  listen = {

    to(source, args) {
      console.log(source, args);
      if (listen.for[source]!==undefined) {
        emitAction({
          player:game.private.playerID,
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
    console.log('callback',data);
    onUpdate(data);
  });

});
