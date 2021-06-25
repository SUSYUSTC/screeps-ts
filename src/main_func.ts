import * as defense from "./defense";
import * as mymath from "./mymath";
import * as layout from "./layout";
import * as functions from "./functions";
import * as config from "./config";
import * as _ from "lodash";
import { Timer } from "./timer";

function is_not_full(structure: AnyStoreStructure): boolean {
    return ( < GeneralStore > structure.store).getFreeCapacity("energy") > 0;
}

function need_to_repair(structure: Structure): boolean {
    return (structure.hits < structure.hitsMax * 0.6);
}

function is_safely_connected(pos1: RoomPosition, pos2: RoomPosition): boolean {
	return !(PathFinder.search(pos1, {pos: pos2, range: 1}, {maxOps: 200, roomCallback: (room_name) => functions.get_basic_costmatrices(room_name, 1)}).incomplete);
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
			let spawns = < StructureSpawn[] > _.filter(structures, (structure) => structure.structureType == "spawn");
			global.memory[room_name].spawn_list = spawns.map((e) => e.id);

			let towers = < StructureTower[] > _.filter(structures, (structure) => structure.structureType == "tower");
			global.memory[room_name].tower_list = towers.map((e) => e.id);

			let energy_storage_list = _.filter(structures, (structure) => ['container', 'link', 'storage', 'terminal'].includes(structure.structureType));
			let energy_storage_list_safe = energy_storage_list.filter((e) => is_safely_connected(spawns[0].pos, e.pos));
			global.memory[room_name].energy_storage_list = energy_storage_list.map((e) => < Id < AnyStoreStructure >> e.id)
			global.memory[room_name].energy_storage_list_safe = energy_storage_list_safe.map((e) => < Id < AnyStoreStructure >> e.id)

			if (room.find(FIND_HOSTILE_CREEPS).length > 0) {
				global.memory[room_name].repair_list = [];
			} else {
				global.memory[room_name].repair_list = _.filter(structures, (structure) => ['container', 'road'].includes(structure.structureType) && need_to_repair(structure)).map((e) => e.id);
			}

			let walls = conf.walls.map((xy) => (<StructureWall> room.getPositionAt(xy[0], xy[1]).lookFor("structure").filter((e) => e.structureType == 'constructedWall')[0])).filter((e) => e !== undefined);
			let main_ramparts = conf.main_ramparts.map((xy) => (<StructureRampart> room.getPositionAt(xy[0], xy[1]).lookFor("structure").filter((e) => e.structureType == 'rampart')[0])).filter((e) => e !== undefined);
			let secondary_ramparts = conf.secondary_ramparts.map((xy) => (<StructureRampart> room.getPositionAt(xy[0], xy[1]).lookFor("structure").filter((e) => e.structureType == 'rampart')[0])).filter((e) => e !== undefined);
			global.memory[room_name].walls_id = walls.map((e) => e.id);
			global.memory[room_name].main_ramparts_id = main_ramparts.map((e) => e.id);
			global.memory[room_name].secondary_ramparts_id = secondary_ramparts.map((e) => e.id);
			global.memory[room_name].ramparts_to_repair = main_ramparts.concat(secondary_ramparts).filter((structure) => structure.hits < config.wall_strength).map((e) => e.id);

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
			let main_ramparts = conf.main_ramparts.map((xy) => (<StructureRampart> room.getPositionAt(xy[0], xy[1]).lookFor("structure").filter((e) => e.structureType == 'rampart')[0])).filter((e) => e !== undefined);
			let secondary_ramparts = conf.secondary_ramparts.map((xy) => (<StructureRampart> room.getPositionAt(xy[0], xy[1]).lookFor("structure").filter((e) => e.structureType == 'rampart')[0])).filter((e) => e !== undefined);
			global.memory[room_name].ramparts_to_repair = main_ramparts.concat(secondary_ramparts).filter((structure) => structure.hits < config.wall_strength).map((e) => e.id);
		}
		let spawns = global.memory[room_name].spawn_list.map((e) => Game.getObjectById(e));
		let towers = global.memory[room_name].tower_list.map((e) => Game.getObjectById(e));
		let energy_filling_towers = towers.filter((e) => e.store.getFreeCapacity("energy") > 400).map((e) => < Id < AnyStoreStructure >> e.id);
		if (Game.powered_rooms[room_name] !== undefined) {
			let energy_filling_spawns = spawns.filter(is_not_full).map((e) => < Id < AnyStoreStructure >> e.id);
			global.memory[room_name].energy_filling_list = energy_filling_spawns.concat(energy_filling_towers);
		} else {
			let energy_filling_spawns = spawns.filter(is_not_full).map((e) => < Id < AnyStoreStructure >> e.id);
			let energy_filling_exts = _.filter(structures, (structure) => structure.structureType == "extension" && is_not_full(structure)).map((e) => <Id<AnyStoreStructure>> e.id);
			global.memory[room_name].energy_filling_list = energy_filling_spawns.concat(energy_filling_towers).concat(energy_filling_exts);
		}
    } else {
        global.memory[room_name].energy_filling_list = global.memory[room_name].energy_filling_list.filter((e) => is_not_full(Game.getObjectById(e)));
		global.memory[room_name].repair_list = global.memory[room_name].repair_list.filter((e) => need_to_repair(Game.getObjectById(e)));
		global.memory[room_name].ramparts_to_repair = global.memory[room_name].ramparts_to_repair.filter((e) => Game.getObjectById(e).hits < config.wall_strength);
	}
}

function update_link_and_container(room_name: string) {
    let room = Game.rooms[room_name];
    let conf = config.conf_rooms[room_name];
    let game_memory = Game.memory[room_name];
    let containers_status = global.memory[room_name].named_structures_status.container;
    let links_status = global.memory[room_name].named_structures_status.link;
    let container_modes = ['S1', 'S2', 'CT'].map((e) => containers_status[e].finished);
    let link_modes = Object.keys(conf.links).filter((e) => links_status[e].finished);
    game_memory.container_modes_all = mymath.all(container_modes);
    game_memory.link_modes = link_modes;
	if (Game.powered_rooms[room_name] == undefined && Game.time % 3 !== 0) {
		return;
	}
    game_memory.are_links_source = {};
	link_modes.filter((e) => e !== 'MAIN' && e !== 'Ext').forEach((e) => game_memory.are_links_source[e] = false);
	if (links_status.Ext !== undefined) {
		game_memory.are_links_source.Ext = true;
	}
    for (let source_name of ['S1', 'S2']) {
        if (link_modes.includes(source_name)) {
            let this_container = Game.getObjectById(containers_status[source_name].id);
            if (this_container !== null && this_container.store.getUsedCapacity("energy") >= config.source_container_lower_limit) {
                game_memory.are_links_source[source_name] = true;
            }
        }
        let source_pos = Game.getObjectById(conf.sources[source_name]).pos;
        room.visual.text(source_name, source_pos.x, source_pos.y);
    }
    if (link_modes.includes('MAIN')) {
		let source_links = link_modes.filter((e) => game_memory.are_links_source[e] == true && Game.getObjectById(links_status[e].id).cooldown <= 3)
        let sink_links = link_modes.filter((e) => game_memory.are_links_source[e] == false)
        let link_energies: {
            [key: string]: number
        } = {};
        link_modes.forEach((e) => link_energies[e] = Game.getObjectById(links_status[e].id).store.getUsedCapacity("energy"));
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
		if (link_energies['Ext'] !== undefined && link_energies['Ext'] > 0 && Game.getObjectById(links_status.Ext.id).cooldown <= 3) {
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

function update_layout(room_name: string, check_all: boolean = false) {
    if (Game.time % 100 !== 0 && !check_all && global.test_var && !Game.rooms[room_name].memory.objects_updated) {
        return;
    }
    let conf = config.conf_rooms[room_name];
	let corresponding_pc_conf = _.filter(config.pc_conf, (e) => e.room_name == room_name)[0];
	if (corresponding_pc_conf !== undefined && corresponding_pc_conf.external_room !== undefined && Game.rooms[corresponding_pc_conf.external_room] !== undefined) {
		layout.update_multiple_structures(corresponding_pc_conf.external_room, "road", {"0": conf.external_rooms[corresponding_pc_conf.external_room].powered_source.roads}, true);
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

function update_mine(room_name: string) {
    let room = Game.rooms[room_name];
    let game_memory = Game.memory[room_name];
    let conf = config.conf_rooms[room_name];
    let containers_MINE = global.memory[room_name].named_structures_status.container.MINE;
    if ("mine" in conf) {
        let mine = Game.getObjectById(conf.mine);
        let exist_extrator = mine.pos.lookFor("structure").filter((e) => e.structureType == 'extractor').length > 0;
        game_memory.mine_status = {
            "harvestable": (exist_extrator && (containers_MINE !== undefined) && containers_MINE.finished),
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

function is_pos_accessable(pos: RoomPosition): boolean {
	let room = Game.rooms[pos.roomName];
	let xmin = Math.min(25, pos.x);
	let xmax = Math.max(25, pos.x);
	let ymin = Math.min(25, pos.y);
	let ymax = Math.max(25, pos.y);
	let n_walls = room.lookForAtArea("structure", ymin, xmin, ymax, xmax, true).filter((e) => e.structure.structureType == 'constructedWall').length;
	return n_walls == 0;
}
global.is_pos_accessable = is_pos_accessable;

var detection_period = 500;
function detect_resources(room_name: string) {
    if (Memory.pb_cooldown_time == undefined) {
        Memory.pb_cooldown_time = 0;
    }
    if (Memory.pb_cooldown_time > 0) {
        Memory.pb_cooldown_time -= 1;
        return;
    }
    let cpu_used = Game.cpu.getUsed();

    let room = Game.rooms[room_name];
    if (room.controller.level < 8) {
        return;
    }
    let game_memory = Game.memory[room_name];
    let external_rooms = config.highway_resources[room_name];
    if (external_rooms == undefined || !global.memory[room_name].unique_structures_status.observer.finished) {
        return;
    }
    if (room.memory.external_resources == undefined) {
        room.memory.external_resources = {
            "pb": {},
            "depo": {},
        };
    }
    if (room.memory.external_resources.pb == undefined) {
        room.memory.external_resources.pb = {};
    }
    if (room.memory.external_resources.depo == undefined) {
        room.memory.external_resources.depo = {};
    }
    for (let i = 0; i < external_rooms.length; i++) {
        if (Game.time % detection_period == i) {
			let observer_status = global.memory[room_name].unique_structures_status.observer
			let observer = Game.getObjectById(observer_status.id);
			if (observer == undefined) {
				continue;
			}
            let external_room_name = external_rooms[i];
            observer.observeRoom(external_room_name);
        }
    }
    for (let i = 0; i < external_rooms.length; i++) {
        if (Game.time % detection_period == i + 1) {
            let external_room_name = external_rooms[i];
            let external_room = Game.rooms[external_room_name];
            if (external_room == undefined) {
				console.log(`Warning: Fail to observe room ${external_room_name} from ${room_name} at time ${Game.time}`);
                continue;
            }
            let pb = < StructurePowerBank > external_room.find(FIND_STRUCTURES).filter((e) => e.structureType == "powerBank")[0];
            if (pb !== undefined && pb.power >= 1000 && pb.ticksToDecay >= 2000) {
                if (room.memory.external_resources.pb[external_room_name] == undefined) {
					let accessable = is_pos_accessable(pb.pos);
					if (!accessable) {
						continue;
					}
					let ok_attacker = functions.is_boost_resource_enough(config.pb_attacker_body);
					let ok_healer = functions.is_boost_resource_enough(config.pb_healer_body);
					let ok = ok_attacker && ok_healer;
                    if (!ok) {
						console.log(`Warning: Boost resource not enough when detecting pb at room ${external_room_name} from room ${room_name} at time ${Game.time}`)
                        continue;
                    }
                    let name = "pb_" + external_room_name + '_' + Game.time.toString();
					let pb_attacker_name = "pb_attacker" + external_room_name + '_' + Game.time.toString()
					let pb_healer_name = "pb_healer" + external_room_name + '_' + Game.time.toString()
                    let pb_carrier_names: string[] = [];
                    let pb_carrier_sizes: number[] = [];
                    let path = PathFinder.search(Game.getObjectById(global.memory[room_name].spawn_list[0]).pos, {
                        "pos": pb.pos,
                        "range": 1
                    }, {
                        maxOps: 6000,
                        roomCallback: functions.restrict_passing_rooms,
                    })
                    if (path.incomplete) {
						console.log(`Warning: Cannot find path when detecting pb at room ${external_room_name} from room ${room_name} at time ${Game.time}`)
                        continue;
                    }
					if (path.path.length > 320) {
                        continue;
					}
					let exits_path = functions.get_exits_from_path(path.path);
                    let n_moves = Math.ceil(pb.power / 100);
                    while (true) {
                        if (n_moves > 16) {
                            n_moves -= 16;
                            pb_carrier_sizes.push(16);
                        } else {
                            pb_carrier_sizes.push(n_moves);
                            break;
                        }
                    }
                    for (let i = 0; i < pb_carrier_sizes.length; i++) {
                        let pb_carrier_name = "pb_carrier" + external_room_name + '_' + Game.time.toString() + i.toString();
                        pb_carrier_names.push(pb_carrier_name);
                    }
                    room.memory.external_resources.pb[external_room_name] = {
                        "name": name,
                        "xy": [pb.pos.x, pb.pos.y],
                        "id": pb.id,
                        "status": 0,
                        "time_last": 0,
                        "rooms_path": exits_path.rooms_path,
                        "poses_path": exits_path.poses_path,
                        "distance": path.cost,
                        "amount": pb.power,
						"amount_received": 0,
                        "pb_attacker_name": pb_attacker_name,
                        "pb_healer_name": pb_healer_name,
                        "pb_carrier_names": pb_carrier_names,
                        "pb_carrier_sizes": pb_carrier_sizes,
                        "n_pb_carrier_finished": 0,
                    }
                    Memory.pb_cooldown_time = 500;
                }
            }
			/*
            let depo = < Deposit > external_room.find(FIND_DEPOSITS)[0];
            if (depo !== undefined && depo.lastCooldown <= config.depo_last_cooldown && depo.ticksToDecay > 2000) {
                let path = PathFinder.search(room.terminal.pos, {
                    "pos": depo.pos,
                    "range": 1
                }, {
                    maxOps: 6000,
                    roomCallback: functions.restrict_passing_rooms,
                })
                if (path.incomplete) {
                    continue;
                }
                let name = "depo_" + Game.time.toString();
                let rooms_path: string[] = [room_name];
                let poses_path: number[] = [];
                for (let pos of path.path) {
                    if (pos.roomName != rooms_path[rooms_path.length - 1]) {
                        rooms_path.push(pos.roomName);
                        if (pos.x == 0 || pos.x == 49) {
                            poses_path.push(pos.y);
                        }
                        if (pos.y == 0 || pos.y == 49) {
                            poses_path.push(pos.x);
                        }
                    }
                }
                room.memory.external_resources.depo[external_room_name] = {
                    "name": name,
                    "xy": [depo.pos.x, depo.pos.y],
                    "id": depo.id,
                    "status": 0,
                    "time_last": 0,
                    "rooms_path": rooms_path,
                    "poses_path": poses_path,
                    "distance": path.cost,
                    "last_cooldown": depo.lastCooldown,
                    "container_progress": 0,
                }
            }
			*/
        }
    }
}

function update_resources(room_name: string) {
    let room = Game.rooms[room_name];
    if (room.controller.level < 8) {
        return;
    }
    if (room.memory.external_resources == undefined) {
        room.memory.external_resources = {
            "pb": {},
            "depo": {},
        };
    }
    if (room.memory.external_resources.pb == undefined) {
        room.memory.external_resources.pb = {};
    }
    if (room.memory.external_resources.depo == undefined) {
        room.memory.external_resources.depo = {};
    }
    for (let external_room_name in room.memory.external_resources.pb) {
        let pb_status = room.memory.external_resources.pb[external_room_name]
        if (pb_status.status == 0) {
            // pb detected
			let pb_attacker_body = global.get_body(functions.conf_body_to_body_components(config.pb_attacker_body));
			let pb_healer_body = global.get_body(functions.conf_body_to_body_components(config.pb_healer_body));
            let pb_attacker_memory = {
                "home_room_name": room_name,
                "role": "pb_attacker",
                "external_room_name": external_room_name,
            }
            let pb_healer_memory = {
                "home_room_name": room_name,
                "role": "pb_healer",
                "external_room_name": external_room_name,
            }
            global.spawn_in_queue(room_name, pb_attacker_body, pb_status.pb_attacker_name, pb_attacker_memory, false);
            global.spawn_in_queue(room_name, pb_healer_body, pb_status.pb_healer_name, pb_healer_memory, false);
            pb_status.status = 1;
        } else if (pb_status.status == 1) {
            // attacker and healer spawned
            pb_status.time_last += 1;
            if (pb_status.time_last >= 800) {
                let pb_carrier_memory = {
                    "home_room_name": room_name,
                    "role": "pb_carrier",
                    "external_room_name": external_room_name,
                };
                for (let i = 0; i < pb_status.pb_carrier_sizes.length; i++) {
                    let pb_carrier_body: BodyPartConstant[] = [];
                    let pb_carrier_size = pb_status.pb_carrier_sizes[i];
                    let pb_carrier_name = pb_status.pb_carrier_names[i];
                    mymath.range(pb_carrier_size * 2).forEach((e) => pb_carrier_body.push(CARRY));
                    mymath.range(pb_carrier_size).forEach((e) => pb_carrier_body.push(MOVE));
                    global.spawn_in_queue(room_name, pb_carrier_body, pb_carrier_name, pb_carrier_memory, false);
                    pb_status.status = 2;
                    pb_status.time_last = 0;
                }
            }
        } else if (pb_status.status == 2) {
            // carrier spawned
            pb_status.time_last += 1;
            if (pb_status.time_last >= 2000 || pb_status.n_pb_carrier_finished == pb_status.pb_carrier_names.length) {
				if (Memory.pb_log == undefined) {
					Memory.pb_log = [];
				}
				let pb_item: type_pb_log = {
					name: pb_status.name,
					home_room_name: room_name,
					external_room_name: external_room_name,
					amount: pb_status.amount,
					amount_received: pb_status.amount_received,
				};
				Memory.pb_log.push(pb_item);
				if (Memory.pb_log.length > 10) {
					Memory.pb_log = Memory.pb_log.slice(0, 10);
				}
				if (pb_status.amount - pb_status.amount_received >= 100) {
					console.log(`Warning: unexpected pb mining ${pb_status.name}`);
				}
                delete room.memory.external_resources.pb[external_room_name];
            }
        }
    }
	/*
    for (let external_room_name in room.memory.external_resources.depo) {
        let depo_status = room.memory.external_resources.depo[external_room_name];
        if (depo_status.status == 0) {
            let do_spawn_builder = false;
            if (depo_status.depo_container_builder_name == undefined) {
                do_spawn_builder = true;
            } else {
                let depo_container_builder = Game.creeps[depo_status.depo_container_builder_name];
                if (depo_container_builder == undefined) {
                    do_spawn_builder = true;
                } else if (depo_container_builder.ticksToLive !== undefined && depo_container_builder.ticksToLive < depo_status.distance + 36) {
                    do_spawn_builder = true;
                }
            }
            if (do_spawn_builder) {
                let depo_container_builder_name = "depo_container_builder_" + Game.time.toString();
                let body: BodyPartConstant[] = [];
                mymath.range(5).forEach((e) => body.push(WORK));
                mymath.range(2).forEach((e) => body.push(CARRY));
                mymath.range(5).forEach((e) => body.push(MOVE));
                let depo_container_builder_memory = {
                    "home_room_name": room_name,
                    "role": "depo_container_builder",
                    "external_room_name": external_room_name,
                }
                global.spawn_in_queue(room_name, body, depo_container_builder_name, depo_container_builder_memory, false);
				depo_status.depo_container_builder_name = depo_container_builder_name;
            }
            let do_spawn_energy_carrier = false;
            if (depo_status.depo_energy_carrier_name == undefined) {
                do_spawn_energy_carrier = true;
            } else {
				let depo_energy_carrier = Game.creeps[depo_status.depo_energy_carrier_name];
                if (depo_energy_carrier == undefined || Game.creeps[depo_status.depo_energy_carrier_name] == undefined) {
                    do_spawn_energy_carrier = true;
                }
            }
			let depo_commuting_times = Math.floor((Math.floor(1450 / depo_status.distance) + 1) / 2);
        } else if (depo_status.status == 1) {}
    }
	*/
}

function get_power_effects(room_name: string) {
	if (Game.time % 5 == 0) {
		return;
	}
	if (Game.powered_rooms[room_name] == undefined) {
		return;
	}
	let room = Game.rooms[room_name];
	let lab_status = global.memory[room_name].named_structures_status.lab;
	for (let lab_name of ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'B1']) {
		if (lab_status[lab_name] !== undefined && lab_status[lab_name].finished) {
			let lab = Game.getObjectById(lab_status[lab_name].id);
			let effect: RoomObjectEffect = undefined;
			if (lab.effects !== undefined) {
				effect = lab.effects.filter((e) => e.effect == PWR_OPERATE_LAB)[0];
			}
			if (effect == undefined) {
				lab_status[lab_name].effect_time = 0;
			} else {
				lab_status[lab_name].effect_time = effect.ticksRemaining;
			}
		}
	}
	let powerspawn_status = global.memory[room_name].unique_structures_status.powerSpawn;
	if (powerspawn_status.finished) {
		let powerspawn = Game.getObjectById(powerspawn_status.id)
		let effect;
		let effect_time = 0;
		if (powerspawn.effects !== undefined) {
			effect = powerspawn.effects.filter((e) => e.effect == PWR_OPERATE_POWER)[0];
		}
		if (effect !== undefined) {
			effect_time = effect.ticksRemaining;
		}
		powerspawn_status.effect_time = effect_time;
	}
}

var set_room_memory_functions: {[key: string]: any} = {
	"update_structures": update_structures,
	"update_layout": update_layout,
	"update_construction_sites": update_construction_sites,
	"update_link_and_container": update_link_and_container,
	"update_mine": update_mine,
	"update_external": update_external,
	"detect_resources": detect_resources,
	"update_resources": update_resources,
	"get_power_effects": get_power_effects,
}

var set_room_memory_functions_order = ["update_structures", "update_layout", "update_construction_sites", "update_link_and_container", "update_mine", "update_external", "detect_resources", "update_resources", "get_power_effects"];

export function set_room_memory(room_name: string) {
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

function update_gcl_room() {
	let timer = new Timer("update_gcl_room", false);

	let conf = config.conf_gcl.conf;
	let conf_map = config.conf_gcl.conf_map;
	let room_name = conf_map.gcl_room;
	let room = Game.rooms[room_name];
	if (room == undefined || !room.controller.my) {
		return;
	}
	Game.memory[room_name] = {};
	set_danger_mode(room_name);
	if (room.memory.next_time == undefined) {
		room.memory.next_time = {};
	}
	if (global.memory[room_name] == undefined) {
		global.memory[room_name] = {};
	}
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
	if (Game.time % 50 == 0 || global.test_var == undefined) {
		let towers = < StructureTower[] > _.filter(room.find(FIND_STRUCTURES), (structure) => structure.structureType == "tower");
		global.memory[room_name].tower_list = towers.map((e) => e.id);
	}
	if (Game.time % 50 == 0) {
		layout.update_multiple_structures(room_name, "road", conf.roads, true, true);
		layout.update_multiple_structures(room_name, "tower", conf.towers, true);
		layout.update_unique_structures(room_name, "storage", conf.storage, true);
		layout.update_unique_structures(room_name, "terminal", conf.terminal, true);
		if (room.terminal == undefined || room.storage == undefined) {
			layout.update_named_structures(room_name, "container", conf.containers, true);
		}
	}
	if (Game.time % 50 == 10) {
		let sites = room.find(FIND_MY_CONSTRUCTION_SITES);
		room.memory.sites_total_progressleft = mymath.array_sum(sites.filter((e) => ['container', 'road'].includes(e.structureType)).map((e) => e.progressTotal - e.progress));
		let supporting_room = Game.rooms[conf_map.supporting_room];
		if (room.memory.external_sites_total_progressleft == undefined) {
			supporting_room.memory.external_sites_total_progressleft = {};
		}
		supporting_room.memory.external_sites_total_progressleft[room_name] = room.memory.sites_total_progressleft;
	}
	global.memory[room_name].ramparts_to_repair = [];
	if (Game.time % 20 == 0 || !global.test_var) {
		global.memory[room_name].repair_list = <Array<Id < StructureRoad >>> _.filter(room.find(FIND_STRUCTURES), (structure) => ["road", "container"].includes(structure.structureType) && need_to_repair(structure)).map((e) => e.id);
	} else {
		global.memory[room_name].repair_list = global.memory[room_name].repair_list.filter((e) => Game.getObjectById(e) != undefined && need_to_repair(Game.getObjectById(e)));
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

    if (Memory.product_request == undefined) {
        Memory.product_request = {};
    }
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
    for (let spawn_name in Game.spawns) {
        let spawn = Game.spawns[spawn_name];
        if (spawn.memory.spawning_time == undefined) {
            spawn.memory.spawning_time = 0;
        }
        spawn.memory.spawning_time += 1;
    }
	if (Game.time % 50 == 0 || Memory.total_energies == undefined || global.terminal_store == undefined) {
		global.terminal_store = global.summarize_terminal();
		Memory.total_energies = global.terminal_store.energy + global.terminal_store.battery * 10;
	}
	Game.powered_rooms = {};
    for (let pc_name in config.pc_conf) {
        if (Game.powerCreeps[pc_name].room !== undefined) {
            let level = Game.powerCreeps[pc_name].powers[PWR_REGEN_SOURCE].level;
            Game.memory[config.pc_conf[pc_name].room_name].pc_source_level = level;
			Game.powered_rooms[config.pc_conf[pc_name].room_name] = pc_name;
        }
    }
	update_gcl_room();
	functions.update_basic_costmatrices();

	timer.end();
}
global.update_layout = update_layout
