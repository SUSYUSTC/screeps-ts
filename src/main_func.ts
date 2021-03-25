import * as defense from "./defense";
import * as mymath from "./mymath";
import * as layout from "./layout";
import * as functions from "./functions";
import * as config from "./config";
import * as _ from 'lodash';

function is_not_full(structure: AnyStoreStructure): boolean {
    return ( < GeneralStore > structure.store).getFreeCapacity("energy") > 0;
}

export function clear_creep() {
    let name_of_this_function = "clear_creep";
    if (Game.tick_cpu_main[name_of_this_function] == undefined) {
        Game.tick_cpu_main[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();

	if (Game.time % 50 == 0) {
		for (let name in Memory.creeps) {
			if (!Game.creeps[name]) {
				delete Memory.creeps[name];
			}
		}
	}

    Game.tick_cpu_main[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
}

let named_structures = ["container", "link", "lab", "spawn"];
let unique_structures = ["factory", "nuker", "storage", "terminal", "observer", "powerSpawn", "extractor"];
let multiple_structures = ["road", "extension", "tower"];

function update_structures(room_name: string) {
    let name_of_this_function = "update_structures";
    if (Game.tick_cpu[name_of_this_function] == undefined) {
        Game.tick_cpu[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();

	let room = Game.rooms[room_name];
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
	let structures_defined = (room.memory.energy_filling_list !== undefined) && (room.memory.energy_storage_list !==  undefined) && (room.memory.spawn_list !== undefined) && (room.memory.tower_list !== undefined)
    if (global.test_var == undefined || room.energyCapacityAvailable < 3000 || room.energyAvailable < 2000 || Game.time % 10 == 0 || !structures_defined) {
		let structures = room.find(FIND_STRUCTURES);
		room.memory.objects_updated = false;
		let n_structures = structures.length;
		if (room.memory.n_structures !== n_structures) {
			room.memory.objects_updated = true;
			room.memory.n_structures = n_structures;
		}
		let spawns = < StructureSpawn[] > _.filter(structures, (structure) => structure.structureType == "spawn");
		let towers = < StructureTower[] > _.filter(structures, (structure) => structure.structureType == "tower");
		room.memory.tower_list = towers.map((e) => e.id);
		room.memory.spawn_list = spawns.map((e) => e.id);
        let exts = < StructureExtension[] > _.filter(structures, (structure) => structure.structureType == "extension");
        room.memory.energy_filling_list = spawns.filter(is_not_full).map((e) => < Id < AnyStoreStructure >> e.id).concat(exts.filter(is_not_full).map((e) => < Id < AnyStoreStructure >> e.id));
		room.memory.energy_storage_list = _.filter(structures, (structure) => ['container', 'link', 'storage', 'terminal'].includes(structure.structureType)).map((e) => <Id<AnyStoreStructure>> e.id)
    }

    Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
}

function update_link_and_container(room_name: string) {
    let name_of_this_function = "update_link_and_container";
    if (Game.tick_cpu[name_of_this_function] == undefined) {
        Game.tick_cpu[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();

    let room = Game.rooms[room_name];
    let conf = config.conf_rooms[room_name];
    let game_memory = Game.memory[room_name];
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
		let source_pos = Game.getObjectById(conf.sources[source_name]).pos;
		room.visual.text(source_name, source_pos.x, source_pos.y);
    }
    if (link_modes.includes('MAIN')) {
        let source_links = link_modes.filter((e) => game_memory.are_links_source[e] && e !== 'MAIN')
        let sink_links = link_modes.filter((e) => !game_memory.are_links_source[e] && e !== 'MAIN')
        let link_energies: {
            [key: string]: number
        } = {};
        link_modes.forEach((e) => link_energies[e] = Game.getObjectById(links_status[e].id).store.getUsedCapacity("energy"));
        if (room.memory.maincarrier_link_amount == undefined) {
            room.memory.maincarrier_link_amount = 400;
        }
        if (mymath.any(sink_links.map((e) => link_energies[e] <= config.main_link_amount_source - config.link_transfer_gap))) {
            room.memory.is_mainlink_source = true;
            room.memory.maincarrier_link_amount = config.main_link_amount_source;
        } else if (mymath.any(source_links.map((e) => link_energies[e] >= config.main_link_amount_sink + config.link_transfer_gap))) {
            room.memory.is_mainlink_source = false;
            room.memory.maincarrier_link_amount = config.main_link_amount_sink;
        }
        if (room.memory.is_mainlink_source !== undefined) {
            game_memory.are_links_source.MAIN = room.memory.is_mainlink_source;
        }
        room.visual.text(room.memory.maincarrier_link_amount.toString(), conf.links.MAIN.pos[0], conf.links.MAIN.pos[1]);
    }

    Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
}

function update_layout(room_name: string) {
    let name_of_this_function = "update_layout";
    if (Game.tick_cpu[name_of_this_function] == undefined) {
        Game.tick_cpu[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();

    if (global.test_var !== undefined && Game.time % 50 !== 0) {
		Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
		return;
	}
    let conf = config.conf_rooms[room_name];
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
		Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
        return;
    }
    let storage_finished = (layout.update_unique_structures(room_name, "storage", conf.storage, true) == 0);
    let terminal_finished = (layout.update_unique_structures(room_name, "terminal", conf.terminal, true) == 0);
    let extractor_finished = (layout.update_unique_structures(room_name, "extractor", conf.extractor, true) == 0);
    level_finished = level_finished && storage_finished && terminal_finished && extractor_finished;
    //console.log("storage", storage_finished, "terminal", terminal_finished, "extractor", extractor_finished);
    if (!level_finished) {
		Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
        return;
    }
    let labs_finished = (layout.update_named_structures(room_name, "lab", conf.labs, true) == 0);
    let ps_finished = (layout.update_unique_structures(room_name, "powerSpawn", conf.powerspawn, true) == 0);
    let factory_finished = (layout.update_unique_structures(room_name, "factory", conf.factory, true) == 0);
    let nuker_finished = (layout.update_unique_structures(room_name, "nuker", conf.nuker, true) == 0);
    let observer_finished = (layout.update_unique_structures(room_name, "observer", conf.observer, true) == 0);
    //console.log("labs", labs_finished, "ps", ps_finished, "factory", factory_finished, "nuker", nuker_finished, "observer", observer_finished);

    Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
}

function update_construction_sites(room_name: string) {
    let name_of_this_function = "update_construction_sites";
    if (Game.tick_cpu[name_of_this_function] == undefined) {
        Game.tick_cpu[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();

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

	if (room.memory.ticks_to_spawn_builder > 0) {
		room.memory.ticks_to_spawn_builder -= 1;
	}

    Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
}

function update_mine(room_name: string) {
    let name_of_this_function = "update_mine";
    if (Game.tick_cpu[name_of_this_function] == undefined) {
        Game.tick_cpu[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();

	let room = Game.rooms[room_name];
	let game_memory = Game.memory[room_name];
    let conf = config.conf_rooms[room_name];
    let containers_MINE = room.memory.named_structures_status.container.MINE;
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

    Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
}

function update_external(room_name: string) {
    let name_of_this_function = "update_external";
    if (Game.tick_cpu[name_of_this_function] == undefined) {
        Game.tick_cpu[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();

    let game_memory = Game.memory[room_name];
    let room = Game.rooms[room_name];
    let conf = config.conf_rooms[room_name];
    if (!("external_room_status" in room.memory)) {
        room.memory.external_room_status = {};
    }
	if (room.memory.external_harvester == undefined) {
		room.memory.external_harvester = {};
	}
	for (var external_room_name in conf.external_rooms) {
		if (!conf.external_rooms[external_room_name].active) {
			continue;
		}
		if (room.memory.external_harvester[external_room_name] == undefined) {
			room.memory.external_harvester[external_room_name] = {};
		}
		for (var source_name in conf.external_rooms[external_room_name].sources) {
			if (room.memory.external_harvester[external_room_name][source_name] == undefined) {
				room.memory.external_harvester[external_room_name][source_name] = "";
			}
		}
	}
	if (Game.time % 5 !== 0) {
		Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
		return;
	}
    for (let external_room_name in conf.external_rooms) {
		if (!conf.external_rooms[external_room_name].active) {
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
    if (Memory.debug_mode) {
        console.log(room.name, JSON.stringify(room.memory.external_room_status))
    }

    Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
}

function is_danger_mode(room_name: string): boolean {
    let name_of_this_function = "is_danger_mode";
    if (Game.tick_cpu[name_of_this_function] == undefined) {
        Game.tick_cpu[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();

    let enemies_components = defense.get_room_invading_ability(room_name)
    let enemies_CE = mymath.array_sum(Object.values(enemies_components));
    if (enemies_CE >= 50 && enemies_components.heal >= 20) {
		Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
        return true;
    } else {
		Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
        return false;
    }
	Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
}

function detect_resources(room_name: string) {
	if (Memory.pb_cooldown_time == undefined) {
		Memory.pb_cooldown_time = 0;
	}
	if (Memory.pb_cooldown_time > 0) {
		Memory.pb_cooldown_time -= 1;
		return;
	}
    let name_of_this_function = "detect_resources";
    if (Game.tick_cpu[name_of_this_function] == undefined) {
        Game.tick_cpu[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();

    let room = Game.rooms[room_name];
	if (room.controller.level < 8) {
		Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
		return;
	}
    let game_memory = Game.memory[room_name];
    let external_rooms = config.highway_resources[room_name];
    if (external_rooms == undefined || !room.memory.unique_structures_status.observer.finished) {
		Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
        return;
    }
    if (room.memory.external_resources == undefined) {
        room.memory.external_resources = {
            "pb": {}
        };
    }
    for (let i = 0; i < external_rooms.length; i++) {
        if (Game.time % 100 == i) {
			let observer = Game.getObjectById(room.memory.unique_structures_status.observer.id);
			let external_room_name = external_rooms[i];
            observer.observeRoom(external_room_name);
        }
    }
    for (let i = 0; i < external_rooms.length; i++) {
		if (Game.time % 100 == i+1) {
			let external_room_name = external_rooms[i];
			let external_room = Game.rooms[external_room_name];
            if (external_room == undefined) {
                continue;
            }
            let pb = < StructurePowerBank > external_room.find(FIND_STRUCTURES).filter((e) => e.structureType == "powerBank")[0];
			if (pb !== undefined && pb.power >= 1000 && pb.ticksToDecay >= 2000) {
                if (room.memory.external_resources.pb[external_room_name] == undefined) {
					let external_terminal_store = Game.rooms[config.external_resources_compounds_storage_room].terminal.store;
					let requested_resources: {[key in ResourceConstant] ?: number} = {};
					for (let part in config.pb_attacker_body) {
						let boost_mineral = config.pb_attacker_body[<BodyPartConstant> part].boost;
						if (boost_mineral !== undefined) {
							requested_resources[boost_mineral] = config.pb_attacker_body[<BodyPartConstant> part].number;
						}
					}
					for (let part in config.pb_healer_body) {
						let boost_mineral = config.pb_healer_body[<BodyPartConstant> part].boost;
						if (boost_mineral !== undefined) {
							requested_resources[boost_mineral] = config.pb_healer_body[<BodyPartConstant> part].number;
						}
					}
					let ok=true;
					for (let mineral in requested_resources) {
						if (external_terminal_store.getUsedCapacity(<ResourceConstant> mineral) < requested_resources[<ResourceConstant> mineral]) {
							ok=false;
						}
					}
					if (!ok) {
						continue;
					}
					if (room_name !== config.external_resources_compounds_storage_room) {
						for (let mineral in requested_resources) {
							let num = requested_resources[<ResourceConstant> mineral];
							global.request_resource_sending(config.external_resources_compounds_storage_room, room_name, <ResourceConstant> mineral, num*30);
						}
					}
                    let path = PathFinder.search(Game.getObjectById(room.memory.spawn_list[0]).pos, {
                        "pos": pb.pos,
                        "range": 1
                    }, {
                        maxOps: 6000,
						roomCallback: functions.restrict_passing_rooms,
                    })
                    let rooms_path: string[] = [room_name];
                    let poses_path: number[] = [];
                    let status = 3;
                    if (!path.incomplete) {
                        status = 0;
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
                    }
					let n_moves = Math.ceil(pb.power / 100);
					let pb_carrier_names: string[] = [];
					let pb_carrier_sizes: number[] = [];
					while (true) {
						if (n_moves>16) {
							n_moves -= 16;
							pb_carrier_sizes.push(16);
						}
						else {
							pb_carrier_sizes.push(n_moves);
							break;
						}
					}
					for (let i = 0; i < pb_carrier_sizes.length; i++) {
						let pb_carrier_name = "pb_carrier" + Game.time.toString() + i.toString();
						pb_carrier_names.push(pb_carrier_name);
					}
                    room.memory.external_resources.pb[external_room_name] = {
                        "xy": [pb.pos.x, pb.pos.y],
                        "id": pb.id,
                        "status": status,
                        "time_last": 0,
                        "rooms_path": rooms_path,
                        "poses_path": poses_path,
                        "distance": path.cost,
                        "path_found": !path.incomplete,
                        "amount": pb.power,
						"pb_attacker_name": "pb_attacker" + Game.time.toString(),
						"pb_healer_name": "pb_healer" + Game.time.toString(),
						"pb_carrier_names": pb_carrier_names,
						"pb_carrier_sizes": pb_carrier_sizes,
                    }
					Memory.pb_cooldown_time = 500;
                }
                return;
			Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
            }
        }
    }

    Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
}

function update_resources(room_name: string) {
    let name_of_this_function = "update_resources";
    if (Game.tick_cpu[name_of_this_function] == undefined) {
        Game.tick_cpu[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();

    let room = Game.rooms[room_name];
	if (room.controller.level < 8) {
		Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
		return;
	}
    if (room.memory.external_resources == undefined) {
        room.memory.external_resources = {
            "pb": {}
        };
    }
    let pb_status = room.memory.external_resources.pb;
    for (let external_room_name in pb_status) {
        if (pb_status[external_room_name].status == 0) {
			// pb detected
            let pb_attacker_body: BodyPartConstant[] = [];
			for (let part in config.pb_attacker_body) {
				let num = config.pb_attacker_body[<BodyPartConstant> part].number;
				mymath.range(num).forEach((e) => pb_attacker_body.push(<BodyPartConstant> part));
			}
            let pb_healer_body: BodyPartConstant[] = [];
			for (let part in config.pb_healer_body) {
				let num = config.pb_healer_body[<BodyPartConstant> part].number;
				mymath.range(num).forEach((e) => pb_healer_body.push(<BodyPartConstant> part));
			}
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
            global.spawn_in_queue(room_name, pb_attacker_body, pb_status[external_room_name].pb_attacker_name, pb_attacker_memory, false);
            global.spawn_in_queue(room_name, pb_healer_body, pb_status[external_room_name].pb_healer_name, pb_healer_memory, false);
			pb_status[external_room_name].status = 1;
        } else if (pb_status[external_room_name].status == 1) {
			// attacker and healer spawned
            pb_status[external_room_name].time_last += 1;
            if (pb_status[external_room_name].time_last >= 1000) {
				let pb_carrier_memory = {
					"home_room_name": room_name,
					"role": "pb_carrier",
					"external_room_name": external_room_name,
				};
				for (let i = 0; i < pb_status[external_room_name].pb_carrier_sizes.length; i++) {
					let pb_carrier_body: BodyPartConstant[] = [];
					let pb_carrier_size = pb_status[external_room_name].pb_carrier_sizes[i];
					let pb_carrier_name = pb_status[external_room_name].pb_carrier_names[i];
					mymath.range(pb_carrier_size*2).forEach((e) => pb_carrier_body.push(CARRY));
					mymath.range(pb_carrier_size).forEach((e) => pb_carrier_body.push(MOVE));
					global.spawn_in_queue(room_name, pb_carrier_body, pb_carrier_name, pb_carrier_memory, false);
					pb_status[external_room_name].status = 2;
					pb_status[external_room_name].time_last = 0;
				}
			}
        } else if (pb_status[external_room_name].status == 2) {
			// carrier spawned
            pb_status[external_room_name].time_last += 1;
            if (pb_status[external_room_name].time_last >= 2000) {
                delete pb_status[external_room_name];
            }
        } else if (pb_status[external_room_name].status == 3) {
            if (Game.time % 100 == 50) {
                if (Game.getObjectById(pb_status[external_room_name].id) == undefined) {
                    delete pb_status[external_room_name];
                }
            }
        }
    }
    Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
}

export function set_room_memory(room_name: string) {
    let name_of_this_function = "set_room_memory"
    if (Game.tick_cpu_main[name_of_this_function] == undefined) {
        Game.tick_cpu_main[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();

    let room = Game.rooms[room_name];
    let game_memory = Game.memory[room_name];

	update_structures(room_name);
	update_layout(room_name);
	update_construction_sites(room_name);
    update_link_and_container(room_name);
	update_mine(room_name);
    update_external(room_name);
	detect_resources(room_name);
	update_resources(room_name);

    game_memory.danger_mode = is_danger_mode(room_name)
    if (game_memory.danger_mode) {
        console.log("Warning: room", room_name, "invaded!")
    }
    if (("storage" in room) && room.storage.store.getUsedCapacity("energy") > 2000) {
        game_memory.lack_energy = false;
    } else {
        game_memory.lack_energy = true;
    }

    Game.tick_cpu_main[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
}

export function set_global_memory() {
    Game.memory = {}
    let name_of_this_function = "set_global_memory";
    if (Game.tick_cpu_main[name_of_this_function] == undefined) {
        Game.tick_cpu_main[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();

	for (let room_name of config.controlled_rooms) {
		Game.memory[room_name] = {};
	}
	for (let spawn_name in Game.spawns) {
		let spawn = Game.spawns[spawn_name];
		if (!("spawning_time" in spawn.memory)) {
			spawn.memory.spawning_time = 0;
		}
		spawn.memory.spawning_time += 1;
	}

    if (Game.mineral_storage_amount == undefined) {
        Game.mineral_storage_amount = {};
    }
    let room_names = < Array < keyof type_mineral_storage_room >> Object.keys(config.mineral_storage_room);
    for (let room_name of room_names) {
        try {
            Game.mineral_storage_amount[room_name] = {};
            for (let mineral of config.mineral_storage_room[room_name]) {
				Game.mineral_storage_amount[room_name][mineral] = Game.rooms[room_name].terminal.store.getUsedCapacity(mineral);
            }
        } catch (err) {
            console.log("Error", err, err.stack);
        }
    }
	for (let pc_name in config.pc_conf) {
		if (config.pc_conf[pc_name].source) {
			let level = Game.powerCreeps[pc_name].powers[PWR_REGEN_SOURCE].level;
			Game.memory[config.pc_conf[pc_name].room_name].pc_source_level = level;
		}
	}
    Game.tick_cpu_main[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
}
