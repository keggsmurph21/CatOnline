module.exports = {
   vertices: {
      "_v_init_collect": {
         edges: [
            "_e_init2_build_road"
         ],
         label: ""
      },
      "_v_roll": {
         edges: [
            "_e_roll_collect",
            "_e_roll_discard",
            "_e_roll_move_robber"
         ],
         label: ""
      },
      "_v_collect": {
         edges: [
            "_e_to_root"
         ],
         label: ""
      },
      "_v_discard": {
         edges: [
            "_e_discard_move_robber",
            "_e_roll_discard"
         ],
         label: ""
      },
      "_v_move_robber": {
         edges: [
            "_e_steal_robber"
         ],
         label: ""
      },
      "_v_steal": {
         edges: [
            "_e_to_root"
         ],
         label: ""
      },
      "_v_trade_with_bank": {
         edges: [
            "_e_to_root"
         ],
         label: ""
      },
      "_v_offer_trade": {
         edges: [
            "_e_accept_trade",
            "_e_cancel_trade"
         ],
         label: ""
      },
      "_v_accept_trade": {
         edges: [
            "_e_to_root"
         ],
         label: ""
      },
      "_v_play_vp": {
         edges: [
            "_e_end_game",
            "_e_to_root"
         ],
         label: ""
      },
      "_v_play_knight": {
         edges: [
            "_e_cancel_knight",
            "_e_end_game",
            "_e_knight_move_robber"
         ],
         label: ""
      },
      "_v_play_yop": {
         edges: [
            "_e_cancel_yop",
            "_e_play_yop_choose"
         ],
         label: ""
      },
      "_v_choose_2_resources": {
         edges: [
            "_e_to_root"
         ],
         label: ""
      },
      "_v_play_monopoly": {
         edges: [
            "_e_cancel_monopoly",
            "_e_play_monopoly_choose"
         ],
         label: ""
      },
      "_v_choose_resource_type": {
         edges: [
            "_e_to_root"
         ],
         label: ""
      },
      "_v_buy_dc": {
         edges: [
            "_e_end_game",
            "_e_to_root"
         ],
         label: ""
      },
      "_v_fortify": {
         edges: [
            "_e_end_game",
            "_e_to_root"
         ],
         label: ""
      },
      "_v_pave": {
         edges: [
            "_e_end_game",
            "_e_end_init",
            "_e_to_root"
         ],
         label: ""
      },
      "_v_settle": {
         edges: [
            "_e_end_game",
            "_e_init_build_road",
            "_e_init_collect",
            "_e_to_root"
         ],
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
         label: ""
      },
      "_v_end_turn": {
         edges: [
            "_e_take_turn"
         ],
         label: ""
      },
      "_v_end_game": {
         edges: [],
         label: ""
      }
   },
   edges: {
      "_e_accept_trade": {
         target: "_v_accept_trade",
         evaluate: function (f) { return f.canAcceptTrade; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: true,
         isCancel: false,
         label: ""
      },
      "_e_build_city": {
         target: "_v_fortify",
         evaluate: function (f) { return f.hasRolled && f.canBuild.city; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_build_road": {
         target: "_v_pave",
         evaluate: function (f) { return f.hasRolled && f.canBuild.road; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_build_settlement": {
         target: "_v_settle",
         evaluate: function (f) { return f.hasRolled && f.canBuild.settlement; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_buy_dc": {
         target: "_v_buy_dc",
         evaluate: function (f) { return f.hasRolled && f.canBuy.dc; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_cancel_knight": {
         target: "_v_root",
         evaluate: function (f) { return true; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: true,
         label: ""
      },
      "_e_cancel_monopoly": {
         target: "_v_root",
         evaluate: function (f) { return true; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: true,
         label: ""
      },
      "_e_cancel_trade": {
         target: "_v_root",
         evaluate: function (f) { return true; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: true,
         label: ""
      },
      "_e_cancel_yop": {
         target: "_v_root",
         evaluate: function (f) { return true; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: true,
         label: ""
      },
      "_e_discard_move_robber": {
         target: "_v_move_robber",
         evaluate: function (f) { return f.isCurrentPlayer; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_end_game": {
         target: "_v_end_game",
         evaluate: function (f) { return f.isGameOver; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_end_init": {
         target: "_v_end_turn",
         evaluate: function (f) { return f.isFirstTurn || f.isSecondTurn; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_end_turn": {
         target: "_v_end_turn",
         evaluate: function (f) { return f.hasRolled; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init_build_road": {
         target: "_v_pave",
         evaluate: function (f) { return f.isFirstTurn; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init_collect": {
         target: "_v_init_collect",
         evaluate: function (f) { return f.isSecondTurn; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init_settle": {
         target: "_v_settle",
         evaluate: function (f) { return f.isFirstTurn || f.isSecondTurn; },
         "arguments": "int",
         execute: function (g,a) { if (a[0]<0||g.board.juncs.length<=a[0]) return 'test'; if (g.board.juncs[a[0]].isSettleable) { playerSettleJunc(g,a); } },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init2_build_road": {
         target: "_v_pave",
         evaluate: function (f) { return f.isSecondTurn; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_knight_move_robber": {
         target: "_v_move_robber",
         evaluate: function (f) { return true; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_offer_trade": {
         target: "_v_offer_trade",
         evaluate: function (f) { return !f.isFirstTurn; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_knight": {
         target: "_v_play_knight",
         evaluate: function (f) { return f.canPlayDC.knight; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_monopoly": {
         target: "_v_play_monopoly",
         evaluate: function (f) { return f.canPlayDC.monopoly; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_monopoly_choose": {
         target: "_v_choose_resource_type",
         evaluate: function (f) { return true; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_vp": {
         target: "_v_play_vp",
         evaluate: function (f) { return f.canPlayDC.vp; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_yop": {
         target: "_v_play_yop",
         evaluate: function (f) { return f.canPlayDC.yop; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_yop_choose": {
         target: "_v_choose_2_resources",
         evaluate: function (f) { return true; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_roll": {
         target: "_v_roll",
         evaluate: function (f) { return !f.hasRolled && !f.isFirstTurn; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_roll_collect": {
         target: "_v_collect",
         evaluate: function (f) { return !f.isRollSeven; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_roll_discard": {
         target: "_v_discard",
         evaluate: function (f) { return f.hasHeavyPurse; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: true,
         isMulti: true,
         isCancel: false,
         label: ""
      },
      "_e_roll_move_robber": {
         target: "_v_move_robber",
         evaluate: function (f) { return f.isCurrentPlayer && f.isWaitingFor; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_steal_robber": {
         target: "_v_steal",
         evaluate: function (f) { return true; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_take_turn": {
         target: "_v_root",
         evaluate: function (f) { return f.isCurrentPlayer; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_to_root": {
         target: "_v_root",
         evaluate: function (f) { return !f.isFirstTurn; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_trade_bank": {
         target: "_v_trade_with_bank",
         evaluate: function (f) { return !f.isFirstTurn; },
         "arguments": "",
         execute: function (g,a) { },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      }
   }
}