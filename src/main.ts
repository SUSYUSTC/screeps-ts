if (Memory.debug_mode == undefined) {
	Memory.debug_mode = false;
}
if (Memory.output_mode == undefined) {
	Memory.output_mode = false;
}
global.is_main_server = ['shard0', 'shard1', 'shard2', 'shard3'].includes(Game.shard.name);
if (global.is_main_server) {
	global.main_shards = ['shard3']; 
	global.sub_shards = ['shard0', 'shard1', 'shard2'];
} else {
	global.main_shards = [Game.shard.name];
	global.sub_shards = [];
}
global.all_shards = global.main_shards.concat(global.sub_shards);
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
import * as control from "./control";
action_counter.warpActions();

function run_sub() {
	console.log()
	console.log("Beginning of tick", Game.time, 'at', Game.shard.name);
	console.log("bucket", Game.cpu.bucket);
	Game.tick_cpu_main = {};
	Game.tick_cpu = {};
	Game.function_actions_count = {};

	try {
		cross_shard.sync_shard_memory();
		for (let creepname in Game.creeps) {
			let creep = Game.creeps[creepname];
			console.log("test creep position", Game.shard.name, JSON.stringify(creep.pos));
			external_room.movethroughshards(creep);
		}
		cross_shard.update_shard_memory();
	} catch (err) {
		console.log(err.stack);
	}
}
function run_main() {
	console.log()
	console.log("Beginning of tick", Game.time, 'at', Game.shard.name);
	console.log("bucket", Game.cpu.bucket);
	let timer;
	Game.tick_cpu_main = {};
	Game.tick_cpu = {};
	Game.function_actions_count = {};

    main_func.clear_creep();
	try {
		main_func.set_global_memory()
	} catch (err) {
		console.log("Captured error", err.stack);
	}
    for (let room_name of config.controlled_rooms) {
		try {
			let room = Game.rooms[room_name];
			main_func.set_room_memory(room_name);
		} catch (err) {
			console.log("Captured error", room_name, err.stack);
		}
	}

	timer = new Timer("sync_shard_memory", true);
	try {
		cross_shard.sync_shard_memory();
	} catch (err) {
		console.log("Captured error", err.stack);
	}
	timer.end();

	timer = new Timer("towers", true);
    for (let room_name of config.controlled_rooms) {
		try {
			defense.defend_home(room_name);
		} catch (err) {
			console.log("Captured error", room_name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("links", true);
    for (let room_name of config.controlled_rooms) {
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
			console.log("Captured error", pc.room.name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("spawning", true);
    for (let room_name of config.controlled_rooms) {
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
    for (let room_name of config.controlled_rooms) {
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
    for (let room_name of config.controlled_rooms) {
		try {
			terminal.process_resource_sending_request(room_name);
		} catch (err) {
			console.log("Captured error", room_name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("factory", true);
    for (let room_name of config.controlled_rooms) {
		try {
			factory.produce(room_name);
		} catch (err) {
			console.log("Captured error", room_name, err.stack);
		}
    }
	timer.end();

	timer = new Timer("powerspawn", true);
    for (let room_name of config.controlled_rooms) {
		try {
			powerspawn.process(room_name);
		} catch (err) {
			console.log("Captured error", room_name, err.stack);
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
		console.log("Captured error", err.stack);
	}

    for (let room_name of config.controlled_rooms) {
		try {
			market.auto_supply_resources(room_name);
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

	try {
		final_command.log();
		output.log();
	} catch (err) {
		console.log("Captured error", err.stack);
	}
	global.test_var = true;
	console.log("Final Real CPU:", Game.cpu.getUsed());
}


module.exports.loop = function() {
	if (Memory.stop_running) {
		return;
	}
	if (global.main_shards.includes(Game.shard.name)) {
		run_main();
	} else {
		run_sub();
	}
}
