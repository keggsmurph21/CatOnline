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

function roadGetAdjRoads(board, r) {
  let adjs = new Set(), road = board.roads[r];
  for (let j=0; j<road.juncs.length; j++) {
    let junc = board.juncs[ road.juncs[j] ];
    if ( junc.owner === road.owner
      || junc.owner === -1
      || road.owner === -1 ) {
      for (let s=0; s<junc.roads.length; s++) {
        adjs.add(junc.roads[s]);
      }
    }
  }
  adjs.delete(r);
  return Array.from(adjs);

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
            title: "",
            activate: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_accept_trade_other": {
            name: "_e_accept_trade_other",
            target: "_v_accept_trade_other",
            listen: "acceptTrade",
            title: "",
            activate: "",
            description: "accept the trade",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_after_discard_other": {
            name: "_e_after_discard_other",
            target: "_v_end_turn",
            listen: "",
            title: "",
            activate: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_after_trade_other": {
            name: "_e_after_trade_other",
            target: "_v_end_turn",
            listen: "",
            title: "",
            activate: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_build_city": {
            name: "_e_build_city",
            target: "_v_fortify",
            listen: "spot",
            title: "Click to build a city",
            activate: ".spot.fortifiable",
            description: "build a city",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_build_road": {
            name: "_e_build_road",
            target: "_v_pave",
            listen: "road",
            title: "Click to build a road",
            activate: ".road.paveable",
            description: "build a road",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_build_settlement": {
            name: "_e_build_settlement",
            target: "_v_settle",
            listen: "spot",
            title: "Click to build a settlement",
            activate: ".spot.settleable",
            description: "build a settlement",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_buy_dc": {
            name: "_e_buy_dc",
            target: "_v_buy_dc",
            listen: "buyDevelopmentCard",
            title: "",
            activate: "",
            description: "buy a development card",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_cancel_trade": {
            name: "_e_cancel_trade",
            target: "_v_root",
            listen: "cancelTrade",
            title: "",
            activate: "",
            description: "cancel the trade",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: true,
            label: ""
        },
        "_e_decline_trade": {
            name: "_e_decline_trade",
            target: "_v_end_turn",
            listen: "declineTrade",
            title: "",
            activate: "",
            description: "decline the trade",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_discard_move_robber": {
            name: "_e_discard_move_robber",
            target: "_v_move_robber",
            listen: "tile",
            title: "Click to move the robber here",
            activate: ".tile.robbable polygon",
            description: "move the robber",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_end_game": {
            name: "_e_end_game",
            target: "_v_end_game",
            listen: "",
            title: "",
            activate: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_end_init": {
            name: "_e_end_init",
            target: "_v_end_turn",
            listen: "",
            title: "",
            activate: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_end_turn": {
            name: "_e_end_turn",
            target: "_v_end_turn",
            listen: "endTurn",
            title: "",
            activate: "",
            description: "end your turn",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_fail_trade": {
            name: "_e_fail_trade",
            target: "_v_root",
            listen: "",
            title: "",
            activate: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_init_build_road": {
            name: "_e_init_build_road",
            target: "_v_pave",
            listen: "road",
            title: "Click to place a free road",
            activate: ".road.init-paveable",
            description: "choose a road",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_init_collect": {
            name: "_e_init_collect",
            target: "_v_init_collect",
            listen: "",
            title: "",
            activate: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_init_settle": {
            name: "_e_init_settle",
            target: "_v_settle",
            listen: "spot",
            title: "Click to place a free settlement",
            activate: ".spot.init-settleable",
            description: "choose a settlement",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_init2_build_road": {
            name: "_e_init2_build_road",
            target: "_v_pave",
            listen: "road",
            title: "Click to place a free road",
            activate: ".road.init-paveable",
            description: "choose a road",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_no_steal_robber": {
            name: "_e_no_steal_robber",
            target: "_v_root",
            listen: "",
            title: "",
            activate: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_offer_trade": {
            name: "_e_offer_trade",
            target: "_v_offer_trade",
            listen: "offerTrade",
            title: "",
            activate: "",
            description: "make a trade",
            onSuccess: function (p,a) { modals.Trade.cancel(); },
            isCancel: false,
            label: ""
        },
        "_e_play_knight": {
            name: "_e_play_knight",
            target: "_v_move_robber",
            listen: "playKnight",
            title: "Click to move the robber here",
            activate: ".tile.robbable polygon",
            description: "play a Knight",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_play_monopoly": {
            name: "_e_play_monopoly",
            target: "_v_play_monopoly",
            listen: "playMonopoly",
            title: "",
            activate: "",
            description: "play a Monopoly",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_play_rb": {
            name: "_e_play_rb",
            target: "_v_play_rb",
            listen: "playRB",
            title: "Click to place a free road here",
            activate: ".road.paveable",
            description: "play Road Building",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_play_vp": {
            name: "_e_play_vp",
            target: "_v_play_vp",
            listen: "playVP",
            title: "",
            activate: "",
            description: "play a Victory Point",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_play_yop": {
            name: "_e_play_yop",
            target: "_v_play_yop",
            listen: "playYOP",
            title: "",
            activate: "",
            description: "play a Year of Plenty",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_roll": {
            name: "_e_roll",
            target: "_v_roll",
            listen: "dice",
            title: "",
            activate: "",
            description: "roll the dice",
            onSuccess: function (p,a) { setDice(a); },
            isCancel: false,
            label: ""
        },
        "_e_roll_collect": {
            name: "_e_roll_collect",
            target: "_v_collect",
            listen: "",
            title: "",
            activate: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_roll_discard": {
            name: "_e_roll_discard",
            target: "_v_discard",
            listen: "discard",
            title: "",
            activate: "",
            description: "discard some cards",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_roll_discard_other": {
            name: "_e_roll_discard_other",
            target: "_v_discard_other",
            listen: "discard",
            title: "",
            activate: "",
            description: "discard some cards",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_roll_move_robber": {
            name: "_e_roll_move_robber",
            target: "_v_move_robber",
            listen: "tile",
            title: "Click to move the robber here",
            activate: ".tile.robbable polygon",
            description: "move the robber",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_steal_robber": {
            name: "_e_steal_robber",
            target: "_v_steal",
            listen: "player",
            title: "Click to steal from this player",
            activate: ".spot.stealable",
            description: "steal from someone",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_take_turn": {
            name: "_e_take_turn",
            target: "_v_root",
            listen: "",
            title: "",
            activate: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_to_root": {
            name: "_e_to_root",
            target: "_v_root",
            listen: "",
            title: "",
            activate: "",
            description: "",
            onSuccess: function (p,a) { console.log('on success', a); },
            isCancel: false,
            label: ""
        },
        "_e_trade_bank": {
            name: "_e_trade_bank",
            target: "_v_trade_with_bank",
            listen: "tradeBank",
            title: "",
            activate: "",
            description: "trade with the bank",
            onSuccess: function (p,a) { modals.Trade.cancel(); },
            isCancel: false,
            label: ""
        }
    }
}