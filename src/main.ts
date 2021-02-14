if (Memory.debug_mode == undefined) {
	Memory.debug_mode = true;
}
if (Memory.output_mode == undefined) {
	Memory.output_mode = true;
}
import * as config from "./config"
import * as _ from "lodash";
import * as creepjobs from "./creepjobs";
import * as mymath from "./mymath";
import * as spawning from "./spawning";
import * as towers from "./towers";
import * as links from "./links";
import * as labs from "./labs"
import * as factory from "./factory"
import * as main_func from "./main_func";
import * as final_command from "./final_command"
import * as output from "./output"
import * as control from "./control"
Memory.rerunning = true;

module.exports.loop = function() {
	console.log()
	console.log("Beginning of tick", Game.time);
	let cpu_used;
	Game.tick_cpu = {};
	cpu_used = Game.cpu.getUsed();
	Game.tick_cpu.parse_memory = Game.cpu.getUsed() - cpu_used;

    main_func.clear_creep();
	main_func.set_global_memory()
    for (var room_name of Memory.controlled_rooms) {
        var room = Game.rooms[room_name];
        main_func.set_room_memory(room_name);
	}

	cpu_used = Game.cpu.getUsed();
    for (var room_name of Memory.controlled_rooms) {
        if (towers.attack_all(room_name) == 1) {
        	if (towers.heal_all(room_name) == 1) {
        		towers.repair_all(room_name);
        	}
        }
        links.work(room_name)
    }
	Game.tick_cpu.towers_and_links = Game.cpu.getUsed() - cpu_used;

    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
		cpu_used = Game.cpu.getUsed();
        creepjobs.creepjob(creep);
		if (creep.memory.role !== undefined) {
			if (Game.tick_cpu[creep.memory.role] == undefined) {
				Game.tick_cpu[creep.memory.role] = 0;
			}
			Game.tick_cpu[creep.memory.role] += Game.cpu.getUsed() - cpu_used;
		}
    }

	cpu_used = Game.cpu.getUsed();
    for (var room_name of Memory.controlled_rooms) {
		spawning.spawn(room_name);
    }
	Game.tick_cpu.spawning = Game.cpu.getUsed() - cpu_used;

	cpu_used = Game.cpu.getUsed();
    for (var room_name of Memory.controlled_rooms) {
		labs.prepare(room_name);
		labs.reaction(room_name);
		factory.produce(room_name);
    }
	Game.tick_cpu.labs = Game.cpu.getUsed() - cpu_used;

	cpu_used = Game.cpu.getUsed();
	control.action();
	Game.tick_cpu.control = Game.cpu.getUsed() - cpu_used;
	final_command.log();
	output.log();
	global.test_var = true;
}
