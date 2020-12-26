import * as _ from "lodash";
import * as mymath from "./mymath";

function returnbody(n_work: number, n_carry: number, n_move: number): BodyPartConstant[] {
    var body: BodyPartConstant[] = [];
    for (var i = 0; i < n_work; ++i) {
        body.push(WORK)
    }
    for (var i = 0; i < n_carry; ++i) {
        body.push(CARRY)
    }
    for (var i = 0; i < n_move; ++i) {
        body.push(MOVE)
    }
    return body;
}
const getbody_external_init = () => {
    return returnbody(2, 2, 2);
}
const getbody_defender = (options: any): BodyPartConstant[] => {
    if (options.name == 'small_close') {
        return [TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, HEAL] // 740
    } else if (options.name == 'big_close') {
        return [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, HEAL] // 1010
    } else if (options.name == 'small_far') {
        return [TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, HEAL] // 940
    } else if (options.name == 'big_far') {
        return [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, HEAL] // 1290
    }
}
const getbody_harvester = (options: any): BodyPartConstant[] => {
    if (options.link_mode) {
        return returnbody(5, 1, 1);
    } else {
        return returnbody(5, 0, 1);
    }
}
const getbody_mineharvester = (options: any): BodyPartConstant[] => {
    if (options.max_parts > 7) {
        return returnbody(options.max_parts, 0, 2);
    } else {
        return returnbody(options.max_parts, 0, 1);
    }
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
const getbody_externalcarrier = (options: any): BodyPartConstant[] => {
    return returnbody(0, options.n_carry, options.n_carry);
}
const getbody_reserver = (options: any): BodyPartConstant[] => {
    return [CLAIM, MOVE]
}
const getbody_transferer = (options: any): BodyPartConstant[] => {
    return returnbody(0, 4, 2);
}
const get_cost = (body: BodyPartConstant[]): number => {
    let n_work = body.filter((e) => e == 'work').length;
    let n_carry = body.filter((e) => e == 'carry').length;
    let n_move = body.filter((e) => e == 'move').length;
    let n_claim = body.filter((e) => e == 'claim').length;
    let n_attack = body.filter((e) => e == 'attack').length;
    let n_tough = body.filter((e) => e == 'tough').length;
    let n_heal = body.filter((e) => e == 'heal').length;
    return n_work * 100 + n_carry * 50 + n_move * 50 + n_claim * 600 + n_attack * 80 + n_tough * 10 + n_heal * 250;
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
    'reserver': getbody_reserver,
    'builder': getbody_builder,
    'upgrader': getbody_upgrader,
    'transferer': getbody_transferer
}

export function get_nbody(creeps: Creep[], bodyname: BodyPartConstant): number {
    if (creeps.length == 0) {
        return 0;
    }
    let n = mymath.array_sum(creeps.map((creep) => creep.body.filter((e) => e.type == bodyname).length));
    return n;
}
export function prepare_role(rolename: string, energy: number, added_memory: any, options: any, added_json: any) {
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

export function spawn_json(spawn: StructureSpawn, json: type_spawn_json) {
    if (Memory.debug_mode) {
        console.log("Spawning " + json.rolename);
    }
    if (spawn.memory.spawning_time < 0) {
        return;
    }
    spawn.spawnCreep(json.body, json.creepname, {
        memory: json.memory
    });
}
