import * as defense from "./defense";
import * as mymath from "./mymath";
import * as layout from "./layout";
import * as _ from 'lodash';

export function clear_creep() {
    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
}

export function set_room_memory(room_name: string) {
    let room = Game.rooms[room_name];
    let structures = room.find(FIND_STRUCTURES);
    let temp_exts = _.filter(structures, (structure) => structure.structureType == "extension");
    let temp_spawns = _.filter(structures, (structure) => structure.structureType == "spawn");
    let temp_towers = _.filter(structures, (structure) => structure.structureType == "tower");
    let exts = temp_exts.map((e) => < StructureExtension > e);
    let spawns = temp_spawns.map((e) => < StructureSpawn > e);
    let towers = temp_towers.map((e) => < StructureTower > e);
    room.memory.storage_list = spawns.map((e) => < Id < AnyStorageStructure >> e.id).concat(exts.map((e) => < Id < AnyStorageStructure >> e.id));
    room.memory.tower_list = towers.map((e) => e.id);
    room.memory.spawn_list = spawns.map((e) => e.id);

    let spawn_energies = spawns.map((e) => e.store.getUsedCapacity("energy"));
    let spawn_maxenergies = spawns.map((e) => e.store.getCapacity("energy"));
    let spawn_totalenergy = mymath.array_sum(spawn_energies);
    let spawn_totalmaxenergy = mymath.array_sum(spawn_maxenergies);
    let ext_energies = exts.map((e) => e.store.getUsedCapacity("energy"));
    let ext_maxenergies = exts.map((e) => e.store.getCapacity("energy"));
    let ext_totalenergy = mymath.array_sum(ext_energies);
    let ext_totalmaxenergy = mymath.array_sum(ext_maxenergies);
    let total_energy = spawn_totalenergy + ext_totalenergy;
    let total_maxenergy = spawn_totalmaxenergy + ext_totalmaxenergy;
    room.memory.total_energy = total_energy;
    room.memory.total_maxenergy = total_maxenergy;
    for (let spawn of spawns) {
        if (!("spawning_time" in spawn.memory)) {
            spawn.memory.spawning_time = 0;
        }
        spawn.memory.spawning_time += 1;
    }

    let sites = room.find(FIND_MY_CONSTRUCTION_SITES);
    let sites_progressleft = sites.map((e) => e.progressTotal - e.progress);
    room.memory.sites_total_progressleft = mymath.array_sum(sites_progressleft);

    let enemies = room.find(FIND_HOSTILE_CREEPS);
    if (enemies.length > 0 && room.memory.tower_list.length == 0) {
        room.memory.danger_mode = true;
        console.log("Warning: room", room_name, "invaded!")
    } else {
        room.memory.danger_mode = false;
    }

    let conf = Memory.rooms_conf[room_name];
    if (room.memory.total_maxenergy >= 550) {
        layout.update_structure_info(room_name, "container", conf.containers);
        layout.update_structure_info(room_name, "tower", conf.towers);
        layout.update_structure_info(room_name, "link", conf.links);
    }

    let temp_walls = _.filter(structures, (e) => (e.structureType == "constructedWall" || e.structureType == "rampart"))
    let all_walls = temp_walls.map((e) => < Structure_Wall_Rampart > e);
    let wall_total_rate = conf.wall_rate * all_walls.length;
	if (all_walls.length > 0 && conf.wall_rate > 0) {
		if (!("n_needed_wallrepair" in room.memory)) {
			room.memory.n_needed_wallrepair = 0;
		}
		let do_add_wallrepair = (Math.floor(Game.time*wall_total_rate/800) >  Math.floor((Game.time-1)*wall_total_rate/800));
		if (do_add_wallrepair) {
			room.memory.n_needed_wallrepair += 1;
		}
    }

    let containers_mode = ['S1', 'S2', 'CT'].map((e) => (e in conf.containers) && conf.containers[e].finished);
    let link_modes = Object.keys(conf.links).filter((e) => conf.links[e].finished);
    room.memory.container_mode = mymath.all(containers_mode);
    room.memory.link_modes = link_modes;
	if (link_modes.includes('MAIN')) {
		let source_links = link_modes.filter((e) => conf.links[e].source && e !== 'MAIN')
		let sink_links = link_modes.filter((e) => !conf.links[e].source && e !== 'MAIN')
		let link_energies: {[key: string]: number} = {};
		link_modes.forEach((e) => link_energies[e] = Game.getObjectById(conf.links[e].id).store.getUsedCapacity("energy"));
		if (mymath.any(sink_links.map((e) => link_energies[e] < 150))) {
			conf.links.MAIN.source = true;
			conf.maincarriers.MAIN.link_amount = 550;
		}
		else if (mymath.any(source_links.map((e) => link_energies[e] == 800))) {
			conf.links.MAIN.source = false;
			conf.maincarriers.MAIN.link_amount = 400;
		}
	}
    if ("mine" in conf) {
        let mine = Game.getObjectById(conf.mine.id);
        let exist_extrator = mine.pos.lookFor("structure").filter((e) => e.structureType == 'extractor').length > 0;
        room.memory.mine_harvestable = (exist_extrator && ("MINE" in conf.containers) && conf.containers.MINE.finished);
        conf.mine.density = mine.density;
        conf.mine.type = mine.mineralType;
        conf.mine.amount = mine.mineralAmount;
    }

    for (let external_room_name in conf.external_rooms) {
        for (let source_name in conf.external_rooms[external_room_name].sources) {
            let conf_external = conf.external_rooms[external_room_name].sources[source_name];
            conf_external.harvester_name = "";
            let type = conf_external.carry_end.type;
            if (type == "link") {
                conf_external.transfer_target_id = conf.links[conf_external.carry_end.name].id;
            } else if (type == 'storage') {
                conf_external.transfer_target_id = room.storage.id;
            } else if (type == 'terminal') {
                conf_external.transfer_target_id = room.terminal.id;
            }
        }
    }
    for (let creepname in Game.creeps) {
        let creep = Game.creeps[creepname];
        if (creep.memory.role == 'externalharvester' && creep.memory.home_room_name == room_name && creep.room.name == creep.memory.external_room_name) {
            //console.log(room_name, creep.memory.source_name, JSON.stringify(conf.external_rooms[creep.memory.external_room_name].sources))
            let conf_external = conf.external_rooms[creep.memory.external_room_name].sources[creep.memory.source_name];
            conf_external.harvester_name = creepname;
        }
    }
    if (!("external_room_status" in room.memory)) {
        room.memory.external_room_status = {};
    }
    for (let external_room_name in conf.external_rooms) {
        if (!(external_room_name in room.memory.external_room_status)) {
            room.memory.external_room_status[external_room_name] = {
                "defense_type": '',
                "reserver": '',
                "invader_core_existance": false,
                "safe": true,
            }
        }
        if (external_room_name in Game.rooms) {
            let external_room = Game.rooms[external_room_name];
            let defense_type = defense.get_defense_type(Game.rooms[external_room_name]);
            let reserver;
            if (external_room.controller.reservation !== undefined) {
                reserver = external_room.controller.reservation.username;
            } else {
                reserver = '';
            }
            let invader_core_existance = Game.rooms[external_room_name].find(FIND_STRUCTURES).filter((e) => e.structureType == 'invaderCore').length > 0;
            room.memory.external_room_status[external_room_name] = {
                "defense_type": defense_type,
                "reserver": reserver,
                "invader_core_existance": invader_core_existance,
                "safe": (defense_type == '') && (reserver == Memory.username) && !invader_core_existance,
            }
        }
    }
    console.log(room.name, JSON.stringify(room.memory.external_room_status))
    if (("storage" in room) && room.storage.store.getUsedCapacity("energy") > 2000) {
        room.memory.lack_energy = false;
    } else {
        room.memory.lack_energy = true;
    }
}
