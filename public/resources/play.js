
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
    message = escapeString(`available actions: <strong>${options.join(`</strong>, <strong>`)}</strong>`);
  } else {
    message = `waiting for %%${game.public.waiting.join('%%, %%')}%%...`;
    message = escapeString(message);
  }
  $('#waiting-for').html(message);
}
function setDice(values) {
  for (let i=0; i<values.length; i++) {
    $(`#dice > :nth-child(${i+1}) .die-dot`).each( (key,value) => {
      let dot = $(value);
      if (dot.hasClass(`die-${values[i]}`)) {
        dot.show();
      } else {
        dot.hide();
      }
    });
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
    $(`.tile-group .tile-chip`).show();
    $(`#tile${i} .tile-chip`).hide();
  }

}

function populate() {
  /*
   *  handle updates to game data, call this every time we get a new response from the server
   */

  // update things on the board first

  // set up robber
  moveRobber(game.public.robber);
  moveRobber(game.public.robber, head='#demo-robber');
  $('.tile-group').addClass('robbable');
  $(`#tile${game.public.robber}`).removeClass('robbable');
  $('#demo-robber').css('visibility', ($('.tile-group.robbable.active').length>0 ? 'visible' : 'hidden'));

  // set dice
  setDice(game.public.dice.values);

  // show all the settlements & cities, bind appropriate classes
  $('.spot-group').removeClass(['fortifiable', 'init-settleable', 'settleable', 'stealable']);
  for (let i=0; i<game.public.juncs.length; i++) {

    let spot = $(`#spot${i}`),
        data = game.public.juncs[i],
        owner= (data.owner>-1 ? game.public.players[data.owner] : null);

    // check if we could steal from the owner of this spot
    if (game.private !== null) {
      for (let j=0; j<data.hexes.length; j++) {
        if (data.hexes[j] === game.public.robber
          && data.owner !== -1
          && data.owner !== game.private.playerID)
          spot.addClass('stealable');
      }
    }

    // check if it is a settlement or city (or could become a city)
    if (owner!==null) {
      spot.addClass(owner.color)
        .attr('owner',owner.playerID);
      if (data.isCity) {
        spot.find('circle, .spot-settlement').hide();
        spot.find('.spot-city').show();
        spot.addClass('city');
      } else {
        spot.find('circle, .spot-city').hide();
        spot.find('.spot-settlement').show();
        if (game.private !== null) {
          if (owner.playerID === game.private.playerID)
            spot.addClass('fortifiable');
        }
      }

    // check if it could become a settlement
    } else if (data.isSettleable) {
      spot.addClass('init-settleable');
      for (let j=0; j<data.roads.length; j++) {
        if (game.private !== null) {
          if (game.public.roads[data.roads[j]].owner === game.private.playerID)
            spot.addClass('settleable');
        }
      }
    }

    // check if it's a port
    if (data.port !== null)
      $(`#port${data.port.num}`).addClass(data.port.type)
        .find('title').text( data.port.type === 'mystery'
            ? '3:1 port'
            : `2:1 ${data.port.type} port`);

    // add the title
    spot.find('title').text(`owner:${
      owner===null ? 'none' : owner.lobbyData.name} ${
        data.port !== null
          ? `port:${data.port.type}`
          : ''
      }`);
  }

  // show all the roads with appropriate classes
  $('.road-group').removeClass(['paveable', 'init-paveable']);
  for (let i=0; i<game.public.roads.length; i++) {

    let road = $(`#road${i}`),
        data = game.public.roads[i],
        owner= (data.owner>-1 ? game.public.players[data.owner] : null);

    // if it is owned
    if (owner!==null) {
      road.addClass(owner.color)
        .attr('owner',owner.playerID);

    // or if it could be owned
    } else if (game.private !== null) {
      // only possible if it's next to an existing road
      let adjacentRoads = roadGetAdjRoads(game.public, i);
      for (let j=0; j<adjacentRoads.length; j++) {
        if (game.public.roads[adjacentRoads[j]].owner === game.private.playerID)
          road.addClass('paveable');
      }
      for (let j=0; j<data.juncs.length; j++) {
        if (game.public.juncs[data.juncs[j]].owner === game.private.playerID) {
          // or existing settlement
          road.addClass('paveable');
          let settlements = game.public.players[game.private.playerID].settlements;
          if (data.juncs[j] === settlements[settlements.length-1]) {
            // unless it's the first turn
            road.addClass('init-paveable');
          }
        }
      }
    }

    // add the title
    road.find('title').text(`owner:${owner===null ? 'none' : owner.lobbyData.name}`);

  }


  // then update the public info

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
    // add an emoji if this player currently has the longest road
    let str = game.public.players[i].longestRoad;
    if (game.private !== null) {
      if (game.public.hasLongestRoad === i)
        str += '🚗';
    }
    return str;
  }
  function getLAString(i) {
    // add an emoji if this player currently has the largest army
    let str = game.public.players[i].numKnights;
    if (game.private !== null) {
      if (game.public.hasLargestArmy === game.private.playerID)
        str += '⚔️';
    }
    return str;
  }

  // update each item in the public data table
  for (let i=0; i<game.public.players.length; i++) {
    $(`#${i}-score`).html( getVPString(i) );
    $(`#${i}-resources`).html( game.public.players[i].resourcesInHand );
    $(`#${i}-longest-road`).html( getLRString(i) );
    $(`#${i}-dev-cards`).html( game.public.players[i].devCardsInHand );
    $(`#${i}-knights`).html( getLAString(i) );
  }

  // send the server trade to the modal
  modals.Trade.setTrade(game.public.trade);


  // now update private stuff

  if (game.private !== null) {

    // resources, dev cards, escapes
    for (let res in game.private.resources) {
      $(`#num-${res}`).html(game.private.resources[res]);
      $(`#modal-trade .trade-out .resource-count[name=${res}]`).html(0);
    }
    for (let dc in game.private.unplayedDCs) {
      $(`#num-${dc}`).html( game.private.unplayedDCs[dc]+game.private.unplayableDCs[dc] );
      escapes[`%%${devCardNames[dc]}%%`] =
        `<strong class="${dc}">${devCardNames[dc]}</strong>`;
    }
    escapes['%%DISCARD%%'] = `${game.private.flags.discard} card${game.private.flags.discard>1?'s':''}`;


    // button updates

    // update the floating buttons (only the usable ones should be visible)
    $('#endTurn')
      .css('display', game.private.adjacents.indexOf('_e_end_turn')>-1
        ? 'block' : 'none');
    $('#buyDevelopmentCard')
      .css('display', game.private.adjacents.indexOf('_e_buy_dc')>-1
        ? 'block' : 'none');
    $('#offerTrade')
      .css('display',
        (  game.private.adjacents.indexOf('_e_offer_trade')>-1
        || game.private.adjacents.indexOf('_e_trade_bank') >-1)
          ? 'block' : 'none');

    // only show the discard buttons if we need to discard
    $('button.discard').hide();
    if (game.private.flags.discard > 0) {
      $('button.discard').show();
      for (let res in game.private.resources) {
        if (game.private.resources[res] > 0)
          $(`button.discard[name=${res}]`).show();
      }
    }

    // and only show the play dev card buttons if we can play a dev card
    $(`button.play`).hide();
    for (let dc in game.private.flags.canPlayDC) {
      if (game.private.flags.canPlayDC[dc] && game.private.flags.isCurrentPlayer) {
        $(`button.play[name=${dc}]`).show();
      }
    }

    // trade actions buttons
    $('#cancelTrade').css('display', (game.private.adjacents.indexOf('_e_cancel_trade') > -1)
      ? 'block' : 'none');
    $('#acceptTrade').css('display', (game.private.adjacents.indexOf('_e_accept_trade_other') > -1)
      ? 'block' : 'none');
    $('#declineTrade').css('display',(game.private.adjacents.indexOf('_e_decline_trade') > -1)
      ? 'block' : 'none');

    // miscellaneous
    modals.update();
    setWaitingMessage();
  }

  // make sure we're listening for the right events
  listen.set();

  // add some other things that depend on the 'active' classes (set in listen.set())
  let activeSpots = $('.active.fortifiable');
  activeSpots.find('.spot-settlement, .spot-placeholder').hide();
  activeSpots.find('.spot-city').show();


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

// set global variables
let blocked = false, gameid, game, panzoom,
  listen = {

    to(sound, args) {
      console.log('sound',sound,'args',args);
      if (listen.for[sound]!==undefined) {
        for (let i=0; i<listen.for[sound].length; i++) {
          let edge = getEdge(listen.for[sound][i]);
          if (game.private.adjacents.indexOf(edge.name) > -1) {
            if (edge.confirm.length) {
              let response = confirm(edge.confirm);
              if (!response) {
                blocked = false;
                return;
              }
            }
            emitAction({
              player:game.private.playerID,
              edge:listen.for[sound][i],
              args:args });
            return;
          }
        }
      } else {
        blocked = false;
      }
    },

    set() {
      listen.reset();
      if (game.private !== null) {
        $('#gameboard *').removeClass('active');

        for (let i=0; i<game.private.adjacents.length; i++) {
          let edge = getEdge(game.private.adjacents[i]);
          if (listen.for[edge.listen] === undefined)
            listen.for[edge.listen] = [];
          listen.for[edge.listen].push(edge.name);

          if (edge.activate.length)
            $(edge.activate)
              .addClass('active')
              .find('title').text(edge.title);
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

      $('#modal-trade .decrement').each( (key,value) => {
        let data = modals.Trade.get(value);
        $(value).prop( 'disabled', data.num===0 );
      });
      $('#modal-trade .trade-out .increment').each( (key,value) => {
        let data = modals.Trade.get(value);
        $(value).prop( 'disabled', data.num === game.private.resources[data.res] );
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
      $('#modal-trade .trade-out .resource-count').each( (key,value) => {
        let data = modals.Trade.get(value);
        modals.Trade.trade.out[data.res] = data.num;
      });
      $('#modal-trade .trade-in .resource-count').each( (key,value) => {
        let data = modals.Trade.get(value);
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
          whos = `%%${trade.with.join('%%, %%')}%%`;
        } else {
          whos = '<strong>no one</strong>';
        }
      }

      let outs = toString(trade.out),
        ins = toString(trade.in),
        str = `${destination==='public'
          ? `%%${game.public.currentPlayerID}%%:` : ''
          } trading ${outs} for ${ins} with ${whos}`;
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
      modals.Trade.trade = { out:{}, in:{}, with:[] };
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

            let button = $(dom.target).closest('button').attr('name');
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

            let button = $(dom.target).closest('button').attr('name');
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

          $('.tile-group.dc-choose *').click( (dom) => {

            let num = parseInt($(dom.target).closest('.tile-group').attr('num'));
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

  // assign this global-scoped object
  panzoom = svgPanZoom('svg#gameboard');


  // tell the socket that we're here to request game data
  // so that we can populate our html
  socket.emit('play connect', null);

  // when we get our first response from the server
  socket.on('play connect', function(data) {

    game = data;
    console.log(game);

    //game.public.trade = { in:{ ore:1 }, out:{ wheat:1 }, with:[0] };
    //game.private.adjacents.push('_e_cancel_trade');
    //game.private.adjacents.push('_e_accept_trade_other','_e_decline_trade');

    // BUILD THE GAME TILES
    for (let i=0; i<game.public.hexes.length; i++) {
      let hex = game.public.hexes[i], tile = $(`#tile${i}`);

      tile.find('polygon')
        .attr( 'resource', hex.resource )
        .attr( 'class', hex.resource );
      tile.find('title')
        .text(`resource:${hex.resource} ${hex.roll
          ? `roll:${hex.roll}` : ''}`);
      tile.find('.tile-chip-dot')
        .not(`.chip-dot-${hex.roll}`).hide();

      // if it's the desert, detach its tile-chip
      if (hex.roll) {
        tile.find('text').text(hex.roll)
          .attr( 'class', [6,8].indexOf(hex.roll) > -1 ? 'red' : '' )
      } else {
        tile.find('.tile-chip').detach();
      }

      // add some things to escape in the message queue/info panels
      escapes[`%%${hex.resource}%%`] =
        `<strong class="${hex.resource}">${hex.resource}</strong>`;
    }
    escapes['%%Longest Road%%'] = '<strong class="longest-road">Longest Road</strong>';
    escapes['%%Largest Army%%'] = '<strong class="largest-army">Largest Army</strong>';
    for (let i=0; i< game.public.players.length; i++) {
      // including player names
      escapes[`%%${i}%%`] =
        `<strong class="${
          game.public.players[i].color}">${
          game.public.players[i].lobbyData.name
        }</strong>`;
    }
    if (game.private !== null) {
      escapes[`%%${game.private.playerID}%%`] = `<strong class="${
        game.public.players[game.private.playerID].color
      }">you</strong>`;
    }


    // IMPORTANT! push server data out
    populate();

    // bind listeners for SVG elements
    $('.clickable *').click( (i) => {
      // .clickable includes roads, hexes, spots
      if (!blocked) { // rudimentary lock to prevent overloading with redundant messages
        blocked = true;
        let clickable = $(i.target).closest('.clickable'),
          type = clickable.attr('type'),
          num  = clickable.attr('num');
        listen.to(type, [num]);
      }
    });
    $('.spot').click( (i) => {
      let clickable = $(i.target).closest('.clickable');
      if (clickable.hasClass('stealable')) {
        let player = parseInt(clickable.attr('owner'));
    		listen.to('player', [player]);
      }
  	});
    $('.robber *').click( (i) => {
      let num = $(i.target).attr('num');
      if ($(`#tile${num}`).hasClass('robbable')) {
        $(`#tile${num} polygon`).click();
      }
    })

    // moving the demo robber around on hover (probably rewrite this) TODO
    $('.tile-group, .tile-group *').closest('.tile-group').children().hover( (i) => {
      let target = $(i.target).closest('g');
      if (i.type === 'mouseenter') {
        if (target.hasClass('active') || target.hasClass('dc-choose')) {
          let j = parseInt(target.attr('id').slice(4));
          $('#demo-robber *').attr('num', j).css('visibility', 'visible');
          moveRobber(j, head='#demo-robber');
        }
      }
    });

    // roll dice
    $('#dice').click( (i) => {
  		listen.to('dice');
  	});

    // floating buttons
    $('#endTurn').click( () => {
  		listen.to('endTurn');
  	});
    $('#buyDevelopmentCard').click( () => {
  		listen.to('buyDevelopmentCard');
  	});
    $('#offerTrade').click( () => {
      modals.Trade.set('players');
  	});
    $('#exitGame').click( () => {
      location.href = '/lobby';
    });

    // trade actions
    $('#acceptTrade').click( () => {
  		listen.to('acceptTrade');
  	});
    $('#declineTrade').click( () => {
      listen.to('declineTrade');
    })
    $('#cancelTrade').click( () => {
  		listen.to('cancelTrade');
  	});

    // discard after 7
    $('button.discard').click( (i) => {
      let res = $(i.target).attr('name');
  		listen.to('discard', `1 ${res} = 0 ${res}`);
  	});

    // play dev card
    $('button.play').click( (i) => {
      let type = $(i.target).attr('name');
      modals.DC.set(type);
  	});

    // Trade modal
    $('#modal-trade .decrement').click( (i) => {
      modals.Trade.decrement(i.target);
    });
    $('#modal-trade .increment').click( (i) => {
      modals.Trade.increment(i.target);
    });
    $('#modal-trade input[type=checkbox]').click( (i) => {
      modals.Trade.toggleCheck(i.target);
    });
    $('#modal-trade [name=select-all]').click( () => {
      modals.Trade.selectAll();
    });
    $('#modal-trade [name=confirm]').click( () => {
      modals.Trade.confirm();
    });
    $('#modal-trade [name=cancel]').click( () => {
      modals.Trade.cancel();
    });

    // DC modal
    $('#modal-play-dc [name=confirm]').click( () => {
      modals.DC.confirm();
    });
    $('#modal-play.dc [name=cancel]').click( () => {
      modals.DC.cancel();
    });

  });

  // subsequent server responses
  socket.on('play callback', function(data) {

    console.log('callback',data);
    // if server responded with no errors
    if (data.success) {

      // add all the messages
      for (let i=0; i<data.messages.length; i++) {
        _M.addMessage( escapeString(data.messages[i]) );
      }

      // take all the appropriate actions to modify our UI
      getEdge(data.edge).onSuccess()
      game = Object.assign({}, data.game);
      populate();

    } else {

      // let the client know why it errored
      _M.addMessage(data.message, { class:'error' });

    }

    // unblock the listeners
    blocked = false;
  });

});
