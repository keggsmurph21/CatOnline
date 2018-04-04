const _STATE_GRAPH = {
   vertices: {
      "_v_accept_trade": {
         edges: [
            "_e_to_root"
         ],
         name: "_v_accept_trade",
         "": ""
      },
      "_v_accept_trade_other": {
         edges: [
            "_e_after_trade_other"
         ],
         name: "_v_accept_trade_other",
         "": ""
      },
      "_v_buy_dc": {
         edges: [
            "_e_end_game",
            "_e_to_root"
         ],
         name: "_v_buy_dc",
         "": ""
      },
      "_v_collect": {
         edges: [
            "_e_to_root"
         ],
         name: "_v_collect",
         "": ""
      },
      "_v_discard": {
         edges: [
            "_e_discard_move_robber",
            "_e_roll_discard"
         ],
         name: "_v_discard",
         "": ""
      },
      "_v_discard_other": {
         edges: [
            "_e_after_discard_other",
            "_e_roll_discard_other"
         ],
         name: "_v_discard_other",
         "": ""
      },
      "_v_end_game": {
         edges: [],
         name: "_v_end_game",
         "": ""
      },
      "_v_end_turn": {
         edges: [
            "_e_accept_trade_other",
            "_e_roll_discard_other",
            "_e_take_turn"
         ],
         name: "_v_end_turn",
         "": ""
      },
      "_v_fortify": {
         edges: [
            "_e_end_game",
            "_e_to_root"
         ],
         name: "_v_fortify",
         "": ""
      },
      "_v_init_collect": {
         edges: [
            "_e_init2_build_road"
         ],
         name: "_v_init_collect",
         "": ""
      },
      "_v_move_robber": {
         edges: [
            "_e_no_steal_robber",
            "_e_steal_robber"
         ],
         name: "_v_move_robber",
         "": ""
      },
      "_v_offer_trade": {
         edges: [
            "_e_accept_trade",
            "_e_cancel_trade"
         ],
         name: "_v_offer_trade",
         "": ""
      },
      "_v_pave": {
         edges: [
            "_e_end_game",
            "_e_end_init",
            "_e_to_root"
         ],
         name: "_v_pave",
         "": ""
      },
      "_v_play_knight": {
         edges: [
            "_e_end_game"
         ],
         name: "_v_play_knight",
         "": ""
      },
      "_v_play_monopoly": {
         edges: [
            "_e_to_root"
         ],
         name: "_v_play_monopoly",
         "": ""
      },
      "_v_play_rb": {
         edges: [
            "_e_to_root"
         ],
         name: "_v_play_rb",
         "": ""
      },
      "_v_play_vp": {
         edges: [
            "_e_end_game",
            "_e_to_root"
         ],
         name: "_v_play_vp",
         "": ""
      },
      "_v_play_yop": {
         edges: [
            "_e_to_root"
         ],
         name: "_v_play_yop",
         "": ""
      },
      "_v_roll": {
         edges: [
            "_e_roll_collect",
            "_e_roll_discard",
            "_e_roll_move_robber"
         ],
         name: "_v_roll",
         "": ""
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
         "": ""
      },
      "_v_settle": {
         edges: [
            "_e_end_game",
            "_e_init_build_road",
            "_e_init_collect",
            "_e_to_root"
         ],
         name: "_v_settle",
         "": ""
      },
      "_v_steal": {
         edges: [
            "_e_to_root"
         ],
         name: "_v_steal",
         "": ""
      },
      "_v_trade_with_bank": {
         edges: [
            "_e_to_root"
         ],
         name: "_v_trade_with_bank",
         "": ""
      }
   },
   edges: {
      "_e_accept_trade": {
         name: "_e_accept_trade",
         target: "_v_accept_trade",
         listen: "",
         clientDescription: "",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.tradeAccepted; },
         arguments: "",
         execute: function (m,g,p,a) {  require(`../logic`).helpers.acceptTradeAsOffer(m,g,p); },
         isPriority: true,
         isMulti: true,
         isCancel: false,
         label: ""
      },
      "_e_accept_trade_other": {
         name: "_e_accept_trade_other",
         target: "_v_accept_trade_other",
         listen: "acceptTrade",
         clientDescription: "accept the trade",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.canAcceptTrade; },
         arguments: "",
         execute: function (m,g,p,a) {  require(`../logic`).helpers.acceptTradeAsOther(m,g,p); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_after_discard_other": {
         name: "_e_after_discard_other",
         target: "_v_end_turn",
         listen: "",
         clientDescription: "",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return true; },
         arguments: "",
         execute: function (m,g,p,a) { },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_after_trade_other": {
         name: "_e_after_trade_other",
         target: "_v_end_turn",
         listen: "",
         clientDescription: "",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return true; },
         arguments: "",
         execute: function (m,g,p,a) { },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_build_city": {
         name: "_e_build_city",
         target: "_v_fortify",
         listen: "spot",
         clientDescription: "build a city",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.hasRolled && f.canBuild.city; },
         arguments: "settlement",
         execute: function (m,g,p,a) { return require(`../logic`).helpers.fortify(m,g,p,a[0]); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_build_road": {
         name: "_e_build_road",
         target: "_v_pave",
         listen: "road",
         clientDescription: "build a road",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.hasRolled && f.canBuild.road; },
         arguments: "road",
         execute: function (m,g,p,a) { return require(`../logic`).helpers.pave(m,g,p,a[0]); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_build_settlement": {
         name: "_e_build_settlement",
         target: "_v_settle",
         listen: "spot",
         clientDescription: "build a settlement",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.hasRolled && f.canBuild.settlement; },
         arguments: "settlement",
         execute: function (m,g,p,a) { return require(`../logic`).helpers.settle(m,g,p,a[0]); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_buy_dc": {
         name: "_e_buy_dc",
         target: "_v_buy_dc",
         listen: "buyDevelopmentCard",
         clientDescription: "buy a development card",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.hasRolled && f.canBuy.dc; },
         arguments: "",
         execute: function (m,g,p,a) {  require(`../logic`).helpers.buyDevCard(m,g,p); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_cancel_trade": {
         name: "_e_cancel_trade",
         target: "_v_root",
         listen: "cancelTrade",
         clientDescription: "cancel the trade",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return true; },
         arguments: "",
         execute: function (m,g,p,a) { require(`../logic`).helpers.cancelTrade(m,g); },
         isPriority: false,
         isMulti: false,
         isCancel: true,
         label: ""
      },
      "_e_discard_move_robber": {
         name: "_e_discard_move_robber",
         target: "_v_move_robber",
         listen: "tile",
         clientDescription: "move the robber",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.isCurrentPlayer && f.isRollSeven && !f.waitForDiscard; },
         arguments: "hex",
         execute: function (m,g,p,a) { return require(`../logic`).helpers.moveRobber(m,g,p,a[0]); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_end_game": {
         name: "_e_end_game",
         target: "_v_end_game",
         listen: "",
         clientDescription: "",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.isGameOver; },
         arguments: "",
         execute: function (m,g,p,a) { require(`../logic`).helpers.end(m,g); },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_end_init": {
         name: "_e_end_init",
         target: "_v_end_turn",
         listen: "",
         clientDescription: "",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.isFirstTurn || f.isSecondTurn; },
         arguments: "",
         execute: function (m,g,p,a) { require(`../logic`).helpers.iterateTurn(m,g,p); },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_end_turn": {
         name: "_e_end_turn",
         target: "_v_end_turn",
         listen: "endTurn",
         clientDescription: "end your turn",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.hasRolled; },
         arguments: "",
         execute: function (m,g,p,a) { require(`../logic`).helpers.iterateTurn(m,g,p); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init_build_road": {
         name: "_e_init_build_road",
         target: "_v_pave",
         listen: "road",
         clientDescription: "choose a road",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.isFirstTurn; },
         arguments: "road",
         execute: function (m,g,p,a) { return require(`../logic`).helpers.initPave(m,g,p,a[0]); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init_collect": {
         name: "_e_init_collect",
         target: "_v_init_collect",
         listen: "",
         clientDescription: "",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.isSecondTurn; },
         arguments: "",
         execute: function (m,g,p,a) { require(`../logic`).helpers.initCollect(m,g,p); },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init_settle": {
         name: "_e_init_settle",
         target: "_v_settle",
         listen: "spot",
         clientDescription: "choose a settlement",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.isFirstTurn || f.isSecondTurn; },
         arguments: "settlement",
         execute: function (m,g,p,a) { return require(`../logic`).helpers.initSettle(m,g,p,a[0]); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init2_build_road": {
         name: "_e_init2_build_road",
         target: "_v_pave",
         listen: "road",
         clientDescription: "choose a road",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.isSecondTurn; },
         arguments: "road",
         execute: function (m,g,p,a) { return require(`../logic`).helpers.initPave(m,g,p,a[0]); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_no_steal_robber": {
         name: "_e_no_steal_robber",
         target: "_v_root",
         listen: "",
         clientDescription: "",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return !f.canSteal; },
         arguments: "",
         execute: function (m,g,p,a) { },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_offer_trade": {
         name: "_e_offer_trade",
         target: "_v_offer_trade",
         listen: "offerTrade",
         clientDescription: "make a trade",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return !f.isFirstTurn && !f.isSecondTurn && f.hasRolled && f.canTrade; },
         arguments: "trade",
         execute: function (m,g,p,a) { require(`../logic`).helpers.validateTrade(m,g,p,a); return require(`../logic`).helpers.offerTrade(m,g,p,a); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_knight": {
         name: "_e_play_knight",
         target: "_v_move_robber",
         listen: "tile",
         clientDescription: "play a Knight",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.canPlayDC.knight; },
         arguments: "hex",
         execute: function (m,g,p,a) { require(`../logic`).helpers.playDC(m,g,p,'knight'); return require(`../logic`).helpers.moveRobber(m,g,p,a[0]); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_monopoly": {
         name: "_e_play_monopoly",
         target: "_v_play_monopoly",
         listen: "playMonopoly",
         clientDescription: "play a Monopoly",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.canPlayDC.monopoly; },
         arguments: "resource",
         execute: function (m,g,p,a) { return require(`../logic`).helpers.playDC(m,g,p,'monopoly',a[0]); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_rb": {
         name: "_e_play_rb",
         target: "_v_play_rb",
         listen: "playRoadBuilder",
         clientDescription: "play Road Building",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.canPlayDC.rb; },
         arguments: "road road",
         execute: function (m,g,p,a) { return require(`../logic`).helpers.playDC(m,g,p,'rb',a); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_vp": {
         name: "_e_play_vp",
         target: "_v_play_vp",
         listen: "playVictoryPoint",
         clientDescription: "play a Victory Point",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.canPlayDC.vp; },
         arguments: "",
         execute: function (m,g,p,a) {  require(`../logic`).helpers.playDC(m,g,p,'vp'); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_yop": {
         name: "_e_play_yop",
         target: "_v_play_yop",
         listen: "playYearOfPlenty",
         clientDescription: "play a Year of Plenty",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.canPlayDC.yop; },
         arguments: "resource resource",
         execute: function (m,g,p,a) { return require(`../logic`).helpers.playDC(m,g,p,'yop',a); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_roll": {
         name: "_e_roll",
         target: "_v_roll",
         listen: "dice",
         clientDescription: "roll the dice",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return !f.hasRolled && !f.isFirstTurn && !f.isSecondTurn; },
         arguments: "",
         execute: function (m,g,p,a) { return require(`../logic`).helpers.roll(m,g,p,a); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_roll_collect": {
         name: "_e_roll_collect",
         target: "_v_collect",
         listen: "",
         clientDescription: "",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return !f.isRollSeven; },
         arguments: "",
         execute: function (m,g,p,a) { require(`../logic`).helpers.collectResources(m,g); },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_roll_discard": {
         name: "_e_roll_discard",
         target: "_v_discard",
         listen: "discard",
         clientDescription: "discard some cards",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.discard > 0; },
         arguments: "trade",
         execute: function (m,g,p,a) { return require(`../logic`).helpers.discard(m,g,p,a.out); },
         isPriority: false,
         isMulti: true,
         isCancel: false,
         label: ""
      },
      "_e_roll_discard_other": {
         name: "_e_roll_discard_other",
         target: "_v_discard_other",
         listen: "discard",
         clientDescription: "discard some cards",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.discard > 0; },
         arguments: "trade",
         execute: function (m,g,p,a) { return require(`../logic`).helpers.discard(m,g,p,a.out); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_roll_move_robber": {
         name: "_e_roll_move_robber",
         target: "_v_move_robber",
         listen: "tile",
         clientDescription: "move the robber",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.isCurrentPlayer && f.isRollSeven && !f.waitForDiscard; },
         arguments: "hex",
         execute: function (m,g,p,a) { return require(`../logic`).helpers.moveRobber(m,g,p,a[0]); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_steal_robber": {
         name: "_e_steal_robber",
         target: "_v_steal",
         listen: "player",
         clientDescription: "steal from someone",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.canSteal; },
         arguments: "player",
         execute: function (m,g,p,a) { return require(`../logic`).helpers.steal(m,g,p,a[0]); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_take_turn": {
         name: "_e_take_turn",
         target: "_v_root",
         listen: "",
         clientDescription: "",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return f.isCurrentPlayer; },
         arguments: "",
         execute: function (m,g,p,a) { },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_to_root": {
         name: "_e_to_root",
         target: "_v_root",
         listen: "",
         clientDescription: "",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return !f.isFirstTurn; },
         arguments: "",
         execute: function (m,g,p,a) { },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_trade_bank": {
         name: "_e_trade_bank",
         target: "_v_trade_with_bank",
         listen: "tradeBank",
         clientDescription: "trade with the bank",
         clientOnSuccess: function (a) { console.log('on success', a); },
         evaluate: function (f) { return !f.isFirstTurn && !f.isSecondTurn && f.hasRolled && f.canTradeBank; },
         arguments: "trade",
         execute: function (m,g,p,a) { return require(`../logic`).helpers.tradeWithBank(m,g,p,a); },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      }
   }
}