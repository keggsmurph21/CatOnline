
function getEdge(estring) {
  return _STATE_GRAPH.edges[estring];
}
function emitAction(data) {
  console.log('player',data.player,'fired an action:',data);
  socket.emit('play action', data);
}
function setWaitingMessage() {
  let adjs = game.private.adjacents;
  let options = new Set();
  for (let i=0; i<adjs.length; i++) {
    let description = getEdge([adjs[i]]).description;
    if (description.length)
      options.add(description);
  }
  options = Array.from(options);
  let message;
  if (options.length) {
    message = `available actions: <strong>${options.join('</strong>, <strong>')}</strong>`;
  } else {
    message = `waiting for %%${
      game.public.waiting.join('%%, %%')}%%...`;
    message = escapeString(message);
  }
  $('#waiting-for').html(message);
  //_M.addMessage(message);
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
  escapes = {
    '%%Longest Road%%':'<strong class="longest-road">Longest Road</strong>',
    '%%Largest Army%%':'<strong class="largest-army">Largest Army</strong>'
  };
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
    $(`#tile${i} title`).text(`resource:${hex.resource} ${hex.roll ? `roll:${hex.roll}` : ''}`);
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
      str +=   `<td><button type="button" class="discard" name="${res}">discard</button>`;
      str += `</tr>`;

      return str;
    }
    function buildDevCardTR(dc) {
      let str = ``;

      str += `<tr class="${dc}">`;
      str +=   `<td>${dc}</td>`;
      str +=   `<td id="num-${dc}"></td>`;
      str +=   `<td><button type="button" class="play" name="${dc}">play</button>`;
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
        `<table id="private-resources" class="private-data-table">
        <tr class="header">
          <th colspan="100">resources</th>
        </tr>
      </table>
      <table id="private-dev-cards" class="private-data-table">
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
    function buildDCModalButton(res) {
      return `<button type="button" class="${res}" name="${res}">${escapeString(`%%${res}%%`)}</span>`;
    }


    // resources content rows
    for (let res in game.private.resources) {
      let tr = buildResourceTR(res);
      $('#private-resources tr:last').after(tr);

      tr = buildTradeModalResourceTR(res);
      $('.trade-out tr:last').after(tr);
      $('.trade-in tr:last').after(tr);

      tr = buildDCModalButton(res);
      $('#modal-play-dc .dc-resources').append(tr);
    }
    $('#modal-play-dc .dc-resources').append(
      `<button type="button" name="reset"><strong>reset</strong></span>`);


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

    $('.tile, .tile *').closest('.tile').children().hover( (i) => {
      let target = $(i.target).closest('g');
      if (i.type === 'mouseenter') {
        if (target.hasClass('active') || target.hasClass('dc-choose')) {
          let j = parseInt(target.attr('id').slice(4));
          $('#demo-robber *').attr('num', j).css('visibility', 'visible');
          moveRobber(j, head='#demo-robber');
          //target.closest('g').children().off('hover');
        }
      }
    });

    buildButtons();
  }

}
function moveRobber(i, head='#robber') {
  let pts = $(`#tile${i}`).find('polygon').attr('points').split(' ');
  pts = pts.slice(0,pts.length-1);

  let x=0, y=0;
  for (let i=0; i<pts.length; i++) {
    if (i%2) {
      y += parseFloat(pts[i]);
    } else {
      x += parseFloat(pts[i]);
    }
  }
  x = x/(pts.length/2);
  y = y/(pts.length/2);

  let width = parseFloat(pts[2]) - parseFloat(pts[0]);

  const triangleWidth = 5/12*width;
  const triangleHeight= 5/6*width;
  const circleRadius  = 1/4*width;

  const xTransforms = [0, triangleWidth, -triangleWidth, 0];
  const yTransforms = [0, triangleHeight, triangleHeight,0];
  const yOffset     = (circleRadius + triangleHeight)/2 - circleRadius;

  $(`${head} .robber-head`).attr('cx', x);
  $(`${head} .robber-head`).attr('cy', y-yOffset);
  $(`${head} .robber-head`).attr('r', circleRadius);

  pts = [];
  for (let i=0; i<xTransforms.length; i++) {
    pts.push(x + xTransforms[i]);
    pts.push(y + yTransforms[i] - yOffset);
  }
  $(`${head} .robber-body`).attr('points', pts.join(' '));

  if (head === '#robber') {
    $(`.tile text`).show();
    $(`#tile${i} text`).hide();
  }

}
function populate() {
  function board() {

    moveRobber(game.public.robber);
    moveRobber(game.public.robber, head='#demo-robber');

    $('.tile').addClass('robbable');
    $(`#tile${game.public.robber}`).removeClass('robbable');

    //
    $('.spot').removeClass(['fortifiable', 'init-settleable', 'settleable', 'stealable']);
    for (let i=0; i<game.public.juncs.length; i++) {
      let spot = $('#spot'+i),
          data = game.public.juncs[i],
          owner= (data.owner>-1 ? game.public.players[data.owner] : null);

      if (game.private !== null) {
        for (let j=0; j<data.hexes.length; j++) {
          if (data.hexes[j] === game.public.robber
            && data.owner !== -1
            && data.owner !== game.private.playerID)
            spot.addClass('stealable');
        }
      }
      if (owner!==null) {
        spot.addClass(owner.color)
          .attr('owner',owner.playerID);
        if (data.isCity) {
          spot.addClass('city');
        } else {
          if (game.private !== null) {
            if (owner.playerID === game.private.playerID)
              spot.addClass('fortifiable');
          }
        }
      } else if (data.isSettleable) {
        spot.addClass('init-settleable');
        for (let j=0; j<data.roads.length; j++) {
          if (game.private !== null) {
            console.log(spot, $(`#road${j}`));
            if (game.public.roads[data.roads[j]].owner === game.private.playerID)
              spot.addClass('settleable');
          }
        }
      }
      if (data.port !== null)
        $('#port'+data.port.num).attr( 'class', 'port '+data.port.type );

      spot.siblings('title').text(`owner:${
        owner===null ? 'none' : owner.lobbyData.name} ${
          data.port !== null
            ? `port:${data.port.type}`
            : ''
        }`);

    }
    $('.road').removeClass(['paveable', 'init-paveable']);
    for (let i=0; i<game.public.roads.length; i++) {
      let road = $('#road'+i),
          data = game.public.roads[i],
          owner= (data.owner>-1 ? game.public.players[data.owner] : null);

      if (owner!==null) {
        road.addClass(owner.color)
          .attr('owner',owner.playerID);
      } else if (game.private !== null) {
        let adjacentRoads = roadGetAdjRoads(game.public, i);
        for (let j=0; j<adjacentRoads.length; j++) {
          if (game.public.roads[adjacentRoads[j]].owner === game.private.playerID)
            road.addClass('paveable');
        }
        for (let j=0; j<data.juncs.length; j++) {
          if (game.public.juncs[data.juncs[j]].owner === game.private.playerID) {
            road.addClass('paveable');
            let settlements = game.public.players[game.private.playerID].settlements;
            if (data.juncs[j] === settlements[settlements.length-1]) {
              road.addClass('init-paveable');
            }
          }
        }
      }

      road.siblings('title').text(`owner:${owner===null ? 'none' : owner.lobbyData.name}`);

    }

    $('#demo-robber').css('visibility', ($('.tile.robbable.active').length>0 ? 'visible' : 'hidden'));
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
      if (game.private !== null) {
        if (game.public.hasLongestRoad === game.private.playerID)
          str += '🚗';
      }
      return str;
    }
    function getLAString(i) {
      let str = game.public.players[i].numKnights;
      if (game.private !== null) {
        if (game.public.hasLargestArmy === game.private.playerID)
          str += '⚔️';
      }
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

      if (game.private.flags.discard > 0) {
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

      $(`button.play`).prop('disabled', true).hide();
      for (let dc in game.private.flags.canPlayDC) {
        if (game.private.flags.canPlayDC[dc]) {
          $(`button.play[name=${dc}]`).prop('disabled', false);
          $('button.play').show();
        }
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
        $(`#modal-trade .trade-out .resource-count[name=${res}]`).html(0);
      }
      for (let dc in game.private.unplayedDCs) {
        $(`#num-${dc}`).html( game.private.unplayedDCs[dc]+game.private.unplayableDCs[dc] );
        escapes[`%%${devCardNames[dc]}%%`] =
          `<strong class="${dc}">${devCardNames[dc]}</strong>`;
      }

      setWaitingMessage();
      updateButtons();

    }
  }

  board();
  publicInfo();
  privateInfo();
  listen.set();

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
    $('.tile, .tile *').click( (t) => {
      let [type, num] = getTypeAndNum(
        $(t.target).closest('.tile').attr('id'));
      listen.to(type, [num]);
    });

    $('.robber, .robber *').click( (i) => {
      let num = $(i.target).attr('num');
      if ($(`#tile${num}`).hasClass('robbable')) {
        $(`#tile${num}`).click();
      }
    })

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
      let type = $(i.target).attr('name');
      console.log(type);
      modals.DC.set(type);
  	});

    $('#dice').click( (i) => {
  		listen.to('dice');
  	});

    $('button.discard').click( (i) => {
      let res = $(i.target).attr('name');
  		listen.to('discard', `1 ${res} = 0 ${res}`);
  	});

    $('.spot.stealable').click( (i) => {
      let j = parseInt($(i.target).attr('id').slice(4));
      let player = game.public.juncs[j].owner;
  		listen.to('player', [player]);
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

    for (let i=0; i<data.messages.length; i++) {
      _M.addMessage( escapeString(data.messages[i]) );
    }

    getEdge(data.edge).onSuccess()
    game = Object.assign({}, data.game);
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
        let edge = getEdge(listen.for[source]);
        if (edge.confirm.length) {
          let response = confirm(edge.confirm);
          if (!response)
            return;
        }
        emitAction({
          player:game.private.playerID,
          edge:listen.for[source],
          args:args });
      }
    },

    set() {
      listen.reset();
      if (game.private !== null) {
        $('#gameboard *').removeClass('active');

        for (let i=0; i<game.private.adjacents.length; i++) {
          let edge = getEdge(game.private.adjacents[i]);
          listen.for[edge.listen] = edge.name;

          if (edge.activate.length)
            $(edge.activate)
              .addClass('active')
              .siblings('title').text(edge.title);
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
const devCardNames = {
  monopoly  : 'Monopoly',
  knight    : 'Knight',
  yop       : 'Year of Plenty',
  rb        : 'Road Building',
  vp        : 'Victory Point'
};
const modals = {
  Trade  : {
    setTrade(trade) {
      for (let res in trade.out) {
        $(`#modal-trade .trade-out .resource-count[name=${res}]`).html(trade.out[res]);
      }
      for (let res in trade.in) {
        $(`#modal-trade .trade-in .resource-count[name=${res}]`).html(trade.in[res]);
      }
      $('#modal-trade .trade-partner.player').prop('checked', false);
      for (let i=0; i<trade.with.length; i++) {
        $(`#modal-trade .trade-partner.player[name=${i}]`).prop('checked', true);
      }
      modals.Trade.update()
    },
    update() {

      modals.Trade.parse();

      $('#public-trade-current').html( game.public.trade.with.length
        ? modals.Trade.toString('public') : '' );

      $('#modal-trade .decrement').each( (i,item) => {
        let data = modals.Trade.get(item);
        $(item).prop( 'disabled', data.num===0 );
      });
      $('#modal-trade .trade-out .increment').each( (i,item) => {
        let data = modals.Trade.get(item);
        $(item).prop( 'disabled', data.num === game.private.resources[data.res] );
      });
      $('#modal-trade .modal-string').html( modals.Trade.toString() );
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
      $('#modal-trade .trade-out .resource-count').each( (i,item) => {
        let data = modals.Trade.get(item);
        modals.Trade.trade.out[data.res] = data.num;
      });
      $('#modal-trade .trade-in .resource-count').each( (i,item) => {
        let data = modals.Trade.get(item);
        modals.Trade.trade.in[data.res] = data.num;
      });
    },
    toString(destination='modal') {
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

      let trade = (destination==='modal'
        ? modals.Trade.trade : game.public.trade);

      let whos;
      if (trade.with === 'bank') {
        whos = '<strong>the Bank</strong>';
      } else {
        if (trade.with.length) {
          whos = trade.with
            .map( (item) => {
              return `%%${item}%%`;
            })
            .join(', ');
        } else {
          whos = '<strong>no one</strong>';
        }
      }

      let outs = toString(trade.out),
        ins = toString(trade.in),
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

      $('#modal-trade').show();

      if (partner==='bank') {
        $('#modal-trade .trade-partner.bank').prop('checked', true);
        $('#modal-trade .trade-partner.player').prop('checked', false);
        modals.Trade.trade.with = 'bank';
        modals.Trade.update();
      } else if (partner==='players') {
        modals.Trade.selectAll();
      }

    },
    selectAll() {

      modals.Trade.trade.with = [];
      $('#modal-trade .trade-partner.bank').prop('checked', false);
      $('#modal-trade .trade-partner.player').each( (i,item) => {
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
          $('#modal-trade .trade-partner.player').prop('checked', false);
        } else {
          modals.Trade.trade.with = [];
        }

      } else {

        let i = parseInt(obj.attr('name'))
        if (obj.prop('checked')) {
          if ($('#modal-trade .trade-partner.bank').prop('checked'))
            modals.Trade.trade.with = [];
          $('#modal-trade .trade-partner.bank').prop('checked', false);
          modals.Trade.trade.with.push(i);
        } else {
          modals.Trade.trade.with.splice( modals.Trade.trade.with.indexOf(i), 1 );
        }

      }
      modals.Trade.update();

    },
    cancel() {
      for (let res in modals.Trade.trade.out) {
        $(`#modal-trade .trade-out .resource-count[name=${res}]`).html(0);
      }
      for (let res in modals.Trade.trade.in) {
        $(`#modal-trade .trade-in .resource-count[name=${res}]`).html(0);
      }
      $('#modal-trade').hide();
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
        _M.addMessage('You must choose at least one player to trade with.', { class:'error' });
      }
    },
    trade : { out:{}, in:{}, with:[] }
  },
  DC     : {
    set(type) {

      modals.DC.reset();

      switch (type) {
        case ('yop'):
          function yopString() {
            if (!modals.DC.card.args.length)
              return 'You have not chosen any resources.';
            return escapeString(`You have chosen %%${modals.DC.card.args.join('%% and %%')}%%.`);
          }
          modals.DC.title = getEdge('_e_play_yop').title;

          $('#modal-play-dc .dc-resources').show();
          $('#modal-play-dc .modal-header').html( escapeString('Confirm %%Year of Plenty%%.') );
          $('#modal-play-dc .modal-string').html( yopString() );

          $('#modal-play-dc .dc-resources button').click( (dom) => {

            let button = $(dom.target).attr('name');
            if (button === 'reset') {
              modals.DC.card.args = [];

            } else if (modals.DC.card.args.length < 2) {
              modals.DC.card.args.push(button);

            }
            $('#modal-play-dc .modal-string').html( yopString() );
            modals.DC.card.isValid = (modals.DC.card.args.length === 2);
            modals.DC.update();

          });
          break;

        case ('rb'):
          function rbString() {
            let selected = $('.dc-select').length;
            return `You have chosen <strong>${selected} road${selected === 1 ? '' : 's'}</strong>.`;
          }
          function updateChooseable() {
            function updateThisChooseable(i,item) {

              let r = $(item).attr('num'),
                adjacentRoads = roadGetAdjRoads(game.public, r);
              for (let i=0; i<adjacentRoads.length; i++) {
                if (game.public.roads[adjacentRoads[i]].owner === -1) {
                  $(`#road${adjacentRoads[i]}`).addClass('dc-choose');
                }
              }
            }
            $('.road').removeClass('dc-choose');
            $(`.road[owner=${game.private.playerID}]`).each( updateThisChooseable );
            $(`.dc-select.paveable`).each( updateThisChooseable );
          }
          modals.DC.title = getEdge('_e_play_rb').title;

          updateChooseable();

          $('#modal-play-dc .dc-resources').hide();
          $('#modal-play-dc .modal-header').html( escapeString('Confirm %%Road Building%%.') );
          $('#modal-play-dc .modal-string').html( rbString() );

          $('.road').click( (dom) => {

            let choice = parseInt($(dom.target).attr('num'));
            if (isNaN(choice)) {
              _M.addMessage('WARNING: choice NaN', $(dom.target));
              return;
            }

            let road = $(`#road${choice}`);

            if (road.hasClass('dc-select')) {
              road.removeClass('dc-select');
              if (road.hasClass('paveable')) {
                $('.dc-select').not('.paveable')
                  .removeClass('dc-select');
              }
            } else {
              if (!road.hasClass('dc-choose')) {
                _M.addMessage('This road is not reachable.', { class:'error' });
              } else if ($('.dc-select').length === 2) {
                _M.addMessage('You have already chosen 2 roads!', { class:'error' });
              } else {
                road.addClass('dc-select');
              }
            }

            updateChooseable();
            $('#modal-play-dc .modal-string').html( rbString() );

            let selected = [];
            modals.DC.card.args = $('.dc-select').each( (key, value) => {
              selected.push(parseInt($(value).attr('num')));
            });
            modals.DC.card.args = selected;
            modals.DC.card.isValid = ($('.dc-select').length === 2);
            modals.DC.update();
          });
          break;

        case ('monopoly'):
          function monopolyString() {
            if (!modals.DC.card.args.length)
              return 'You have not chosen a resource to monopolize.';
            return escapeString(`You have chosen to monopolize %%${modals.DC.card.args[0]}%%.`);
          }
          modals.DC.title = getEdge('_e_play_monopoly').title;

          $('#modal-play-dc .dc-resources').show();
          $('#modal-play-dc .modal-header').html( escapeString('Confirm %%Monopoly%%.') );
          $('#modal-play-dc .modal-string').html( monopolyString() );

          $('#modal-play-dc .dc-resources button').click( (dom) => {

            let button = $(dom.target).attr('name');
            modals.DC.card.args = [button];
            if (button === 'reset')
              modals.DC.card.args = [];

            $('#modal-play-dc .modal-string').html( monopolyString() );
            modals.DC.card.isValid = (modals.DC.card.args.length === 1);
            modals.DC.update();

          });
          break;

        case ('knight'):
          function knightString() {
            if (!modals.DC.card.args.length)
              return 'You have not chosen a tile to block.';
            return 'You have chosen to block a tile.';
          }
          modals.DC.title = getEdge('_e_play_knight').title;

          $('.robbable').addClass('dc-choose');
          $('#modal-play-dc .dc-resources').hide();
          $('#demo-robber *').css('visibility','visible');
          $('#modal-play-dc .modal-header').html( escapeString('Confirm %%Knight%%.') );
          $('#modal-play-dc .modal-string').html( knightString() );

          $('.tile.robbable, .tile.robbable *').click( (dom) => {

            let num = parseInt($(dom.target).closest('.tile').attr('num'));
            moveRobber(num, head='#demo-robber');
            modals.DC.card.args = [num];

            $('.dc-choose').removeClass('dc-choose');

            $('#modal-play-dc .modal-string').html( knightString() );
            modals.DC.card.isValid = (modals.DC.card.args.length === 1);
            modals.DC.update();

          });
          break;

        case ('vp'):
          $('#modal-play-dc .dc-resources').hide();
          $('#modal-play-dc .modal-header').html( escapeString('Confirm %%Victory Point%%.') );
          modals.DC.card.isValid = true;
          break;
        default:
          _M.addMessage('WARNING: unmatched dev card type on set', { class:'error' });
          return;
      }
      modals.DC.card.type = type;

      modals.DC.update();

    },
    reset() {

      modals.DC.title = null;
      modals.DC.card = { type:'', args:[], isValid:false };

      $('#modal-play-dc').show();
      $('#modal-play-dc button[name=confirm]').prop('disabled', true);
      $('.dc-select').removeClass('dc-select');
      $('.dc-choose').removeClass('dc-choose');
      $('#demo-robber *').css('visibility', 'hidden');
    },
    update() {

      if (modals.DC.title)
        $('.dc-choose').attr('title', modals.DC.title);

      $('#modal-play-dc button[name=confirm]').prop('disabled', !modals.DC.card.isValid);
      $('#modal-play-dc .dc-name').html(modals.DC.card.type);

    },
    cancel() {
      modals.DC.reset();
      $('#modal-play-dc').hide();
    },
    confirm() {

      let card = modals.DC.card;
      if (card.isValid) {
        switch(card.type) {
          case ('yop'):
            listen.to('playYOP', card.args);
            break;
          case ('vp'):
            // validation before ^^
            listen.to('playVP');
            break;
          case ('monopoly'):
            listen.to('playMonopoly', card.args);
            break;
          case ('knight'):
            listen.to('playKnight', card.args);
            break;
          case ('rb'):
            listen.to('playRB', card.args);
            break;

          default:
            _M.addMessage('WARNING: unmatched dev card type on confirm', { class:'error' });
        }
      } else {
        _M.addMessage('modal error message', { class:'error' });
      }
    },
    card : { type:'', args:[], isValid:false },
    title: null
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
