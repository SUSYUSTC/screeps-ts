import * as _ from "lodash";
import * as mymath from "./mymath";
import * as spawning_func from "./spawning_func";
import * as spawning_init from "./spawning_init";
import * as defense from "./defense";
import * as config from "./config";

function is_valid_creep(creep: Creep, rolename: type_creep_role, livetime: number): boolean {
    return creep.memory.role == rolename && (creep.ticksToLive == undefined || creep.ticksToLive > livetime);
}

function get_defender_json(room_name: string, typename: string): type_spawn_json {
    let room = Game.rooms[room_name];
    let added_memory = {
        "home_room_name": room.name,
        "defender_type": typename
    };
    let options = {
        "defender_type": typename
    };
    let priority = 120;
    let added_json = {
        "priority": priority,
		"require_full": false,
    };
    let json = spawning_func.prepare_role("defender", room.energyAvailable, added_memory, options, added_json);
    return json;
}
export function spawn(room_name: string) {
    let room = Game.rooms[room_name];
    let queue = room.memory.additional_spawn_queue;
    if (queue !== undefined && queue.first !== undefined && queue.first.length > 0) {
        let spawns = _.filter(Game.spawns, (e) => e.room.name == room_name);
        let obj = queue.first[0];
        for (let s of spawns) {
            if (s.spawnCreep(obj.body, obj.name, {
                    memory: obj.memory
                }) == 0) {
                queue.first = queue.first.slice(1, undefined)
                return;
            }
        }
        return;
    }
    if (Game.time % 5 !== 0) {
        return;
    }
    let game_memory = Game.memory[room_name];
    let enemies = room.find(FIND_HOSTILE_CREEPS).filter((e) => e.owner.username == 'Invader');
    if (enemies.length > 0 && global.memory[room_name].tower_list.length == 0) {
        room.find(FIND_MY_CREEPS).forEach((e) => e.suicide());
        return;
    }
    let conf = config.conf_rooms[room.name];
    let containers_status = global.memory[room_name].named_structures_status.container;
    let links_status = global.memory[room_name].named_structures_status.link;
    let sources_name = Object.keys(conf.sources);
    let room_creeps = _.filter(Game.creeps, (creep) => creep.room.name == room.name);
    if (room.energyCapacityAvailable < 550) {
        /*
        for (let source_name of sources_name) {
            spawning_init.spawn_init(room_name, source_name, conf.init[source_name].number, room.energyCapacityAvailable, room.energyAvailable);
        }
		 */
        return;
    }
    let link_modes = game_memory.link_modes;

    let jsons: type_spawn_json[] = [];
    let info_source: any = {};
    for (let source_name of sources_name) {
        if (game_memory.danger_mode) {
            let is_protected = config.protected_sources[room_name].includes(source_name);
            if (!is_protected) {
                continue;
            }
        }
        let creeps = room_creeps.filter((creep) => creep.memory.source_name == source_name);
        let this_container = Game.getObjectById(containers_status[source_name].id);
        let is_container_broken = (this_container.hitsMax - this_container.hits >= 100000);
        let carriers = creeps.filter((e) => is_valid_creep(e, 'carrier', Math.ceil(conf.carriers[source_name].number * 4.5) + 10));
        let n_carrys = spawning_func.get_nbody(carriers, 'carry')
        let max_carry = 0;
        let link_mode = link_modes.includes('CT') && link_modes.includes(source_name);
        if (!link_mode) {
            max_carry = conf.carriers[source_name].number;
        }
        let with_carry = 0;
        let with_harvest = 5;
        let with_move = 1;
        if (link_mode) {
            with_carry = 2;
        } else if (is_container_broken && room.energyCapacityAvailable >= 600) {
            with_carry = 1;
        }
        if (game_memory.pc_source_level !== undefined) {
            let level = game_memory.pc_source_level;
            with_harvest = config.powered_harvester[level].n_harvest;
            with_carry = config.powered_harvester[level].n_carry;
            with_move = config.powered_harvester[level].n_move;
        }
        let harvesters = creeps.filter((e) => is_valid_creep(e, 'harvester', conf.harvesters[source_name].commuting_time + (with_harvest + with_move + with_move)*3));
        let n_harvesters = harvesters.length;
        info_source[source_name] = {
            n_carrys: n_carrys + "/" + max_carry,
            n_harvesters: harvesters.length + "/" + "1"
        };
        if (n_harvesters == 0 && !game_memory.danger_mode) {
            let added_memory = {
                "source_name": source_name,
                "pc_level": game_memory.pc_source_level,
            };
            let options = {
                "with_harvest": with_harvest,
                "with_carry": with_carry,
                "with_move": with_move,
                "max_energy": room.energyCapacityAvailable,
            };
            let priority = (n_carrys > 0 ? 101 : 81);
            let added_json = {
                "priority": priority,
                "require_full": false,
            };
            let json = spawning_func.prepare_role("harvester", room.energyAvailable, added_memory, options, added_json);
            jsons.push(json);
        }
        if (n_carrys < max_carry && !game_memory.danger_mode) {
            let added_memory = {
                "source_name": source_name
            };
            let options = {
                "link_mode": link_mode,
                "max_energy": room.energyCapacityAvailable,
                "max_parts": max_carry,
            };
            let priority = (n_harvesters > 0 ? 100 : 80);
            let added_json = {
                "priority": priority,
                "require_full": false,
            };
            let json = spawning_func.prepare_role("carrier", room.energyAvailable, added_memory, options, added_json);
            jsons.push(json);
        }
    }

    if (!("storage_level" in room.memory)) {
        room.memory.storage_level = 0;
    }
    let added_upgraders = 0;
    if (room.storage !== undefined || config.storage_bars == undefined) {
        let storage_bars = config.storage_bars;
        if ("storage" in room) {
            let current_energy = room.storage.store.getUsedCapacity("energy");
            if (room.memory.storage_level < storage_bars.length && current_energy >= storage_bars[room.memory.storage_level] + config.storage_gap) {
                room.memory.storage_level += 1;
            } else if (room.memory.storage_level > 0 && room.storage.store["energy"] < storage_bars[room.memory.storage_level - 1]) {
                room.memory.storage_level -= 1;
            }
        }
        added_upgraders = 2 * room.memory.storage_level;
        if (room.storage.store.getUsedCapacity("energy") > storage_bars[0] && !(link_modes.includes('CT') && link_modes.includes('MAIN'))) {
            let storage_carriers = room_creeps.filter((e) => is_valid_creep(e, "carrier", Math.ceil(conf.carriers.storage.number * 4.5) + 10) && e.memory.source_name == 'storage');
            if (storage_carriers.length < room.memory.storage_level) {
                let max_carry = conf.carriers.storage.number;
                let added_memory = {
                    "source_name": "storage"
                };
                let options = {
                    "link_mode": true,
                    "max_energy": room.energyCapacityAvailable,
                    "max_parts": max_carry,
                };
                let priority = 85;
                let added_json = {
                    "priority": priority,
                    "require_full": false,
                };
                let json = spawning_func.prepare_role("carrier", room.energyAvailable, added_memory, options, added_json);
                jsons.push(json);
            }
            info_source["storage"] = {
                n_carriers: storage_carriers.length + "/" + added_upgraders,
            };
        }
    }
    let builders = room_creeps.filter((e) => is_valid_creep(e, "builder", 50));
    let n_builds = spawning_func.get_nbody(builders, 'work')
    let max_build = 6;
    if (room.storage !== undefined && room.storage.store.getUsedCapacity("energy") > 50000) {
        if (room.energyCapacityAvailable >= 4000) {
            max_build = 15;
        } else if (room.energyCapacityAvailable >= 2300) {
            max_build = 10;
        }
    }
    let n_builds_needed = Math.min(max_build, Math.ceil(room.memory.sites_total_progressleft / 2000));
    if (n_builds < n_builds_needed && room.memory.ticks_to_spawn_builder == 0 && !game_memory.danger_mode) {
        let added_memory = {};
        let options = {
            "max_energy": room.energyCapacityAvailable,
            "max_parts": Math.min(max_build, n_builds_needed),
        };
        let priority = 2;
        let added_json = {
            "priority": priority,
            "require_full": true && game_memory.lack_energy,
        };
        let json = spawning_func.prepare_role("builder", room.energyAvailable, added_memory, options, added_json);
        jsons.push(json);
    }
    let upgrader_spawning_time = 21;
    if (room.energyCapacityAvailable >= 2400) {
        upgrader_spawning_time = 84;
    } else if (room.energyCapacityAvailable >= 1200) {
        upgrader_spawning_time = 42;
    }
    let upgraders = room_creeps.filter((e) => is_valid_creep(e, "upgrader", conf.upgraders.commuting_time + upgrader_spawning_time));
    let n_upgrades = spawning_func.get_nbody(upgraders, 'work')
    let max_upgrade = 18 + added_upgraders * 9;
    if (room.storage == undefined || room.storage.store.getUsedCapacity("energy") < 5000) {
        max_upgrade -= n_builds_needed * 3;
    }
    if (room.controller.level == 8) {
		let storage_condition = room.storage !== undefined && (room.storage.store.getUsedCapacity("battery") * 10 + room.storage.store.getUsedCapacity("energy") >= config.energy_bar_to_spawn_upgrader);
        if (storage_condition || room.controller.ticksToDowngrade <= 100000) {
            max_upgrade = 15;
        } else {
            max_upgrade = 0;
        }
    }
    if (n_upgrades < max_upgrade && !game_memory.danger_mode) {
        let added_memory: any = {};
        let options = {
            "max_energy": room.energyCapacityAvailable,
            rcl8: (room.controller.level == 8),
        };
        let priority = 0;
        let added_json = {
            "priority": priority,
            "require_full": true && game_memory.lack_energy,
        };
        let json = spawning_func.prepare_role("upgrader", room.energyAvailable, added_memory, options, added_json);
        jsons.push(json);
    }
	
	// transferer
    let transferers = room_creeps.filter((e) => is_valid_creep(e, "transferer", 150));
    let n_transfers = spawning_func.get_nbody(transferers, 'carry')
    let max_transfer;
    if (room.controller.level >= 7) {
        max_transfer = 12;
    } else if (room.controller.level >= 5) {
        max_transfer = 8;
    } else {
        max_transfer = 4;
    }
    let n_transferer_needed = 1;
    if (game_memory.danger_mode) {
        n_transferer_needed = 2;
    }
    if (transferers.length < n_transferer_needed) {
        let added_memory = {};
        let options = {
            "max_parts": max_transfer,
        };
        let priority = (n_transfers > 0 ? 60 : 150);
        let added_json = {
            "priority": priority,
            "require_full": false
        };
        let json = spawning_func.prepare_role("transferer", room.energyAvailable, added_memory, options, added_json);
        jsons.push(json);
    }

    // mineharvester and minecarrier
    let n_mineharvesters_needed = 0;
    let n_minecarriers_needed = 0;
    let full_mine: boolean;
	let store_amount = room.storage.store.getUsedCapacity(game_memory.mine_status.type);
	if (room.terminal !== undefined) {
		store_amount += room.terminal.store.getUsedCapacity(game_memory.mine_status.type);
	}
	if (game_memory.mine_status.amount > 0 && game_memory.mine_status.harvestable && store_amount < 180000) {
        n_mineharvesters_needed = 1;
        n_minecarriers_needed = 1;
        full_mine = game_memory.mine_status.amount >= 10000 && room.energyCapacityAvailable >= 4500;
    } else {
        n_mineharvesters_needed = 0;
        n_minecarriers_needed = 0;
    }
    let n_mineharvesters;
    let n_minecarriers;
    if (full_mine) {
        let mineharvesters = room_creeps.filter((e) => is_valid_creep(e, "mineharvester", 300));
        let minecarriers = room_creeps.filter((e) => is_valid_creep(e, "minecarrier", 100));
        n_mineharvesters = mineharvesters.length;
        n_minecarriers = minecarriers.length;
    } else {
        let mineharvesters = room_creeps.filter((e) => is_valid_creep(e, "mineharvester", 150));
        let minecarriers = room_creeps.filter((e) => is_valid_creep(e, "minecarrier", 50));
        n_mineharvesters = mineharvesters.length;
        n_minecarriers = minecarriers.length;
    }
    if (n_mineharvesters < n_mineharvesters_needed && !game_memory.danger_mode) {
        let added_memory = {};
        let options = {
            "full": full_mine,
        };
        let priority = 1;
        let added_json = {
            "priority": priority,
            "require_full": true && game_memory.lack_energy,
        };
        let json = spawning_func.prepare_role("mineharvester", room.energyAvailable, added_memory, options, added_json);
        jsons.push(json);
    }
    if (n_minecarriers < n_minecarriers_needed && !game_memory.danger_mode) {
        let added_memory = {};
        let options = {
            "full": full_mine,
        };
        let priority = -1;
        let added_json = {
            "priority": priority,
            "require_full": true && game_memory.lack_energy,
        };
        let json = spawning_func.prepare_role("minecarrier", room.energyAvailable, added_memory, options, added_json);
        jsons.push(json);
    }
	let powered = (_.filter(config.pc_conf, (e) => e.room_name == room_name)[0] !== undefined);
	let maincarrier_ncarry: number;
	if (powered) {
		maincarrier_ncarry = config.maincarrier_ncarry_powered;
	} else {
		maincarrier_ncarry = config.maincarrier_ncarry_no_power;
	}
    let maincarriers = room_creeps.filter((e) => is_valid_creep(e, "maincarrier", maincarrier_ncarry * 3 + 30));
    let n_maincarriers = maincarriers.length;
    let n_maincarriers_needed = 0;
    if (link_modes.includes('CT') && link_modes.includes('MAIN') && room.storage !== undefined) {
        n_maincarriers_needed = 1;
    }
    if (n_maincarriers < n_maincarriers_needed) {
        let added_memory = {};
        let options = {
            "max_parts": maincarrier_ncarry,
        };
        let priority = 110;
        let added_json = {
            "priority": priority,
            "require_full": false
        };
        let json = spawning_func.prepare_role("maincarrier", room.energyAvailable, added_memory, options, added_json);
        jsons.push(json);
    }

    // wall _repairer
    let wall_repairers = room_creeps.filter((e) => e.memory.role == 'wall_repairer');
    if (wall_repairers.length < config.wall_rates[room_name] && !game_memory.danger_mode) {
        let added_memory = {};
        let options = {};
        let priority = -1;
        let added_json = {
            "priority": priority,
            "require_full": false
        };
        let json = spawning_func.prepare_role("wall_repairer", room.energyAvailable, added_memory, options, added_json);
        jsons.push(json);
    }
    let info_home = {
        n_upgrades: n_upgrades + "/" + max_upgrade,
        n_builds: n_builds + "/" + n_builds_needed,
        n_transfers: n_transfers + "/" + max_transfer,
        n_mineharvesters: n_mineharvesters + "/" + n_mineharvesters_needed,
        n_minecarriers: n_minecarriers + "/" + n_minecarriers_needed,
        n_maincarriers: n_maincarriers + "/" + n_maincarriers_needed,
    };
    if (config.help_list[room_name] !== undefined && !game_memory.danger_mode) {
        for (let external_room_name in config.help_list[room_name]) {
            let external_room = Game.rooms[external_room_name];
            if (external_room == undefined || external_room.controller.owner == undefined || external_room.controller.owner.username !== config.username) {
                let newroom_claimers = _.filter(Game.creeps, (e) => e.memory.role == 'newroom_claimer' && e.memory.external_room_name == external_room_name && e.memory.home_room_name == room_name);
				if (newroom_claimers.length == 0) {
					let added_memory = {
                        "external_room_name": external_room_name,
                        "home_room_name": room_name,
					};
					let options = {};
					let priority = -1;
					let added_json = {
						"priority": priority,
						"require_full": false
					};
					let json = spawning_func.prepare_role("newroom_claimer", room.energyAvailable, added_memory, options, added_json);
					jsons.push(json);
				}
                continue;
            }
            if (external_room.energyCapacityAvailable >= 550) {
                continue;
            }
            let conf_help = config.help_list[room_name][external_room_name];
            let conf_external = config.conf_rooms[external_room_name];
            for (let source_name in config.conf_rooms[external_room_name].sources) {
                let n_help_harvesters = _.filter(Game.creeps, (e) => e.memory.role == 'help_harvester' && e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && (e.ticksToLive == undefined || e.ticksToLive > conf_help.commuting_distance + 33));
                let n_help_carriers = _.filter(Game.creeps, (e) => e.memory.role == 'help_carrier' && e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && (e.ticksToLive == undefined || e.ticksToLive > conf_help.commuting_distance + conf_external.carriers[source_name].number * 6));
                if (n_help_harvesters.length == 0) {
                    let added_memory = {
                        "source_name": source_name,
                        "external_room_name": external_room_name,
                        "home_room_name": room_name,
                    };
                    let options = {};
                    let priority = 42;
                    let added_json = {
                        "priority": priority,
                        "require_full": false
                    };
                    let json = spawning_func.prepare_role("help_harvester", room.energyAvailable, added_memory, options, added_json);
                    jsons.push(json);
                }
                if (n_help_carriers.length == 0) {
                    let added_memory = {
                        "source_name": source_name,
                        "external_room_name": external_room_name,
                        "home_room_name": room_name,
                    };
                    let options = {
                        "max_parts": conf_help.n_carrys[source_name],
                    };
                    let priority = 41;
                    let added_json = {
                        "priority": priority,
                        "require_full": false
                    };
                    let json = spawning_func.prepare_role("help_carrier", room.energyAvailable, added_memory, options, added_json);
                    jsons.push(json);
                }
            }
            let n_help_builders = _.filter(Game.creeps, (e) => e.memory.role == 'help_builder' && e.memory.external_room_name == external_room_name && (e.ticksToLive == undefined || e.ticksToLive > conf_help.commuting_distance + 72));
            if (n_help_builders.length == 0) {
                let added_memory = {
                    "external_room_name": external_room_name,
                    "home_room_name": room_name,
                };
                let options = {};
                let priority = 40;
                let added_json = {
                    "priority": priority,
                    "require_full": false
                };
                let json = spawning_func.prepare_role("help_builder", room.energyAvailable, added_memory, options, added_json);
                jsons.push(json);
            }
        }
    }
	
	// preclaimers
	if_claimer: if (config.preclaiming_rooms[room_name] !== undefined) {
		for (let external_room_name in config.preclaiming_rooms[room_name]) {
			let n_needed_claimers = 1;
			let external_room = Game.rooms[external_room_name];
			if (external_room !== undefined && external_room.controller.my) {
				n_needed_claimers = 0;
				break if_claimer;
			}
			let claimers = _.filter(Game.creeps, (e) => is_valid_creep(e, 'preclaimer', 0) && e.memory.external_room_name == external_room_name && e.memory.home_room_name == room_name);
			if (claimers.length < n_needed_claimers) {
				let added_memory = {
					"external_room_name": external_room_name,
					"home_room_name": room_name,
					"rooms_forwardpath": config.preclaiming_rooms[room_name][external_room_name].rooms_forwardpath,
					"poses_forwardpath": config.preclaiming_rooms[room_name][external_room_name].poses_forwardpath,
				};
				let options = {};
				let priority = 5;
				let added_json = {
					"priority": priority,
					"require_full": true && game_memory.lack_energy,
				};
				let json = spawning_func.prepare_role("preclaimer", room.energyAvailable, added_memory, options, added_json);
				jsons.push(json);
			}
		}
	}

	// externalbuilder
	if (room.memory.external_sites_total_progressleft == undefined) {
		room.memory.external_sites_total_progressleft = {};
	}
	let external_progress = room.memory.external_sites_total_progressleft;
	if (external_progress !== undefined) {
		for (let external_room_name in external_progress) {
			if (conf.external_rooms[external_room_name] == undefined) {
				continue;
			}
			let conf_external: type_external_map;
			if (powered) {
				conf_external = conf.external_rooms[external_room_name].powered_source;
			} else if (config.conf_gcl.conf_map.supporting_room == room_name && config.conf_gcl.conf_map.gcl_room == external_room_name) {
				conf_external = config.conf_gcl.conf_map;
			} else {
				conf_external = conf.external_rooms[external_room_name].controller;
			}
			let n_builds_needed = Math.min(15, Math.ceil(external_progress[external_room_name] / 1000));
			let externalbuilders = _.filter(Game.creeps, (e) => is_valid_creep(e, "externalbuilder", 150));
			let n_builds = spawning_func.get_nbody(externalbuilders, 'work')
			if (n_builds < n_builds_needed && !game_memory.danger_mode) {
				let added_memory = {
					"external_room_name": external_room_name,
					"home_room_name": room.name,
					"rooms_forwardpath": conf_external.rooms_forwardpath,
					"rooms_backwardpath": conf_external.rooms_backwardpath,
					"poses_forwardpath": conf_external.poses_forwardpath,
					"poses_backwardpath": conf_external.poses_backwardpath,
				};
				let options = {
					"max_energy": room.energyCapacityAvailable,
					"max_parts": n_builds_needed,
				};
				let priority = 2;
				let added_json = {
					"priority": priority,
					"require_full": true && game_memory.lack_energy,
				};
				let json = spawning_func.prepare_role("externalbuilder", room.energyAvailable, added_memory, options, added_json);
				jsons.push(json);
			}
		}
	}
    //reservers, externalharvesters, externalcarriers
    let external_room_status = room.memory.external_room_status;
    let info_external: any = {}
    for (let external_room_name in conf.external_rooms) {
        // claimer
        if (!conf.external_rooms[external_room_name].active || external_room_status[external_room_name].defense_type !== '' || room.storage == undefined) {
            continue;
        }
        info_external[external_room_name] = {};
        let conf_controller = conf.external_rooms[external_room_name].controller;
		// reserver
        let reserve = conf_controller.reserve;
        let reservers = _.filter(Game.creeps, (e) => is_valid_creep(e, 'reserver', conf_controller.path_time) && e.memory.external_room_name == external_room_name && e.memory.home_room_name == room_name);
        let n_needed_reservers = 1;
        if (reserve && (config.preclaiming_rooms[room_name] == undefined || config.preclaiming_rooms[room_name][external_room_name] == undefined)) {
            if (external_room_name in Game.rooms) {
                if (Game.rooms[external_room_name].controller.my) {
                    n_needed_reservers = 0;
                }
                let reservation = Game.rooms[external_room_name].controller.reservation;
                if (reservation !== undefined) {
                    if (reservation.username == config.username && reservation.ticksToEnd > 800) {
                        n_needed_reservers = 0;
                    }
                }
            }
        } else {
            n_needed_reservers = 0;
        }
        if (reservers.length < n_needed_reservers && !game_memory.danger_mode) {
            let added_memory = {
                "external_room_name": external_room_name,
                "home_room_name": room.name,
            };
            let options = {
                "max_parts": 8,
                "max_energy": room.energyCapacityAvailable,
            };
            let priority = 40;
            let added_json = {
                "priority": priority,
                "require_full": true && game_memory.lack_energy,
            };
            let json = spawning_func.prepare_role("reserver", room.energyAvailable, added_memory, options, added_json);
            jsons.push(json);
        }
        info_external[external_room_name].n_reservers = reservers.length + "/" + n_needed_reservers;
        if (!room.memory.external_room_status[external_room_name].safe) {
            continue;
        }
		let corresponding_pc_conf = _.filter(config.pc_conf, (e) => e.room_name == room_name)[0];
		let powered = corresponding_pc_conf !== undefined && corresponding_pc_conf.external_room == external_room_name;
		if_powered_source: if (powered) {
			let conf_powered_source = conf.external_rooms[external_room_name].powered_source;
			if (conf_powered_source == undefined) {
				break if_powered_source;
			}
			if (Game.rooms[external_room_name] == undefined) {
				break if_powered_source;
			}
            let conf_external = conf.external_rooms[external_room_name].powered_source;
			info_external[external_room_name][conf_external.source_name] = {}
			let pc_level = Game.memory[room_name].pc_source_level;
			let harvester_conf = config.powered_external_harvester[pc_level];
			// externalharvester, externalcarrier
            let externalharvester_spawning_time = (harvester_conf.n_move + harvester_conf.n_carry + harvester_conf.n_harvest + 10) * 3;
            let externalharvesters = _.filter(Game.creeps, (e) => is_valid_creep(e, 'externalharvester', conf_external.single_distance + externalharvester_spawning_time) && e.memory.external_room_name == external_room_name && e.memory.source_name == conf_external.source_name && e.memory.home_room_name == room.name);
			let n_carrier_carry = Math.ceil((conf_external.carrier_distance + 2) * harvester_conf.n_harvest * 0.08);
            let externalcarrier_spawning_time = Math.ceil(n_carrier_carry * 4.5) + 6;
            let externalcarriers = _.filter(Game.creeps, (e) => is_valid_creep(e, 'externalcarrier', conf_external.single_distance + externalcarrier_spawning_time) && e.memory.external_room_name == external_room_name && e.memory.source_name == conf_external.source_name && e.memory.home_room_name == room.name);
            if (externalharvesters.length == 0 && !game_memory.danger_mode) {
                let added_memory = {
                    "source_name": conf_external.source_name,
                    "external_room_name": external_room_name,
                    "home_room_name": room.name,
					"powered": true,
                };
                let options = {
                    "max_energy": room.energyCapacityAvailable,
					"n_work": harvester_conf.n_harvest,
					"n_carry": harvester_conf.n_carry,
					"n_move": harvester_conf.n_move,
                }
                let priority = (externalcarriers.length > 0 ? 31 : 21);
                let added_json = {
                    "priority": priority,
                    "require_full": true && game_memory.lack_energy,
                };
                let json = spawning_func.prepare_role("externalharvester", room.energyAvailable, added_memory, options, added_json);
                jsons.push(json);
				info_external[external_room_name][conf_external.source_name].n_harvesters = externalharvesters.length + "/" + "1";
            }
            if (externalcarriers.length == 0 && !game_memory.danger_mode) {
                let added_memory = {
                    "source_name": conf_external.source_name,
                    "external_room_name": external_room_name,
                    "home_room_name": room.name,
					"powered": true,
                };
                let options = {
                    "max_energy": room.energyCapacityAvailable,
					"n_work": 2,
					"n_carry": n_carrier_carry,
					"n_move": Math.ceil(n_carrier_carry/2) + 2,
                }
                let priority = (externalharvesters.length > 0 ? 30 : 20);
                let added_json = {
                    "priority": priority,
                    "require_full": true && game_memory.lack_energy,
                };
                let json = spawning_func.prepare_role("externalcarrier", room.energyAvailable, added_memory, options, added_json);
                jsons.push(json);
				info_external[external_room_name][conf_external.source_name].n_carriers = externalcarriers.length + "/" + "1";
            }
		} else {
			for (let source_name in conf.external_rooms[external_room_name].sources) {
				info_external[external_room_name][source_name] = {}
				let conf_external = conf.external_rooms[external_room_name].sources[source_name];
				// externalharvester and externalcarrier
				let n_harvester_carry = 1;
				let n_carrier_carry;
				let n_carriers;
				if (conf_external.n_carry_tot <= 25 && room.energyCapacityAvailable >= conf_external.n_carry_tot * 100) {
					n_carriers = 1;
				} else if (room.energyAvailable >= Math.ceil(conf_external.n_carry_tot / 2) * 100) {
					n_carriers = 2;
				} else {
					n_carriers = 3;
				}
				n_carrier_carry = Math.ceil(conf_external.n_carry_tot / n_carriers);
				let externalharvester_spawning_time = (n_harvester_carry + 10) * 3;
				let externalcarrier_spawning_time = n_carrier_carry * 6;
				let externalharvesters = _.filter(Game.creeps, (e) => is_valid_creep(e, 'externalharvester', conf_external.single_distance + externalharvester_spawning_time) && e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && e.memory.home_room_name == room.name);
				let externalcarriers = _.filter(Game.creeps, (e) => is_valid_creep(e, 'externalcarrier', conf_external.single_distance + externalcarrier_spawning_time) && e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && e.memory.home_room_name == room.name);
				if (externalharvesters.length == 0 && !game_memory.danger_mode) {
					let added_memory = {
						"source_name": source_name,
						"external_room_name": external_room_name,
						"home_room_name": room.name,
					};
					let options = {
						"max_energy": room.energyCapacityAvailable,
						"max_parts": n_harvester_carry,
					}
					let priority = (externalcarriers.length > 0 ? 31 : 21);
					let added_json = {
						"priority": priority,
						"require_full": true && game_memory.lack_energy,
					};
					let json = spawning_func.prepare_role("externalharvester", room.energyAvailable, added_memory, options, added_json);
					jsons.push(json);
				}
				info_external[external_room_name][source_name].n_harvesters = externalharvesters.length + "/" + "1";
				if (externalcarriers.length < n_carriers && !game_memory.danger_mode) {
					let added_memory = {
						"source_name": source_name,
						"external_room_name": external_room_name,
						"home_room_name": room.name,
					};
					let options = {
						"max_energy": room.energyCapacityAvailable,
						"max_parts": n_carrier_carry,
					}
					let priority = (externalharvesters.length > 0 ? 30 : 20);
					let added_json = {
						"priority": priority,
						"require_full": true && game_memory.lack_energy,
					};
					let json = spawning_func.prepare_role("externalcarrier", room.energyAvailable, added_memory, options, added_json);
					jsons.push(json);
				}
				info_external[external_room_name][source_name].n_carriers = externalcarriers.length + "/" + n_carriers;
			}
		}
    }
    let Invader_rooms = Object.keys(external_room_status).filter((e) => !(['', 'user'].includes(external_room_status[e].defense_type)));
    if (Invader_rooms.length > 0) {
        let available_defense_types = Object.keys(config.defender_responsible_types);
        let defense_types = Invader_rooms.map((e) => external_room_status[e].defense_type);
        let defenders = _.filter(Game.creeps, (e) => e.memory.role == 'defender' && e.memory.home_room_name == room.name);
        let defenders_type = defenders.map((e) => e.memory.defender_type);
        for (let defense_type of defense_types) {
            if (defense_type == 'user') {
                continue;
            }
            let fightable_defender_types = available_defense_types.filter((e) => config.defender_responsible_types[e].list.includes(defense_type));
            if (mymath.all(defenders_type.map((e) => !fightable_defender_types.includes(e)))) {
                let costs = fightable_defender_types.map((e) => config.defender_responsible_types[e].cost);
                let argmin = mymath.argmin(costs);
                if (costs[argmin] > room.energyCapacityAvailable) {
                    continue;
                }
                let json = get_defender_json(room_name, fightable_defender_types[argmin]);
                jsons.push(json);
                break;
            }
        }
    }
    let invader_core_existing_rooms = Object.keys(external_room_status).filter((e) => external_room_status[e].invader_core_existance);
    if (invader_core_existing_rooms.length > 0 && !game_memory.danger_mode) {
        let invader_core_attackers = _.filter(Game.creeps, (e) => e.memory.role == 'invader_core_attacker' && e.memory.home_room_name == room.name);
        if (invader_core_attackers.length == 0) {
            let added_memory = {
                "home_room_name": room.name,
            };
            let options = {};
            let priority = 120;
            let added_json = {
                "priority": priority,
                "require_full": true && game_memory.lack_energy,
            };
            let json = spawning_func.prepare_role("invader_core_attacker", room.energyAvailable, added_memory, options, added_json);
            jsons.push(json);
        }
    }
    if (config.hunting[room_name] !== undefined && !game_memory.danger_mode) {
        let hunters = _.filter(Game.creeps, (e) => is_valid_creep(e, 'hunter', 175));
        let conf_hunting = config.hunting[room_name];
        if (hunters.length < conf_hunting.number) {
            let added_memory = {
                "home_room_name": room.name,
            };
            let options = {
                "body": conf_hunting.body,
            };
            let priority = 110;
            let added_json = {
                "priority": priority,
                "require_full": true && game_memory.lack_energy,
            };
            let json = spawning_func.prepare_role("hunter", room.energyAvailable, added_memory, options, added_json);
            jsons.push(json);
        }
    }
	// gcl
	if_gcl: if (config.conf_gcl.conf_map.supporting_room == room_name && Game.rooms[config.conf_gcl.conf_map.gcl_room] !== undefined && Game.rooms[config.conf_gcl.conf_map.gcl_room].controller.my) {
		let gcl_room = Game.rooms[config.conf_gcl.conf_map.gcl_room];
		if (gcl_room == undefined) {
			break if_gcl;
		}
		if (gcl_room.controller.level == 1 && gcl_room.memory.sites_total_progressleft !== 0) {
			break if_gcl;
		}
		if (gcl_room.terminal == undefined) {
			let n_work = Math.ceil(600/(config.conf_gcl.conf_map.carrier_distance + 2));
			let n_move = Math.ceil(n_work/2);
			let n_carry = Math.ceil(n_work/5);
			let upgraders = _.filter(Game.creeps, (e) => is_valid_creep(e, 'gcl_upgrader', config.conf_gcl.conf_map.single_distance + (n_work + n_move + n_carry) * 3));
			let carriers = _.filter(Game.creeps, (e) => is_valid_creep(e, 'gcl_carrier', config.conf_gcl.conf_map.single_distance + 150));
			if (upgraders.length == 0) {
				let added_memory = { };
				let options = {
					"n_work": n_work,
					"n_carry": n_carry,
					"n_move": n_move,
				};
				let priority = 10;
				let added_json = {
					"priority": priority,
					"require_full": true && game_memory.lack_energy,
				};
				let json = spawning_func.prepare_role("gcl_upgrader", room.energyAvailable, added_memory, options, added_json);
				jsons.push(json);
			}
			if (carriers.length == 0) {
				let added_memory = { };
				let options = { };
				let priority = 11;
				let added_json = {
					"priority": priority,
					"require_full": true && game_memory.lack_energy,
				};
				let json = spawning_func.prepare_role("gcl_carrier", room.energyAvailable, added_memory, options, added_json);
				jsons.push(json);
			}
		} else {
			let raw_upgraders = _.filter(Game.creeps, (e) => e.memory.role == 'gcl_upgrader'); 
			let upgraders = raw_upgraders.filter((e) => is_valid_creep(e,  'gcl_upgrader', config.conf_gcl.conf_map.single_distance + 150));
			let has_spawning = mymath.any(raw_upgraders.map((e) => e.spawning));
			let n_upgrades_needed = config.energy_bars_to_spawn_gcl_upgraders.filter((e) => e < Memory.total_energies).length;
			if (upgraders.length < n_upgrades_needed && gcl_room.terminal.store.getUsedCapacity("energy") >= 200000 && Game.cpu.bucket >= 9000 && !has_spawning) {
				let added_memory = {
					"advanced": true,
				};
				let options = {
					"n_work": 32,
					"n_carry": 10,
					"n_move": 8,
				};
				let priority = 10;
				let added_json = {
					"priority": priority,
					"require_full": true && game_memory.lack_energy,
				};
				let json = spawning_func.prepare_role("gcl_upgrader", room.energyAvailable, added_memory, options, added_json);
				jsons.push(json);
			}
		}
	}
    /*
    if (game_memory.danger_mode) {
    	let added_memory = {
    		"home_room_name": room.name,
    	};
    	let options = { };
    	let priority = 115;
    	let added_json = {
    		"priority": priority,
    	};
    	let json = spawning_func.prepare_role("home_defender", room.energyAvailable, added_memory, options, added_json);
    	jsons.push(json);
    }
     */
    if (Memory.debug_mode) {
        console.log(room.name, "source info: ", JSON.stringify(info_source))
        console.log(room.name, "home info: ", JSON.stringify(info_home))
        console.log(room.name, "external info: ", JSON.stringify(info_external))
        console.log(room_name, "Spawning list: ", jsons.map((e) => [e.rolename, e.cost, e.priority]));
    }
    let spawns = _.filter(Game.spawns, (e) => e.room.name == room_name);
    for (let spawn of spawns) {
        if (spawn.spawning) {
            spawn.memory.spawning_time = -5;
        }
    }
    if (jsons.length >= 1) {
        let priorities = jsons.map((e) => e.priority);
        let argmax = mymath.argmax(priorities);
        let json = jsons[argmax];
        if (json.affordable && (!json.require_full || room.energyCapacityAvailable == room.energyAvailable)) {
            spawning_func.spawn_json(room_name, jsons[argmax]);
        }
    } else {
        if (queue !== undefined && queue.last !== undefined && queue.last.length > 0) {
            let spawns = _.filter(Game.spawns, (e) => e.room.name == room_name);
            let obj = queue.last[0];
            for (let s of spawns) {
                if (s.spawnCreep(obj.body, obj.name, {
                        memory: obj.memory
                    }) == 0) {
                    queue.last = queue.last.slice(1, undefined)
                    return;
                }
            }
            return;
        }
    }
}
