module.exports = {
   vertices: {
      "_v_init": {
         edges: [
            "_e_init_turns"
         ],
         label: ""
      },
      "_v_init_collect": {
         edges: [
            "_e_init2_build_road"
         ],
         label: ""
      },
      "_v_roll": {
         edges: [
            "_e_roll_move_robber",
            "_e_roll_collect",
            "_e_roll_discard"
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
         isPriority: false,
         isMulti: true,
         isCancel: false,
         label: ""
      },
      "_e_build_city": {
         target: "_v_fortify",
         evaluate: function (f) { return f.hasRolled in f.canBuild.city; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_build_road": {
         target: "_v_pave",
         evaluate: function (f) { return f.hasRolled in f.canBuild.road; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_build_settlement": {
         target: "_v_settle",
         evaluate: function (f) { return f.hasRolled in f.canBuild.settlement; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_buy_dc": {
         target: "_v_buy_dc",
         evaluate: function (f) { return f.hasRolled in f.canBuy.dc; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_cancel_knight": {
         target: "_v_root",
         evaluate: function (f) { return true; },
         isPriority: false,
         isMulti: false,
         isCancel: true,
         label: ""
      },
      "_e_cancel_monopoly": {
         target: "_v_root",
         evaluate: function (f) { return true; },
         isPriority: false,
         isMulti: false,
         isCancel: true,
         label: ""
      },
      "_e_cancel_trade": {
         target: "_v_root",
         evaluate: function (f) { return true; },
         isPriority: false,
         isMulti: false,
         isCancel: true,
         label: ""
      },
      "_e_cancel_yop": {
         target: "_v_root",
         evaluate: function (f) { return true; },
         isPriority: false,
         isMulti: false,
         isCancel: true,
         label: ""
      },
      "_e_end_game": {
         target: "_v_end_game",
         evaluate: function (f) { return f.isGameOver; },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_end_init": {
         target: "_v_end_turn",
         evaluate: function (f) { return f.isFirstTurn || f.isSecondTurn; },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_end_turn": {
         target: "_v_end_turn",
         evaluate: function (f) { return f.hasRolled; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init_build_road": {
         target: "_v_pave",
         evaluate: function (f) { return f.isFirstTurn; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init_collect": {
         target: "_v_init_collect",
         evaluate: function (f) { return f.isSecondTurn; },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init_settle": {
         target: "_v_settle",
         evaluate: function (f) { return f.isFirstTurn || f.isSecondTurn; },
         isPriority: true,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init2_build_road": {
         target: "_v_pave",
         evaluate: function (f) { return f.isSecondTurn; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_discard_move_robber": {
         target: "_v_move_robber",
         evaluate: function (f) { return f.isCurrentPlayer; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_knight_move_robber": {
         target: "_v_move_robber",
         evaluate: function (f) { return true; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_roll_move_robber": {
         target: "_v_move_robber",
         evaluate: function (f) { return f.isCurrentPlayer && f.isWaitingFor; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_offer_trade": {
         target: "_v_offer_trade",
         evaluate: function (f) { return true; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_knight": {
         target: "_v_play_knight",
         evaluate: function (f) { return f.canPlay.knight; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_monopoly": {
         target: "_v_play_monopoly",
         evaluate: function (f) { return f.canPlay.monopoly; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_monopoly_choose": {
         target: "_v_choose_resource_type",
         evaluate: function (f) { return true; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_vp": {
         target: "_v_play_vp",
         evaluate: function (f) { return f.canPlay.vp; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_yop": {
         target: "_v_play_yop",
         evaluate: function (f) { return f.canPlay.yop; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_play_yop_choose": {
         target: "_v_choose_2_resources",
         evaluate: function (f) { return true; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_roll": {
         target: "_v_roll",
         evaluate: function (f) { return !f.hasRolled; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_roll_collect": {
         target: "_v_collect",
         evaluate: function (f) { return !f.isRollSeven; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_roll_discard": {
         target: "_v_discard",
         evaluate: function (f) { return f.hasHeavyPurse; },
         isPriority: true,
         isMulti: true,
         isCancel: false,
         label: ""
      },
      "_e_steal_robber": {
         target: "_v_steal",
         evaluate: function (f) { return true; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_take_turn": {
         target: "_v_root",
         evaluate: function (f) { return f.isCurrentPlayer; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_init_turns": {
         target: "_v_end_turn",
         evaluate: function (f) { return true; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_to_root": {
         target: "_v_root",
         evaluate: function (f) { return true; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      },
      "_e_trade_bank": {
         target: "_v_trade_with_bank",
         evaluate: function (f) { return true; },
         isPriority: false,
         isMulti: false,
         isCancel: false,
         label: ""
      }
   }
}