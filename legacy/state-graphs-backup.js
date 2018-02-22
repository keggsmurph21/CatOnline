{
	edges : {
		"_e_trade_bank": {
			isMulti: false,
			evaluate: function (f) { return true; },
			isPriority: false
		},
		"_e_take_turn": {
			isMulti: false,
			evaluate: function (f) { return f.isCurrentPlayer; },
			isPriority: false
		},
		"_e_play_knight": {
			isMulti: false,
			evaluate: function (f) { return f.canPlay.knight; },
			isPriority: false
		},
		"_e_end_turn": {
			isMulti: false,
			evaluate: function (f) { return f.hasRolled; },
			isPriority: false
		},
		"_e_cancel_trade": {
			isMulti: false,
			evaluate: function (f) { return f.isHuman; },
			isPriority: false
		},
		"_e_play_yop": {
			isMulti: false,
			evaluate: function (f) { return f.canPlay.yop; },
			isPriority: false
		},
		"_e_init2_build_road": {
			isMulti: false,
			evaluate: function (f) { return f.isSecondTurn; },
			isPriority: false
		},
		"_e_roll_discard": {
			isMulti: true,
			evaluate: function (f) { return f.hasHeavyPurse; },
			isPriority: true
		},
		"_e_play_monopoly": {
			isMulti: false,
			evaluate: function (f) { return f.canPlay.monopoly; },
			isPriority: false
		},
		"_e_accept_trade": {
			isMulti: true,
			evaluate: function (f) { return f.canAcceptTrade; },
			isPriority: false
		},
		"_e_play_yop_choose": {
			isMulti: false,
			evaluate: function (f) { return true; },
			isPriority: false
		},
		"_e_move_robber_after_knight": {
			isMulti: false,
			evaluate: function (f) { return true; },
			isPriority: false
		},
		"_e_build_city": {
			isMulti: false,
			evaluate: function (f) { return f.hasRolled && f.canBuild.city; },
			isPriority: false
		},
		"_e_build_road": {
			isMulti: false,
			evaluate: function (f) { return f.hasRolled && f.canBuild.road; },
			isPriority: false
		},
		"_e_play_vp": {
			isMulti: false,
			evaluate: function (f) { return f.canPlay.vp; },
			isPriority: false
		},
		"_e_offer_trade": {
			isMulti: false,
			evaluate: function (f) { return true; },
			isPriority: false
		},
		"_e_init_collect": {
			isMulti: false,
			evaluate: function (f) { return f.isSecondTurn; },
			isPriority: false
		},
		"_e_init_settle": {
			isMulti: false,
			evaluate: function (f) { return f.isFirstTurn || f.isSecondTurn; },
			isPriority: true
		},
		"_e_roll": {
			isMulti: false,
			evaluate: function (f) { return !f.hasRolled; },
			isPriority: false
		},
		"_e_steal_robber": {
			isMulti: false,
			evaluate: function (f) { return true; },
			isPriority: false
		},
		"_e_buy_dc": {
			isMulti: false,
			evaluate: function (f) { return f.hasRolled && f.canBuy.dc; },
			isPriority: false
		},
		"_e_cancel_monopoly": {
			isMulti: false,
			evaluate: function (f) { return f.isHuman; },
			isPriority: false
		},
		"_e_cancel_knight": {
			isMulti: false,
			evaluate: function (f) { return f.isHuman; },
			isPriority: false
		},
		"_e_end_game": {
			isMulti: false,
			evaluate: function (f) { return f.isGameOver; },
			isPriority: true
		},
		"_e_cancel_yop": {
			isMulti: false,
			evaluate: function (f) { return f.isHuman; },
			isPriority: false
		},
		"_e_play_monopoly_choose": {
			isMulti: false,
			evaluate: function (f) { return true; },
			isPriority: false
		},
		"_e_init_build_road": {
			isMulti: false,
			evaluate: function (f) { return f.isFirstTurn; },
			isPriority: true
		},
		"_e_move_robber_no_discard": {
			isMulti: false,
			evaluate: function (f) { return f.isCurrentPlayer && f.isWaitingFor; },
			isPriority: false
		},
		"_e_build_settlement": {
			isMulti: false,
			evaluate: function (f) { return f.hasRolled && f.canBuild.settlement; },
			isPriority: false
		},
		"_e_end_init": {
			isMulti: false,
			evaluate: function (f) { return f.isFirstTurn || f.isSecondTurn; },
			isPriority: true
		},
		"_e_to_root": {
			isMulti: false,
			evaluate: function (f) { return true; },
			isPriority: false
		},
		"_e_roll_collect": {
			isMulti: false,
			evaluate: function (f) { return !f.isRollSeven; },
			isPriority: false
		},
		"_e_move_robber_after_discard": {
			isMulti: false,
			evaluate: function (f) { return f.isCurrentPlayer; },
			isPriority: false
		},
    "_e_init_turns": {
      isMulti: false,
      evaluate: function (f) { return f.isCurrentPlayer; },
      isPriority: false
    }
	},
	vertices: {
		"_v_end_game": {
			"edges": []
		},
		"_v_end_turn": {
			"edges": [
			   "_e_take_turn"
			]
		},
		"_v_trade_with_bank": {
			"edges": [
			   "_e_to_root"
			]
		},
		"_v_roll": {
			"edges": [
			   "_e_move_robber_no_discard",
			   "_e_roll_collect",
			   "_e_roll_discard"
			]
		},
		"_v_steal_from_player": {
			"edges": [
			   "_e_to_root"
			]
		},
		"_v_offer_trade": {
			"edges": [
			   "_e_accept_trade",
			   "_e_cancel_trade"
			]
		},
		"_v_play_monopoly": {
			"edges": [
			   "_e_cancel_monopoly",
			   "_e_play_monopoly_choose"
			]
		},
		"_v_play_yop": {
			"edges": [
			   "_e_cancel_yop",
			   "_e_play_yop_choose"
			]
		},
		"_v_choose_resource_type": {
			"edges": [
			   "_e_to_root"
			]
		},
		"_v_buy_dc": {
			"edges": [
			   "_e_end_game",
			   "_e_to_root"
			]
		},
		"_v_root": {
			"edges": [
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
		"_v_accept_trade": {
			"edges": [
			   "_e_to_root"
			]
		},
		"_v_play_knight": {
			"edges": [
			   "_e_cancel_knight",
			   "_e_end_game",
			   "_e_move_robber_after_knight"
			]
		},
		"_v_init": {
			"edges": [
			   "_e_init_turns"
			]
		},
		"_v_play_vp": {
			"edges": [
			   "_e_end_game",
			   "_e_to_root"
			]
		},
		"_v_pave": {
			"edges": [
			   "_e_end_game",
			   "_e_end_init",
			   "_e_to_root"
			]
		},
		"_v_fortify": {
			"edges": [
			   "_e_end_game",
			   "_e_to_root"
			]
		},
		"_v_settle": {
			"edges": [
			   "_e_end_game",
			   "_e_init_build_road",
			   "_e_init_collect",
			   "_e_to_root"
			]
		},
		"_v_collect_resources_(single)": {
			"edges": [
			   "_e_init2_build_road"
			]
		},
		"_v_move_robber": {
			"edges": [
			   "_e_steal_robber"
			]
		},
		"_v_collect_resources_(all)": {
			"edges": [
			   "_e_to_root"
			]
		},
		"_v_choose_2_resources": {
			"edges": [
			   "_e_to_root"
			]
		},
		"_v_discard": {
			"edges": [
			   "_e_move_robber_after_discard",
			   "_e_roll_discard"
			]
		}
	}
}
