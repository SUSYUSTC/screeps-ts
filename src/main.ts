Memory.performance_mode = true;
Memory.advanced_mode = true;
Memory.debug_mode = true;
import * as config from "./config"
import * as _ from "lodash";
import * as creepjobs from "./creepjobs";
import * as mymath from "./mymath";
import * as spawning from "./spawning";
import * as towers from "./towers";
import * as links from "./links";
import * as main_func from "./main_func";
import * as simpleattacker from "./simple_attacker"
Memory.rerunning = true;

module.exports.loop = function() {
	console.log()
	console.log("Beginning of tick", Game.time);
    main_func.clear_creep();
    for (var room_name of Memory.controlled_rooms) {
        var room = Game.rooms[room_name];
        main_func.set_room_memory(room_name);
        if (towers.attack_all(room_name) == 1) {
        	if (towers.heal_all(room_name) == 1) {
        		towers.repair_all(room_name);
        	}
        }
        links.work(room_name)
    }
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        creepjobs.creepjob(creep);
    }
    for (var room_name of Memory.controlled_rooms) {
		spawning.spawn(room_name);
    }
	if ("test" in Game.creeps) {
		simpleattacker.simple_attack(Game.creeps["test"], ['E15N58', 'E14N58', 'E13N58', 'E13N57', 'E12N57', 'E12N56'], ['default', 'default', 'default', 'default', 'default'])
	}
}
