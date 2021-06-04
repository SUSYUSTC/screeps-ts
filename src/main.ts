if (Memory.debug_mode == undefined) {
	Memory.debug_mode = true;
}
if (Memory.output_mode == undefined) {
	Memory.output_mode = true;
}
import * as action_counter from "./action_counter";
import * as config from "./config";
import * as _ from "lodash";
import * as creepjobs from "./creepjobs";
import * as mymath from "./mymath";
import * as spawning from "./spawning";
import * as towers from "./towers";
import * as links from "./links";
import * as labs from "./labs";
import * as factory from "./factory";
import * as powerspawn from "./powerspawn";
import * as market from "./market";
import * as terminal from "./terminal";
import * as main_func from "./main_func";
import * as final_command from "./final_command";
import * as output from "./output";
import * as invade from "./invade";
import * as powercreeps from "./powercreeps"
import * as gcl_room from "./gcl_room";
import { Timer } from "./timer";
import * as defense from "./defense";
import * as control from "./control";
action_counter.warpActions();

module.exports.loop = function() {
	console.log()
	console.log("Beginning of tick", Game.time);
	let timer;
	Game.tick_cpu_main = {};
	Game.tick_cpu = {};
	Game.function_actions_count = {};

    main_func.clear_creep();
	main_func.set_global_memory()
    for (var room_name of config.controlled_rooms) {
		try {
			var room = Game.rooms[room_name];
			main_func.set_room_memory(room_name);
		} catch (err) {
			console.log("Error", room_name, err.stack);
		}
	}

	timer = new Timer("towers", true);
    for (var room_name of config.controlled_rooms) {
		try {
			defense.defend_home(room_name);
		} catch (err) {
			console.log("Error", room_name, err.stack);
		}
    }
	if (Game.rooms[config.conf_gcl.conf_map.gcl_room] !== undefined) {
		let room_name = config.conf_gcl.conf_map.gcl_room;
		try {
			if (towers.attack_all(room_name) == 1) {
				if (towers.heal_all(room_name) == 1) {
					towers.repair_all(room_name);
				}
			}
		} catch (err) {
			console.log("Error", room_name, err.stack);
		}
	}
	timer.end();

	timer = new Timer("links", true);
    for (var room_name of config.controlled_rooms) {
		try {
			links.work(room_name)
		} catch (err) {
			console.log("Error", room_name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("classify_creeps", true);
	try {
		for (var name in Game.creeps) {
			var creep = Game.creeps[name];
				creepjobs.creepjob(creep);
		}
	} catch (err) {
		console.log("Error", err.stack);
	}
	timer.end();

	timer = new Timer("run_creeps", true);
	try {
		creepjobs.run();
	} catch (err) {
		console.log("Error", err.stack);
	}
	timer.end();

	timer = new Timer("gcl_room", true);
	try {
		gcl_room.run();
	} catch (err) {
		creep.say("Error");
		console.log("Error at gcl room", err.stack);
	}
	timer.end();

	timer = new Timer("pc", true);
    for (var name in Game.powerCreeps) {
		var pc = Game.powerCreeps[name];
		try {
			powercreeps.work(pc);
		} catch (err) {
			pc.say("Error");
			console.log("Error", pc.room.name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("spawning", true);
    for (var room_name of config.controlled_rooms) {
		try {
			spawning.spawn(room_name);
		} catch (err) {
			console.log("Error", err.stack);
		}
    }
	timer.end();

	timer = new Timer("terminal", true);
	terminal.terminal_balance();
    for (var room_name of config.controlled_rooms) {
		try {
			terminal.process_resource_sending_request(room_name);
		} catch (err) {
			console.log("Error", room_name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("lab_prepare", true);
	labs.prepare();
	timer.end();

	timer = new Timer("lab_reaction", true);
    for (var room_name of config.controlled_rooms) {
		try {
			labs.reaction(room_name);
		} catch (err) {
			console.log("Error", room_name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("factory", true);
    for (var room_name of config.controlled_rooms) {
		try {
			factory.produce(room_name);
		} catch (err) {
			console.log("Error", room_name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("powerspawn", true);
    for (var room_name of config.controlled_rooms) {
		try {
			powerspawn.process(room_name);
		} catch (err) {
			console.log("Error", room_name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("market", true);
	try {
		market.clear_used();
		market.regulate_all_order_prices();
		market.auto_sell();
		market.market_stat();
	} catch (err) {
		console.log("Error", err.stack);
	}

    for (var room_name of config.controlled_rooms) {
		try {
			market.auto_supply_resources(room_name);
			market.process_buy_order(room_name);
			market.process_sell_order(room_name);
		} catch (err) {
			console.log("Error", room_name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("control", true);
	try {
		control.action();
	} catch (err) {
		console.log("Error", err.stack);
	}
	timer.end();

	try {
		final_command.log();
	} catch (err) {
		console.log("Error", err.stack);
	}
	output.log();
	global.test_var = true;
	if (Memory.debug_mode) {
		console.log("Final Real CPU:", Game.cpu.getUsed());
	}
}
