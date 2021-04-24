import * as _ from "lodash";
import * as mymath from "./mymath";
import * as spawning_func from "./spawning_func";
import * as spawning_init from "./spawning_init";
import * as defense from "./defense";
import * as config from "./config";
import * as functions from "./functions";
import { Timer } from "./timer";

function is_valid_creep(creep: Creep, livetime: number): boolean {
    return (creep.ticksToLive == undefined || creep.ticksToLive > livetime);
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
function creep_statistics() {
	if (Game.creep_statistics_done) {
		return;
	}
	let timer = new Timer("creep_statistics", false);
	Game.creep_statistics = {};
	for (let room_name of config.controlled_rooms) {
		let empty: {[key in type_creep_role] ? : Creep[]} = {};
		config.creep_roles_all.forEach((e) => empty[e] = []);
		Game.creep_statistics[room_name] = empty;
	}
	for (let creepname in Game.creeps) {
		let creep = Game.creeps[creepname];
		let role = creep.memory.role;
		if (role !== undefined) {
			let room_name: string;
			if (creep.memory.home_room_name !== undefined) {
				room_name = creep.memory.home_room_name;
			} else {
				room_name = creep.room.name;
			}
			Game.creep_statistics[room_name][role].push(creep);
		}
	}
	/*
	for (let room_name of config.controlled_rooms) {
		for (let role of config.creep_roles_all) {
			console.log(room_name, role, Game.creep_statistics[room_name][role].length);
		}
	}
	*/
	Game.creep_statistics_done = true;
	timer.end();
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
	creep_statistics();
    let game_memory = Game.memory[room_name];
    let enemies = room.find(FIND_HOSTILE_CREEPS).filter((e) => e.owner.username == 'Invader');
    if (enemies.length > 0 && global.memory[room_name].tower_list.length == 0) {
        room.find(FIND_MY_CREEPS).forEach((e) => e.suicide());
        return;
    }
    let conf = config.conf_rooms[room.name];
	let room_statistics = Game.creep_statistics[room_name];
    let containers_status = global.memory[room_name].named_structures_status.container;
    let links_status = global.memory[room_name].named_structures_status.link;
    let sources_name = Object.keys(conf.sources);
    //let room_creeps = _.filter(Game.creeps, (creep) => creep.room.name == room.name);
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
    for (let source_name of sources_name) {
        if (game_memory.danger_mode) {
            let is_protected = config.protected_sources[room_name].includes(source_name);
            if (!is_protected) {
                continue;
            }
        }
        let link_mode = link_modes.includes('CT') && link_modes.includes(source_name);

		let with_carry = 0;
		let with_harvest = 5;
		let with_move = 1;
		let half_time = false;
        if (game_memory.pc_source_level !== undefined) {
            let level = game_memory.pc_source_level;
            with_harvest = config.powered_harvester[level].n_harvest;
            with_carry = config.powered_harvester[level].n_carry;
            with_move = config.powered_harvester[level].n_move;
        } else {
			if (room.controller.level == 8) {
				with_harvest = 11;
				with_carry = 4;
				with_move = 3;
				half_time = true;
			} else if (link_mode) {
				with_carry = 2;
			} else if (room.energyCapacityAvailable >= 600) {
				let this_container = Game.getObjectById(containers_status[source_name].id);
				let is_container_broken = (this_container.hitsMax - this_container.hits >= 100000);
				if (is_container_broken) {
					with_carry = 1;
				}
			}
		}
		let pretime = conf.harvesters[source_name].commuting_time + (with_harvest + with_move + with_move)*Math.ceil(with_harvest/(with_move*2)) + 15;
        let harvesters = room_statistics.harvester.filter((e) => e.memory.source_name == source_name && is_valid_creep(e, pretime));
        let n_harvesters = harvesters.length;
        if (n_harvesters == 0) {
            let added_memory = {
                "source_name": source_name,
                "pc_level": game_memory.pc_source_level,
				"half_time": half_time,
            };
            let options = {
                "with_harvest": with_harvest,
                "with_carry": with_carry,
                "with_move": with_move,
                "max_energy": room.energyCapacityAvailable,
            };
            let priority = 101;
            let added_json = {
                "priority": priority,
                "require_full": false,
            };
            let json = spawning_func.prepare_role("harvester", room.energyAvailable, added_memory, options, added_json);
            jsons.push(json);
        }

		if (!link_mode) {
			let carriers = room_statistics.carrier.filter((e) => e.memory.source_name == source_name && is_valid_creep(e, Math.ceil(conf.carriers[source_name].number * 4.5) + 10));
			let n_carrys = spawning_func.get_nbody(carriers, 'carry')
			let max_carry = conf.carriers[source_name].number;
			if (n_carrys < max_carry) {
				let added_memory = {
					"source_name": source_name
				};
				let options = {
					"max_energy": room.energyCapacityAvailable,
					"max_parts": max_carry,
				};
				let priority = 100;
				let added_json = {
					"priority": priority,
					"require_full": false,
				};
				let json = spawning_func.prepare_role("carrier", room.energyAvailable, added_memory, options, added_json);
				jsons.push(json);
			}
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
        if (room.storage.store.getUsedCapacity("energy") > storage_bars[0] && !(link_modes.includes('CT') && link_modes.includes('MAIN')) && !game_memory.danger_mode) {
            let storage_carriers = room_statistics.carrier.filter((e) => is_valid_creep(e, Math.ceil(conf.carriers.storage.number * 4.5) + 10) && e.memory.source_name == 'storage');
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
        }
    }
	let n_builds_needed = 0;
	if (room.memory.sites_total_progressleft > 0 && !game_memory.danger_mode) {
		let builders = room_statistics.builder.filter((e) => is_valid_creep(e, 50));
		let n_builds = spawning_func.get_nbody(builders, 'work')
		let max_build = 6;
		if (room.storage !== undefined && room.storage.store.getUsedCapacity("energy") > 50000) {
			if (room.energyCapacityAvailable >= 4000) {
				max_build = 15;
			} else if (room.energyCapacityAvailable >= 2300) {
				max_build = 10;
			}
		}
		n_builds_needed = Math.min(max_build, Math.ceil(room.memory.sites_total_progressleft / 2000));
		if (n_builds < n_builds_needed && room.memory.ticks_to_spawn_builder == 0) {
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
	}
	let max_upgrade;
    if (room.controller.level == 8) {
		let storage_condition = room.storage !== undefined && (room.storage.store.getUsedCapacity("battery") * 10 + room.storage.store.getUsedCapacity("energy") >= config.energy_bar_to_spawn_upgrader);
        if (storage_condition || room.controller.ticksToDowngrade <= 100000) {
            max_upgrade = 15;
        } else {
            max_upgrade = 0;
        }
    } else {
		max_upgrade = 18 + added_upgraders * 9;
		if (room.storage == undefined || room.storage.store.getUsedCapacity("energy") < 5000) {
			max_upgrade -= n_builds_needed * 3;
		}
	}
	if (max_upgrade > 0 && !game_memory.danger_mode) {
		let upgrader_spawning_time = 21;
		if (room.energyCapacityAvailable >= 2400) {
			upgrader_spawning_time = 84;
		} else if (room.energyCapacityAvailable >= 1200) {
			upgrader_spawning_time = 42;
		}
		let upgraders = room_statistics.upgrader.filter((e) => is_valid_creep(e, conf.upgraders.commuting_time + upgrader_spawning_time));
		let n_upgrades = spawning_func.get_nbody(upgraders, 'work')
		if (n_upgrades < max_upgrade) {
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
	}
	
	// transferer
    let transferers = room_statistics.transferer.filter((e) => is_valid_creep(e, 150));
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
        let priority = (transferers.length > 0 ? 60 : 150);
        let added_json = {
            "priority": priority,
            "require_full": false
        };
        let json = spawning_func.prepare_role("transferer", room.energyAvailable, added_memory, options, added_json);
        jsons.push(json);
    }

    // mineharvester and minecarrier
	if_mine: if (game_memory.mine_status.harvestable && game_memory.mine_status.amount > 0 && !game_memory.danger_mode) {
		let store_amount = room.storage.store.getUsedCapacity(game_memory.mine_status.type);
		if (room.terminal !== undefined) {
			store_amount += room.terminal.store.getUsedCapacity(game_memory.mine_status.type);
		}
		if (store_amount > 180000) {
			break if_mine;
		}
		let full_mine = game_memory.mine_status.amount >= 10000 && room.energyCapacityAvailable >= 4500;
		let n_mineharvesters;
		let n_minecarriers;
		if (full_mine) {
			let mineharvesters = room_statistics.mineharvester.filter((e) => is_valid_creep(e, 300));
			let minecarriers = room_statistics.minecarrier.filter((e) => is_valid_creep(e, 100));
			n_mineharvesters = mineharvesters.length;
			n_minecarriers = minecarriers.length;
		} else {
			let mineharvesters = room_statistics.mineharvester.filter((e) => is_valid_creep(e, 150));
			let minecarriers = room_statistics.minecarrier.filter((e) => is_valid_creep(e, 50));
			n_mineharvesters = mineharvesters.length;
			n_minecarriers = minecarriers.length;
		}
		if (n_mineharvesters == 0) {
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
		if (n_minecarriers == 0) {
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
	}
	let powered = Game.powered_rooms[room_name] !== undefined;
	let maincarrier_ncarry: number;
	if (powered) {
		maincarrier_ncarry = config.maincarrier_ncarry_powered;
	} else {
		maincarrier_ncarry = config.maincarrier_ncarry_no_power;
	}
    let maincarriers = room_statistics.maincarrier.filter((e) => is_valid_creep(e, maincarrier_ncarry * 3 + 30));
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
    let wall_repairers = room_statistics.wall_repairer;
    if (wall_repairers.length == 0 && Math.min(room.memory.min_wall_strength, room.memory.min_rampart_strength) < 2.0e7) {
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
    if (config.help_list[room_name] !== undefined && !game_memory.danger_mode) {
        for (let external_room_name in config.help_list[room_name]) {
            let external_room = Game.rooms[external_room_name];
            if (external_room == undefined || external_room.controller.owner == undefined || external_room.controller.owner.username !== config.username) {
				let newroom_claimers = room_statistics.newroom_claimer.filter((e) => e.memory.external_room_name = external_room_name);
                //let newroom_claimers = _.filter(Game.creeps, (e) => e.memory.role == 'newroom_claimer' && e.memory.external_room_name == external_room_name && e.memory.home_room_name == room_name);
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
				let help_harvesters = room_statistics.help_harvester.filter((e) => e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && is_valid_creep(e, conf_help.commuting_distance + 33));
                //let help_harvesters = _.filter(Game.creeps, (e) => e.memory.role == 'help_harvester' && e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && (e.ticksToLive == undefined || e.ticksToLive > conf_help.commuting_distance + 33));
				let help_carriers = room_statistics.help_carrier.filter((e) => e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && is_valid_creep(e, conf_help.commuting_distance + conf_external.carriers[source_name].number * 6));
                //let help_carriers = _.filter(Game.creeps, (e) => e.memory.role == 'help_carrier' && e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && (e.ticksToLive == undefined || e.ticksToLive > conf_help.commuting_distance + conf_external.carriers[source_name].number * 6));
                if (help_harvesters.length == 0) {
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
                if (help_carriers.length == 0) {
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
			let help_builders = room_statistics.help_builder.filter((e) => e.memory.external_room_name == external_room_name && is_valid_creep(e, conf_help.commuting_distance + 72));
            //let help_builders = _.filter(Game.creeps, (e) => e.memory.role == 'help_builder' && e.memory.external_room_name == external_room_name && (e.ticksToLive == undefined || e.ticksToLive > conf_help.commuting_distance + 72));
            if (help_builders.length == 0) {
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
	if_claimer: if (config.preclaiming_rooms[room_name] !== undefined && !game_memory.danger_mode) {
		for (let external_room_name in config.preclaiming_rooms[room_name]) {
			let external_room = Game.rooms[external_room_name];
			if (external_room !== undefined && external_room.controller.my) {
				break if_claimer;
			}
			let claimers = room_statistics.preclaimer.filter((e) => e.memory.external_room_name == external_room_name);
			//let claimers = _.filter(Game.creeps, (e) => is_valid_creep(e, 'preclaimer', 0) && e.memory.external_room_name == external_room_name && e.memory.home_room_name == room_name);
			if (claimers.length == 0) {
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
	if (external_progress !== undefined && !game_memory.danger_mode) {
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
			//let externalbuilders = _.filter(Game.creeps, (e) => is_valid_creep(e, "externalbuilder", 150));
			let externalbuilders = room_statistics.externalbuilder.filter((e) => e.memory.external_room_name == external_room_name && is_valid_creep(e, 150));
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
    for (let external_room_name in conf.external_rooms) {
		if (game_memory.danger_mode) {
			continue;
		}
        // claimer
        if (!conf.external_rooms[external_room_name].active || external_room_status[external_room_name].defense_type !== '' || room.storage == undefined) {
            continue;
        }
        let conf_controller = conf.external_rooms[external_room_name].controller;
		// reserver
        let reserve = conf_controller.reserve;
        let need_reserve = true;
        if (reserve && (config.preclaiming_rooms[room_name] == undefined || config.preclaiming_rooms[room_name][external_room_name] == undefined)) {
            if (Game.rooms[external_room_name] !== undefined) {
                if (Game.rooms[external_room_name].controller.my) {
                    need_reserve = false;
                }
                let reservation = Game.rooms[external_room_name].controller.reservation;
                if (reservation !== undefined) {
                    if (reservation.username == config.username && reservation.ticksToEnd > 800) {
                        need_reserve = false;
                    }
                }
            }
        } else {
            need_reserve = false;
        }
		if (need_reserve) {
			let reservers = room_statistics.reserver.filter((e) => e.memory.external_room_name == external_room_name && is_valid_creep(e, conf_controller.path_time));
			if (reservers.length == 0 && !game_memory.danger_mode) {
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
		}
        if (!room.memory.external_room_status[external_room_name].safe) {
            continue;
        }
		let pc_name = Game.powered_rooms[room_name];
		let powered = (pc_name !== undefined) && (config.pc_conf[pc_name].external_room == external_room_name);
		if_powered_source: if (powered) {
			let conf_powered_source = conf.external_rooms[external_room_name].powered_source;
			if (conf_powered_source == undefined) {
				break if_powered_source;
			}
			if (Game.rooms[external_room_name] == undefined) {
				break if_powered_source;
			}
            let conf_external = conf.external_rooms[external_room_name].powered_source;
			let pc_level = Game.memory[room_name].pc_source_level;
			let harvester_conf = config.powered_external_harvester[pc_level];
			// externalharvester, externalcarrier
            let externalharvester_spawning_time = (harvester_conf.n_move + harvester_conf.n_carry + harvester_conf.n_harvest) * 3 + 20;
			let externalharvesters = room_statistics.externalharvester.filter((e) => e.memory.external_room_name == external_room_name && e.memory.source_name == conf_external.source_name && is_valid_creep(e, conf_external.single_distance + externalharvester_spawning_time));
            //let externalharvesters = _.filter(Game.creeps, (e) => is_valid_creep(e, 'externalharvester', conf_external.single_distance + externalharvester_spawning_time) && e.memory.external_room_name == external_room_name && e.memory.source_name == conf_external.source_name && e.memory.home_room_name == room.name);
			let n_carrier_carry = Math.ceil((conf_external.carrier_distance + 2) * harvester_conf.n_harvest * 0.08);
            let externalcarrier_spawning_time = Math.ceil(n_carrier_carry * 4.5) + 20;
			let externalcarriers = room_statistics.externalcarrier.filter((e) => e.memory.external_room_name == external_room_name && e.memory.source_name == conf_external.source_name && is_valid_creep(e, conf_external.single_distance + externalcarrier_spawning_time));
            //let externalcarriers = _.filter(Game.creeps, (e) => is_valid_creep(e, 'externalcarrier', conf_external.single_distance + externalcarrier_spawning_time) && e.memory.external_room_name == external_room_name && e.memory.source_name == conf_external.source_name && e.memory.home_room_name == room.name);
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
            }
		} else {
			for (let source_name in conf.external_rooms[external_room_name].sources) {
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
				let externalharvesters = room_statistics.externalharvester.filter((e) => e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && is_valid_creep(e, conf_external.single_distance + externalharvester_spawning_time));
				//let externalharvesters = _.filter(Game.creeps, (e) => is_valid_creep(e, 'externalharvester', conf_external.single_distance + externalharvester_spawning_time) && e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && e.memory.home_room_name == room.name);
				let externalcarriers = room_statistics.externalcarrier.filter((e) => e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && is_valid_creep(e, conf_external.single_distance + externalcarrier_spawning_time));
				//let externalcarriers = _.filter(Game.creeps, (e) => is_valid_creep(e, 'externalcarrier', conf_external.single_distance + externalcarrier_spawning_time) && e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && e.memory.home_room_name == room.name);
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
			}
		}
    }
    let Invader_rooms = Object.keys(external_room_status).filter((e) => !(['', 'user'].includes(external_room_status[e].defense_type)));
    if (Invader_rooms.length > 0 && !game_memory.danger_mode) {
        let available_defense_types = Object.keys(config.defender_responsible_types);
        let defense_types = Invader_rooms.map((e) => external_room_status[e].defense_type);
		let defenders = room_statistics.defender;
        //let defenders = _.filter(Game.creeps, (e) => e.memory.role == 'defender' && e.memory.home_room_name == room.name);
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
		let invader_core_attackers = room_statistics.invader_core_attacker;
        //let invader_core_attackers = _.filter(Game.creeps, (e) => e.memory.role == 'invader_core_attacker' && e.memory.home_room_name == room.name);
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
		let hunters = room_statistics.hunter.filter((e) => is_valid_creep(e, 175));
        //hunters = _.filter(Game.creeps, (e) => is_valid_creep(e, 'hunter', 175));
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
	let gcl_room = Game.rooms[config.conf_gcl.conf_map.gcl_room];
	if_gcl: if (config.conf_gcl.conf_map.supporting_room == room_name && gcl_room !== undefined && gcl_room.controller.my && !game_memory.danger_mode && !Game.memory[gcl_room.name].danger_mode) {
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
			let upgraders = room_statistics.gcl_upgrader.filter((e) => is_valid_creep(e, config.conf_gcl.conf_map.single_distance + (n_work + n_move + n_carry) * 3));
			//let upgraders = _.filter(Game.creeps, (e) => is_valid_creep(e, 'gcl_upgrader', config.conf_gcl.conf_map.single_distance + (n_work + n_move + n_carry) * 3));
			let carriers = room_statistics.gcl_carrier.filter((e) => is_valid_creep(e, config.conf_gcl.conf_map.single_distance + 150));
			//let carriers = _.filter(Game.creeps, (e) => is_valid_creep(e, 'gcl_carrier', config.conf_gcl.conf_map.single_distance + 150));
			if (upgraders.length == 0) {
				let added_memory = { 
					"home_room_name": room_name,
				};
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
			let raw_upgraders = room_statistics.gcl_upgrader;
			let upgraders = raw_upgraders.filter((e) => is_valid_creep(e,  config.conf_gcl.conf_map.single_distance + 150));
			let has_spawning = mymath.any(raw_upgraders.map((e) => e.spawning));
			let n_upgrades_needed = config.energy_bars_to_spawn_gcl_upgraders.filter((e) => e < Memory.total_energies).length;
			let energy_condition = (room.terminal.isActive() ? room.terminal.store.getUsedCapacity("energy") >= 200000 : room.terminal.store.getUsedCapacity("energy") + room.storage.store.getUsedCapacity("energy") >= 100000)
			if (upgraders.length < n_upgrades_needed && energy_condition && functions.is_boost_resource_enough('GH2O', 32) && functions.is_boost_resource_enough('ZO', 8) && Game.cpu.bucket >= 9000 && !has_spawning) {
				let added_memory = {
					"home_room_name": room_name,
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
    if (game_memory.danger_mode) {
		let defenders = room_statistics.home_defender.filter((e) => is_valid_creep(e, 200));
		if (defenders.length < game_memory.n_defenders_needed) {
			let added_memory = {
				"home_room_name": room.name,
			};
			let options = { };
			let priority = 115;
			let added_json = {
				"priority": priority,
				"require_full": false,
			};
			let json = spawning_func.prepare_role("home_defender", room.energyAvailable, added_memory, options, added_json);
			jsons.push(json);
		}
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
