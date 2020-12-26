Memory.performance_mode = true;
Memory.advanced_mode = true;
Memory.debug_mode = true;
var layout = require('./layout');
var creepjobs = require('./creepjobs');
var mymath = require('./mymath');
var spawning = require('./spawning');
var towers = require('./towers');
var links = require('./links')
require('./external_room');
var main_func = require('./main_func');
Memory.rerunning = true;

module.exports.loop = function() {
    main_func.clear_creep();
    for (var room_name of Memory.controlled_rooms) {
        var room = Game.rooms[room_name];
        if (("total_maxenergy" in room.memory) && room.memory.total_maxenergy >= 550) {
            layout.update_structure_info(room_name, "container");
            layout.update_structure_info(room_name, "tower");
            layout.update_structure_info(room_name, "link");
        }
        if (towers.attack_all(room_name) == 1) {
        	if (towers.heal_all(room_name) == 1) {
        		towers.repair_all(room_name);
        	}
        }
        links.work(room_name)
        main_func.set_room_memory(room_name);
    }
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        creepjobs.creepjob(creep);
    }
    for (var name in Game.spawns) {
		spawning.spawn(Game.spawns[name]);
    }
}
