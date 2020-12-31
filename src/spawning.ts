import * as _ from "lodash";
import * as mymath from "./mymath";
import * as spawning_func from "./spawning_func";
import * as spawning_init from "./spawning_init";
import * as defense from "./defense";

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
    };
    let json = spawning_func.prepare_role("defender", room.memory.total_energy, added_memory, options, added_json);
    return json;
}
export function spawn(room_name: string) {
    let room = Game.rooms[room_name];
    if (room.memory.danger_mode) {
        return;
    }
    let enemies = room.find(FIND_HOSTILE_CREEPS);
    if (enemies.length > 0 && room.memory.tower_list.length == 0) {
        return;
    }
    let conf = Memory.rooms_conf[room.name];
    let sources_name = Object.keys(conf.sources);
    let room_creeps = _.filter(Game.creeps, (creep) => creep.room.name == room.name);
    if (!room.memory.container_mode) {
        for (let source_name of sources_name) {
            spawning_init.spawn_init(room_name, source_name, conf.init[source_name].number, room.memory.total_maxenergy, room.memory.total_energy);
        }
        return;
    }
    let link_modes = room.memory.link_modes;

    let jsons: type_spawn_json[] = [];
    let info_source: any = {};
    for (let source_name of sources_name) {
        let creeps = room_creeps.filter((creep) => creep.memory.source_name == source_name);
        let harvesters = creeps.filter((e) => is_valid_creep(e, 'harvester', conf.harvesters[source_name].commuting_time + 18));
        let carriers = creeps.filter((e) => is_valid_creep(e, 'carrier', Math.ceil(conf.carriers[source_name].number * 4.5) + 10));
        let n_harvesters = harvesters.length;
        let n_carrys = spawning_func.get_nbody(carriers, 'carry')
        let max_carry = 0;
        let link_mode = link_modes.includes('CT') && link_modes.includes(source_name);
        if (!link_mode) {
            max_carry = conf.carriers[source_name].number;
        }
        info_source[source_name] = {
            n_carrys: n_carrys + "/" + max_carry,
            n_harvesters: harvesters.length + "/" + "1"
        };
        if (n_harvesters == 0) {
            let added_memory = {
                "source_name": source_name
            };
            let options = {
                "link_mode": link_mode,
                "max_energy": room.memory.total_maxenergy
            };
            let priority = (n_carrys > 0 ? 101 : 81);
            let added_json = {
                "priority": priority,
                "require_full": false,
            };
            let json = spawning_func.prepare_role("harvester", room.memory.total_energy, added_memory, options, added_json);
            jsons.push(json);
        }
        if (n_carrys < max_carry) {
            let added_memory = {
                "source_name": source_name
            };
            let options = {
                "link_mode": link_mode,
                "max_energy": room.memory.total_maxenergy,
                "max_parts": max_carry
            };
            let priority = (n_harvesters > 0 ? 100 : 80);
            let added_json = {
                "priority": priority,
                "require_full": false,
            };
            let json = spawning_func.prepare_role("carrier", room.memory.total_energy, added_memory, options, added_json);
            jsons.push(json);
        }
    }
    let added_upgraders = 0;
    if ("storage" in room) {
        for (let bar of [100000]) {
            if (room.storage.store["energy"] > bar) {
                added_upgraders += 1;
            }
        }
    }
    if (!(link_modes.includes('CT') && link_modes.includes('MAIN'))) {
        let storage_carriers = room_creeps.filter((e) => is_valid_creep(e, "carrier", Math.ceil(conf.carriers.storage.number * 4.5) + 10) && e.memory.source_name == 'storage');
        if (storage_carriers.length < added_upgraders) {
            let max_carry = conf.carriers.storage.number;
            let added_memory = {
                "source_name": "storage"
            };
            let options = {
                "link_mode": true,
                "max_energy": room.memory.total_maxenergy,
                "max_parts": max_carry
            };
            let priority = 85;
            let added_json = {
                "priority": priority,
                "require_full": false
            };
            let json = spawning_func.prepare_role("carrier", room.memory.total_energy, added_memory, options, added_json);
            jsons.push(json);
        }
        info_source["storage"] = {
            n_carriers: storage_carriers.length + "/" + added_upgraders,
        };
    }
    let upgrader_spawning_time = 21;
    if (room.memory.total_maxenergy >= 1200) {
        upgrader_spawning_time = 42;
    }
    let upgraders = room_creeps.filter((e) => is_valid_creep(e, "upgrader", conf.upgraders.commuting_time + upgrader_spawning_time));
    let builders = room_creeps.filter((e) => is_valid_creep(e, "builder", 50));
    let transferers = room_creeps.filter((e) => is_valid_creep(e, "transferer", 150));
    let mineharvesters = room_creeps.filter((e) => is_valid_creep(e, "mineharvester", 150));
    let specialcarriers = room_creeps.filter((e) => is_valid_creep(e, "specialcarrier", 50));
    let maincarriers = room_creeps.filter((e) => is_valid_creep(e, "maincarrier", 50));
    let maincarriers_MAIN = maincarriers.filter((e) => e.memory.maincarrier_type == 'MAIN');
    let n_upgrades = spawning_func.get_nbody(upgraders, 'work')
    let n_builds = spawning_func.get_nbody(builders, 'work')
    let n_transfers = spawning_func.get_nbody(transferers, 'carry')
    let n_mineharvesters = mineharvesters.length;
    let n_specialcarriers = specialcarriers.length;
    let n_maincarriers_MAIN = maincarriers_MAIN.length;
    let n_builds_needed = Math.min(6, Math.ceil(room.memory.sites_total_progressleft / 2000));
    let n_mineharvesters_needed;
    let n_specialcarriers_needed = 1;
    if (conf.mine.amount > 0) {
        n_mineharvesters_needed = 1;
    } else {
        n_mineharvesters_needed = 0;
    }
    let max_build = 3;
    let max_upgrade = 18 + added_upgraders * 10;
    let max_transfer = conf.max_transfer;
    let n_maincarriers_MAIN_needed = 0;
    if (link_modes.includes('CT') && link_modes.includes('MAIN')) {
        n_maincarriers_MAIN_needed = 1;
    }
    let info_home = {
        n_upgrades: n_upgrades + "/" + max_upgrade,
        n_builds: n_builds + "/" + n_builds_needed,
        n_transfers: n_transfers + "/" + max_transfer,
        n_mineharvesters: n_mineharvesters + "/" + n_mineharvesters_needed,
        n_specialcarriers: n_specialcarriers + "/" + n_specialcarriers_needed,
        n_maincarriers: {
            MAIN: n_maincarriers_MAIN + "/" + n_maincarriers_MAIN_needed
        },
    };
    if (n_transfers < max_transfer) {
        let added_memory = {};
        let options = {
            "max_parts": max_transfer,
        };
        let priority = (n_transfers > 0 ? 60 : 150);
        let added_json = {
            "priority": priority,
            "require_full": false
        };
        let json = spawning_func.prepare_role("transferer", room.memory.total_energy, added_memory, options, added_json);
        jsons.push(json);
    }
    if (n_builds < n_builds_needed) {
        let added_memory = {};
        let options = {
            "max_energy": room.memory.total_maxenergy,
            "max_parts": max_build
        };
        let priority = 2;
        let added_json = {
            "priority": priority,
            "require_full": true && room.memory.lack_energy,
        };
        let json = spawning_func.prepare_role("builder", room.memory.total_energy, added_memory, options, added_json);
        jsons.push(json);
    }
    if (n_mineharvesters_needed > 0 && n_mineharvesters == 0) {
        let added_memory = {};
        let options = {};
        let priority = 1;
        let added_json = {
            "priority": priority,
            "require_full": true && room.memory.lack_energy,
        };
        let json = spawning_func.prepare_role("mineharvester", room.memory.total_energy, added_memory, options, added_json);
        jsons.push(json);
    }
    if (n_specialcarriers_needed > 0 && n_specialcarriers == 0) {
        let added_memory = {};
        let options = {};
        let priority = -1;
        let added_json = {
            "priority": priority,
            "require_full": true && room.memory.lack_energy,
        };
        let json = spawning_func.prepare_role("specialcarrier", room.memory.total_energy, added_memory, options, added_json);
        jsons.push(json);
    }
    let container = Game.getObjectById(conf.containers.CT.id);
    if (n_upgrades < max_upgrade) {
        let added_memory = {};
        let options = {
            "max_energy": room.memory.total_maxenergy,
        };
        let priority = 0;
        let added_json = {
            "priority": priority,
            "require_full": true && room.memory.lack_energy,
        };
        let json = spawning_func.prepare_role("upgrader", room.memory.total_energy, added_memory, options, added_json);
        jsons.push(json);
    }
    if (n_maincarriers_MAIN < n_maincarriers_MAIN_needed) {
        let added_memory = {
            "maincarrier_type": "MAIN"
        };
        let options = {
            "max_parts": conf.maincarriers.MAIN.n_carry
        };
        let priority = 110;
        let added_json = {
            "priority": priority,
            "require_full": false
        };
        let json = spawning_func.prepare_role("maincarrier", room.memory.total_energy, added_memory, options, added_json);
        jsons.push(json);
    }

    /*
    if (Object.keys(Memory.help_list).includes(room.name)) {
        var external_room_name = Memory.help_list[room.name];
        if (Game.rooms[external_room_name].memory.storage_list.length < 3) {
            var external_conf = Memory.rooms_conf[external_room_name];
            var external_proportions = {}
            for (var source_name in external_conf.sources) {
                var needed_external_init = external_conf.init[source_name].number;
                var external_init = _.filter(Game.creeps, (e) => e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && e.ticksToLive > 150);
                var n_external_init = external_init.length;
                if (n_external_init < needed_external_init) {
                    var json = spawning_func.prepare_role("external_init", room.memory.total_maxenergy, room.memory.total_energy, max_carry, {
                        source_name: source_name,
                        external_room_name: external_room_name
                    });
                    jsons.push(json);
                    external_proportions[source_name] = n_external_init / needed_external_init;
                }
            }
        }
    }
	*/

    //reservers, externalharvesters, externalcarriers
    let external_room_status = room.memory.external_room_status;
    let info_external: any = {}
    for (let external_room_name in conf.external_rooms) {
        if (external_room_status[external_room_name].defense_type !== '' || !conf.external_rooms[external_room_name].active) {
            continue;
        }
        info_external[external_room_name] = {};
        let conf_external = conf.external_rooms[external_room_name].controller;
        let reserve = conf_external.reserve;
        let reservers = _.filter(Game.creeps, (e) => is_valid_creep(e, 'reserver', conf_external.path_time) && e.memory.external_room_name == external_room_name && e.memory.home_room_name == room.name);
        let n_needed_reservers = 0;
        if (reserve) {
            n_needed_reservers = 2;
            if (external_room_name in Game.rooms) {
                if (Game.rooms[external_room_name].controller.reservation !== undefined) {
                    let reservation = Game.rooms[external_room_name].controller.reservation;
                    if (reservation.username == Memory.username && reservation.ticksToEnd > 1000) {
                        n_needed_reservers = 1;
                    } else if (external_room_status[external_room_name].invader_core_existance) {
                        n_needed_reservers = 3;
                    }
                }
            }
        }
        if (reservers.length < n_needed_reservers) {
            let added_memory = {
                "external_room_name": external_room_name,
                "home_room_name": room.name,
                "rooms_forwardpath": conf_external.rooms_forwardpath,
                "names_forwardpath": conf_external.names_forwardpath,
                "rooms_backwardpath": conf_external.rooms_backwardpath,
                "names_backwardpath": conf_external.names_backwardpath,
            };
            let options = {};
            let priority = 40;
            let added_json = {
                "priority": priority,
                "require_full": true && room.memory.lack_energy,
            };
            let json = spawning_func.prepare_role("reserver", room.memory.total_energy, added_memory, options, added_json);
            jsons.push(json);
        }
        info_external[external_room_name].n_reservers = reservers.length + "/" + n_needed_reservers;
        if (!room.memory.external_room_status[external_room_name].safe) {
            continue;
        }
        for (let source_name in conf.external_rooms[external_room_name].sources) {
            info_external[external_room_name][source_name] = {}
            let conf_external = conf.external_rooms[external_room_name].sources[source_name];
            let externalharvester_spawning_time = (conf_external.n_carry + 8) * 3;
            let externalcarrier_spawning_time = conf_external.n_carry * 6;
            let externalharvesters = _.filter(Game.creeps, (e) => is_valid_creep(e, 'externalharvester', conf_external.single_distance * 2 + externalharvester_spawning_time) && e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && e.memory.home_room_name == room.name);
            let externalcarriers = _.filter(Game.creeps, (e) => is_valid_creep(e, 'externalcarrier', conf_external.single_distance + externalcarrier_spawning_time) && e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && e.memory.home_room_name == room.name);
            if (externalharvesters.length == 0) {
                let added_memory = {
                    "source_name": source_name,
                    "external_room_name": external_room_name,
                    "home_room_name": room.name,
                    "rooms_forwardpath": conf_external.rooms_forwardpath,
                    "names_forwardpath": conf_external.names_forwardpath,
                    "rooms_backwardpath": conf_external.rooms_backwardpath,
                    "names_backwardpath": conf_external.names_backwardpath,
                };
                let options = conf_external;
                let priority = (externalcarriers.length > 0 ? 31 : 21);
                let added_json = {
                    "priority": priority,
                    "require_full": true && room.memory.lack_energy,
                };
                let json = spawning_func.prepare_role("externalharvester", room.memory.total_energy, added_memory, options, added_json);
                jsons.push(json);
            }
            info_external[external_room_name][source_name].n_harvesters = externalharvesters.length + "/" + "1";
            if (externalcarriers.length < conf_external.n_carrier) {
                let added_memory = {
                    "source_name": source_name,
                    "external_room_name": external_room_name,
                    "home_room_name": room.name,
                    "rooms_forwardpath": conf_external.rooms_forwardpath,
                    "names_forwardpath": conf_external.names_forwardpath,
                    "rooms_backwardpath": conf_external.rooms_backwardpath,
                    "names_backwardpath": conf_external.names_backwardpath,
                };
                let options = conf_external;
                let priority = (externalharvesters.length > 0 ? 30 : 20);
                let added_json = {
                    "priority": priority,
                    "require_full": true && room.memory.lack_energy,
                };
                let json = spawning_func.prepare_role("externalcarrier", room.memory.total_energy, added_memory, options, added_json);
                jsons.push(json);
            }
            info_external[external_room_name][source_name].n_carriers = externalcarriers.length + "/" + conf_external.n_carrier;
        }
    }
    let Invader_rooms = Object.keys(external_room_status).filter((e) => !(['', 'user'].includes(external_room_status[e].defense_type)));
    if (Invader_rooms.length > 0) {
        let available_defense_types = Object.keys(Memory.defender_responsible_types);
        let defense_types = Invader_rooms.map((e) => external_room_status[e].defense_type);
        let defenders = _.filter(Game.creeps, (e) => e.memory.role == 'defender' && e.memory.home_room_name == room.name);
        let defenders_type = defenders.map((e) => e.memory.defender_type);
        for (let defense_type of defense_types) {
            if (defense_type == 'user') {
                continue;
            }
            let fightable_defender_types = available_defense_types.filter((e) => Memory.defender_responsible_types[e].list.includes(defense_type));
            if (mymath.all(defenders_type.map((e) => !fightable_defender_types.includes(e)))) {
                let costs = fightable_defender_types.map((e) => Memory.defender_responsible_types[e].cost);
                let argmin = mymath.argmin(costs);
                let json = get_defender_json(room_name, fightable_defender_types[argmin]);
                jsons.push(json);
                break;
            }
        }
    }
    let invader_core_existing_rooms = Object.keys(external_room_status).filter((e) => external_room_status[e].invader_core_existance);
    if (invader_core_existing_rooms.length > 0) {
        let invader_core_attackers = _.filter(Game.creeps, (e) => e.memory.role == 'invader_core_attacker' && e.memory.home_room_name == room.name);
        if (invader_core_attackers.length == 0) {
            let added_memory = {
                "home_room_name": room.name,
            };
            let options = {};
            let priority = 120;
            let added_json = {
                "priority": priority,
                "require_full": true && room.memory.lack_energy,
            };
            let json = spawning_func.prepare_role("invader_core_attacker", room.memory.total_energy, added_memory, options, added_json);
            jsons.push(json);
        }
    }
    if ("hunting" in conf) {
        let hunters = _.filter(Game.creeps, (e) => is_valid_creep(e, 'hunter', 175));
        if (hunters.length < conf.hunting.number) {
            let added_memory = {
                "home_room_name": room.name,
            };
			let options = {
                "body": conf.hunting.body,
			};
            let priority = 110;
            let added_json = {
                "priority": priority,
                "require_full": true && room.memory.lack_energy,
            };
            let json = spawning_func.prepare_role("hunter", room.memory.total_energy, added_memory, options, added_json);
			jsons.push(json);
        }
    }
    if (Memory.debug_mode) {
        console.log(room.name, JSON.stringify(info_source))
        console.log(room.name, JSON.stringify(info_home))
        console.log(room.name, JSON.stringify(info_external))
    }
    if (jsons.length > 0 || Memory.debug_mode) {
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
        if (json.affordable && (!json.require_full || room.memory.total_maxenergy == room.memory.total_energy)) {
            spawning_func.spawn_json(room_name, jsons[argmax]);
        }
    }
}
