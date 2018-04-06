
function emitAction(data) {
  console.log('player',data.player,'fired an action:',data);
  socket.emit('play action', data);
}
function setWaitingMessage() {
  let adjs = game.private.adjacents;
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
    message = `waiting for %%${game.public.waiting.forWho.join('%%, %%')}%%...`;
    message = escapeString(message);
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

  $('#public-data').after(`
    <div id="public-trade">
      <div id="public-trade-current"></div>
      <div id="public-trade-buttons"></div>
    </div>`);
  escapes = {};
  for (let i=0; i<game.public.hexes.length; i++) {
    let hex = game.public.hexes[i];
    escapes[`%%${hex.resource}%%`] =
      `<strong class="${hex.resource}">${hex.resource}</strong>`;

    $('#tile'+i+' polygon')
      .attr( 'resource', hex.resource )
      .attr( 'class', hex.resource );
    $('#tile'+i+' text')
      .attr( 'class', [6,8].indexOf(hex.roll) > -1 ? 'red' : '' )
      .text( hex.roll ? hex.roll : '' );
  }
  for (let i=0; i< game.public.players.length; i++) {

    escapes[`%%${i}%%`] =
      `<strong class="${
        game.public.players[i].color}">${
        game.public.players[i].lobbyData.name}</strong>`;

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
      buttons.push( buildButton('offerTrade', 'Offer trade') );
      buttons.push( buildButton('tradeBank', 'Trade bank') );

      for (let i=0; i<buttons.length; i++) {
        $('#buttons button:last').after( buttons[i] );
      }

      $('#public-trade-buttons').html( buildButton('cancelTrade', 'cancel', 'button', true) );
      $('#public-trade-buttons button:last').after( buildButton('acceptTrade', 'accept', 'button', true) );
      $('#public-trade-buttons button:last').after( buildButton('declineTrade', 'decline', 'button', true) );

    }

    // table skeletons and header rows
    $('#private-data').html(
        `<table id="private-resources">
        <tr class="header">
          <th colspan="100">resources</th>
        </tr>
      </table>
      <table id="private-dev-cards">
        <tr class="header">
          <th colspan="100">dev cards</th>
        </tr>
      </table>`);
    function buildTradeModalResourceTR(res) {
      return `<tr class="${res}">
        <td>${res}</td>
        <td>
          <button type="button" class="decrement" name="${res}" onclick="modals.Trade.decrement(this);">-</button>
          <span class="resource-count" name="${res}">0</span>
          <button type="button" class="increment" name="${res}" onclick="modals.Trade.increment(this);">+</button>
        </td>
      </tr>`;
    }
    function buildTradeModalPlayerTR(i) {
      return `<tr class="player-${i}">
        <td> <input type="checkbox" name="${i}" class="trade-partner player" onclick="modals.Trade.toggleCheck(this);" /> </td>
        <td>${escapeString(`%%${i}%%`)}</td>
      </tr>`;
    }


    // resources content rows
    for (let res in game.private.resources) {
      let tr = buildResourceTR(res);
      $('#private-resources tr:last').after(tr);

      tr = buildTradeModalResourceTR(res);
      $('.trade-out tr:last').after(tr);
      $('.trade-in tr:last').after(tr);
    }


    if (game.public.players.length > 1) {
      $('.trade-with tr:last').after(
        `<tr>
          <th></th>
          <th>Players</th>
        </tr>`);
      $('.trade-with table').after(
        `<button type="button" onclick="modals.Trade.selectAll();">Select all</button>`);
    }
    for (let i=0; i<game.public.players.length; i++) {
      if (i !== game.private.playerID) {
        tr = buildTradeModalPlayerTR(i);
        $('.trade-with tr:last').after(tr);
      }
    }

    // development cards content rows
    for (let dc in game.private.unplayedDCs) {
      let tr = buildDevCardTR(dc);
      $('#private-dev-cards tr:last').after(tr);
    }

    escapes[`%%${game.private.playerID}%%`] = `<strong class="${
      game.public.players[game.private.playerID].color}">you</strong>`;

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

    modals.Trade.setTrade(game.public.trade);
    $('#public-trade-current').html( (modals.Trade.trade.out === {}
      ? escapeString(`%%${
        game.public.currentPlayerID}%%: ${
          modals.Trade.toString()}` )
      : '') );
  }
  function privateInfo() {
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
            .css('visiblity', 'hidden');
        }
      }
      if (canPlayDC) {
        $('button.play').show();
      } else {
        $('button.play').hide();
      }

      if (game.private.adjacents.indexOf('_e_cancel_trade') > -1) {
        $('#cancelTrade').show();
      } else {
        $('#cancelTrade').hide();
      }
      if (game.private.adjacents.indexOf('_e_accept_trade_other') > -1) {
        $('#acceptTrade').show();
      } else {
        $('#acceptTrade').hide();
      }
      if (game.private.adjacents.indexOf('_e_decline_trade') > -1) {
        $('#declineTrade').show();
      } else {
        $('#declineTrade').hide();
      }

      modals.update();
    }

    if (game.private !== null) {

      for (let res in game.private.resources) {
        $(`#num-${res}`).html(game.private.resources[res]);
        $(`#modal-offer-trade .trade-out .resource-count[name=${res}]`).html(0);
      }
      for (let dc in game.private.unplayedDCs) {
        let names = {
          monopoly  : 'Monopoly',
          knight    : 'Knight',
          yop       : 'Year of Plenty',
          rb        : 'Road Building',
          vp        : 'Victory Point'
        };
        $(`#num-${dc}`).html( game.private.unplayedDCs[dc] );
        escapes[`%%${names[dc]}%%`] =
          `<strong class="${dc}">${names[dc]}</strong>`;
      }

      setWaitingMessage();
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

    $('#declineTrade').click( (i) => {
      listen.to('declineTrade');
    })

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
      modals.Trade.set('players');
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
      modals.Trade.set('bank');
  	});
  }

  game = data;
  console.log(game);

  build();
  populate();
  bindListeners();
}
function escapeString(str) {
  let toBeEscaped = Object.keys(escapes);
  for (let i=0; i<toBeEscaped.length; i++) {
    while (str.indexOf(toBeEscaped[i]) > -1)
      str = str.replace(
        toBeEscaped[i],
        escapes[toBeEscaped[i]])
  };
  return str;
}
function onUpdate(data) {

  if (data.success) {

    function addServerMessage(message, opts={ class:'normal' }) {

      // send message from the server to the message interface
      _M.addMessage( escapeString(message) );

    }
    for (let i=0; i<data.messages.length; i++) {
      addServerMessage(data.messages[i]);
    }

    game = data.game;
    populate();

  } else {

    _M.addMessage(data.message, { class:'error' });

  }
}

// set global variables
let gameid, game, escapes, panzoom,
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
const modals = {
  Trade  : {
    setTrade(trade) {
      for (let res in trade.out) {
        $(`#modal-offer-trade .trade-out .resource-count[name=${res}]`).html(trade.out[res]);
      }
      for (let res in trade.in) {
        $(`#modal-offer-trade .trade-in .resource-count[name=${res}]`).html(trade.in[res]);
      }
      $('#modal-offer-trade .trade-partner.player').prop('checked', false);
      for (let i=0; i<trade.with.length; i++) {
        $(`#modal-offer-trade .trade-partner.player[name=${i}]`).prop('checked', true);
      }
      modals.Trade.update()
    },
    update() {

      modals.Trade.parse();

      $('#modal-offer-trade .decrement').each( (i,item) => {
        let data = modals.Trade.get(item);
        $(item).prop( 'disabled', data.num===0 );
      });
      $('#modal-offer-trade .trade-out .increment').each( (i,item) => {
        let data = modals.Trade.get(item);
        $(item).prop( 'disabled', data.num === game.private.resources[data.res] );
      });
      $('#modal-offer-trade .trade-string').html( modals.Trade.toString() );
    },
    get(dom) {
      let data = {},
        obj = $(dom),
        table = obj.closest('div'),
        res = obj.attr('name'),
        span = table.find(`.resource-count[name=${res}]`),
        num = parseInt(span.html());
      return {
        table : table,
        res   : res,
        span  : span,
        num   : num
      };
    },
    parse() {
      $('#modal-offer-trade .trade-out .resource-count').each( (i,item) => {
        let data = modals.Trade.get(item);
        modals.Trade.trade.out[data.res] = data.num;
      });
      $('#modal-offer-trade .trade-in .resource-count').each( (i,item) => {
        let data = modals.Trade.get(item);
        modals.Trade.trade.in[data.res] = data.num;
      });
    },
    toString() {
      function toString(set) {
        let keys = Object.keys(set).filter( (key) => {
          return set[key] > 0;
        });
        if (keys.length) {
          for (let i=0; i<keys.length; i++) {
            keys[i] = `${set[keys[i]]} %%${keys[i]}%%`;
          }
          return keys.join(', ');
        }
        return '<strong>nothing</strong>';
      }

      let whos;
      if (modals.Trade.trade.with === 'bank') {
        whos = '<strong>the Bank</strong>';
      } else {
        if (modals.Trade.trade.with.length) {
          whos = modals.Trade.trade.with
            .map( (item) => {
              return `%%${item}%%`;
            })
            .join(', ');
        } else {
          whos = '<strong>no one</strong>';
        }
      }

      let outs = toString(modals.Trade.trade.out),
        ins = toString(modals.Trade.trade.in),
        str = `trading ${outs} for ${ins} with ${whos}`;
      str = escapeString(str);
      return str;
    },
    decrement(dom) {
      let data = modals.Trade.get(dom);
      if (data.num > 0) {
        data.span.html(data.num-1);
        modals.Trade.update();
      }
    },
    increment(dom) {
      let data = modals.Trade.get(dom);
      if (data.num < game.private.resources[data.res] || data.table.hasClass('trade-in')) {
        data.span.html(data.num+1);
        modals.Trade.update();
      }
    },
    set(partner) {

      $('#modal-offer-trade').show();

      if (partner==='bank') {
        $('#modal-offer-trade .trade-partner.bank').prop('checked', true);
        $('#modal-offer-trade .trade-partner.player').prop('checked', false);
        modals.Trade.trade.with = 'bank';
        modals.Trade.update();
      } else if (partner==='players') {
        modals.Trade.selectAll();
      }

    },
    selectAll() {

      modals.Trade.trade.with = [];
      $('#modal-offer-trade .trade-partner.bank').prop('checked', false);
      $('#modal-offer-trade .trade-partner.player').each( (i,item) => {
        let obj = $(item);
        obj.prop('checked', true);
        modals.Trade.trade.with.push( parseInt(obj.attr('name')) );
      });
      modals.Trade.update();

    },
    toggleCheck(dom) {

      let obj = $(dom);
      if (obj.attr('name')==='bank') {

        if (obj.prop('checked')) {
          modals.Trade.trade.with = 'bank';
          $('#modal-offer-trade .trade-partner.player').prop('checked', false);
        } else {
          modals.Trade.trade.with = [];
        }

      } else {

        let i = parseInt(obj.attr('name'))
        if (obj.prop('checked')) {
          if ($('#modal-offer-trade .trade-partner.bank').prop('checked'))
            modals.Trade.trade.with = [];
          $('#modal-offer-trade .trade-partner.bank').prop('checked', false);
          modals.Trade.trade.with.push(i);
        } else {
          modals.Trade.trade.with.splice( modals.Trade.trade.with.indexOf(i), 1 );
        }

      }
      modals.Trade.update();

    },
    cancel() {
      $('#modal-offer-trade').hide();
    },
    confirm() {
      function toString(set) {
        let keys = Object.keys(set).filter( (key) => {
          return set[key] > 0;
        });
        if (keys.length) {
          for (let i=0; i<keys.length; i++) {
            keys[i] = `${set[keys[i]]} ${keys[i]}`;
          }
          return keys.join(' ');
        }
      }

      if (modals.Trade.trade.with==='bank') {
        let trade = `${
          toString(modals.Trade.trade.out)} = ${
          toString(modals.Trade.trade.in)}`;
        listen.to('tradeBank', trade);
      } else if (modals.Trade.trade.with.length) {
        let trade = `${
          toString(modals.Trade.trade.out)} = ${
          toString(modals.Trade.trade.in)} ${
            modals.Trade.trade.with
              .map( (item) => { return `@${item}`; })
              .join(' ')
          }`;
        listen.to('offerTrade', trade);
      } else {
        _M.addMessage('You must choose at least one player to trade with.');
      }
    },
    trade : { out:{}, in:{}, with:[] }
  },
  DC     : {
    update() {
      console.log('dev card modal update');
    }
  },
  update() {
    modals.Trade.update();
    modals.DC.update();
  }
}

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
