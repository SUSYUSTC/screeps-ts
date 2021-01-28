Memory.debug_mode = true;
import * as config from "./config"
import * as _ from "lodash";
import * as creepjobs from "./creepjobs";
import * as mymath from "./mymath";
import * as spawning from "./spawning";
import * as towers from "./towers";
import * as links from "./links";
import * as main_func from "./main_func";
import * as final_command from "./final_command"
import * as control from "./control"
Memory.rerunning = true;

module.exports.loop = function() {
	console.log()
	console.log("Beginning of tick", Game.time);
    main_func.clear_creep();
	main_func.set_global_memory()
    for (var room_name of Memory.controlled_rooms) {
        var room = Game.rooms[room_name];
        main_func.set_room_memory(room_name);
	}

	let cpu_used;
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
		if (!Memory.controlled_rooms.includes(creep.room.name)) {
			continue;
		}
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

	control.action();
	Game.tick_cpu.control = Game.cpu.getUsed() - cpu_used;
	final_command.log();
	global.test_var = true;
}
