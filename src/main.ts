if (Memory.debug_mode == undefined) {
	Memory.debug_mode = true;
}
if (Memory.output_mode == undefined) {
	Memory.output_mode = true;
}
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
import * as attack from "./attack";
import * as powercreeps from "./powercreeps"
import * as control from "./control";
Memory.rerunning = true;

module.exports.loop = function() {
	console.log()
	console.log("Beginning of tick", Game.time);
	let cpu_used;
	Game.tick_cpu_main = {};
	Game.tick_cpu = {};

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

	cpu_used = Game.cpu.getUsed();
    for (var room_name of config.controlled_rooms) {
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
	Game.tick_cpu_main.towers = Game.cpu.getUsed() - cpu_used;

	cpu_used = Game.cpu.getUsed();
    for (var room_name of config.controlled_rooms) {
		try {
			links.work(room_name)
		} catch (err) {
			console.log("Error", room_name, err.stack);
		}
    }
	Game.tick_cpu_main.links = Game.cpu.getUsed() - cpu_used;

    for (var name in Game.creeps) {
		var creep = Game.creeps[name];
		try {
			cpu_used = Game.cpu.getUsed();
			creepjobs.creepjob(creep);
			if (creep.memory.role !== undefined) {
				if (Game.tick_cpu_main[creep.memory.role] == undefined) {
					Game.tick_cpu_main[creep.memory.role] = 0;
				}
				Game.tick_cpu_main[creep.memory.role] += Game.cpu.getUsed() - cpu_used;
			}
		} catch (err) {
			creep.say("Error");
			creep.memory.movable = false;
			creep.memory.crossable = false;
			console.log("Error", creep.room.name, err.stack);
		}
    }

	cpu_used = Game.cpu.getUsed();
    for (var name in Game.powerCreeps) {
		var pc = Game.powerCreeps[name];
		try {
			powercreeps.work(pc);
		} catch (err) {
			creep.say("Error");
			console.log("Error", creep.room.name, err.stack);
		}
    }
	Game.tick_cpu_main.pc = Game.cpu.getUsed() - cpu_used;

	cpu_used = Game.cpu.getUsed();
    for (var room_name of config.controlled_rooms) {
		try {
			spawning.spawn(room_name);
		} catch (err) {
			console.log("Error", err.stack);
		}
    }
	Game.tick_cpu_main.spawning = Game.cpu.getUsed() - cpu_used;

	cpu_used = Game.cpu.getUsed();
	terminal.terminal_balance();
    for (var room_name of config.controlled_rooms) {
		try {
			terminal.process_resource_sending_request(room_name);
		} catch (err) {
			console.log("Error", room_name, err.stack);
		}
    }
	Game.tick_cpu_main.terminal = Game.cpu.getUsed() - cpu_used;

	cpu_used = Game.cpu.getUsed();
	labs.prepare();
	Game.tick_cpu_main.lab_prepare = Game.cpu.getUsed() - cpu_used;

	cpu_used = Game.cpu.getUsed();
    for (var room_name of config.controlled_rooms) {
		try {
			labs.reaction(room_name);
		} catch (err) {
			console.log("Error", room_name, err.stack);
		}
    }
	Game.tick_cpu_main.lab_reaction = Game.cpu.getUsed() - cpu_used;

	cpu_used = Game.cpu.getUsed();
    for (var room_name of config.controlled_rooms) {
		try {
			factory.produce(room_name);
		} catch (err) {
			console.log("Error", room_name, err.stack);
		}
    }
	Game.tick_cpu_main.factory = Game.cpu.getUsed() - cpu_used;

	cpu_used = Game.cpu.getUsed();
    for (var room_name of config.controlled_rooms) {
		try {
			powerspawn.process(room_name);
		} catch (err) {
			console.log("Error", room_name, err.stack);
		}
    }
	Game.tick_cpu_main.powerspawn = Game.cpu.getUsed() - cpu_used;

	cpu_used = Game.cpu.getUsed();
	try {
		market.clear_used();
		market.regulate_all_order_prices();
	} catch (err) {
		console.log("Error", err.stack);
	}
	Game.tick_cpu_main.market_regulate = Game.cpu.getUsed() - cpu_used;

	cpu_used = Game.cpu.getUsed();
    for (var room_name of config.controlled_rooms) {
		try {
			market.process_buy_order(room_name);
			market.process_sell_order(room_name);
		} catch (err) {
			console.log("Error", room_name, err.stack);
		}
    }
	Game.tick_cpu_main.market_process = Game.cpu.getUsed() - cpu_used;

	cpu_used = Game.cpu.getUsed();
	try {
		control.action();
	} catch (err) {
		console.log("Error", err.stack);
	}
	Game.tick_cpu_main.control = Game.cpu.getUsed() - cpu_used;
	try {
		final_command.log();
	} catch (err) {
		console.log("Error", err.stack);
	}
	output.log();
	global.test_var = true;
}
