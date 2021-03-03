import * as defense from "./defense";
import * as mymath from "./mymath";
import * as layout from "./layout";
import * as config from "./config";
import * as _ from 'lodash';

function is_not_full(structure: AnyStorageStructure): boolean {
    return ( < GeneralStore > structure.store).getFreeCapacity("energy") > 0;
}

export function clear_creep() {
    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }
}

let named_structures = ["container", "link", "lab", "spawn"];
let unique_structures = ["factory", "nuker", "storage", "terminal", "observer", "powerSpawn", "extractor"];
let multiple_structures = ["road", "extension", "tower"];

export function set_room_memory(room_name: string) {
    let name_of_this_function = "set_room_memory"
    if (Game.tick_cpu[name_of_this_function] == undefined) {
        Game.tick_cpu[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();

    let room = Game.rooms[room_name];
    Game.memory[room_name] = {};
    let game_memory = Game.memory[room_name];
    if (room.memory.named_structures_status == undefined) {
        let named_structures_status: any = {};
        named_structures.forEach((e) => named_structures_status[e] = {});
        room.memory.named_structures_status = < type_all_named_structures_status > named_structures_status;
    }
    if (room.memory.unique_structures_status == undefined) {
        let unique_structures_status: any = {};
        unique_structures.forEach((e) => unique_structures_status[e] = {});
        room.memory.unique_structures_status = < type_all_unique_structures_status > unique_structures_status;
    }
    let structures = room.find(FIND_STRUCTURES);
    room.memory.objects_updated = false;
    let n_structures = structures.length;
    if (room.memory.n_structures !== n_structures) {
        room.memory.objects_updated = true;
        room.memory.n_structures = n_structures;
    }
    let conf = config.conf_rooms[room_name];
    if_layout: if (global.test_var == undefined || Game.time % 20 == 0) {
        let level_finished = true;
        let containers_finished = (layout.update_named_structures(room_name, "container", conf.containers, true) == 0);
        let links_finished = (layout.update_named_structures(room_name, "link", conf.links, true) == 0);
        let spawns_finished = (layout.update_named_structures(room_name, "spawn", conf.spawns, true) == 0);
        let roads_finished = (layout.update_multiple_structures(room_name, "road", conf.roads, true) == 0);
        let extensions_finished = (layout.update_multiple_structures(room_name, "extension", conf.extensions, true) == 0);
        let towers_finished = (layout.update_multiple_structures(room_name, "tower", conf.towers, true) == 0);
		//console.log("containers", containers_finished, "links", links_finished, "spawns", spawns_finished, "roads", roads_finished, "extension", extensions_finished, "towers", towers_finished)
		level_finished = level_finished && containers_finished && links_finished && spawns_finished && roads_finished && extensions_finished && towers_finished;
        if (!level_finished) {
            break if_layout;
        }
        let storage_finished = (layout.update_unique_structures(room_name, "storage", conf.storage, true) == 0);
        let terminal_finished = (layout.update_unique_structures(room_name, "terminal", conf.terminal, true) == 0);
        let extractor_finished = (layout.update_unique_structures(room_name, "extractor", conf.extractor, true) == 0);
		level_finished = level_finished && storage_finished && terminal_finished && extractor_finished;
		//console.log("storage", storage_finished, "terminal", terminal_finished, "extractor", extractor_finished);
        if (!level_finished) {
            break if_layout;
        }
        let labs_finished = (layout.update_named_structures(room_name, "lab", conf.labs, true) == 0);
        let ps_finished = (layout.update_unique_structures(room_name, "powerSpawn", conf.powerspawn, true) == 0);
        let factory_finished = (layout.update_unique_structures(room_name, "factory", conf.factory, true) == 0);
        let nuker_finished = (layout.update_unique_structures(room_name, "nuker", conf.nuker, true) == 0);
        let observer_finished = (layout.update_unique_structures(room_name, "observer", conf.observer, true) == 0);
		//console.log("labs", labs_finished, "ps", ps_finished, "factory", factory_finished, "nuker", nuker_finished, "observer", observer_finished);
    }

    let spawns = < StructureSpawn[] > _.filter(structures, (structure) => structure.structureType == "spawn");
    let towers = < StructureTower[] > _.filter(structures, (structure) => structure.structureType == "tower");
    Game.memory[room_name].tower_list = towers.map((e) => e.id);
    Game.memory[room_name].spawn_list = spawns.map((e) => e.id);
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

    for (let spawn of spawns) {
        if (!("spawning_time" in spawn.memory)) {
            spawn.memory.spawning_time = 0;
        }
        spawn.memory.spawning_time += 1;
    }

    let sites_progressleft = sites.map((e) => e.progressTotal - e.progress);
    game_memory.sites_total_progressleft = mymath.array_sum(sites_progressleft);
    let enemies = room.find(FIND_HOSTILE_CREEPS);
    if (enemies.length > 0 && Game.memory[room_name].tower_list.length == 0) {
        game_memory.danger_mode = true;
        console.log("Warning: room", room_name, "invaded!")
    } else {
        game_memory.danger_mode = false;
    }

    let containers_status = room.memory.named_structures_status.container;
    let links_status = room.memory.named_structures_status.link;
    let container_modes = ['S1', 'S2', 'CT'].map((e) => containers_status[e].finished);
    let link_modes = Object.keys(conf.links).filter((e) => links_status[e].finished);
    game_memory.container_modes_all = mymath.all(container_modes);
    game_memory.link_modes = link_modes;
    game_memory.are_links_source = {};
    link_modes.forEach((e) => game_memory.are_links_source[e] = false);
    for (let source_name of ['S1', 'S2']) {
        if (link_modes.includes(source_name)) {
            let this_container = Game.getObjectById(containers_status[source_name].id);
            if (this_container.store.getUsedCapacity("energy") >= 800) {
                game_memory.are_links_source[source_name] = true;
            }
        }
    }
    if (link_modes.includes('MAIN')) {
        let source_links = link_modes.filter((e) => game_memory.are_links_source[e] && e !== 'MAIN')
        let sink_links = link_modes.filter((e) => !game_memory.are_links_source[e] && e !== 'MAIN')
        let link_energies: {
            [key: string]: number
        } = {};
        link_modes.forEach((e) => link_energies[e] = Game.getObjectById(links_status[e].id).store.getUsedCapacity("energy"));
        if (mymath.any(sink_links.map((e) => link_energies[e] <= config.main_link_amount_source - config.link_transfer_gap))) {
            game_memory.are_links_source.MAIN = true;
            game_memory.maincarrier_link_amount = config.main_link_amount_source;
        } else if (mymath.any(source_links.map((e) => link_energies[e] >= config.main_link_amount_sink + config.link_transfer_gap))) {
            game_memory.are_links_source.MAIN = false;
            game_memory.maincarrier_link_amount = config.main_link_amount_sink;
        }
    }

    if (("storage" in room) && room.storage.store.getUsedCapacity("energy") > 2000) {
        game_memory.lack_energy = false;
    } else {
        game_memory.lack_energy = true;
    }

    if ("mine" in conf) {
        let mine = Game.getObjectById(conf.mine);
        let exist_extrator = mine.pos.lookFor("structure").filter((e) => e.structureType == 'extractor').length > 0;
		game_memory.mine_status = {
			"harvestable": (exist_extrator && (containers_status.MINE !== undefined) && containers_status.MINE.finished),
			"density": mine.density,
			"type": mine.mineralType,
			"amount": mine.mineralAmount,
		}
    }

    game_memory.external_harvester = {};
    for (var external_room_name in conf.external_rooms) {
        game_memory.external_harvester[external_room_name] = {};
        for (var source_name in conf.external_rooms[external_room_name].sources) {
            game_memory.external_harvester[external_room_name][source_name] = "";
        }
    }
    for (let creepname in Game.creeps) {
        let creep = Game.creeps[creepname];
        if (creep.memory.role == 'externalharvester' && creep.memory.home_room_name == room_name && creep.room.name == creep.memory.external_room_name) {
            game_memory.external_harvester[creep.memory.external_room_name][creep.memory.source_name] = creep.name;
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
                "safe": (defense_type == '') && (reserver == config.username) && !invader_core_existance,
            }
        }
    }
    if (Memory.debug_mode) {
        console.log(room.name, JSON.stringify(room.memory.external_room_status))
    }
    Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
}

export function set_global_memory() {
    if (Game.mineral_storage_amount == undefined) {
        Game.mineral_storage_amount = {};
    }
    Game.memory = {}
    let keys = < Array < keyof type_mineral_storage_room >> Object.keys(config.mineral_storage_room);
    for (let key of keys) {
        let room_name = config.mineral_storage_room[key];
        Game.mineral_storage_amount[key] = Game.rooms[room_name].terminal.store.getUsedCapacity(key);
    }
}
