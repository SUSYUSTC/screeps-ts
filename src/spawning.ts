import * as _ from "lodash";
import * as mymath from "./mymath";
import * as spawning_func from "./spawning_func";
import * as spawning_init from "./spawning_init";
import * as defense from "./defense";

function get_defender_json(spawn: StructureSpawn, typename: string): type_spawn_json {
	let added_memory = {
		"home_room_name": spawn.room.name,
		"type": typename
	};
	let options = {};
	let priority = 110;
	let added_json = {
		"priority": priority,
	};
	let json = spawning_func.prepare_role("defender", spawn.room.memory.total_energy, added_memory, options, added_json);
	return json;
}
export function spawn(spawn: StructureSpawn) {
    if (spawn.room.memory.danger_mode) {
        return;
    }
    var enemies = spawn.room.find(FIND_HOSTILE_CREEPS);
    if (enemies.length > 0 && spawn.room.memory.tower_list.length == 0) {
        return;
    }
    var conf = Memory.rooms_conf[spawn.room.name];
    var sources_name = Object.keys(conf.sources);
    var room_creeps = _.filter(Game.creeps, (creep) => creep.room.name == spawn.room.name);
    if (!spawn.room.memory.container_mode) {
        for (var source_name of sources_name) {
            spawning_init.spawn_init(spawn, source_name, conf.init[source_name].number, spawn.room.memory.total_maxenergy, spawn.room.memory.total_energy);
        }
        return;
    }

    var jsons: type_spawn_json[] = [];
    var info_source: any = {};
    for (var source_name of sources_name) {
        let creeps = room_creeps.filter((creep) => creep.memory.source_name == source_name);
        let harvesters = creeps.filter((e) => e.memory.role == 'harvester' && e.ticksToLive >= conf.harvesters[source_name].commuting_time + 18);
        let carriers = creeps.filter((e) => e.memory.role == 'carrier' && e.ticksToLive >= Math.ceil(conf.carriers[source_name].number * 4.5) + 10);
        let n_harvesters = harvesters.length;
        let n_carrys = spawning_func.get_nbody(carriers, 'carry')
		let max_carry = 0;
        if (!spawn.room.memory.link_mode) {
            max_carry = conf.carriers[source_name].number;
        }
        info_source[source_name] = {
            n_carrys: n_carrys.toString() + "/" + max_carry.toString(),
            n_harvesters: harvesters.length.toString() + "/" + "1"
        };
        if (n_harvesters == 0) {
            let added_memory = {
                "source_name": source_name
            };
            let options = {
                "link_mode": spawn.room.memory.link_mode,
                "max_energy": spawn.room.memory.total_maxenergy
            };
            let priority = (n_carrys > 0 ? 81 : 101);
            let added_json = {
                "priority": priority,
                "require_full": false
            };
            let json = spawning_func.prepare_role("harvester", spawn.room.memory.total_energy, added_memory, options, added_json);
            jsons.push(json);
        }
        if (n_carrys < max_carry) {
            let added_memory = {
                "source_name": source_name
            };
            let options = {
                "link_mode": spawn.room.memory.link_mode,
                "max_energy": spawn.room.memory.total_maxenergy,
                "max_parts": max_carry
            };
            let priority = (n_harvesters > 0 ? 80 : 100);
            let added_json = {
                "priority": priority,
                "require_full": false
            };
            let json = spawning_func.prepare_role("carrier", spawn.room.memory.total_energy, added_memory, options, added_json);
            jsons.push(json);
        }
    }
    var added_upgraders = 0;
    if (spawn.room.hasOwnProperty("storage")) {
        for (var bar of [200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000]) {
            if (spawn.room.storage.store["energy"] > bar) {
                added_upgraders += 1;
            }
        }
    }
	if (!spawn.room.memory.link_mode) {
		let storage_carriers = room_creeps.filter((e) => e.memory.role == 'carrier' && e.memory.source_name == 'storage' && e.ticksToLive >= Math.ceil(conf.carriers[source_name].number * 4.5) + 10);
		if (storage_carriers.length < added_upgraders) {
			let max_carry = conf.carriers.storage.number;
            let added_memory = {
                "source_name": "storage"
            };
            let options = {
                "link_mode": spawn.room.memory.link_mode,
                "max_energy": spawn.room.memory.total_maxenergy,
                "max_parts": max_carry
            };
            let priority = 85;
            let added_json = {
                "priority": priority,
                "require_full": false
            };
            let json = spawning_func.prepare_role("carrier", spawn.room.memory.total_energy, added_memory, options, added_json);
            jsons.push(json);
		}
		info_source["storage"] = {
			n_carriers: storage_carriers.length.toString() + "/" + added_upgraders,
		};
	}
	var upgrader_spawning_time = 21;
    if (spawn.room.memory.total_maxenergy >= 1200) {
        upgrader_spawning_time = 42;
    }
    var upgraders = room_creeps.filter((e) => e.memory.role == 'upgrader' && e.ticksToLive >= conf.upgraders.commuting_time + upgrader_spawning_time);
    var builders = room_creeps.filter((e) => e.memory.role == 'builder' && e.ticksToLive >= 50);
    var transferers = room_creeps.filter((e) => e.memory.role == 'transferer' && e.ticksToLive >= 150);
    var mineharvesters = room_creeps.filter((e) => e.memory.role == 'mineharvester' && e.ticksToLive >= 50);
    var n_upgrades = spawning_func.get_nbody(upgraders, 'work')
    var n_builds = spawning_func.get_nbody(builders, 'work')
    var n_transfers = spawning_func.get_nbody(transferers, 'carry')
    var n_mineharvests = spawning_func.get_nbody(mineharvesters, 'work')
    var n_builds_needed = Math.min(6, Math.ceil(spawn.room.memory.sites_total_progressleft / 2000));
	var n_mineharvests_needed=0;
    if (spawn.room.memory.mine_harvestable) {
		var density2number: {[key:string]: number} = {}
        density2number[DENSITY_LOW] = 2;
        density2number[DENSITY_MODERATE] = 5;
        density2number[DENSITY_HIGH] = 9;
        density2number[DENSITY_ULTRA] = 12;
        var n_mineharvests_needed = density2number[conf.mine.density];
    };
    var max_build = 3;
    var max_upgrade = 18 + added_upgraders*10;
    var max_transfer = conf.max_transfer;
    var info_home = {
        n_upgrades: n_upgrades.toString() + "/" + max_upgrade.toString(),
        n_builds: n_builds + "/" + n_builds_needed.toString(),
        n_transfers: n_transfers + "/" + max_transfer.toString(),
        n_mineharvests: n_mineharvests + "/" + n_mineharvests_needed.toString(),
    };
    if (n_transfers < max_transfer) {
        let added_memory = {};
        let options = {};
        let priority = (n_transfers > 0 ? 60 : 120);
        let added_json = {
            "priority": priority,
            "require_full": false
        };
        let json = spawning_func.prepare_role("transferer", spawn.room.memory.total_energy, added_memory, options, added_json);
        jsons.push(json);
    }
    if (n_builds < n_builds_needed) {
        let added_memory = {};
        let options = {
            "max_energy": spawn.room.memory.total_maxenergy,
            "max_parts": max_build
        };
        let priority = 2;
        let added_json = {
            "priority": priority,
            "require_full": true
        };
        let json = spawning_func.prepare_role("builder", spawn.room.memory.total_energy, added_memory, options, added_json);
        jsons.push(json);
    }
    if (n_mineharvests_needed > 0 && n_mineharvests == 0) {
        let added_memory = {};
        let options = {
            "max_parts": n_mineharvests_needed
        };
        let priority = 25;
        let added_json = {
            "priority": priority,
            "require_full": true
        };
        let json = spawning_func.prepare_role("mineharvester", spawn.room.memory.total_energy, added_memory, options, added_json);
        jsons.push(json);
    }
    var container = Game.getObjectById(conf.containers.CT.id);
    if (n_upgrades < max_upgrade) {
        let added_memory = {};
        let options = {
            "max_energy": spawn.room.memory.total_maxenergy,
        };
        let priority = 0;
        let added_json = {
            "priority": priority,
            "require_full": true
        };
        let json = spawning_func.prepare_role("upgrader", spawn.room.memory.total_energy, added_memory, options, added_json);
        jsons.push(json);
    }

    /*
    if (Object.keys(Memory.help_list).includes(spawn.room.name)) {
        var external_room_name = Memory.help_list[spawn.room.name];
        if (Game.rooms[external_room_name].memory.storage_list.length < 3) {
            var external_conf = Memory.rooms_conf[external_room_name];
            var external_proportions = {}
            for (var source_name in external_conf.sources) {
                var needed_external_init = external_conf.init[source_name].number;
                var external_init = _.filter(Game.creeps, (e) => e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && e.ticksToLive > 150);
                var n_external_init = external_init.length;
                if (n_external_init < needed_external_init) {
                    var json = spawning_func.prepare_role("external_init", spawn.room.memory.total_maxenergy, spawn.room.memory.total_energy, max_carry, {
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
    var info_external: any = {}
    for (var external_room_name in conf.external_rooms) {
		if (spawn.room.memory.invaded_external_rooms.hasOwnProperty(external_room_name)) {
			info_external[external_room_name] = "Invaded!";
			continue;
		}
        info_external[external_room_name] = {};
        let conf_external = conf.external_rooms[external_room_name].controller;
        let reserve = conf_external.reserve;
        let reservers = _.filter(Game.creeps, (e) => e.memory.role == 'reserver' && e.memory.external_room_name == external_room_name && e.memory.home_room_name == spawn.room.name);
        let n_needed_reservers = 0;
        if (reserve) {
            n_needed_reservers = 1;
            if (Game.rooms.hasOwnProperty(external_room_name) && Game.rooms[external_room_name].controller.hasOwnProperty("reservation")) {
                var reservation = Game.rooms[external_room_name].controller.reservation;
                if (reservation.username == Memory.username && reservation.ticksToEnd < 1000) {
                    n_needed_reservers = 2;
                }
            }
        }
        if (reservers.length < n_needed_reservers) {
            let added_memory = {
                "external_room_name": external_room_name,
                "home_room_name": spawn.room.name,
                "rooms_forwardpath": conf_external.rooms_forwardpath,
                "names_forwardpath": conf_external.names_forwardpath,
                "rooms_backwardpath": conf_external.rooms_backwardpath,
                "names_backwardpath": conf_external.names_backwardpath,
            };
            let options = {};
            let priority = 10;
            let added_json = {
                "priority": priority,
                "require_full": true
            };
            let json = spawning_func.prepare_role("reserver", spawn.room.memory.total_energy, added_memory, options, added_json);
            jsons.push(json);
        }
        info_external[external_room_name].n_reservers = reservers.length.toString() + "/" + n_needed_reservers.toString();
        for (var source_name in conf.external_rooms[external_room_name].sources) {
            info_external[external_room_name][source_name] = {}
            let conf_external = conf.external_rooms[external_room_name].sources[source_name];
            let externalharvesters = _.filter(Game.creeps, (e) => e.memory.role == 'externalharvester' && e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && e.memory.home_room_name == spawn.room.name);
            let externalcarriers = _.filter(Game.creeps, (e) => e.memory.role == 'externalcarrier' && e.memory.external_room_name == external_room_name && e.memory.source_name == source_name && e.memory.home_room_name == spawn.room.name);
            if (externalharvesters.length == 0) {
                let added_memory = {
                    "source_name": source_name,
                    "external_room_name": external_room_name,
                    "home_room_name": spawn.room.name,
                    "rooms_forwardpath": conf_external.rooms_forwardpath,
                    "names_forwardpath": conf_external.names_forwardpath,
                    "rooms_backwardpath": conf_external.rooms_backwardpath,
                    "names_backwardpath": conf_external.names_backwardpath,
                };
                let options = conf_external;
                let priority = (externalcarriers.length > 0 ? 21 : 31);
                let added_json = {
                    "priority": priority,
                    "require_full": true
                };
                let json = spawning_func.prepare_role("externalharvester", spawn.room.memory.total_energy, added_memory, options, added_json);
                jsons.push(json);
            }
            info_external[external_room_name][source_name].n_harvesters = externalharvesters.length.toString() + "/" + "1";
            if (externalcarriers.length < conf_external.n_carrier) {
                let added_memory = {
                    "source_name": source_name,
                    "external_room_name": external_room_name,
                    "home_room_name": spawn.room.name,
                    "rooms_forwardpath": conf_external.rooms_forwardpath,
                    "names_forwardpath": conf_external.names_forwardpath,
                    "rooms_backwardpath": conf_external.rooms_backwardpath,
                    "names_backwardpath": conf_external.names_backwardpath,
                };
                let options = conf_external;
                let priority = (externalharvesters.length > 0 ? 20 : 30);
                let added_json = {
                    "priority": priority,
                    "require_full": true
                };
                let json = spawning_func.prepare_role("externalcarrier", spawn.room.memory.total_energy, added_memory, options, added_json);
                jsons.push(json);
            }
            info_external[external_room_name][source_name].n_carriers = externalcarriers.length.toString() + "/" + conf_external.n_carrier.toString();
        }
    }
	if (Object.keys(spawn.room.memory.invaded_external_rooms).length > 0) {
		let defense_types = Object.values(spawn.room.memory.invaded_external_rooms);
		let defenders = _.filter(Game.creeps, (e) => e.memory.role == 'defender' && e.memory.home_room_name == spawn.room.name);
		let defender_types: {[key: string]: number} = {}
		for (var type of ["big_close", "small_close", "big_far", "small_far"]) {
			defender_types[type] = defenders.filter((e) => e.memory.defender_type == type).length;
		}
		if (defense_types.includes("big_close") && defender_types["big_close"] == 0) {
			jsons.push(get_defender_json(spawn, "big_close"));
			return;
		}
		else if (defense_types.includes("small_close") && defender_types["big_close"] == 0 && defender_types["small_close"] == 0) {
			jsons.push(get_defender_json(spawn, "small_close"));
			return;
		}
		if (defense_types.includes("big_far") && defender_types["big_far"] == 0) {
			jsons.push(get_defender_json(spawn, "big_far"));
			return;
		}
		else if (defense_types.includes("small_far") && defender_types["big_far"] == 0 && defender_types["small_far"] == 0) {
			jsons.push(get_defender_json(spawn, "small_far"));
			return;
		}
	}
    if (Memory.debug_mode) {
        console.log(spawn.room.name, JSON.stringify(info_source))
        console.log(spawn.room.name, JSON.stringify(info_home))
        console.log(spawn.room.name, JSON.stringify(info_external))
    }
    if (jsons.length > 0 || Memory.debug_mode) {
        console.log(spawn.name, "Spawning list: ", jsons.map((e) => [e.rolename, e.cost, e.priority]));
    }
    if (spawn.spawning) {
		spawn.memory.spawning_time = -5;
        return;
    }
    if (jsons.length >= 1) {
        let priorities = jsons.map((e) => e.priority);
        let argmax = mymath.argmax(priorities);
        let json = jsons[argmax];
        if (json.affordable && (!json.require_full || spawn.room.memory.total_maxenergy == spawn.room.memory.total_energy)) {
            spawning_func.spawn_json(spawn, jsons[argmax]);
        }
    }
}
