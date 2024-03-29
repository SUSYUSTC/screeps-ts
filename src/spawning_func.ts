import * as _ from "lodash";
import * as mymath from "./mymath";
import * as config from "./config";
import {
    Timer
} from "./timer"
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
const getbody_signer = (options: any) => {
    return returnbody(0, 0, 1);
}
const getbody_external_init = (options: any) => {
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
    return returnbody(11, 3, 11);
}
const getbody_help_carrier = (options: any) => {
    let n_work = 0;
    let n_carry = options.max_parts;
    let n_move = options.max_parts;
    return returnbody(n_work, n_carry, n_move);
}
const getbody_help_builder = (options: any) => {
    return returnbody(options.work, options.carry, options.move);
}
const getbody_energy_carrier = (options: any) => {
    return fullreturnbody({
		"carry": 25-options.n_heal,
		"heal": options.n_heal,
		"move": 25,
	})
}
const getbody_guard = (options: any) => {
	return fullreturnbody(options.bodyinfo);
}
const getbody_wall_repairer = (options: any) => {
    let n_work = 24;
    let n_carry = 8;
    let n_move = 16;
    return returnbody(n_work, n_carry, n_move);
}
const getbody_harvester = (options: any): BodyPartConstant[] => {
    return returnbody(options.with_harvest, options.with_carry, options.with_move);
}
const getbody_mineharvester = (options: any): BodyPartConstant[] => {
    return returnbody(options.work, 0, options.move);
}
const getbody_externalharvester = (options: any): BodyPartConstant[] => {
    if (options.n_work !== undefined && options.n_carry !== undefined && options.n_move !== undefined) {
        return returnbody(options.n_work, options.n_carry, options.n_move)
    }
    var n_work = 5;
    var n_move = 5;
    var carry_affordable = Math.floor((options.max_energy - 750) / 50)
    var n_carry = Math.min(options.max_parts, carry_affordable);
    return returnbody(n_work, n_carry, n_move);
}
const getbody_upgrader = (options: any): BodyPartConstant[] => {
    if (options.rcl8) {
        return returnbody(15, 3, 8);
    } else {
		if (options.max_energy >= 4300) {
            return returnbody(36, 8, 6);
		} else if (options.max_energy >= 2150) {
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
const getbody_externalbuilder = (options: any): BodyPartConstant[] => {
    return returnbody(options.max_parts, options.max_parts, options.max_parts);
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
const getbody_minecarrier = (options: any): BodyPartConstant[] => {
    return returnbody(0, options.carry, options.move);
}
const getbody_maincarrier = (options: any): BodyPartConstant[] => {
    let n_carry = options.max_parts;
    let n_move = Math.ceil(options.max_parts / 2);
    let n_work = 0;
    return returnbody(n_work, n_carry, n_move);
}
const getbody_externalcarrier = (options: any): BodyPartConstant[] => {
    if (options.n_work !== undefined && options.n_carry !== undefined && options.n_move !== undefined) {
        return returnbody(options.n_work, options.n_carry, options.n_move)
    }
    var carry_affordable = Math.floor(options.max_energy / 100)
    var n_carry = Math.min(options.max_parts, carry_affordable);
    return returnbody(0, n_carry, n_carry);
}
const getbody_reserver = (options: any): BodyPartConstant[] => {
    let n_parts = Math.min(options.max_parts, Math.floor(options.max_energy / 650));
    let bodyinfo: type_body_components = {
        "move": n_parts,
        "claim": n_parts,
    };
    return fullreturnbody(bodyinfo);
}
const getbody_preclaimer = (options: any): BodyPartConstant[] => {
    let bodyinfo: type_body_components = {
        "move": 20,
		"attack": 2,
        "claim": 8,
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
    [key in type_creep_role] ? : {
        (options: any): BodyPartConstant[]
    };
};
const getbody_list: type_getbody = {
    'harvester': getbody_harvester,
    'mineharvester': getbody_mineharvester,
    'carrier': getbody_carrier,
    'maincarrier': getbody_maincarrier,
    'minecarrier': getbody_minecarrier,
    'builder': getbody_builder,
    'upgrader': getbody_upgrader,
    'transferer': getbody_transferer,
    'wall_repairer': getbody_wall_repairer,
    'reserver': getbody_reserver,
    'preclaimer': getbody_preclaimer,
    'externalharvester': getbody_externalharvester,
    'externalcarrier': getbody_externalcarrier,
    'externalbuilder': getbody_externalbuilder,
    'help_harvester': getbody_help_harvester,
    'help_carrier': getbody_help_carrier,
    'help_builder': getbody_help_builder,
	'energy_carrier': getbody_energy_carrier,
	'guard': getbody_guard,
    'defender': getbody_defender,
    'invader_core_attacker': getbody_invader_core_attacker,
    'home_defender': getbody_home_defender,
}

export function get_cost(body: BodyPartConstant[]): number {
    return mymath.array_sum(body.map((e) => BODYPART_COST[e]));
}

export function get_nbody(creeps: Creep[], bodyname: BodyPartConstant): number {
    if (creeps.length == 0) {
        return 0;
    }
    let timer = new Timer("get_nbody", false);
    let n = mymath.array_sum(creeps.map((creep) => creep.body.filter((e) => e.type == bodyname).length));
    timer.end();
    return n;
}
export function prepare_role(rolename: type_creep_role, energy: number, added_memory: CreepMemory, options: any, added_json: {
    priority: number,
    require_full: boolean
}) {
    let creepname = rolename + Game.time;
    let body = getbody_list[rolename](options);
    let cost = get_cost(body);
    let affordable = (cost <= energy);
    let memory: any = {
        role: rolename
    };
    if (added_memory !== null) {
        for (let key of < Array < keyof CreepMemory >> Object.keys(added_memory)) {
            memory[key] = added_memory[key];
        }
    }
    let json: type_spawn_json = {
        rolename: rolename,
        creepname: creepname,
        body: body,
        cost: cost,
        memory: memory,
        affordable: affordable
    }
    for (let key of < Array < keyof typeof added_json >> Object.keys(added_json)) {
        json[key] = added_json[key];
    }
    return json;
}

export function get_spawn_energy_structures(room_name: string): SpawnOptions {
    if (Game.powered_rooms[room_name] !== undefined) {
        let room = Game.rooms[room_name];
        let all_spawns = < Array < StructureExtension | StructureSpawn >> global.memory[room_name].spawn_list.map((e) => Game.getObjectById(e));
        let all_exts = < Array < StructureExtension | StructureSpawn >> room.find(FIND_STRUCTURES).filter((e) => e.structureType == 'extension');
        return {
            energyStructures: all_exts.concat(all_spawns)
        };
    } else {
        return {};
    }
}

export function spawn_json(room_name: string, json: type_spawn_json) {
    // 0: success, 1: fail
    let room = Game.rooms[room_name];
    let spawns = global.memory[room_name].spawn_list.map((e) => Game.getObjectById(e));
    if (Memory.debug_mode) {
        console.log("Spawning " + json.rolename);
    }
    if (room.energyAvailable < json.cost) {
        return 1;
    }
    for (let spawn of spawns) {
        if (spawn.memory.spawning_time < 0) {
            continue;
        }
        let options: SpawnOptions = {
            memory: json.memory
        }
        options = {
            ...options,
            ...get_spawn_energy_structures(room_name)
        };
        let out = spawn.spawnCreep(json.body, json.creepname, options);
        return out;
    }
    return 1;
}

export function spawn_jsons(room_name: string, jsons: type_spawn_json[]) {
    // 0: success, 1: fail
    let room = Game.rooms[room_name];
    if (room.energyAvailable < mymath.array_sum(jsons.map((e) => e.cost))) {
        return 1;
    }
    let spawns = global.memory[room_name].spawn_list.map((e) => Game.getObjectById(e));
    let available_spawns = spawns.filter((e) => e.memory.spawning_time >= 0);
    if (available_spawns.length < jsons.length) {
        return 1;
    }
    for (let i of mymath.range(jsons.length)) {
        let json = jsons[i];
        let options: SpawnOptions = {
            memory: json.memory
        }
        options = {
            ...options,
            ...get_spawn_energy_structures(room_name)
        };
        spawns[i].spawnCreep(json.body, json.creepname, options);
    }
    return 0;
}

for (var name in config.defender_responsible_types) {
    config.defender_responsible_types[name].cost = get_cost(fullreturnbody(config.defender_responsible_types[name].body));
}

global.spawn_in_queue = function(room_name: string, body: BodyPartConstant[], name: string, memory: CreepMemory = {}, first = false): number {
    // 0: success, 1: name exists, 2: wrong body
    if (Game.creeps[name] !== undefined) {
        return 1;
    }
    if (body.length > 50) {
        console.log(`Warning: trying to spawn a creep with more than 50 body in room ${room_name} with creep name ${name} at time ${Game.time}`);
        return 2;
    }
    let room = Game.rooms[room_name];
    let obj: type_additional_spawn = {
        "name": name,
        "body": body,
        "memory": memory,
    }
    if (room.memory.additional_spawn_queue == undefined) {
        room.memory.additional_spawn_queue = {
            "first": [],
            "last": []
        };
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

global.get_body = function(components: type_body_components): BodyPartConstant[] {
    let body: BodyPartConstant[] = [];
    for (let part of [TOUGH, WORK, CARRY, ATTACK, RANGED_ATTACK, MOVE, HEAL, CLAIM]) {
        if (components[part] !== undefined) {
            mymath.range(components[part]).forEach((e) => body.push(part));
        }
    }
    return body;
}
