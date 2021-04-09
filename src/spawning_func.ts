import * as _ from "lodash";
import * as mymath from "./mymath";
import * as config from "./config";
const body_cost: {
    [key in BodyPartConstant]: number
} = {
    "tough": 10,
    "move": 50,
    "carry": 50,
    "work": 100,
    "attack": 80,
    "ranged_attack": 150,
    "heal": 250,
    "claim": 600
}

function returnbody(n_work: number, n_carry: number, n_move: number): BodyPartConstant[] {
    var body: BodyPartConstant[] = [];
    for (var i = 0; i < n_work; ++i) {
        body.push("work")
    }
    for (var i = 0; i < n_carry; ++i) {
        body.push("carry")
    }
    for (var i = 0; i < n_move; ++i) {
        body.push("move")
    }
    return body;
}

export function fullreturnbody(list: type_body_components): BodyPartConstant[] {
    var body: BodyPartConstant[] = [];
    for (var temp_bodyname in list) {
        let bodyname = < keyof type_body_components > temp_bodyname;
        for (var i = 0; i < list[bodyname]; i++) {
            body.push(bodyname);
        }
    }
    return body;
}
const getbody_external_init = (options: any) => {
    return fullreturnbody(options.body);
}
const getbody_hunter = (options: any): BodyPartConstant[] => {
    return fullreturnbody(options.body);
}
const getbody_defender = (options: any): BodyPartConstant[] => {
    var bodyinfo = config.defender_responsible_types[options.defender_type].body;
    return fullreturnbody(bodyinfo);
}
const getbody_invader_core_attacker = (options: any): BodyPartConstant[] => {
    var bodyinfo = {
        "move": 5,
        "attack": 10,
    };
    return fullreturnbody(bodyinfo);
}
const getbody_home_defender = (options: any): BodyPartConstant[] => {
    var bodyinfo = {
        "move": 10,
        "attack": 40,
    };
    return fullreturnbody(bodyinfo);
}
const getbody_help_harvester = (options: any) => {
    return returnbody(5, 1, 5);
}
const getbody_help_carrier = (options: any) => {
    let n_work = 0;
    let n_carry = options.max_parts;
    let n_move = options.max_parts;
    return returnbody(n_work, n_carry, n_move);
}
const getbody_help_builder = (options: any) => {
    let n_work = 8;
    let n_carry = 8;
    let n_move = 8;
    return returnbody(n_work, n_carry, n_move);
}
const getbody_wall_repairer = (options: any) => {
    let n_work = 20;
    let n_carry = 8;
    let n_move = 14;
    return returnbody(n_work, n_carry, n_move);
}
const getbody_harvester = (options: any): BodyPartConstant[] => {
    return returnbody(options.with_harvest, options.with_carry, options.with_move);
}
const getbody_mineharvester = (options: any): BodyPartConstant[] => {
	if (options.full) {
		return returnbody(40, 0, 10);
	} else {
		return returnbody(20, 0, 5);
	}
}
const getbody_externalharvester = (options: any): BodyPartConstant[] => {
    var n_work = 5;
    var n_move = 5;
    var carry_affordable = Math.floor((options.max_energy - 750) / 50)
    var n_carry = Math.min(options.max_parts, carry_affordable);
    return returnbody(n_work, n_carry, n_move);
}
const getbody_upgrader = (options: any): BodyPartConstant[] => {
    if (options.rcl8) {
        return returnbody(15, 3, 3);
    } else {
        if (options.max_energy >= 2150) {
            return returnbody(18, 4, 3);
        } else if (options.max_energy >= 1200) {
            return returnbody(10, 2, 2);
        } else if (options.max_energy >= 600) {
            return returnbody(5, 1, 1);
        } else {
            return returnbody(4, 1, 1);
        }
    }
}
const getbody_builder = (options: any): BodyPartConstant[] => {
    let n_afforable = Math.floor(options.max_energy / 200);
    let n_carry;
    if (n_afforable >= options.max_parts) {
        n_carry = options.max_parts;
    } else if (n_afforable >= Math.ceil(options.max_parts / 2)) {
        n_carry = Math.ceil(options.max_parts / 2);
    } else {
        n_carry = n_afforable;
    }
    let n_move = n_carry;
    let n_work = n_carry;
    return returnbody(n_work, n_carry, n_move);
}
const getbody_carrier = (options: any): BodyPartConstant[] => {
    let temp_n_move = Math.floor((options.max_energy + 50) / 150);
    let n_carry = Math.min(options.max_energy / 50 - temp_n_move, temp_n_move * 2);
    if (n_carry >= options.max_parts) {
        n_carry = options.max_parts;
    } else if (n_carry >= Math.ceil(options.max_parts / 2)) {
        n_carry = Math.ceil(options.max_parts / 2)
    }
    let n_move = Math.ceil(n_carry / 2);
    let n_work = 0;
    return returnbody(n_work, n_carry, n_move);
}
const getbody_specialcarrier = (options: any): BodyPartConstant[] => {
	if (options.full) {
		return returnbody(0, 12, 6);
	} else {
		return returnbody(0, 6, 3);
	}
}
const getbody_maincarrier = (options: any): BodyPartConstant[] => {
    let n_carry = options.max_parts;
    let n_move = Math.ceil(options.max_parts / 2);
    let n_work = 0;
    return returnbody(n_work, n_carry, n_move);
}
const getbody_externalcarrier = (options: any): BodyPartConstant[] => {
    var carry_affordable = Math.floor(options.max_energy / 100)
    var n_carry = Math.min(options.max_parts, carry_affordable);
    return returnbody(0, n_carry, n_carry);
}
const getbody_reserver = (options: any): BodyPartConstant[] => {
    let n_parts = Math.min(options.max_parts, Math.floor(options.max_energy / 650));
    let bodyinfo: type_body_components = {
        "claim": n_parts,
        "move": n_parts
    };
    return fullreturnbody(bodyinfo);
}
const getbody_claimer = (options: any): BodyPartConstant[] => {
    let bodyinfo: type_body_components = {
        "claim": 1,
        "move": 1,
    };
    return fullreturnbody(bodyinfo);
}
const getbody_newroom_claimer = (options: any): BodyPartConstant[] => {
    let bodyinfo: type_body_components = {
        "claim": 1,
        "move": 1,
    };
    return fullreturnbody(bodyinfo);
}
const getbody_transferer = (options: any): BodyPartConstant[] => {
    let n_work = 0;
    let n_carry = options.max_parts;
    let n_move = Math.ceil(n_carry / 2);
    return returnbody(n_work, n_carry, n_move);
}
type type_getbody = {
    [key in type_creep_role] ?: {
        (options: any): BodyPartConstant[]
    };
};
const getbody_list: type_getbody = {
    'harvester': getbody_harvester,
    'mineharvester': getbody_mineharvester,
    'carrier': getbody_carrier,
    'maincarrier': getbody_maincarrier,
    'specialcarrier': getbody_specialcarrier,
    'builder': getbody_builder,
    'upgrader': getbody_upgrader,
    'transferer': getbody_transferer,
    'wall_repairer': getbody_wall_repairer,
    'reserver': getbody_reserver,
    'claimer': getbody_claimer,
    'externalharvester': getbody_externalharvester,
    'externalcarrier': getbody_externalcarrier,
    'help_harvester': getbody_help_harvester,
    'help_carrier': getbody_help_carrier,
    'help_builder': getbody_help_builder,
    'hunter': getbody_hunter,
    'defender': getbody_defender,
    'invader_core_attacker': getbody_invader_core_attacker,
    'home_defender': getbody_home_defender,
    'newroom_claimer': getbody_newroom_claimer,
}

export function get_cost(body: BodyPartConstant[]): number {
    return mymath.array_sum(body.map((e) => body_cost[e]));
}

export function get_nbody(creeps: Creep[], bodyname: BodyPartConstant): number {
    if (creeps.length == 0) {
        return 0;
    }
    let n = mymath.array_sum(creeps.map((creep) => creep.body.filter((e) => e.type == bodyname).length));
    return n;
}
export function prepare_role(rolename: type_creep_role, energy: number, added_memory: any, options: any, added_json: any) {
    var rolename = rolename;
    var creepname = rolename + Game.time;
    var body = getbody_list[rolename](options);
    var cost = get_cost(body);
    var affordable = (cost <= energy);
    var memory: any = {
        role: rolename
    };
    if (added_memory !== null) {
        for (var key in added_memory) {
            memory[key] = added_memory[key];
        }
    }
    var json: type_spawn_json = {
        rolename: rolename,
        creepname: creepname,
        body: body,
        cost: cost,
        memory: memory,
        affordable: affordable
    }
    for (var key in added_json) {
        json[key] = added_json[key];
    }
    return json;
}

export function spawn_json(room_name: string, json: type_spawn_json) {
    let room = Game.rooms[room_name];
    let spawns = _.filter(Game.spawns, (e) => e.room.name == room_name);
    if (Memory.debug_mode) {
        console.log("Spawning " + json.rolename);
    }
    for (let spawn of spawns) {
        if (spawn.memory.spawning_time < 0) {
            continue;
        }
        spawn.spawnCreep(json.body, json.creepname, {
            memory: json.memory
        });
        return;
    }
}

for (var name in config.defender_responsible_types) {
    config.defender_responsible_types[name].cost = get_cost(fullreturnbody(config.defender_responsible_types[name].body));
}

global.spawn_in_queue = function(room_name: string, body: BodyPartConstant[], name: string, memory: any = {}, first=false): number {
    // 0: success, 1: name exists
    if (Game.creeps[name] !== undefined) {
        return 1;
    }
    let room = Game.rooms[room_name];
    let obj: type_additional_spawn = {
        "name": name,
        "body": body,
		"memory": memory,
    }
    if (room.memory.additional_spawn_queue == undefined) {
		room.memory.additional_spawn_queue = {"first":[], "last": []};
    }
	if (room.memory.additional_spawn_queue.first == undefined) {
		room.memory.additional_spawn_queue.first = [];
	}
	if (room.memory.additional_spawn_queue.last == undefined) {
		room.memory.additional_spawn_queue.last = [];
	}
	if (first) {
		room.memory.additional_spawn_queue.first.push(obj);
	} else {
		room.memory.additional_spawn_queue.last.push(obj);
	}
    return 0;
}
