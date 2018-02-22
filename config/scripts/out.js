{
   edges: {
      "_e_move_robber_no_discard": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return f.isCurrentPlayer && f.isWaitingFor; }
      },
      "_e_cancel_knight": {
         isCancel: true,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return true; }
      },
      "_e_take_turn": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return f.isCurrentPlayer; }
      },
      "_e_play_vp": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return f.canPlay.vp; }
      },
      "_e_cancel_monopoly": {
         isCancel: true,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return true; }
      },
      "_e_cancel_yop": {
         isCancel: true,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return true; }
      },
      "_e_play_knight": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return f.canPlay.knight; }
      },
      "_e_build_settlement": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return f.hasRolled in f.canBuild.settlement; }
      },
      "_e_move_robber_after_knight": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return true; }
      },
      "_e_buy_dc": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return f.hasRolled in f.canBuy.dc; }
      },
      "_e_play_yop_choose": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return true; }
      },
      "_e_init2_build_road": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return f.isSecondTurn; }
      },
      "_e_build_road": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return f.hasRolled in f.canBuild.road; }
      },
      "_e_roll_collect": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return !f.isRollSeven; }
      },
      "_e_init_collect": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return f.isSecondTurn; }
      },
      "_e_to_root": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return true; }
      },
      "_e_build_city": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return f.hasRolled in f.canBuild.city; }
      },
      "_e_play_yop": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return f.canPlay.yop; }
      },
      "_e_init_build_road": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return f.isFirstTurn; }
      },
      "_e_move_robber_after_discard": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return f.isCurrentPlayer; }
      },
      "_e_steal_robber": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return true; }
      },
      "_e_accept_trade": {
         isCancel: false,
         isPriority: false,
         isMulti: true,
         evaluate: function (f) { return f.canAcceptTrade; }
      },
      "_e_cancel_trade": {
         isCancel: true,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return true; }
      },
      "_e_init_settle": {
         isCancel: false,
         isPriority: true,
         isMulti: false,
         evaluate: function (f) { return f.isFirstTurn || f.isSecondTurn; }
      },
      "_e_roll": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return !f.hasRolled; }
      },
      "_e_end_turn": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return f.hasRolled; }
      },
      "_e_end_game": {
         isCancel: false,
         isPriority: true,
         isMulti: false,
         evaluate: function (f) { return f.isGameOver; }
      },
      "_e_end_init": {
         isCancel: false,
         isPriority: true,
         isMulti: false,
         evaluate: function (f) { return f.isFirstTurn || f.isSecondTurn; }
      },
      "_e_offer_trade": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return true; }
      },
      "_e_play_monopoly": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return f.canPlay.monopoly; }
      },
      "_e_play_monopoly_choose": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return true; }
      },
      "_e_trade_bank": {
         isCancel: false,
         isPriority: false,
         isMulti: false,
         evaluate: function (f) { return true; }
      },
      "_e_roll_discard": {
         isCancel: false,
         isPriority: true,
         isMulti: true,
         evaluate: function (f) { return f.hasHeavyPurse; }
      }
   },
   edges: {
      "_v_fortify": {
         edges: [
            "_e_end_game",
            "_e_to_root"
         ]
      },
      "_v_offer_trade": {
         edges: [
            "_e_accept_trade",
            "_e_cancel_trade"
         ]
      },
      "_v_end_turn": {
         edges: [
            "_e_take_turn"
         ]
      },
      "_v_roll": {
         edges: [
            "_e_move_robber_no_discard",
            "_e_roll_collect",
            "_e_roll_discard"
         ]
      },
      "_v_steal_from_player": {
         edges: [
            "_e_to_root"
         ]
      },
      "_v_settle": {
         edges: [
            "_e_end_game",
            "_e_init_build_road",
            "_e_init_collect",
            "_e_to_root"
         ]
      },
      "_v_play_yop": {
         edges: [
            "_e_cancel_yop",
            "_e_play_yop_choose"
         ]
      },
      "_v_choose_2_resources": {
         edges: [
            "_e_to_root"
         ]
      },
      "_v_end_game": {
         edges: []
      },
      "_v_choose_resource_type": {
         edges: [
            "_e_to_root"
         ]
      },
      "_v_pave": {
         edges: [
            "_e_end_game",
            "_e_end_init",
            "_e_to_root"
         ]
      },
      "_v_discard": {
         edges: [
            "_e_move_robber_after_discard",
            "_e_roll_discard"
         ]
      },
      "_v_play_vp": {
         edges: [
            "_e_end_game",
            "_e_to_root"
         ]
      },
      "_v_init": {
         edges: [
            "_e_to_root"
         ]
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
         ]
      },
      "_v_collect_resources_(single)": {
         edges: [
            "_e_init2_build_road"
         ]
      },
      "_v_accept_trade": {
         edges: [
            "_e_to_root"
         ]
      },
      "_v_play_knight": {
         edges: [
            "_e_cancel_knight",
            "_e_end_game",
            "_e_move_robber_after_knight"
         ]
      },
      "_v_collect_resources_(all)": {
         edges: [
            "_e_to_root"
         ]
      },
      "_v_move_robber": {
         edges: [
            "_e_steal_robber"
         ]
      },
      "_v_trade_with_bank": {
         edges: [
            "_e_to_root"
         ]
      },
      "_v_buy_dc": {
         edges: [
            "_e_end_game",
            "_e_to_root"
         ]
      },
      "_v_play_monopoly": {
         edges: [
            "_e_cancel_monopoly",
            "_e_play_monopoly_choose"
         ]
      }
   }
}