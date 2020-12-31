import * as _ from "lodash";
import * as mymath from "./mymath";

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
const getbody_external_init = () => {
    return returnbody(2, 2, 2);
}
const getbody_hunter = (options: any): BodyPartConstant[] => {
    return fullreturnbody(options.body);
}
const getbody_defender = (options: any): BodyPartConstant[] => {
    var bodyinfo = Memory.defender_responsible_types[options.defender_type].body;
    return fullreturnbody(bodyinfo);
}
const getbody_invader_core_attacker = (options: any): BodyPartConstant[] => {
    var bodyinfo = {
        "move": 5,
        "attack": 10
    };
    return fullreturnbody(bodyinfo);
}
const getbody_harvester = (options: any): BodyPartConstant[] => {
    if (options.link_mode) {
        return returnbody(5, 1, 1);
    } else {
        return returnbody(5, 0, 1);
    }
}
const getbody_mineharvester = (options: any): BodyPartConstant[] => {
    return returnbody(20, 0, 5);
}
const getbody_externalharvester = (options: any): BodyPartConstant[] => {
    if (options.reserve) {
        var n_work = 5;
        var n_move = 3;
    } else {
        var n_work = 3;
        var n_move = 2;
    }
    var n_carry = options.n_carry;
    return returnbody(n_work, n_carry, n_move);
}
const getbody_upgrader = (options: any): BodyPartConstant[] => {
    if (options.max_energy >= 1200) {
        return returnbody(10, 2, 2);
    } else if (options.max_energy >= 600) {
        return returnbody(5, 1, 1);
    } else {
        return returnbody(4, 1, 1);
    }
}
const getbody_builder = (options: any): BodyPartConstant[] => {
    let n_carry = Math.min(options.max_parts, Math.floor(options.max_energy / 200));
    let n_move = n_carry;
    let n_work = n_carry;
    return returnbody(n_work, n_carry, n_move);
}
const getbody_carrier = (options: any): BodyPartConstant[] => {
    let n_carry = Math.floor(options.max_energy / 150) * 2;
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
    let n_carry = 4;
    let n_move = 2;
    let n_work = 0;
    return returnbody(n_work, n_carry, n_move);
}
const getbody_maincarrier = (options: any): BodyPartConstant[] => {
    let n_carry = options.max_parts;
    let n_move = 1;
    let n_work = 0;
    return returnbody(n_work, n_carry, n_move);
}
const getbody_externalcarrier = (options: any): BodyPartConstant[] => {
    return returnbody(0, options.n_carry, options.n_carry);
}
const getbody_reserver = (options: any): BodyPartConstant[] => {
    return [CLAIM, MOVE]
}
const getbody_transferer = (options: any): BodyPartConstant[] => {
    let n_work = 0;
    let n_carry = options.max_parts;
    let n_move = Math.ceil(n_carry / 2);
    return returnbody(n_work, n_carry, n_move);
}
interface type_getbody {
    [key: string]: {
        (options: any): BodyPartConstant[]
    };
};
const getbody_list: type_getbody = {
    'external_init': getbody_external_init,
    'harvester': getbody_harvester,
    'mineharvester': getbody_mineharvester,
    'externalharvester': getbody_externalharvester,
    'carrier': getbody_carrier,
    'externalcarrier': getbody_externalcarrier,
    'maincarrier': getbody_maincarrier,
    'specialcarrier': getbody_specialcarrier,
    'reserver': getbody_reserver,
    'builder': getbody_builder,
    'upgrader': getbody_upgrader,
    'transferer': getbody_transferer,
	'hunter': getbody_hunter,
	'defender': getbody_defender,
	'invader_core_attacker': getbody_invader_core_attacker,
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
