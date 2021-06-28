import * as _ from "lodash";
import * as mymath from "./mymath";
import * as spawning_func from "./spawning_func";
import * as spawning_init from "./spawning_init";
import * as defense from "./defense";
import * as config from "./config";
import * as functions from "./functions";
import {
    Timer
} from "./timer";

function is_valid_creep(creep: Creep, livetime: number): boolean {
    return (creep.ticksToLive == undefined || creep.ticksToLive > livetime);
}

type type_general_path_obj = {
    rooms_forwardpath ? : string[];
    poses_forwardpath ? : number[];
    shard_path ? : type_shard_exit_point[];
    [key: string]: any;
}

function get_path_dict(obj: type_general_path_obj): CreepMemory {
    if (obj.shard_path !== undefined) {
        return {
            shard_move: {
                shard_path: obj.shard_path,
            }
        }
    } else {
        return {
            rooms_forwardpath: obj.rooms_forwardpath,
            poses_forwardpath: obj.poses_forwardpath,
        }
    }
}

export function get_mine_conf(remaining_amount: number, distance: number): {
    work: number,
    carry: number
} {
    //let max_work = Math.min(remaining_amount * 6 / 1200 / 5, 40);
    let max_work = Math.min(Math.ceil(remaining_amount / 1000), 40);
    let carry_match = Math.ceil(distance * max_work / 60);
    if (carry_match > 18) {
        max_work = Math.ceil(1080 / distance);
        carry_match = 18;
    }
    let result = {
        work: max_work,
        carry: carry_match,
    }
    return result;
}

function creep_statistics() {
    if (Game.creep_statistics_done) {
        return;
    }
    let timer = new Timer("creep_statistics", false);
    Game.creep_statistics = {};
    for (let room_name of config.controlled_rooms) {
        let empty: {
            [key in type_creep_role] ? : Creep[]
        } = {};
        config.creep_roles_all.forEach((e) => empty[e] = []);
        Game.creep_statistics[room_name] = empty;
        Game.rooms[room_name].memory.creep_statistics = {};
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
            let memory_stat = Game.rooms[room_name].memory.creep_statistics;
            if (memory_stat[role] == undefined) {
                memory_stat[role] = 0;
            }
            memory_stat[role] += 1;
        }
    }
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
            let options: SpawnOptions = {
                memory: obj.memory
            };
            options = {
                ...options,
                ...spawning_func.get_spawn_energy_structures(room_name)
            };
            if (s.spawnCreep(obj.body, obj.name, options) == 0) {
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
    if (enemies.length > 0 && global.memory[room_name].tower_list.length == 0 && room.find(FIND_MY_CREEPS).filter((e) => e.memory.role == 'guard').length == 0) {
        room.find(FIND_MY_CREEPS).forEach((e) => e.suicide());
        return;
    }
    let conf = config.conf_rooms[room.name];
    let room_statistics = Game.creep_statistics[room_name];
    let sources_name = Object.keys(conf.sources);
    if (room.energyCapacityAvailable < config.newroom_independence_energy) {
        return;
    }
    let link_modes = Object.keys(room.link);

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
            if (config.double_powered_harvester) {
                with_harvest *= 2;
                with_carry *= 2;
                with_move *= 2;
                half_time = true;
            }
        } else {
            if (room.controller.level == 8) {
                with_harvest = 11;
                with_carry = 4;
                with_move = 3;
                half_time = true;
            } else if (link_mode) {
                with_carry = 2;
            } else if (room.energyCapacityAvailable >= 600) {
                let this_container = room.container[source_name];
                let is_container_broken = (this_container.hitsMax - this_container.hits >= 100000);
                if (is_container_broken) {
                    with_carry = 1;
                }
            }
        }
        let pretime = conf.harvesters[source_name].commuting_time + (with_harvest + with_move + with_move) * Math.ceil(with_harvest / (with_move * 2)) + 15;
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
        let room_energy = (room.storage == undefined) ? 0 : functions.get_total_resource_amount(room_name, "energy") + functions.get_total_resource_amount(room_name, "battery") * 10;
        let storage_condition = room_energy >= config.energy_bar_to_spawn_upgrader;
        if ((storage_condition && Game.cpu.bucket >= 8000) || room.controller.ticksToDowngrade <= 100000) {
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
        let commuting_time_factor = 3;
        if (room.controller.level == 8) {
            commuting_time_factor = 1;
        }
        let upgraders = room_statistics.upgrader.filter((e) => is_valid_creep(e, conf.upgraders.distance * commuting_time_factor + upgrader_spawning_time));
        let n_upgrades = spawning_func.get_nbody(upgraders, 'work');
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
    if_mine: if (game_memory.mine_status.harvestable && room.energyCapacityAvailable >= 4500 && game_memory.mine_status.amount > 0 && !game_memory.danger_mode) {
        let mineharvesters = room_statistics.mineharvester;
        let minecarriers = room_statistics.minecarrier;
        let n_mineharvesters = mineharvesters.length;
        let n_minecarriers = minecarriers.length;
        let store_amount = room.storage.store.getUsedCapacity(game_memory.mine_status.type);
        if (room.terminal !== undefined) {
            store_amount += room.terminal.store.getUsedCapacity(game_memory.mine_status.type);
        }
        if (store_amount > 240000) {
            break if_mine;
        }
        let mine_conf = get_mine_conf(game_memory.mine_status.amount, conf.minecarrier_distance);
        let body_conf: type_body_conf = {
            work: {
                boost: "UHO2",
                number: mine_conf.work,
            },
            carry: {
                boost: "KH",
                number: mine_conf.carry,
            },
        }
        let ok = functions.is_boost_resource_enough(room_name, body_conf);
        if (!ok) {
            break if_mine;
        }
        if (n_mineharvesters == 0) {
            let added_memory = {
                need_boost: true,
            };
            let options = {
                work: mine_conf.work,
                move: Math.ceil(mine_conf.work / 4),
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
            let added_memory = {
                need_boost: true,
            };
            let options = {
                carry: mine_conf.carry,
                move: Math.ceil(mine_conf.carry / 2),
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

    let powered = game_memory.pc_source_level !== undefined;
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

    // wall_repairer
    let wall_repairers = room_statistics.wall_repairer;
    if (wall_repairers.length == 0 && Math.min(room.memory.min_wall_strength, room.memory.min_main_rampart_strength, room.memory.min_secondary_rampart_strength * 5) < 2.0e7) {
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
                continue;
            }
            if (external_room.energyCapacityAvailable >= config.newroom_independence_energy) {
                continue;
            }
            let conf_help = config.help_list[room_name][external_room_name];
            let path_dict = get_path_dict(conf_help);
            let conf_external = config.conf_rooms[external_room_name];
            let shard_creeps = Game.InterShardMemory[Game.shard.name].all_creeps;
            for (let source_name in config.conf_rooms[external_room_name].sources) {
                let help_harvesters = room_statistics.help_harvester.filter((e) => e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && is_valid_creep(e, conf_help.commuting_time + 75)).map((e) => e.name);
                help_harvesters = help_harvesters.concat(Object.keys(shard_creeps).filter((e) => Game.creeps[e] == undefined && shard_creeps[e].role == 'help_harvester' && shard_creeps[e].external_room_name == external_room_name && shard_creeps[e].source_name == source_name));
                let help_carriers = room_statistics.help_carrier.filter((e) => e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && is_valid_creep(e, conf_help.commuting_time + conf_external.carriers[source_name].number * 6)).map((e) => e.name);
                help_carriers = help_carriers.concat(Object.keys(shard_creeps).filter((e) => Game.creeps[e] == undefined && shard_creeps[e].role == 'help_carrier' && shard_creeps[e].external_room_name == external_room_name && shard_creeps[e].source_name == source_name));
                if (help_harvesters.length == 0) {
                    let added_memory = {
                        "source_name": source_name,
                        "external_room_name": external_room_name,
                        "home_room_name": room_name,
                    };
                    added_memory = {
                        ...added_memory,
                        ...path_dict,
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
                if (help_carriers.length == 0 && (external_room.link.CT == undefined || external_room.link[source_name] == undefined)) {
					let n_carry = conf_help.n_carrys !== undefined ? conf_help.n_carrys[source_name] : conf_external.carriers[source_name].number;
                    let added_memory = {
                        "source_name": source_name,
                        "external_room_name": external_room_name,
                        "home_room_name": room_name,
                    };
                    added_memory = {
                        ...added_memory,
                        ...path_dict,
                    };
                    let options = {
                        "max_parts": n_carry,
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
			let level1 = external_room.controller.level == 1;
            let help_builders = room_statistics.help_builder.filter((e) => e.memory.external_room_name == external_room_name && is_valid_creep(e, conf_help.commuting_time + 150)).map((e) => e.name);
            help_builders = help_builders.concat(Object.keys(shard_creeps).filter((e) => Game.creeps[e] == undefined && shard_creeps[e].role == 'help_builder' && shard_creeps[e].external_room_name == external_room_name));
            if (help_builders.length < 1 + (level1 ? 0 : conf_help.n_energy_carriers)) {
                let request_boost = !level1 && external_room.memory.sites_total_progressleft < conf_help.commuting_time * 20 && external_room.controller.progressTotal - external_room.controller.progress >= 60000;
                let added_memory = {
                    "external_room_name": external_room_name,
                    "home_room_name": room_name,
                    "request_boost": request_boost,
                };
                added_memory = {
                    ...added_memory,
                    ...path_dict,
                };
                let options = {
				};
                let priority = 40;
                let added_json = {
                    "priority": priority,
                    "require_full": false
                };
                let json = spawning_func.prepare_role("help_builder", room.energyAvailable, added_memory, options, added_json);
                jsons.push(json);
            }
            let spawning_energy_carriers = room_statistics.energy_carrier.filter((e) => e.spawning);
            if (conf_help.n_energy_carriers > spawning_energy_carriers.length && !level1) {
				let energy_consuming_rate = (1250 + (1500 - conf_help.commuting_distance) / 3 * 5) / 150;
				let ratio = Math.min(20/energy_consuming_rate, 1);
                let added_memory = {
                    "external_room_name": external_room_name,
                    "home_room_name": room_name,
                };
                added_memory = {
                    ...added_memory,
                    ...path_dict,
                };
                let options = {
					ratio: ratio,
				};
                let priority = 40;
                let added_json = {
                    "priority": priority,
                    "require_full": false
                };
                let json = spawning_func.prepare_role("energy_carrier", room.energyAvailable, added_memory, options, added_json);
                jsons.push(json);
            }
			if (conf_help.guard !== undefined && external_room.controller.level <= 3) {
				let guards = room_statistics.guard.filter((e) => e.memory.external_room_name == external_room_name && is_valid_creep(e, conf_help.commuting_time + conf_help.guard * 6)).map((e) => e.name);
				guards = guards.concat(Object.keys(shard_creeps).filter((e) => Game.creeps[e] == undefined && shard_creeps[e].role == 'guard' && shard_creeps[e].external_room_name == external_room_name));
				if (guards.length == 0) {
					let added_memory = {
						"external_room_name": external_room_name,
						"home_room_name": room_name,
					};
					added_memory = {
						...added_memory,
						...path_dict,
					};
					let options = {
						n_parts: conf_help.guard,
					};
					let priority = 39;
					let added_json = {
						"priority": priority,
						"require_full": false
					};
					let json = spawning_func.prepare_role("guard", room.energyAvailable, added_memory, options, added_json);
					jsons.push(json);
				}
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
            let claimers = room_statistics.preclaimer.filter((e) => e.memory.external_room_name == external_room_name).map((e) => e.name);
            let shard_creeps = Game.InterShardMemory[Game.shard.name].all_creeps;
            claimers = claimers.concat(Object.keys(shard_creeps).filter((e) => shard_creeps[e].role == 'preclaimer' && shard_creeps[e].external_room_name == external_room_name));
            claimers = Array.from(new Set(claimers));
            //let claimers = _.filter(Game.creeps, (e) => is_valid_creep(e, 'preclaimer', 0) && e.memory.external_room_name == external_room_name && e.memory.home_room_name == room_name);
            if (claimers.length == 0) {
                let conf_preclaim = config.preclaiming_rooms[room_name][external_room_name];
                let added_memory: CreepMemory = {
                    "external_room_name": external_room_name,
                    "home_room_name": room_name,
                };
                added_memory = {
                    ...added_memory,
                    ...get_path_dict(conf_preclaim)
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
            let harvester_conf = config.double_powered_harvester ? config.doubled_powered_external_harvester[pc_level] : config.powered_external_harvester[pc_level];
            // externalharvester, externalcarrier
            let externalharvester_spawning_time = (harvester_conf.n_move + harvester_conf.n_carry + harvester_conf.n_harvest) * 3 + 20;
            let externalharvesters = room_statistics.externalharvester.filter((e) => e.memory.external_room_name == external_room_name && e.memory.source_name == conf_external.source_name && is_valid_creep(e, conf_external.single_distance + externalharvester_spawning_time));
            //let externalharvesters = _.filter(Game.creeps, (e) => is_valid_creep(e, 'externalharvester', conf_external.single_distance + externalharvester_spawning_time) && e.memory.external_room_name == external_room_name && e.memory.source_name == conf_external.source_name && e.memory.home_room_name == room.name);
            let max_carry = conf.links.Ext == undefined ? 33 : 32;
            //let n_carrier_carry = Math.min(Math.ceil((conf_external.carrier_distance + 2) * harvester_conf.n_harvest * (config.double_powered_harvester ? 0.04 : 0.08)), max_carry);
            let n_carrier_carry = max_carry;
            let externalcarrier_spawning_time = Math.ceil(n_carrier_carry * 4.5) + 20;
            let externalcarriers = room_statistics.externalcarrier.filter((e) => e.memory.external_room_name == external_room_name && e.memory.source_name == conf_external.source_name && is_valid_creep(e, conf_external.single_distance + externalcarrier_spawning_time));
            //let externalcarriers = _.filter(Game.creeps, (e) => is_valid_creep(e, 'externalcarrier', conf_external.single_distance + externalcarrier_spawning_time) && e.memory.external_room_name == external_room_name && e.memory.source_name == conf_external.source_name && e.memory.home_room_name == room.name);
            if (externalharvesters.length == 0 && !game_memory.danger_mode) {
                let added_memory = {
                    "source_name": conf_external.source_name,
                    "external_room_name": external_room_name,
                    "home_room_name": room.name,
                    "powered": true,
                    "half_time": config.double_powered_harvester,
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
                    "n_work": 0,
                    "n_carry": n_carrier_carry,
                    "n_move": Math.ceil(n_carrier_carry / 2),
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
                let externalcarriers = room_statistics.externalcarrier.filter((e) => e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && is_valid_creep(e, conf_external.single_distance + externalcarrier_spawning_time));
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
                let typename = fightable_defender_types[argmin]
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
    if (game_memory.danger_mode) {
        let defenders = room_statistics.home_defender.filter((e) => is_valid_creep(e, 200));
        if (defenders.length < game_memory.n_defenders_needed) {
            let added_memory = {
                "home_room_name": room.name,
            };
            let options = {};
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
                let options: SpawnOptions = {
                    memory: obj.memory
                };
                options = {
                    ...options,
                    ...spawning_func.get_spawn_energy_structures(room_name)
                };
                if (s.spawnCreep(obj.body, obj.name, options) == 0) {
                    queue.last = queue.last.slice(1, undefined)
                    return;
                }
            }
            return;
        }
    }
}
