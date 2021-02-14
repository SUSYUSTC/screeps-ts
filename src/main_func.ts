import * as defense from "./defense";
import * as mymath from "./mymath";
import * as layout from "./layout";
import * as _ from 'lodash';

function is_not_full(structure: AnyStorageStructure): boolean {
    return structure.store.getFreeCapacity("energy") > 0;
}

export function clear_creep() {
    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }
}

export function set_room_memory(room_name: string) {
    let name_of_this_function = "set_room_memory"
    if (Game.tick_cpu[name_of_this_function] == undefined) {
        Game.tick_cpu[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();

    let room = Game.rooms[room_name];
    let structures = room.find(FIND_STRUCTURES);
    room.memory.objects_updated = false;
    let n_structures = structures.length;
    if (room.memory.n_structures !== n_structures) {
        room.memory.objects_updated = true;
        room.memory.n_structures = n_structures;
    }
    let conf = Memory.rooms_conf[room_name];
    if (global.test_var == undefined || Game.time % 10 == 0) {
        layout.update_structure_info(room_name, "container", conf.containers);
        layout.update_structure_info(room_name, "tower", conf.towers);
        layout.update_structure_info(room_name, "link", conf.links);
        layout.update_structure_info(room_name, "lab", conf.labs);
        if (conf.extensions !== undefined && room.controller.ticksToDowngrade > 8000) {
            for (let xy of conf.extensions) {
                room.createConstructionSite(xy[0], xy[1], 'extension')
            }
        }
		let nukers = < StructureNuker[] > _.filter(structures, (structure) => structure.structureType == "nuker");
		if (nukers.length == 1) {
			room.memory.nuker_id = nukers[0].id;
		}
		else {
			delete room.memory.nuker_id;
		}
		let factories = < StructureFactory[] > _.filter(structures, (structure) => structure.structureType == "factory");
		if (factories.length == 1) {
			room.memory.factory_id = factories[0].id;
		}
		else {
			delete room.memory.factory_id;
		}
		let powerspawns = < StructurePowerSpawn[] > _.filter(structures, (structure) => structure.structureType == "powerSpawn");
		if (powerspawns.length == 1) {
			room.memory.powerspawn_id = powerspawns[0].id;
		}
		else {
			delete room.memory.powerspawn_id;
		}
    }

    let spawns = < StructureSpawn[] > _.filter(structures, (structure) => structure.structureType == "spawn");
    let towers = < StructureTower[] > _.filter(structures, (structure) => structure.structureType == "tower");
    room.memory.tower_list = towers.map((e) => e.id);
    room.memory.spawn_list = spawns.map((e) => e.id);
    if (room.energyCapacityAvailable < 3000 || room.energyAvailable < 2000 || Game.time % 10 == 0 || room.memory.storage_list == undefined) {
        let exts = < StructureExtension[] > _.filter(structures, (structure) => structure.structureType == "extension");
        room.memory.storage_list = spawns.filter(is_not_full).map((e) => < Id < AnyStorageStructure >> e.id).concat(exts.filter(is_not_full).map((e) => < Id < AnyStorageStructure >> e.id));
    }

    let sites = room.find(FIND_MY_CONSTRUCTION_SITES);
    let n_sites = sites.length;;
    if (room.memory.n_sites == undefined) {
        room.memory.n_sites = 0;
        room.memory.ticks_to_spawn_builder = 0;
    }
    if (n_sites > room.memory.n_sites) {
        room.memory.ticks_to_spawn_builder = 8;
    }
    if (room.memory.ticks_to_spawn_builder > 0) {
        room.memory.ticks_to_spawn_builder -= 1;
    }
    if (room.memory.n_sites !== n_sites) {
        room.memory.objects_updated = true;
        room.memory.n_sites = n_sites;
    }
    room.memory.n_sites = sites.length;

    room.memory.total_energy = room.energyAvailable;
    room.memory.total_maxenergy = room.energyCapacityAvailable;
    for (let spawn of spawns) {
        if (!("spawning_time" in spawn.memory)) {
            spawn.memory.spawning_time = 0;
        }
        spawn.memory.spawning_time += 1;
    }

    let sites_progressleft = sites.map((e) => e.progressTotal - e.progress);
    room.memory.sites_total_progressleft = mymath.array_sum(sites_progressleft);
    let enemies = room.find(FIND_HOSTILE_CREEPS);
    if (enemies.length > 0 && room.memory.tower_list.length == 0) {
        room.memory.danger_mode = true;
        console.log("Warning: room", room_name, "invaded!")
    } else {
        room.memory.danger_mode = false;
    }

    let containers_mode = ['S1', 'S2', 'CT'].map((e) => (e in conf.containers) && conf.containers[e].finished);
    let link_modes = Object.keys(conf.links).filter((e) => conf.links[e].finished);
    room.memory.container_mode = mymath.all(containers_mode);
    room.memory.link_modes = link_modes;
    if (link_modes.includes('MAIN')) {
        let source_links = link_modes.filter((e) => conf.links[e].source && e !== 'MAIN')
        let sink_links = link_modes.filter((e) => !conf.links[e].source && e !== 'MAIN')
        let link_energies: {
            [key: string]: number
        } = {};
        link_modes.forEach((e) => link_energies[e] = Game.getObjectById(conf.links[e].id).store.getUsedCapacity("energy"));
        if (mymath.any(sink_links.map((e) => link_energies[e] <= conf.main_link_amount_source - conf.link_transfer_gap))) {
            conf.links.MAIN.source = true;
            conf.maincarriers.MAIN.link_amount = conf.main_link_amount_source;
        } else if (mymath.any(source_links.map((e) => link_energies[e] >= conf.main_link_amount_sink + conf.link_transfer_gap))) {
            conf.links.MAIN.source = false;
            conf.maincarriers.MAIN.link_amount = conf.main_link_amount_sink;
        }
    }
    for (let source_name of ['S1', 'S2']) {
        if (link_modes.includes(source_name)) {
            let this_container = Game.getObjectById(conf.containers[source_name].id);
            if (this_container.store.getUsedCapacity("energy") < 800) {
                conf.links[source_name].source = false;
            } else {
                conf.links[source_name].source = true;
            }
        }
    }

    if (("storage" in room) && room.storage.store.getUsedCapacity("energy") > 2000) {
        room.memory.lack_energy = false;
    } else {
        room.memory.lack_energy = true;
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
        if (!conf.external_rooms[external_room_name].active) {
            continue;
        }
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
    if (Memory.debug_mode) {
        console.log(room.name, JSON.stringify(room.memory.external_room_status))
    }
    Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
}

export function set_global_memory() {
    if (global.mineral_storage_amount == undefined) {
        global.mineral_storage_amount = {};
    }
    let keys = < Array < keyof type_mineral_storage_room >> Object.keys(global.mineral_storage_room);
    for (let key of keys) {
        let room_name = global.mineral_storage_room[key];
        global.mineral_storage_amount[key] = Game.rooms[room_name].terminal.store.getUsedCapacity(key);
    }
}
