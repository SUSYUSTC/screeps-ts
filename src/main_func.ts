import * as defense from "./defense";
import * as mymath from "./mymath";
import * as layout from "./layout";
import * as _ from 'lodash';

export function clear_creep() {
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
}

export function set_room_memory(room_name: string) {
    var room = Game.rooms[room_name];
    var structures = room.find(FIND_MY_STRUCTURES);
    var temp_exts = _.filter(structures, (structure) => structure.structureType == "extension");
    var temp_spawns = _.filter(structures, (structure) => structure.structureType == "spawn");
    var temp_towers = _.filter(structures, (structure) => structure.structureType == "tower");
    var exts = temp_exts.map((e) => < StructureExtension > e);
    var spawns = temp_spawns.map((e) => < StructureSpawn > e);
    var towers = temp_towers.map((e) => < StructureTower > e);
    room.memory.storage_list = spawns.map((e) => < Id < AnyStorageStructure >> e.id).concat(exts.map((e) => < Id < AnyStorageStructure >> e.id));
    room.memory.tower_list = towers.map((e) => e.id);
    room.memory.spawn_list = spawns.map((e) => e.id);

    var spawn_energies = spawns.map((e) => e.store.getUsedCapacity("energy"));
    var spawn_maxenergies = spawns.map((e) => e.store.getCapacity("energy"));
    var spawn_totalenergy = mymath.array_sum(spawn_energies);
    var spawn_totalmaxenergy = mymath.array_sum(spawn_maxenergies);
    var ext_energies = exts.map((e) => e.store.getUsedCapacity("energy"));
    var ext_maxenergies = exts.map((e) => e.store.getCapacity("energy"));
    var ext_totalenergy = mymath.array_sum(ext_energies);
    var ext_totalmaxenergy = mymath.array_sum(ext_maxenergies);
    var total_energy = spawn_totalenergy + ext_totalenergy;
    var total_maxenergy = spawn_totalmaxenergy + ext_totalmaxenergy;
    room.memory.total_energy = total_energy;
    room.memory.total_maxenergy = total_maxenergy;
    for (var spawn of spawns) {
        if (!spawn.memory.hasOwnProperty("spawning_time")) {
            spawn.memory.spawning_time = 0;
        }
        spawn.memory.spawning_time += 1;
    }
	if (room.memory.total_maxenergy >= 550) {
		layout.update_structure_info(room_name, "container");
		layout.update_structure_info(room_name, "tower");
		layout.update_structure_info(room_name, "link");
	}

    var sites = room.find(FIND_MY_CONSTRUCTION_SITES);
    var sites_progressleft = sites.map((e) => e.progressTotal - e.progress);
    room.memory.sites_total_progressleft = mymath.array_sum(sites_progressleft);

    var enemies = room.find(FIND_HOSTILE_CREEPS);
    if (enemies.length > 0 && room.memory.tower_list.length == 0) {
        room.memory.danger_mode = true;
        console.log("Warning: room", room_name, "invaded!")
    } else {
        room.memory.danger_mode = false;
    }
    var conf = Memory.rooms_conf[room_name];
    var containers_mode = ['S1', 'S2', 'CT'].map((e) => (conf.containers.hasOwnProperty(e)) && conf.containers[e].finished);
    var links_mode = ['S1', 'S2', 'CT'].map((e) => (conf.links.hasOwnProperty(e)) && conf.links[e].finished);
    room.memory.container_mode = mymath.all(containers_mode);
    room.memory.link_mode = mymath.all(links_mode);
    if (conf.hasOwnProperty("mine")) {
        var mine = Game.getObjectById(conf.mine.id);
        var exist_extrator = mine.pos.lookFor("structure").filter((e) => e.structureType == 'extractor').length > 0;
        room.memory.mine_harvestable = (exist_extrator && conf.containers.hasOwnProperty("MINE") && conf.containers.MINE.finished);
        conf.mine.density = mine.density;
        conf.mine.type = mine.mineralType;
    }

    for (var external_room_name in conf.external_rooms) {
        for (var source_name in conf.external_rooms[external_room_name].sources) {
            var conf_external = conf.external_rooms[external_room_name].sources[source_name];
            conf_external.harvester_name = "";
            var type = conf_external.carry_end.type;
            if (type == "link") {
                conf_external.transfer_target_id = conf.links[conf_external.carry_end.name].id;
            } else if (type == 'storage') {
                conf_external.transfer_target_id = room.storage.id;
            } else if (type == 'terminal') {
                conf_external.transfer_target_id = room.terminal.id;
            }
        }
    }
    for (var creepname in Game.creeps) {
        var creep = Game.creeps[creepname];
        if (creep.memory.role == 'externalharvester' && creep.memory.home_room_name == room_name) {
            //console.log(room_name, creep.memory.source_name, JSON.stringify(conf.external_rooms[creep.memory.external_room_name].sources))
            var conf_external = conf.external_rooms[creep.memory.external_room_name].sources[creep.memory.source_name];
            conf_external.harvester_name = creepname;
        }
    }
    if (!room.memory.hasOwnProperty("invaded_external_rooms")) {
		room.memory.invaded_external_rooms = {};
    }
	for (var external_room_name in conf.external_rooms) {
		if (Game.rooms.hasOwnProperty(external_room_name)) {
			var defense_type = defense.get_defense_type(Game.rooms[external_room_name]);
			if (defense_type !== ''){
				if (!room.memory.invaded_external_rooms.hasOwnProperty(external_room_name)) {
					room.memory.invaded_external_rooms[external_room_name] = defense_type;
				}
			}
			if (defense_type == ''){
				if (room.memory.invaded_external_rooms.hasOwnProperty(external_room_name)) {
					delete room.memory.invaded_external_rooms[external_room_name];
				}
			}
		}
	}
}

