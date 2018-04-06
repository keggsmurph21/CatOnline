/* DATA STRUCTURE
private
  - adjacents
  - flags
  -​ playerID
  - privateScore
  - resources
  - unplayedDCs
  - vertex
public
  - dice
  - hexes
  - juncs
  - meta
  - players
    - cities
    - color
    - devCardsInHand
    - hasLargestArmy
    - hasLongestRoad
    - isHuman
    - lobbyData
    - longestRoad
    - numKnights
    - playerID
    - publicScore
    - resourcesInHand
    - roads
    - settlements
  - roads
  - trade */

const TESTING = {

  sumObject(obj) {
    let acc = 0;
    for (res in obj) {
      acc += obj[res];
    }
    return acc;
  },

  update : {
    dice(values) {

    },
    longestRoads(hasLongestRoad, longestRoads) {
      console.log('update longest roads', hasLongestRoad, longestRoads)

      for (let p=0; p<game.public.players.length; p++) {
        game.public.players[p].longestRoad = longestRoads[p];
        $(`#${p}-longest-road`).html( getLRString(p) );
      }

      if (hasLongestRoad !== game.public.hasLongestRoad) {

        _.update.vps(game.public.hasLongestRoad, -2);
        _.update.vps(hasLongestRoad, 2);

        game.public.hasLongestRoad = hasLongestRoad;
      }
    },
    resources(p, cost, multiplier=1) {
      if (cost !== undefined) {
        game.public.players[p].resourcesInHand += sumObject(cost) * multiplier;
        $(`#${p}-resources`).html(game.public.players[p].resourcesInHand);
        if (p === game.private.playerID) {
          for (let res in cost) {
            game.private.resources[res] += cost[res] * multiplier;
            $(`#num-${res}`).html(game.private.resources[res]);
          }
        }
      }
    },
    vps(p, incr) {
      if (p > -1) {
        if (p===game.private.playerID)
          game.private.privateScore += incr;
        game.public.players[p].publicScore += incr;

        $(`#${p}-score`).html( getVPString(p) );
      }
    }
  },

  add : {
    city(p, args) {
      console.log('add city not implemented', args);

      $(`#spot${args.junc}`).addClass( 'city' );
      game.public.players[p].cities.push(args.junc);

      let settlements = game.public.players[p].settlements;
      settlements.splice(settlements.indexOf(args.junc),1);

      _.update.resources(p, args.cost, -1);
      _.update.vps(p, 1);

    },
    road(p, args) {
      console.log('add road', args);

      $(`#road${args.road}`).addClass( game.public.players[p].color );
      game.public.players[p].roads.push(args.junc);

      _.update.longestRoads(args.hasLongestRoad, args.longestRoads);
      _.update.resources(p, args.cost, -1);

    },
    settlement(p, args) {
      console.log('add settlement', args);

      $(`#spot${args.junc}`).addClass( game.public.players[p].color );
      game.public.players[p].settlements.push(args.junc);

      _.update.longestRoads(args.hasLongestRoad, args.longestRoads);
      _.update.resources(p, args.cost, -1);
      _.update.vps(p, 1);

    }
  }

}

const _STATE_GRAPH = {
    vertices: {
        "_v_accept_trade": {
            edges: [
                "_e_to_root"
            ],
            name: "_v_accept_trade"
        },
        "_v_accept_trade_other": {
            edges: [
                "_e_after_trade_other"
            ],
            name: "_v_accept_trade_other"
        },
        "_v_buy_dc": {
            edges: [
                "_e_end_game",
                "_e_to_root"
            ],
            name: "_v_buy_dc"
        },
        "_v_collect": {
            edges: [
                "_e_to_root"
            ],
            name: "_v_collect"
        },
        "_v_discard": {
            edges: [
                "_e_discard_move_robber",
                "_e_roll_discard"
            ],
            name: "_v_discard"
        },
        "_v_discard_other": {
            edges: [
                "_e_after_discard_other",
                "_e_roll_discard_other"
            ],
            name: "_v_discard_other"
        },
        "_v_end_game": {
            edges: [],
            name: "_v_end_game"
        },
        "_v_end_turn": {
            edges: [
                "_e_accept_trade_other",
                "_e_decline_trade",
                "_e_roll_discard_other",
                "_e_take_turn"
            ],
            name: "_v_end_turn"
        },
        "_v_fortify": {
            edges: [
                "_e_end_game",
                "_e_to_root"
            ],
            name: "_v_fortify"
        },
        "_v_init_collect": {
            edges: [
                "_e_init2_build_road"
            ],
            name: "_v_init_collect"
        },
        "_v_move_robber": {
            edges: [
                "_e_no_steal_robber",
                "_e_steal_robber"
            ],
            name: "_v_move_robber"
        },
        "_v_offer_trade": {
            edges: [
                "_e_accept_trade",
                "_e_cancel_trade",
                "_e_fail_trade"
            ],
            name: "_v_offer_trade"
        },
        "_v_pave": {
            edges: [
                "_e_end_game",
                "_e_end_init",
                "_e_to_root"
            ],
            name: "_v_pave"
        },
        "_v_play_knight": {
            edges: [
                "_e_end_game"
            ],
            name: "_v_play_knight"
        },
        "_v_play_monopoly": {
            edges: [
                "_e_to_root"
            ],
            name: "_v_play_monopoly"
        },
        "_v_play_rb": {
            edges: [
                "_e_to_root"
            ],
            name: "_v_play_rb"
        },
        "_v_play_vp": {
            edges: [
                "_e_end_game",
                "_e_to_root"
            ],
            name: "_v_play_vp"
        },
        "_v_play_yop": {
            edges: [
                "_e_to_root"
            ],
            name: "_v_play_yop"
        },
        "_v_roll": {
            edges: [
                "_e_roll_collect",
                "_e_roll_discard",
                "_e_roll_move_robber"
            ],
            name: "_v_roll"
        },
        "_v_root": {
            edges: [
                "_e_build_city",
                "_e_build_road",
                "_e_build_settlement",
                "_e_buy_dc",
                "_e_end_turn",
                "_e_init_settle",
                "_e_offer_trade",
                "_e_play_knight",
                "_e_play_monopoly",
                "_e_play_rb",
                "_e_play_vp",
                "_e_play_yop",
                "_e_roll",
                "_e_trade_bank"
            ],
            name: "_v_root"
        },
        "_v_settle": {
            edges: [
                "_e_end_game",
                "_e_init_build_road",
                "_e_init_collect",
                "_e_to_root"
            ],
            name: "_v_settle"
        },
        "_v_steal": {
            edges: [
                "_e_to_root"
            ],
            name: "_v_steal"
        },
        "_v_trade_with_bank": {
            edges: [
                "_e_to_root"
            ],
            name: "_v_trade_with_bank"
        }
    },
    edges: {
        "_e_accept_trade": {
            name: "_e_accept_trade",
            target: "_v_accept_trade",
            listen: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_accept_trade_other": {
            name: "_e_accept_trade_other",
            target: "_v_accept_trade_other",
            listen: "acceptTrade",
            description: "accept the trade",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_after_discard_other": {
            name: "_e_after_discard_other",
            target: "_v_end_turn",
            listen: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_after_trade_other": {
            name: "_e_after_trade_other",
            target: "_v_end_turn",
            listen: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_build_city": {
            name: "_e_build_city",
            target: "_v_fortify",
            listen: "spot",
            description: "build a city",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_build_road": {
            name: "_e_build_road",
            target: "_v_pave",
            listen: "road",
            description: "build a road",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_build_settlement": {
            name: "_e_build_settlement",
            target: "_v_settle",
            listen: "spot",
            description: "build a settlement",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_buy_dc": {
            name: "_e_buy_dc",
            target: "_v_buy_dc",
            listen: "buyDevelopmentCard",
            description: "buy a development card",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_cancel_trade": {
            name: "_e_cancel_trade",
            target: "_v_root",
            listen: "cancelTrade",
            description: "cancel the trade",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: true,
            label: ""
        },
        "_e_decline_trade": {
            name: "_e_decline_trade",
            target: "_v_end_turn",
            listen: "declineTrade",
            description: "decline the trade",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_discard_move_robber": {
            name: "_e_discard_move_robber",
            target: "_v_move_robber",
            listen: "tile",
            description: "move the robber",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_end_game": {
            name: "_e_end_game",
            target: "_v_end_game",
            listen: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_end_init": {
            name: "_e_end_init",
            target: "_v_end_turn",
            listen: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_end_turn": {
            name: "_e_end_turn",
            target: "_v_end_turn",
            listen: "endTurn",
            description: "end your turn",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_fail_trade": {
            name: "_e_fail_trade",
            target: "_v_root",
            listen: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_init_build_road": {
            name: "_e_init_build_road",
            target: "_v_pave",
            listen: "road",
            description: "choose a road",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_init_collect": {
            name: "_e_init_collect",
            target: "_v_init_collect",
            listen: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_init_settle": {
            name: "_e_init_settle",
            target: "_v_settle",
            listen: "spot",
            description: "choose a settlement",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_init2_build_road": {
            name: "_e_init2_build_road",
            target: "_v_pave",
            listen: "road",
            description: "choose a road",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_no_steal_robber": {
            name: "_e_no_steal_robber",
            target: "_v_root",
            listen: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_offer_trade": {
            name: "_e_offer_trade",
            target: "_v_offer_trade",
            listen: "offerTrade",
            description: "make a trade",
            onSuccess: function (p,a) { modals.Trade.cancel(); },
            isCancel: false,
            label: ""
        },
        "_e_play_knight": {
            name: "_e_play_knight",
            target: "_v_move_robber",
            listen: "tile",
            description: "play a Knight",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_play_monopoly": {
            name: "_e_play_monopoly",
            target: "_v_play_monopoly",
            listen: "playMonopoly",
            description: "play a Monopoly",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_play_rb": {
            name: "_e_play_rb",
            target: "_v_play_rb",
            listen: "playRoadBuilder",
            description: "play Road Building",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_play_vp": {
            name: "_e_play_vp",
            target: "_v_play_vp",
            listen: "playVictoryPoint",
            description: "play a Victory Point",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_play_yop": {
            name: "_e_play_yop",
            target: "_v_play_yop",
            listen: "playYearOfPlenty",
            description: "play a Year of Plenty",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_roll": {
            name: "_e_roll",
            target: "_v_roll",
            listen: "dice",
            description: "roll the dice",
            onSuccess: function (p,a) { setDice(a); },
            isCancel: false,
            label: ""
        },
        "_e_roll_collect": {
            name: "_e_roll_collect",
            target: "_v_collect",
            listen: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_roll_discard": {
            name: "_e_roll_discard",
            target: "_v_discard",
            listen: "discard",
            description: "discard some cards",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_roll_discard_other": {
            name: "_e_roll_discard_other",
            target: "_v_discard_other",
            listen: "discard",
            description: "discard some cards",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_roll_move_robber": {
            name: "_e_roll_move_robber",
            target: "_v_move_robber",
            listen: "tile",
            description: "move the robber",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_steal_robber": {
            name: "_e_steal_robber",
            target: "_v_steal",
            listen: "player",
            description: "steal from someone",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_take_turn": {
            name: "_e_take_turn",
            target: "_v_root",
            listen: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_to_root": {
            name: "_e_to_root",
            target: "_v_root",
            listen: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_trade_bank": {
            name: "_e_trade_bank",
            target: "_v_trade_with_bank",
            listen: "tradeBank",
            description: "trade with the bank",
            onSuccess: function (p,a) { modals.Trade.cancel(); },
            isCancel: false,
            label: ""
        }
    }
}