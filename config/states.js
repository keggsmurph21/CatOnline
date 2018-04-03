module.exports = {
   vertices: {
      "_v_accept_trade": {
         edges: [
            "_e_to_root"
         ],
         name: "_v_accept_trade",
         label: ""
      },
      "_v_accept_trade_other": {
         edges: [
            "_e_after_trade_other"
         ],
         name: "_v_accept_trade_other",
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
      "_v_discard_other": {
         edges: [
            "_e_after_discard_other",
            "_e_roll_discard_other"
         ],
         name: "_v_discard_other",
         label: ""
      },
      "_v_end_game": {
         edges: [],
         name: "_v_end_game",
         label: ""
      },
      "_v_end_turn": {
         edges: [
            "_e_accept_trade_other",
            "_e_roll_discard_other",
            "_e_take_turn"
         ],
         name: "_v_end_turn",
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
      "_v_init_collect": {
         edges: [
            "_e_init2_build_road"
         ],
         name: "_v_init_collect",
         label: ""
      },
      "_v_move_robber": {
         edges: [
            "_e_no_steal_robber",
            "_e_steal_robber"
         ],
         name: "_v_move_robber",
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
      "_v_pave": {
         edges: [
            "_e_end_game",
            "_e_end_init",
            "_e_to_root"
         ],
         name: "_v_pave",
         label: ""
      },
      "_v_play_knight": {
         edges: [
            "_e_end_game"
         ],
         name: "_v_play_knight",
         label: ""
      },
      "_v_play_monopoly": {
         edges: [
            "_e_to_root"
         ],
         name: "_v_play_monopoly",
         label: ""
      },
      "_v_play_rb": {
         edges: [
            "_e_to_root"
         ],
         name: "_v_play_rb",
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
      "_v_play_yop": {
         edges: [
            "_e_to_root"
         ],
         name: "_v_play_yop",
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
         name: "_v_root",
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
      }
   },
   edges: {
      "_e_accept_trade": {
         name: "_e_accept_trade",
         target: "_v_accept_trade",
         "listen": "",
         evaluate: function (f) { return f.tradeAccepted; },
         arguments: "",
         execute: function (g,p,a) {  require(`../app/logic`).helpers.acceptTradeAsOffer(g,p); },
         isPriority: true,
         isMulti: true,
         isCancel: false,
         label: ""
      },
      "_e_accept_trade_other": {
         name: "_e_accept_trade_other",
         target: "_v_accept_trade_other",
         "listen": "acceptTrade",
         evaluate: function (f) { return f.canAcceptTrade; },
         arguments: "",
         execute: function (g,p,a) {  require(`../app/logic`).helpers.acceptTradeAsOther(g,p); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_after_discard_other": {
         name: "_e_after_discard_other",
         target: "_v_end_turn",
         "listen": "",
         evaluate: function (f) { return true; },
         arguments: "",
         execute: function (g,p,a) { },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_after_trade_other": {
         name: "_e_after_trade_other",
         target: "_v_end_turn",
         "listen": "",
         evaluate: function (f) { return true; },
         arguments: "",
         execute: function (g,p,a) { },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_build_city": {
         name: "_e_build_city",
         target: "_v_fortify",
         "listen": "spot",
         evaluate: function (f) { return f.hasRolled && f.canBuild.city; },
         arguments: "settlement",
         execute: function (g,p,a) { require(`../app/logic`).helpers.fortify(g,p,a[0]); return a[0]; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_build_road": {
         name: "_e_build_road",
         target: "_v_pave",
         "listen": "road",
         evaluate: function (f) { return f.hasRolled && f.canBuild.road; },
         arguments: "road",
         execute: function (g,p,a) {require(`../app/logic`).helpers.pave(g,p,a[0]); return a[0]; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_build_settlement": {
         name: "_e_build_settlement",
         target: "_v_settle",
         "listen": "spot",
         evaluate: function (f) { return f.hasRolled && f.canBuild.settlement; },
         arguments: "settlement",
         execute: function (g,p,a) { require(`../app/logic`).helpers.settle(g,p,a[0]); return a[0]; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_buy_dc": {
         name: "_e_buy_dc",
         target: "_v_buy_dc",
         "listen": "buyDevelopmentCard",
         evaluate: function (f) { return f.hasRolled && f.canBuy.dc; },
         arguments: "",
         execute: function (g,p,a) {  require(`../app/logic`).helpers.buyDevCard(g,p); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_cancel_trade": {
         name: "_e_cancel_trade",
         target: "_v_root",
         "listen": "cancelTrade",
         evaluate: function (f) { return true; },
         arguments: "",
         execute: function (g,p,a) { require(`../app/logic`).helpers.cancelTrade(g); },
         isPriority: false,
         isMulti: false,
         isCancel: true,
         label: ""
      },
      "_e_discard_move_robber": {
         name: "_e_discard_move_robber",
         target: "_v_move_robber",
         "listen": "tile",
         evaluate: function (f) { return f.isCurrentPlayer && f.isRollSeven && !f.waitForDiscard; },
         arguments: "hex",
         execute: function (g,p,a) { require(`../app/logic`).helpers.moveRobber(g,p,a[0]); return a[0]; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_end_game": {
         name: "_e_end_game",
         target: "_v_end_game",
         "listen": "",
         evaluate: function (f) { return f.isGameOver; },
         arguments: "",
         execute: function (g,p,a) { require(`../app/logic`).helpers.end(g); },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_end_init": {
         name: "_e_end_init",
         target: "_v_end_turn",
         "listen": "",
         evaluate: function (f) { return f.isFirstTurn || f.isSecondTurn; },
         arguments: "",
         execute: function (g,p,a) { require(`../app/logic`).helpers.iterateTurn(g,p); },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_end_turn": {
         name: "_e_end_turn",
         target: "_v_end_turn",
         "listen": "endTurn",
         evaluate: function (f) { return f.hasRolled; },
         arguments: "",
         execute: function (g,p,a) { require(`../app/logic`).helpers.iterateTurn(g,p); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init_build_road": {
         name: "_e_init_build_road",
         target: "_v_pave",
         "listen": "road",
         evaluate: function (f) { return f.isFirstTurn; },
         arguments: "road",
         execute: function (g,p,a) { require(`../app/logic`).helpers.initPave(g,p,a[0]); return a[0]; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init_collect": {
         name: "_e_init_collect",
         target: "_v_init_collect",
         "listen": "",
         evaluate: function (f) { return f.isSecondTurn; },
         arguments: "",
         execute: function (g,p,a) { require(`../app/logic`).helpers.initCollect(g,p); },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init_settle": {
         name: "_e_init_settle",
         target: "_v_settle",
         "listen": "spot",
         evaluate: function (f) { return f.isFirstTurn || f.isSecondTurn; },
         arguments: "settlement",
         execute: function (g,p,a) { require(`../app/logic`).helpers.initSettle(g,p,a[0]); return a[0]; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init2_build_road": {
         name: "_e_init2_build_road",
         target: "_v_pave",
         "listen": "road",
         evaluate: function (f) { return f.isSecondTurn; },
         arguments: "road",
         execute: function (g,p,a) { require(`../app/logic`).helpers.initPave(g,p,a[0]); return a[0]; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_no_steal_robber": {
         name: "_e_no_steal_robber",
         target: "_v_root",
         "listen": "",
         evaluate: function (f) { return !f.canSteal; },
         arguments: "",
         execute: function (g,p,a) { },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_offer_trade": {
         name: "_e_offer_trade",
         target: "_v_offer_trade",
         "listen": "offerTrade",
         evaluate: function (f) { return !f.isFirstTurn && !f.isSecondTurn && f.hasRolled; },
         arguments: "trade",
         execute: function (g,p,a) { require(`../app/logic`).helpers.validateTrade(g,p,a); require(`../app/logic`).helpers.offerTrade(g,p,a); return a; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_knight": {
         name: "_e_play_knight",
         target: "_v_move_robber",
         "listen": "tile",
         evaluate: function (f) { return f.canPlayDC.knight; },
         arguments: "hex",
         execute: function (g,p,a) { require(`../app/logic`).helpers.playDC(g,p,'knight'); require(`../app/logic`).helpers.moveRobber(g,p,a[0]); return a[0]; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_monopoly": {
         name: "_e_play_monopoly",
         target: "_v_play_monopoly",
         "listen": "playMonopoly",
         evaluate: function (f) { return f.canPlayDC.monopoly; },
         arguments: "resource",
         execute: function (g,p,a) { require(`../app/logic`).helpers.playDC(g,p,'monopoly',a[0]); return a[0]; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_rb": {
         name: "_e_play_rb",
         target: "_v_play_rb",
         "listen": "playRoadBuilder",
         evaluate: function (f) { return f.canPlayDC.rb; },
         arguments: "road road",
         execute: function (g,p,a) { require(`../app/logic`).helpers.playDC(g,p,'rb',a); return a; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_vp": {
         name: "_e_play_vp",
         target: "_v_play_vp",
         "listen": "playVictoryPoint",
         evaluate: function (f) { return f.canPlayDC.vp; },
         arguments: "",
         execute: function (g,p,a) {  require(`../app/logic`).helpers.playDC(g,p,'vp'); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_yop": {
         name: "_e_play_yop",
         target: "_v_play_yop",
         "listen": "playYearOfPlenty",
         evaluate: function (f) { return f.canPlayDC.yop; },
         arguments: "resource resource",
         execute: function (g,p,a) { require(`../app/logic`).helpers.playDC(g,p,'yop',a); return a; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_roll": {
         name: "_e_roll",
         target: "_v_roll",
         "listen": "dice",
         evaluate: function (f) { return !f.hasRolled && !f.isFirstTurn && !f.isSecondTurn; },
         arguments: "",
         execute: function (g,p,a) { return require(`../app/logic`).helpers.roll(g, a[0], a[1]); return a; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_roll_collect": {
         name: "_e_roll_collect",
         target: "_v_collect",
         "listen": "",
         evaluate: function (f) { return !f.isRollSeven; },
         arguments: "",
         execute: function (g,p,a) { require(`../app/logic`).helpers.collectResources(g); },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_roll_discard": {
         name: "_e_roll_discard",
         target: "_v_discard",
         "listen": "discard",
         evaluate: function (f) { return f.discard > 0; },
         arguments: "trade",
         execute: function (g,p,a) { require(`../app/logic`).helpers.discard(g,p,a.out); return a.out; },
         isPriority: false,
         isMulti: true,
         isCancel: false,
         label: ""
      },
      "_e_roll_discard_other": {
         name: "_e_roll_discard_other",
         target: "_v_discard_other",
         "listen": "discard",
         evaluate: function (f) { return f.discard > 0; },
         arguments: "trade",
         execute: function (g,p,a) { require(`../app/logic`).helpers.discard(g,p,a.out); return a.out; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_roll_move_robber": {
         name: "_e_roll_move_robber",
         target: "_v_move_robber",
         "listen": "tile",
         evaluate: function (f) { return f.isCurrentPlayer && f.isRollSeven && !f.waitForDiscard; },
         arguments: "hex",
         execute: function (g,p,a) { require(`../app/logic`).helpers.moveRobber(g,p,a[0]); return a[0]; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_steal_robber": {
         name: "_e_steal_robber",
         target: "_v_steal",
         "listen": "player",
         evaluate: function (f) { return f.canSteal; },
         arguments: "player",
         execute: function (g,p,a) { require(`../app/logic`).helpers.steal(g,p,a[0]); return a[0]; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_take_turn": {
         name: "_e_take_turn",
         target: "_v_root",
         "listen": "",
         evaluate: function (f) { return f.isCurrentPlayer; },
         arguments: "",
         execute: function (g,p,a) { },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_to_root": {
         name: "_e_to_root",
         target: "_v_root",
         "listen": "",
         evaluate: function (f) { return !f.isFirstTurn; },
         arguments: "",
         execute: function (g,p,a) { },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_trade_bank": {
         name: "_e_trade_bank",
         target: "_v_trade_with_bank",
         "listen": "tradeBank",
         evaluate: function (f) { return !f.isFirstTurn && !f.isSecondTurn && f.hasRolled && f.canTradeBank; },
         arguments: "trade",
         execute: function (g,p,a) { require(`../app/logic`).helpers.tradeWithBank(g,p,a); return a; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      }
   }
}