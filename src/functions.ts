//screeps
import * as mymath from "./mymath"
import * as config from "./config"
import {
    Timer
} from "./timer"

export function signed_number(num: number, sign: number): number {
    if (sign == 1) {
        return num + 1;
    } else {
        return 0 - num;
    }
}
export function room2coor(room: string): number[] {
    let pos = []
    let sign = []
    let str = room;
    let split;
    if (room.includes('E')) {
        sign.push(1)
        split = str.split('E')
        str = split[1]
    }
    if (room.includes('W')) {
        sign.push(-1)
        split = str.split('W')
        str = split[1]
    }
    if (room.includes('N')) {
        sign.push(-1)
        split = str.split('N')
    }
    if (room.includes('S')) {
        sign.push(1)
        split = str.split('S')
    }
    pos.push(parseInt(split[0]))
    pos.push(parseInt(split[1]))
    return [signed_number(pos[0], sign[0]), signed_number(pos[1], sign[1])];
}

export function avoid_exits(room_name: string, costMatrix: CostMatrix) {
    for (let i = 0; i < 50; i++) {
        costMatrix.set(0, i, 255);
        costMatrix.set(49, i, 255);
        costMatrix.set(i, 49, 255);
        costMatrix.set(i, 0, 255);
    }
}

export function restrict_passing_rooms(room_name: string): CostMatrix {
    let costMatrix = new PathFinder.CostMatrix;
    let coor = room2coor(room_name);
    let is_highway = false;
    for (let value of coor) {
        if (value > 0) {
            if (value % 10 == 1) {
                is_highway = true;
            }
        } else {
            if (-value % 10 == 0) {
                is_highway = true;
            }
        }
    }
    if (is_highway || config.controlled_rooms.includes(room_name) || config.allowed_passing_rooms.includes(room_name)) {
        return costMatrix;
    } else {
        for (let i = 0; i < 50; i++) {
            costMatrix.set(1, i, 255);
            costMatrix.set(48, i, 255);
            costMatrix.set(i, 48, 255);
            costMatrix.set(i, 1, 255);
        }
        return costMatrix;
    }
}

global.restrict_passing_rooms = restrict_passing_rooms;

export function tower_damage(dis: number): number {
    if (dis < 5) {
        return 600;
    } else if (dis > 20) {
        return 150;
    } else {
        return 3000 / dis;
    }
}

export function find_hostile(room: Room): Creep[] {
    if (room.memory.military_exercise) {
        return room.find(FIND_MY_CREEPS).filter((e) => e.memory.role == 'enemy');
    } else {
        return room.find(FIND_HOSTILE_CREEPS);
    }
}

export function get_invader_costmatrix(room_name: string, damage_threshold: number): CostMatrix {
    let timer = new Timer("get_invader_costmatrix", false);

	let room = Game.rooms[room_name];
	let costmatrix = new PathFinder.CostMatrix;
	let terrain = new Room.Terrain(room_name);
	let towers = <Array<StructureTower>>room.find(FIND_STRUCTURES).filter((e) => e.structureType == 'tower');
	let n_towers = towers.length;
	for (let i = 0; i < 50; i++) {
		for (let j = 0; j < 50; j++) {
			if (mymath.array_sum(towers.map((e) => tower_damage(e.pos.getRangeTo(i, j)))) > damage_threshold) {
				costmatrix.set(i, j, 255);
			}
		}
    }
	let structures = room.find(FIND_STRUCTURES);
	//structures.filter((e) => e.structureType == 'road').forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 1));
	structures.filter((e) => !(['road', 'container'].includes(e.structureType))).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
    timer.end();
    return costmatrix;
}

export function get_basic_costmatrices(room_name: string, safe_level: 0 | 1 | 2) {
    let timer = new Timer("get_basic_costmatrices", false);

    if (global.basic_costmatrices == undefined) {
        global.basic_costmatrices = {};
    }
    if (global.basic_costmatrices_safe == undefined) {
        global.basic_costmatrices_safe = {};
    }
    if (global.basic_costmatrices_defense == undefined) {
        global.basic_costmatrices_defense = {};
    }
    let basic_costmatrices: type_costmatrices;
    if (safe_level == 0) {
        basic_costmatrices = global.basic_costmatrices;
    } else if (safe_level == 1) {
        basic_costmatrices = global.basic_costmatrices_safe;
    } else if (safe_level == 2) {
        basic_costmatrices = global.basic_costmatrices_defense;
    }
    if (basic_costmatrices[room_name] == undefined || Game.rooms[room_name].memory.objects_updated) {
        let costmatrix = new PathFinder.CostMatrix;
        let terrain = new Room.Terrain(room_name);
        if (Game.rooms[room_name] !== undefined) {
            let room = Game.rooms[room_name];
            let structures = room.find(FIND_STRUCTURES);
            let sites = room.find(FIND_MY_CONSTRUCTION_SITES);
            structures.filter((e) => e.structureType == 'road').forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 1));
            structures.filter((e) => !(['road', 'container', 'rampart'].includes(e.structureType))).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
            sites.filter((e) => !(['road', 'container', 'rampart'].includes(e.structureType))).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
            structures.filter((e) => e.structureType == 'rampart' && e.owner.username !== config.username).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
        }
        if (safe_level == 1) {
            let boundaries = config.conf_rooms[room_name].safe_boundary;
            boundaries.forEach((e) => costmatrix.set(e[0], e[1], 255));
        } else if (safe_level == 2) {
            let boundaries = config.conf_rooms[room_name].defense_boundary;
            boundaries.forEach((e) => costmatrix.set(e[0], e[1], 255));
        }
        basic_costmatrices[room_name] = costmatrix.clone();
    }
    timer.end();
    return basic_costmatrices[room_name].clone()
}
export function get_costmatrix_road(room_name: string, safe_level: 0 | 1 | 2 = 0): CostMatrix {
    let timer = new Timer("get_costmatrix_road", false);

    if (Game.costmatrices == undefined) {
        Game.costmatrices = {};
    }
    if (Game.costmatrices_safe == undefined) {
        Game.costmatrices_safe = {};
    }
    if (Game.costmatrices_defense == undefined) {
        Game.costmatrices_defense = {};
    }
    let costmatrices: type_costmatrices;
    if (safe_level == 0) {
        costmatrices = Game.costmatrices;
    } else if (safe_level == 1) {
        costmatrices = Game.costmatrices_safe;
    } else if (safe_level == 2) {
        costmatrices = Game.costmatrices_defense;
    }
    if (costmatrices[room_name] == undefined) {
        let costmatrix = get_basic_costmatrices(room_name, safe_level);
        if (Game.rooms[room_name] !== undefined) {
            let room = Game.rooms[room_name];
            let mycreeps = room.find(FIND_MY_CREEPS);
            let mypcs = room.find(FIND_MY_POWER_CREEPS);
            mycreeps.filter((e) => !e.memory.movable && !e.memory.crossable).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
            mypcs.filter((e) => !e.memory.movable && !e.memory.crossable).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
            let hostilecreeps = find_hostile(room);
            hostilecreeps.forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
            if (config.conf_rooms[room_name] !== undefined) {
                for (let xy of config.conf_rooms[room_name].maincarrier.working_zone) {
                    costmatrix.set(xy[0], xy[1], 255);
                }
            }
            costmatrices[room_name] = costmatrix.clone();
        } else {
            costmatrices[room_name] = costmatrix.clone();
        }
    }
    timer.end();
    return costmatrices[room_name];
}

export function analyze_component(creep: Creep): type_creep_components {
    var bodynames = creep.body.map((e) => e.type);
    var n_work = mymath.where(bodynames.map((e) => e == WORK)).length;
    var n_move = mymath.where(bodynames.map((e) => e == MOVE)).length;
    var n_carry = mymath.where(bodynames.map((e) => e == CARRY)).length;
    var n_attack = mymath.where(bodynames.map((e) => e == ATTACK)).length;
    var n_rangedattack = mymath.where(bodynames.map((e) => e == RANGED_ATTACK)).length;
    var n_heal = mymath.where(bodynames.map((e) => e == HEAL)).length;
    return {
        n_work: n_work,
        n_move: n_move,
        n_carry: n_carry,
        n_attack: n_attack,
        n_rangedattack: n_rangedattack,
        n_heal: n_heal
    };
}

global.visualize_cost = function(room_name: string, x_center: number, y_center: number, range: number): number {
    let cost = get_costmatrix_road(room_name);
    for (let x = x_center - range; x <= x_center + range; x++) {
        for (let y = y_center - range; y <= y_center + range; y++) {
            Game.rooms[room_name].visual.text(cost.get(x, y).toString(), x, y);
        }
    }
    return 0;
}

export function is_boost_resource_enough(resource: ResourceConstant, n_boost_parts: number) {
    let expected_amount = (n_boost_parts * 30 + config.resources_balance[resource].gap) * (config.controlled_rooms.length - 1) + n_boost_parts * 2;
    return global.terminal_store[resource] >= expected_amount;
}

function arrange_string(str: string, length: number): string {
    return ' '.repeat(Math.max(length - str.length, 0)) + str;
}

function obj2string(obj: any) {
    if (isNaN(obj)) {
        return obj;
    } else if (Number.isInteger(obj)) {
        return obj.toString();
    } else {
        return obj.toFixed(3);
    }
}

global.format_objs = function(objs: any[]): string {
    let str = '\n'
	if (objs.length == 0) {
		return str;
	}
    let keys = Object.keys(objs[0]);
    let lengths: {[key: string]: number} = {};
    for (let key of keys) {
        lengths[key] = mymath.max(objs.map((e) => obj2string(e[key]).length))
        lengths[key] = Math.max(lengths[key], key.length) + 2;
    }
    for (let key of keys) {
        str += arrange_string(key, lengths[key]);
    }
    for (let obj of objs) {
        str += '\n'
        for (let key of keys) {
            str += arrange_string(obj2string(obj[key]), lengths[key])
        }
    }
    return str;
}
