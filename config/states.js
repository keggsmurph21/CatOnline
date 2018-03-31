const _=require("./helpers");
module.exports = {
   vertices: {
      "_v_init_collect": {
         edges: [
            "_e_init2_build_road"
         ],
         name: "_v_init_collect",
         label: ""
      },
      "_v_roll": {
         edges: [
            "_e_roll_collect",
            "_e_roll_discard",
            "_e_roll_move_robber"
         ],
         name: "_v_roll",
         label: ""
      },
      "_v_collect": {
         edges: [
            "_e_to_root"
         ],
         name: "_v_collect",
         label: ""
      },
      "_v_discard": {
         edges: [
            "_e_discard_move_robber",
            "_e_roll_discard"
         ],
         name: "_v_discard",
         label: ""
      },
      "_v_move_robber": {
         edges: [
            "_e_steal_robber"
         ],
         name: "_v_move_robber",
         label: ""
      },
      "_v_steal": {
         edges: [
            "_e_to_root"
         ],
         name: "_v_steal",
         label: ""
      },
      "_v_trade_with_bank": {
         edges: [
            "_e_to_root"
         ],
         name: "_v_trade_with_bank",
         label: ""
      },
      "_v_offer_trade": {
         edges: [
            "_e_accept_trade",
            "_e_cancel_trade"
         ],
         name: "_v_offer_trade",
         label: ""
      },
      "_v_accept_trade": {
         edges: [
            "_e_to_root"
         ],
         name: "_v_accept_trade",
         label: ""
      },
      "_v_play_vp": {
         edges: [
            "_e_end_game",
            "_e_to_root"
         ],
         name: "_v_play_vp",
         label: ""
      },
      "_v_play_knight": {
         edges: [
            "_e_cancel_knight",
            "_e_end_game",
            "_e_knight_move_robber"
         ],
         name: "_v_play_knight",
         label: ""
      },
      "_v_play_yop": {
         edges: [
            "_e_cancel_yop",
            "_e_play_yop_choose"
         ],
         name: "_v_play_yop",
         label: ""
      },
      "_v_choose_2_resources": {
         edges: [
            "_e_to_root"
         ],
         name: "_v_choose_2_resources",
         label: ""
      },
      "_v_play_monopoly": {
         edges: [
            "_e_cancel_monopoly",
            "_e_play_monopoly_choose"
         ],
         name: "_v_play_monopoly",
         label: ""
      },
      "_v_choose_resource_type": {
         edges: [
            "_e_to_root"
         ],
         name: "_v_choose_resource_type",
         label: ""
      },
      "_v_buy_dc": {
         edges: [
            "_e_end_game",
            "_e_to_root"
         ],
         name: "_v_buy_dc",
         label: ""
      },
      "_v_fortify": {
         edges: [
            "_e_end_game",
            "_e_to_root"
         ],
         name: "_v_fortify",
         label: ""
      },
      "_v_pave": {
         edges: [
            "_e_end_game",
            "_e_end_init",
            "_e_to_root"
         ],
         name: "_v_pave",
         label: ""
      },
      "_v_settle": {
         edges: [
            "_e_end_game",
            "_e_init_build_road",
            "_e_init_collect",
            "_e_to_root"
         ],
         name: "_v_settle",
         label: ""
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
            "_e_play_vp",
            "_e_play_yop",
            "_e_roll",
            "_e_trade_bank"
         ],
         name: "_v_root",
         label: ""
      },
      "_v_end_turn": {
         edges: [
            "_e_accept_trade_partner",
            "_e_take_turn"
         ],
         name: "_v_end_turn",
         label: ""
      },
      "_v_end_game": {
         edges: [],
         name: "_v_end_game",
         label: ""
      },
      "_v_accept_trade_partner": {
         edges: [
            "_e_after_trade_partner"
         ],
         name: "_v_accept_trade_partner",
         label: ""
      }
   },
   edges: {
      "_e_accept_trade": {
         name: "_e_accept_trade",
         target: "_v_accept_trade",
         evaluate: function (f) { return f.tradeAccepted; },
         arguments: "",
         execute: function (g,a) { let p=_.validatePlayer(g,a[0]); _.acceptTradeAsOffer(g,p); },
         isPriority: true,
         isMulti: true,
         isCancel: false,
         label: ""
      },
      "_e_accept_trade_partner": {
         name: "_e_accept_trade_partner",
         target: "_v_accept_trade_partner",
         evaluate: function (f) { return f.canAcceptTrade; },
         arguments: "",
         execute: function (g,a) { let p=_.validatePlayer(g,a[0]); _.acceptTradeAsPartner(g,p); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_after_trade_partner": {
         name: "_e_after_trade_partner",
         target: "_v_end_turn",
         evaluate: function (f) { return true; },
         arguments: "",
         execute: function (g,a) { console.log('after'); },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_build_city": {
         name: "_e_build_city",
         target: "_v_fortify",
         evaluate: function (f) { return f.hasRolled && f.canBuild.city; },
         arguments: "settlement",
         execute: function (g,a) { let p=_.validatePlayer(g,a[0]), j=_.validateJunc(g,a[1]); _.fortify(g,p,j) },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_build_road": {
         name: "_e_build_road",
         target: "_v_pave",
         evaluate: function (f) { return f.hasRolled && f.canBuild.road; },
         arguments: "road",
         execute: function (g,a) { throw Error('not implemented'); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_build_settlement": {
         name: "_e_build_settlement",
         target: "_v_settle",
         evaluate: function (f) { return f.hasRolled && f.canBuild.settlement; },
         arguments: "settlement",
         execute: function (g,a) { throw Error('not implemented'); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_buy_dc": {
         name: "_e_buy_dc",
         target: "_v_buy_dc",
         evaluate: function (f) { return f.hasRolled && f.canBuy.dc; },
         arguments: "",
         execute: function (g,a) { throw Error('not implemented'); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_cancel_knight": {
         name: "_e_cancel_knight",
         target: "_v_root",
         evaluate: function (f) { return true; },
         arguments: "",
         execute: function (g,a) { throw Error('not implemented'); },
         isPriority: false,
         isMulti: false,
         isCancel: true,
         label: ""
      },
      "_e_cancel_monopoly": {
         name: "_e_cancel_monopoly",
         target: "_v_root",
         evaluate: function (f) { return true; },
         arguments: "",
         execute: function (g,a) { throw Error('not implemented'); },
         isPriority: false,
         isMulti: false,
         isCancel: true,
         label: ""
      },
      "_e_cancel_trade": {
         name: "_e_cancel_trade",
         target: "_v_root",
         evaluate: function (f) { return true; },
         arguments: "",
         execute: function (g,a) { _.cancelTrade(g); },
         isPriority: false,
         isMulti: false,
         isCancel: true,
         label: ""
      },
      "_e_cancel_yop": {
         name: "_e_cancel_yop",
         target: "_v_root",
         evaluate: function (f) { return true; },
         arguments: "",
         execute: function (g,a) { throw Error('not implemented'); },
         isPriority: false,
         isMulti: false,
         isCancel: true,
         label: ""
      },
      "_e_discard_move_robber": {
         name: "_e_discard_move_robber",
         target: "_v_move_robber",
         evaluate: function (f) { return f.isCurrentPlayer; },
         arguments: "",
         execute: function (g,a) { throw Error('not implemented'); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_end_game": {
         name: "_e_end_game",
         target: "_v_end_game",
         evaluate: function (f) { return f.isGameOver; },
         arguments: "",
         execute: function (g,a) { throw Error('not implemented'); },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_end_init": {
         name: "_e_end_init",
         target: "_v_end_turn",
         evaluate: function (f) { return f.isFirstTurn || f.isSecondTurn; },
         arguments: "",
         execute: function (g,a) { _.iterateTurn(g) },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_end_turn": {
         name: "_e_end_turn",
         target: "_v_end_turn",
         evaluate: function (f) { return f.hasRolled; },
         arguments: "",
         execute: function (g,a) { _.iterateTurn(g) },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init_build_road": {
         name: "_e_init_build_road",
         target: "_v_pave",
         evaluate: function (f) { return f.isFirstTurn; },
         arguments: "road",
         execute: function (g,a) { let p=_.validatePlayer(g,a[0]), r=_.validateRoad(g,a[1]); _.requireRoadNearLastSettlement(g,p,r); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init_collect": {
         name: "_e_init_collect",
         target: "_v_init_collect",
         evaluate: function (f) { return f.isSecondTurn; },
         arguments: "",
         execute: function (g,a) { let p=_.validatePlayer(g,a[0]), j=_.getLastSettlement(g,p); for (let h in g.board.juncs[j].hexes) { _.collectResource(g,p,g.board.juncs[j].hexes[h]); } },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init_settle": {
         name: "_e_init_settle",
         target: "_v_settle",
         evaluate: function (f) { return f.isFirstTurn || f.isSecondTurn; },
         arguments: "settlement",
         execute: function (g,a) { let p=_.validatePlayer(g,a[0]), j=_.validateJunc(g,a[1]); _.settle(g,p,j,false); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init2_build_road": {
         name: "_e_init2_build_road",
         target: "_v_pave",
         evaluate: function (f) { return f.isSecondTurn; },
         arguments: "road",
         execute: function (g,a) { let p=_.validatePlayer(g,a[0]), r=_.validateRoad(g,a[1]); _.requireRoadNearLastSettlement(g,p,r); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_knight_move_robber": {
         name: "_e_knight_move_robber",
         target: "_v_move_robber",
         evaluate: function (f) { return true; },
         arguments: "",
         execute: function (g,a) { throw Error('not implemented'); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_offer_trade": {
         name: "_e_offer_trade",
         target: "_v_offer_trade",
         evaluate: function (f) { return !f.isFirstTurn && !f.isSecondTurn && f.hasRolled; },
         arguments: "*",
         execute: function (g,a) { let p=_.validatePlayer(g,a[0]), trade=_.parseTrade(g,a.slice(1)); _.validateTrade(g,p,trade); _.offerTrade(g,p,trade); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_knight": {
         name: "_e_play_knight",
         target: "_v_play_knight",
         evaluate: function (f) { return f.canPlayDC.knight; },
         arguments: "",
         execute: function (g,a) { throw Error('not implemented'); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_monopoly": {
         name: "_e_play_monopoly",
         target: "_v_play_monopoly",
         evaluate: function (f) { return f.canPlayDC.monopoly; },
         arguments: "",
         execute: function (g,a) { throw Error('not implemented'); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_monopoly_choose": {
         name: "_e_play_monopoly_choose",
         target: "_v_choose_resource_type",
         evaluate: function (f) { return true; },
         arguments: "",
         execute: function (g,a) { throw Error('not implemented'); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_vp": {
         name: "_e_play_vp",
         target: "_v_play_vp",
         evaluate: function (f) { return f.canPlayDC.vp; },
         arguments: "",
         execute: function (g,a) { throw Error('not implemented'); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_yop": {
         name: "_e_play_yop",
         target: "_v_play_yop",
         evaluate: function (f) { return f.canPlayDC.yop; },
         arguments: "",
         execute: function (g,a) { throw Error('not implemented'); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_yop_choose": {
         name: "_e_play_yop_choose",
         target: "_v_choose_2_resources",
         evaluate: function (f) { return true; },
         arguments: "",
         execute: function (g,a) { throw Error('not implemented'); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_roll": {
         name: "_e_roll",
         target: "_v_roll",
         evaluate: function (f) { return !f.hasRolled && !f.isFirstTurn && !f.isSecondTurn; },
         arguments: "",
         execute: function (g,a) { _.roll(g, a[1], a[2]) },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_roll_collect": {
         name: "_e_roll_collect",
         target: "_v_collect",
         evaluate: function (f) { return !f.isRollSeven; },
         arguments: "",
         execute: function (g,a) { _.collectResources(g); },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_roll_discard": {
         name: "_e_roll_discard",
         target: "_v_discard",
         evaluate: function (f) { return f.hasHeavyPurse; },
         arguments: "",
         execute: function (g,a) { throw Error('not implemented'); },
         isPriority: true,
         isMulti: true,
         isCancel: false,
         label: ""
      },
      "_e_roll_move_robber": {
         name: "_e_roll_move_robber",
         target: "_v_move_robber",
         evaluate: function (f) { return f.isCurrentPlayer && f.isWaitingFor && f.isRollSeven; },
         arguments: "hex",
         execute: function (g,a) { let p=_.validatePlayer(g,a[0]), h=_.validateHex(g,a[1]); if (h.num===g.board.robber) throw Error('robber is already here'); g.board.robber=h.num; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_steal_robber": {
         name: "_e_steal_robber",
         target: "_v_steal",
         evaluate: function (f) { return true; },
         arguments: "player",
         execute: function (g,a) { let p=_.validatePlayer(g,a[0]), q=_.validatePlayer(g,a[1]); if (p===q) throw Error(`you can't steal from youself!`); _.steal(g,p,q); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_take_turn": {
         name: "_e_take_turn",
         target: "_v_root",
         evaluate: function (f) { return f.isCurrentPlayer; },
         arguments: "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_to_root": {
         name: "_e_to_root",
         target: "_v_root",
         evaluate: function (f) { return !f.isFirstTurn; },
         arguments: "",
         execute: function (g,a) { },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_trade_bank": {
         name: "_e_trade_bank",
         target: "_v_trade_with_bank",
         evaluate: function (f) { return !f.isFirstTurn && !f.isSecondTurn && f.hasRolled && f.canTradeBank; },
         arguments: "*",
         execute: function (g,a) { let p=_.validatePlayer(g,a[0]), trade=_.parseTrade(g,a.slice(1)); _.tradeWithBank(g,p,trade); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      }
   }
}