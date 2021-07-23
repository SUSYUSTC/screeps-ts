import * as defense from "./defense";
import * as mymath from "./mymath";
import * as layout from "./layout";
import * as functions from "./functions";
import * as config from "./config";
import * as resources from "./resources";
import * as _ from "lodash";
import {
    Timer
} from "./timer";

function need_to_fill(structure: AnyStoreStructure): boolean {
	if (structure.structureType == 'tower') {
		return ( < GeneralStore > structure.store).getUsedCapacity("energy") < config.tower_filling_energy;
	} else {
		return ( < GeneralStore > structure.store).getFreeCapacity("energy") > 0;
	}
}

function need_to_repair(structure: Structure): boolean {
    return (structure.hits < structure.hitsMax * 0.6);
}

function is_safely_connected(pos1: RoomPosition, pos2: RoomPosition): boolean {
    return !(PathFinder.search(pos1, {
        pos: pos2,
        range: 1
    }, {
        maxOps: 200,
        roomCallback: (room_name: string) => functions.get_basic_costmatrices(room_name, 1)
    }).incomplete);
}

export function clear_creep() {
    let timer = new Timer("clear_creep", true);
    if (Game.time % 50 == 0) {
        for (let name in Memory.creeps) {
            if (!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
        }
    }
    timer.end();
}

let named_structures = ["container", "link", "lab", "spawn"];
let unique_structures = ["factory", "nuker", "storage", "terminal", "observer", "powerSpawn", "extractor"];
let multiple_structures = ["road", "extension", "tower"];

function generate_named_structures(room_name: string, structuretype: type_named_structures) {
    let room = Game.rooms[room_name];
    let named_structures = global.memory[room_name].named_structures_status;
	room[structuretype] = {};
    for (let name in named_structures[structuretype]) {
        let obj = Game.getObjectById(named_structures[structuretype][name].id)
        if (obj != undefined) {
            room[structuretype][name] = <any> obj;
        }
    }
}

function generate_unique_structure(room_name: string, structuretype: type_unique_structures) {
    let room = Game.rooms[room_name];
    let unique_structures = global.memory[room_name].unique_structures_status;
	let obj = Game.getObjectById(unique_structures[structuretype].id)
	if (obj != undefined) {
		room[structuretype] = <any> obj;
	}
}

function update_structures(room_name: string) {
    let room = Game.rooms[room_name];
    let game_memory = Game.memory[room_name];
    let conf = config.conf_rooms[room_name];
    if (global.memory[room_name].named_structures_status == undefined) {
        let named_structures_status: any = {};
        named_structures.forEach((e) => named_structures_status[e] = {});
        global.memory[room_name].named_structures_status = < type_all_named_structures_status > named_structures_status;
    }
    if (global.memory[room_name].unique_structures_status == undefined) {
        let unique_structures_status: any = {};
        unique_structures.forEach((e) => unique_structures_status[e] = {});
        global.memory[room_name].unique_structures_status = < type_all_unique_structures_status > unique_structures_status;
    }
    if (room.energyCapacityAvailable < 3000 || room.energyAvailable < 2000 || Game.time % 40 == 0 || (game_memory.danger_mode && Game.time % 5 == 0) || !global.test_var) {
        let structures = room.find(FIND_STRUCTURES);
        room.memory.objects_updated = false;
        let n_structures = structures.length;
        if (room.memory.n_structures !== n_structures) {
            room.memory.objects_updated = true;
            room.memory.n_structures = n_structures;
        }
        if (Game.time % 200 == 0 || !global.test_var || room.memory.objects_updated) {
			// defined spawns, towers, walls, ramparts
            let spawns = < StructureSpawn[] > _.filter(structures, (structure) => structure.structureType == "spawn");
			let safe_pos = room.getPositionAt(conf.storage.pos[0], conf.storage.pos[1]);
            global.memory[room_name].spawn_list = spawns.map((e) => e.id);

            let towers = < StructureTower[] > _.filter(structures, (structure) => structure.structureType == "tower");
            global.memory[room_name].tower_list = towers.map((e) => e.id);

            let energy_storage_list = _.filter(structures, (structure) => ['container', 'link', 'storage', 'terminal'].includes(structure.structureType));
            let energy_storage_list_safe = energy_storage_list.filter((e) => is_safely_connected(safe_pos, e.pos));
            global.memory[room_name].energy_storage_list = energy_storage_list.map((e) => < Id < AnyStoreStructure >> e.id)
            global.memory[room_name].energy_storage_list_safe = energy_storage_list_safe.map((e) => < Id < AnyStoreStructure >> e.id)

            let walls = conf.walls.map((xy) => ( < StructureWall > room.getPositionAt(xy[0], xy[1]).lookFor("structure").filter((e) => e.structureType == 'constructedWall')[0])).filter((e) => e !== undefined);
            let main_ramparts = conf.main_ramparts.map((xy) => ( < StructureRampart > room.getPositionAt(xy[0], xy[1]).lookFor("structure").filter((e) => e.structureType == 'rampart')[0])).filter((e) => e !== undefined);
            let secondary_ramparts = conf.secondary_ramparts.map((xy) => ( < StructureRampart > room.getPositionAt(xy[0], xy[1]).lookFor("structure").filter((e) => e.structureType == 'rampart')[0])).filter((e) => e !== undefined);
            global.memory[room_name].walls_id = walls.map((e) => e.id);
            global.memory[room_name].main_ramparts_id = main_ramparts.map((e) => e.id);
            global.memory[room_name].secondary_ramparts_id = secondary_ramparts.map((e) => e.id);
            global.memory[room_name].ramparts_to_repair = main_ramparts.concat(secondary_ramparts).filter((structure) => structure.hits < config.min_wall_strength).map((e) => e.id);

            let wall_strength = 0;
            let main_rampart_strength = 0;
            let secondary_rampart_strength = 0;
            if (walls.length > 0) {
                wall_strength = mymath.min(walls.map((e) => e.hits));
            }
            if (main_ramparts.length > 0) {
                main_rampart_strength = mymath.min(main_ramparts.map((e) => e.hits));
            }
            if (secondary_ramparts.length > 0) {
                secondary_rampart_strength = mymath.min(secondary_ramparts.map((e) => e.hits));
            }
            room.memory.min_wall_strength = wall_strength;
            room.memory.min_main_rampart_strength = main_rampart_strength;
            room.memory.min_secondary_rampart_strength = secondary_rampart_strength;
            room.memory.n_walls = walls.length;
            room.memory.n_main_ramparts = main_ramparts.length;
            room.memory.n_secondary_ramparts = secondary_ramparts.length;
        } else if (Memory.look_broken_ramparts) {
            let main_ramparts = conf.main_ramparts.map((xy) => ( < StructureRampart > room.getPositionAt(xy[0], xy[1]).lookFor("structure").filter((e) => e.structureType == 'rampart')[0])).filter((e) => e !== undefined);
            let secondary_ramparts = conf.secondary_ramparts.map((xy) => ( < StructureRampart > room.getPositionAt(xy[0], xy[1]).lookFor("structure").filter((e) => e.structureType == 'rampart')[0])).filter((e) => e !== undefined);
            global.memory[room_name].ramparts_to_repair = main_ramparts.concat(secondary_ramparts).filter((structure) => structure.hits < config.min_wall_strength).map((e) => e.id);
			if (global.memory[room_name].ramparts_to_repair.length == 0 && room.find(FIND_MY_CONSTRUCTION_SITES).length == 0) {
				Memory.look_broken_ramparts = false;
			}
        }

		if (room.find(FIND_HOSTILE_CREEPS).length > 0) {
			global.memory[room_name].repair_list = [];
		} else {
			global.memory[room_name].repair_list = _.filter(structures, (structure) => ['container', 'road'].includes(structure.structureType) && need_to_repair(structure)).map((e) => e.id);
		}
        let spawns = global.memory[room_name].spawn_list.map((e) => Game.getObjectById(e));
        let towers = global.memory[room_name].tower_list.map((e) => Game.getObjectById(e));
        let energy_filling_towers = towers.filter((e) => e.store.getUsedCapacity("energy") < config.tower_filling_energy).map((e) => < Id < AnyStoreStructure >> e.id);
        if (Game.powered_rooms[room_name] !== undefined) {
            let energy_filling_spawns = spawns.filter(need_to_fill).map((e) => < Id < AnyStoreStructure >> e.id);
            global.memory[room_name].energy_filling_list = energy_filling_spawns.concat(energy_filling_towers);
        } else {
            let energy_filling_spawns = spawns.filter(need_to_fill).map((e) => < Id < AnyStoreStructure >> e.id);
            let energy_filling_exts = _.filter(structures, (structure) => structure.structureType == "extension" && need_to_fill(structure)).map((e) => < Id < AnyStoreStructure >> e.id);
            global.memory[room_name].energy_filling_list = energy_filling_spawns.concat(energy_filling_towers).concat(energy_filling_exts);
        }
    } else {
        global.memory[room_name].energy_filling_list = global.memory[room_name].energy_filling_list.filter((e) => need_to_fill(Game.getObjectById(e)));
        global.memory[room_name].repair_list = global.memory[room_name].repair_list.filter((e) => need_to_repair(Game.getObjectById(e)));
        global.memory[room_name].ramparts_to_repair = global.memory[room_name].ramparts_to_repair.filter((e) => Game.getObjectById(e).hits < config.min_wall_strength);
    }
}

function update_layout(room_name: string, check_all: boolean = false) {
	let interval = Game.rooms[room_name].controller.level > 1 ? 100: 20;
    if (Game.time % interval !== 0 && !check_all && global.test_var && !Game.rooms[room_name].memory.objects_updated) {
        return;
    }
    let conf = config.conf_rooms[room_name];
    let corresponding_pc_conf = _.filter(config.pc_conf, (e) => e.room_name == room_name)[0];
    if (corresponding_pc_conf !== undefined && corresponding_pc_conf.external_room !== undefined && Game.rooms[corresponding_pc_conf.external_room] !== undefined) {
        layout.update_multiple_structures(corresponding_pc_conf.external_room, "road", {
            "0": conf.external_rooms[corresponding_pc_conf.external_room].powered_source.roads
        }, true);
    }
    let level_finished = true;
    let containers_finished = (layout.update_named_structures(room_name, "container", conf.containers, true) == 0);
    let links_finished = (layout.update_named_structures(room_name, "link", conf.links, true) == 0);
    let spawns_finished = (layout.update_named_structures(room_name, "spawn", conf.spawns, true) == 0);
    let roads_finished = (layout.update_multiple_structures(room_name, "road", conf.roads, true, check_all) == 0);
    let extensions_finished = (layout.update_multiple_structures(room_name, "extension", conf.extensions, true, check_all) == 0);
    let towers_finished = (layout.update_multiple_structures(room_name, "tower", conf.towers, true, check_all) == 0);
    //console.log("containers", containers_finished, "links", links_finished, "spawns", spawns_finished, "roads", roads_finished, "extension", extensions_finished, "towers", towers_finished)
    //level_finished = level_finished && containers_finished && links_finished && spawns_finished && roads_finished && extensions_finished && towers_finished;
    let storage_finished = (layout.update_unique_structures(room_name, "storage", conf.storage, true) == 0);
    let terminal_finished = (layout.update_unique_structures(room_name, "terminal", conf.terminal, true) == 0);
    let extractor_finished = (layout.update_unique_structures(room_name, "extractor", conf.extractor, true) == 0);
    //level_finished = level_finished && storage_finished && terminal_finished && extractor_finished;
    //console.log("storage", storage_finished, "terminal", terminal_finished, "extractor", extractor_finished);
    let labs_finished = (layout.update_named_structures(room_name, "lab", conf.labs, true) == 0);
    let ps_finished = (layout.update_unique_structures(room_name, "powerSpawn", conf.powerspawn, true) == 0);
    let factory_finished = (layout.update_unique_structures(room_name, "factory", conf.factory, true) == 0);
    let nuker_finished = (layout.update_unique_structures(room_name, "nuker", conf.nuker, true) == 0);
    let observer_finished = (layout.update_unique_structures(room_name, "observer", conf.observer, true) == 0);
    //console.log("labs", labs_finished, "ps", ps_finished, "factory", factory_finished, "nuker", nuker_finished, "observer", observer_finished);
}

function generate_structures(room_name: string) {
	generate_named_structures(room_name, "container");
	generate_named_structures(room_name, "lab");
	generate_named_structures(room_name, "link");
	generate_named_structures(room_name, "spawn");
	generate_unique_structure(room_name, "factory");
	generate_unique_structure(room_name, "nuker");
	generate_unique_structure(room_name, "powerSpawn");
	generate_unique_structure(room_name, "observer");
	generate_unique_structure(room_name, "extractor");
}

function update_construction_sites(room_name: string) {
    let room = Game.rooms[room_name];
    if (Game.time % 5 == 0) {
        let sites = room.find(FIND_MY_CONSTRUCTION_SITES);
        let n_sites = sites.length;;
        if (room.memory.n_sites == undefined) {
            room.memory.n_sites = 0;
            room.memory.ticks_to_spawn_builder = 0;
        }
        if (n_sites > room.memory.n_sites) {
            room.memory.ticks_to_spawn_builder = 8;
        }
        if (room.memory.n_sites !== n_sites) {
            room.memory.objects_updated = true;
            room.memory.n_sites = n_sites;
        }
        room.memory.n_sites = sites.length;

        let sites_progressleft = sites.map((e) => e.progressTotal - e.progress);
        room.memory.sites_total_progressleft = mymath.array_sum(sites_progressleft);
    }
    let corresponding_pc_conf = _.filter(config.pc_conf, (e) => e.room_name == room_name)[0];
    if (corresponding_pc_conf !== undefined && corresponding_pc_conf.external_room !== undefined && Game.rooms[corresponding_pc_conf.external_room] !== undefined) {
        let sites = Game.rooms[corresponding_pc_conf.external_room].find(FIND_MY_CONSTRUCTION_SITES).filter((e) => e.structureType == 'road');
        let sites_progressleft = sites.map((e) => e.progressTotal - e.progress);
        if (room.memory.external_sites_total_progressleft == undefined) {
            room.memory.external_sites_total_progressleft = {};
        }
        room.memory.external_sites_total_progressleft[corresponding_pc_conf.external_room] = mymath.array_sum(sites_progressleft);
    }

    if (room.memory.ticks_to_spawn_builder > 0) {
        room.memory.ticks_to_spawn_builder -= 1;
    }
}

function update_link_and_container(room_name: string) {
    let room = Game.rooms[room_name];
    let conf = config.conf_rooms[room_name];
    let game_memory = Game.memory[room_name];
    let link_modes = Object.keys(room.link);
    if (Game.powered_rooms[room_name] == undefined && Game.time % 3 !== 0) {
        return;
    }
    game_memory.are_links_source = {};
    link_modes.filter((e) => e !== 'MAIN' && e !== 'Ext').forEach((e) => game_memory.are_links_source[e] = false);
    if (room.link.Ext !== undefined) {
        game_memory.are_links_source.Ext = true;
    }
    for (let source_name of ['S1', 'S2']) {
        if (link_modes.includes(source_name)) {
            let this_container = room.container[source_name];
            if (this_container !== null && this_container.store.getUsedCapacity("energy") >= config.source_container_lower_limit) {
                game_memory.are_links_source[source_name] = true;
            }
        }
        let source_pos = Game.getObjectById(conf.sources[source_name]).pos;
        room.visual.text(source_name, source_pos.x, source_pos.y);
    }
    if (link_modes.includes('MAIN') && room.storage !== undefined) {
        let source_links = link_modes.filter((e) => game_memory.are_links_source[e] == true && room.link[e].cooldown <= 3)
        let sink_links = link_modes.filter((e) => game_memory.are_links_source[e] == false)
        let link_energies: {
            [key: string]: number
        } = {};
        link_modes.forEach((e) => link_energies[e] = room.link[e].store.getUsedCapacity("energy"));
        if (room.memory.maincarrier_link_amount == undefined) {
            room.memory.maincarrier_link_amount = 400;
        }
        if (mymath.any(sink_links.map((e) => link_energies[e] <= config.main_link_amount_source - config.link_transfer_from_main_gap))) {
            room.memory.is_mainlink_source = true;
            room.memory.maincarrier_link_amount = config.main_link_amount_source;
        } else if (mymath.any(source_links.map((e) => link_energies[e] >= config.main_link_amount_sink + config.link_transfer_to_main_gap))) {
            room.memory.is_mainlink_source = false;
            room.memory.maincarrier_link_amount = config.main_link_amount_sink;
        }
        if (link_energies['Ext'] !== undefined && link_energies['Ext'] > 0 && room.link.Ext.cooldown <= 3) {
            room.memory.is_mainlink_source = false;
            room.memory.maincarrier_link_amount = config.main_link_amount_sink;
        }
        if (room.storage.store.getUsedCapacity("energy") < 1000) {
            room.memory.is_mainlink_source = false;
            room.memory.maincarrier_link_amount = config.main_link_amount_sink;
        }
        room.visual.text(room.memory.maincarrier_link_amount.toString(), conf.links.MAIN.pos[0], conf.links.MAIN.pos[1]);
    }
}

function update_mine(room_name: string) {
    let room = Game.rooms[room_name];
    let game_memory = Game.memory[room_name];
    let conf = config.conf_rooms[room_name];
    if ("mine" in conf) {
        let mine = Game.getObjectById(conf.mine);
        let exist_extrator = mine.pos.lookFor("structure").filter((e) => e.structureType == 'extractor').length > 0;
        game_memory.mine_status = {
            "harvestable": (exist_extrator && room.container.MINE !== undefined),
            "density": mine.density,
            "type": mine.mineralType,
            "amount": mine.mineralAmount,
        }
    }
}

function update_external(room_name: string) {
    let game_memory = Game.memory[room_name];
    let room = Game.rooms[room_name];
    let conf = config.conf_rooms[room_name];
    if (!("external_room_status" in room.memory)) {
        room.memory.external_room_status = {};
    }
    if (Game.time % 5 !== 0) {
        return;
    }
    for (let external_room_name in conf.external_rooms) {
        if (!conf.external_rooms[external_room_name].active && Game.rooms[external_room_name] == undefined) {
            delete room.memory.external_room_status[external_room_name];
            continue;
        }
        // Initialize if not exists
        if (!(external_room_name in room.memory.external_room_status)) {
            room.memory.external_room_status[external_room_name] = {
                "defense_type": '',
                "reserver": '',
                "invader_core_existance": false,
                "safe": true,
                "time_last": 0,
            }
        }
        // If visible 
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
            let old_defense_type = room.memory.external_room_status[external_room_name].defense_type;
            let time_last = room.memory.external_room_status[external_room_name].time_last;
            if (defense_type == old_defense_type) {
                time_last += 5;
            } else {
                time_last = 0
            }
            room.memory.external_room_status[external_room_name] = {
                "defense_type": defense_type,
                "reserver": reserver,
                "invader_core_existance": invader_core_existance,
                "safe": (defense_type == '') && (external_room.controller.my || reserver == config.username) && !invader_core_existance,
                "time_last": time_last,
            }
        } else {
            room.memory.external_room_status[external_room_name].time_last += 5;
            if (room.memory.external_room_status[external_room_name].time_last >= 1500) {
                room.memory.external_room_status[external_room_name] = {
                    "defense_type": '',
                    "reserver": '',
                    "invader_core_existance": false,
                    "safe": true,
                    "time_last": 0,
                }
            }
        }
    }
}

function set_danger_mode(room_name: string) {
    let enemies_components = defense.get_room_invading_ability(room_name)
    let enemies_CE = mymath.array_sum(Object.values(enemies_components));
    if (enemies_CE >= 50 && enemies_components.heal >= 20) {
        console.log(`Warning: Invasion detected at room ${room_name}!`);
        console.log("Warning: CE:", enemies_CE, "#heal:", enemies_components.heal);
        Game.memory[room_name].danger_mode = true;
    } else {
        Game.memory[room_name].danger_mode = false;
    }
}


function get_power_effects(room_name: string) {
    if (Game.powered_rooms[room_name] == undefined) {
        return;
    }
    let room = Game.rooms[room_name];
	for (let lab_name of ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'B1']) {
		let lab = room.lab[lab_name];
		let effect: RoomObjectEffect = undefined;
		if (lab.effects !== undefined) {
			effect = lab.effects.filter((e) => e.effect == PWR_OPERATE_LAB)[0];
		}
		if (effect == undefined) {
			lab.effect_time = 0;
		} else {
			lab.effect_time = effect.ticksRemaining;
		}
	}
	if (room.powerSpawn !== undefined) {
		let effect: PowerEffect;
		let effect_time = 0;
		if (room.powerSpawn.effects !== undefined) {
			//effect = room.powerSpawn.effects.filter((e) => (<PowerEffect>e).effect == PWR_OPERATE_POWER)[0];
			effect = (<Array<PowerEffect>>room.powerSpawn.effects).filter((e) => e.effect == PWR_OPERATE_POWER)[0];
		}
		if (effect == undefined) {
			room.powerSpawn.effect_time = 0;
		} else {
			room.powerSpawn.effect_time = effect.ticksRemaining;
			room.powerSpawn.effect_level = effect.level;
		}
	}
}

var set_room_memory_functions: {
    [key: string]: any
} = {
    "update_structures": update_structures,
    "update_layout": update_layout,
    "generate_structures": generate_structures,
    "update_construction_sites": update_construction_sites,
    "update_link_and_container": update_link_and_container,
    "update_mine": update_mine,
    "update_external": update_external,
    "detect_resources": resources.detect_resources,
    "update_resources": resources.update_resources,
    "get_power_effects": get_power_effects,
}

var set_room_memory_functions_order = ["update_structures", "update_layout", "generate_structures", "update_construction_sites", "update_link_and_container", "update_mine", "update_external", "detect_resources", "update_resources", "get_power_effects"];

export function set_room_memory(room_name: string) {
	if (Game.rooms[room_name] == undefined) {
		return;
	}
    let timer = new Timer("set_room_memory", true);

    let room = Game.rooms[room_name];
    let game_memory = Game.memory[room_name];

    if (room.memory.next_time == undefined) {
        room.memory.next_time = {};
    }
    if (global.memory[room_name] == undefined) {
        global.memory[room_name] = {};
    }
    set_danger_mode(room_name);

    for (let function_name of set_room_memory_functions_order) {
		//let timer = new Timer(function_name, false);
        set_room_memory_functions[function_name](room_name);
        //timer.end();
    }

    if (("storage" in room) && room.storage.store.getUsedCapacity("energy") > 2000) {
        game_memory.lack_energy = false;
    } else {
        game_memory.lack_energy = true;
    }

    timer.end();
}

export function set_global_memory() {
    Game.actions_count = 0;
    Game.function_actions_count = {};
    Game.memory = {};
    if (global.memory == undefined) {
        global.memory = {};
    }
    let timer = new Timer("set_global_memory", true);

    for (let room_name of config.controlled_rooms) {
        Game.memory[room_name] = {};
    }
    Game.creep_jobtypes = {
        home: [],
        external: [],
        maincarrier: [],
        combat: [],
        resource: [],
    }
	Game.controlled_rooms_with_terminal = config.controlled_rooms.filter((e) =>  Game.rooms[e] !== undefined && Game.rooms[e].storage !== undefined && Game.rooms[e].storage.my && Game.rooms[e].terminal !== undefined && Game.rooms[e].terminal.my);
    for (let spawn_name in Game.spawns) {
        let spawn = Game.spawns[spawn_name];
        if (spawn.memory.spawning_time == undefined) {
            spawn.memory.spawning_time = 0;
        }
        spawn.memory.spawning_time += 1;
    }
    Game.powered_rooms = {};
    for (let pc_name in config.pc_conf) {
        if (Game.powerCreeps[pc_name].room !== undefined) {
			let power_source = Game.powerCreeps[pc_name].powers[PWR_REGEN_SOURCE];
			if (power_source !== undefined) {
				Game.memory[config.pc_conf[pc_name].room_name].pc_source_level = power_source.level;
			}
            Game.powered_rooms[config.pc_conf[pc_name].room_name] = pc_name;
        }
    }
    functions.update_basic_costmatrices();

    timer.end();
}

function is_independent_room(room_name: string): boolean {
	let room = Game.rooms[room_name];
	return room.controller.level >=7 || (room.energyCapacityAvailable >= 2200 && Game.controlled_rooms_with_terminal.includes(room_name) && room.lab.B1 !== undefined && Object.keys(room.link).length == 3);
}
export function set_global_memory_last() {
	Game.independent_rooms = Game.controlled_rooms_with_terminal.filter((e) => is_independent_room(e));
	Game.controlled_rooms_with_terminal = Game.controlled_rooms_with_terminal.filter((e) => !config.obselete_rooms.includes(e));
}
global.update_layout = update_layout
