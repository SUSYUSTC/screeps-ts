if (Memory.debug_mode == undefined) {
	Memory.debug_mode = false;
}
if (Memory.output_mode == undefined) {
	Memory.output_mode = false;
}
global.is_main_server = ['shard0', 'shard1', 'shard2', 'shard3'].includes(Game.shard.name);
if (global.is_main_server) {
	global.all_shards = ['shard0', 'shard1', 'shard2', 'shard3']; 
} else {
	global.all_shards = [Game.shard.name];
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
import * as external_room from "./external_room";
import * as invade from "./invade";
invade.init();
import * as display from "./display";
display.init();
import * as powercreeps from "./powercreeps"
import { Timer } from "./timer";
import * as defense from "./defense";
import * as cross_shard from "./cross_shard";
import * as constants from "./constants"
import * as control from "./control";
action_counter.warpActions();
//action_counter.warpMove();

function run_sub() {
	console.log()
	console.log("Beginning of tick", Game.time, 'at', Game.shard.name);
	console.log("bucket", Game.cpu.bucket);
	Game.tick_cpu_main = {};
	Game.tick_cpu = {};
	Game.function_actions_count = {};

	try {
		cross_shard.sync_shard_memory();
		cross_shard.sync_shard_room_info(config.controlled_rooms);
	} catch (err) {
		console.log("Captured error:", err.stack);
	}
	console.log("All creeps:", Object.keys(Game.InterShardMemory[Game.shard.name].all_creeps))
	console.log("Registered creeps:", Object.keys(Game.InterShardMemory[Game.shard.name].creeps))
	for (let creepname in Game.creeps) {
		try {
			let creep = Game.creeps[creepname];
			external_room.movethroughshards(creep);
		} catch (err) {
			console.log("Captured error:", Game.creeps[creepname].room.name, creepname, err.stack);
		}
	}
	try {
		cross_shard.update_shard_memory();
	} catch (err) {
		console.log("Captured error:", err.stack);
	}
	try {
		final_command.log();
	} catch (err) {
		console.log("Captured error:", err.stack);
	}
	console.log("Final Real CPU:", Game.cpu.getUsed());
	if (Game.cpu.bucket == 10000) {
		Game.cpu.generatePixel();
	}
}
function run_main() {
	console.log()
	console.log("Beginning of tick", Game.time, 'at', Game.shard.name);
	console.log("bucket", Game.cpu.bucket);
	let timer;
	Game.controlled_rooms = config.controlled_rooms.filter((e) => Game.rooms[e] !== undefined);
	Game.tick_cpu_main = {};
	Game.tick_cpu = {};
	Game.function_actions_count = {};

    main_func.clear_memory();
	try {
		main_func.set_global_memory()
	} catch (err) {
		console.log("Captured error", err.stack);
	}
    for (let room_name of Game.controlled_rooms) {
		try {
			let room = Game.rooms[room_name];
			main_func.set_room_memory(room_name);
		} catch (err) {
			console.log("Captured error", room_name, err.stack);
		}
	}
	main_func.set_global_memory_last()

	timer = new Timer("sync_shard_memory", true);
	try {
		cross_shard.sync_shard_memory();
		cross_shard.sync_shard_room_info(config.controlled_rooms);
	} catch (err) {
		console.log("Captured error", err.stack);
	}
	timer.end();

	console.log("All creeps:", Object.keys(Game.InterShardMemory[Game.shard.name].all_creeps))
	console.log("Registered creeps:", Object.keys(Game.InterShardMemory[Game.shard.name].creeps))

	timer = new Timer("invade_groups", true);
	if (Memory.invade_groups_x1 == undefined) {
		Memory.invade_groups_x1 = {};
	}
	for (let groupname in Memory.invade_groups_x1) {
		try {
			console.log(global.format_json(Memory.invade_groups_x1[groupname], {json: false, skipkeys: ['costmatrix', 'shard_path']}))
			invade.run_invader_group_x1(groupname);
		} catch (err) {
			console.log("Captured error", groupname, err.stack);
		}
	}
	if (Memory.invade_groups_x2 == undefined) {
		Memory.invade_groups_x2 = {};
	}
	for (let groupname in Memory.invade_groups_x2) {
		try {
			console.log(global.format_json(Memory.invade_groups_x2[groupname], {json: false, skipkeys: ['costmatrix', 'shard_path']}))
			invade.run_invader_group_x2(groupname);
		} catch (err) {
			console.log("Captured error", groupname, err.stack);
		}
	}
	timer.end();

	timer = new Timer("towers", true);
    for (let room_name of Game.controlled_rooms) {
		try {
			defense.defend_home(room_name);
		} catch (err) {
			console.log("Captured error", room_name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("links", true);
    for (let room_name of Game.controlled_rooms) {
		try {
			links.work(room_name)
		} catch (err) {
			console.log("Captured error", room_name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("classify_creeps", true);
	try {
		for (let name in Game.creeps) {
			let creep = Game.creeps[name];
			creepjobs.creepjob(creep);
		}
	} catch (err) {
		console.log("Captured error", err.stack);
	}
	timer.end();

	timer = new Timer("run_creeps", true);
	try {
		creepjobs.run();
	} catch (err) {
		console.log("Captured error", err.stack);
	}
	timer.end();

	timer = new Timer("pc", true);
    for (let name in Game.powerCreeps) {
		let pc = Game.powerCreeps[name];
		try {
			powercreeps.work(pc);
		} catch (err) {
			pc.say("Error");
			console.log("Captured error", pc.name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("spawning", true);
    for (let room_name of Game.controlled_rooms) {
		try {
			spawning.spawn(room_name);
		} catch (err) {
			console.log("Captured error", room_name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("lab_prepare", true);
	try {
		labs.prepare();
	} catch (err) {
		console.log("Captured error", err.stack);
	}
	timer.end();

	timer = new Timer("lab_reaction", true);
    for (let room_name of Game.controlled_rooms) {
		try {
			labs.reaction(room_name);
		} catch (err) {
			console.log("Captured error", room_name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("terminal", true);
	try {
		terminal.terminal_balance();
	} catch (err) {
		console.log("Captured error", err.stack);
	}
    for (let room_name of Game.controlled_rooms) {
		try {
			terminal.process_resource_sending_request(room_name);
		} catch (err) {
			console.log("Captured error", room_name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("factory", true);
    for (let room_name of Game.controlled_rooms) {
		try {
			factory.produce(room_name);
		} catch (err) {
			console.log("Captured error", room_name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("powerspawn", true);
    for (let room_name of Game.controlled_rooms) {
		try {
			powerspawn.process(room_name);
		} catch (err) {
			console.log("Captured error", room_name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("market", true);
	try {
		market.regulate_all_order_prices();
		market.auto_sell();
		market.market_stat();
		market.commodity_orders();
	} catch (err) {
		console.log("Captured error", err.stack);
	}

    for (let room_name of Game.controlled_rooms) {
		try {
			market.auto_supply_resources(room_name);
			market.auto_buy_resources(room_name);
			market.process_buy_order(room_name);
			market.process_sell_order(room_name);
		} catch (err) {
			console.log("Captured error", room_name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("control", true);
	try {
		control.action();
	} catch (err) {
		console.log("Captured error", err.stack);
	}
	timer.end();

	timer = new Timer("update_shard_memory", true);
	try {
		cross_shard.update_shard_memory();
	} catch (err) {
		console.log("Captured error", err.stack);
	}
	timer.end();

	timer = new Timer("show_direction", true);
	if (Memory.showdirection) {
		for (let creepname in Game.creeps) {
			let creep = Game.creeps[creepname];
			if (creep.commands !== undefined && creep.commands.move !== undefined) {
				creep.say(constants.direction2name[<DirectionConstant>(creep.commands.move[0])]);
			}
		}
	}
	timer.end();

	try {
		final_command.log();
		output.log();
	} catch (err) {
		console.log("Captured error", err.stack);
	}
	global.test_var = true;
	console.log("Final Real CPU:", Game.cpu.getUsed());

	if (Game.cpu.bucket == 10000) {
		Game.cpu.generatePixel();
	}
}


module.exports.loop = function() {
	if (Memory.stop_running) {
		return;
	}
	run_main();
}
