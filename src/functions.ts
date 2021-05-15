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
export function room2coor(room: string): [number, number] {
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

export function coordiff_to_exitconstant(coor_diff: [number, number]): ExitConstant {
	if (coor_diff[0] == 0) {
		if (coor_diff[1] == 1) {
			return FIND_EXIT_BOTTOM
		} else {
			return FIND_EXIT_TOP
		}
	}
	else {
		if (coor_diff[0] == 1) {
			return FIND_EXIT_RIGHT
		} else {
			return FIND_EXIT_LEFT
		}
	}
}

var exitconstant_to_pos: {[key in ExitConstant]: [number, number]} = {
	[FIND_EXIT_BOTTOM]: [0, 0],
	[FIND_EXIT_TOP]: [0, 1],
	[FIND_EXIT_RIGHT]: [1, 0],
	[FIND_EXIT_LEFT]: [1, 1],
}

export function get_exit_xy(coor_diff: [number, number], pos: number, poses: [number, number]){
	let [pos_index, poses_index] = exitconstant_to_pos[coordiff_to_exitconstant(coor_diff)];
	let exit_xy: [number, number] = [undefined, undefined];
	exit_xy[pos_index] = pos;
	exit_xy[1-pos_index] = poses[poses_index];
	return exit_xy;
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
    if (basic_costmatrices[room_name] == undefined || Game.rooms[room_name].memory.objects_updated || Game.time % 200 == 0) {
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

export function is_single_boost_resource_enough(resource: ResourceConstant, n_boost_parts: number) {
    let expected_amount = (n_boost_parts * 30 + config.resources_balance[resource].gap) * (config.controlled_rooms.length - 1) + n_boost_parts * 2;
    return global.terminal_store[resource] >= expected_amount;
}

export function is_boost_resource_enough(request: type_body_conf): boolean {
	let parts = <Array<BodyPartConstant>> Object.keys(request);
	return mymath.all(parts.filter((e) => request[e].boost !== undefined).map((e) => is_single_boost_resource_enough(request[e].boost, request[e].number)));
}

function arrange_string(str: string, length: number): string {
    return ' '.repeat(Math.max(length - str.length, 0)) + str;
}

function obj2string(obj: any, json: boolean) {
	if (obj == undefined) {
		return 'undefined';
	} else if (typeof obj == 'object') {
		if (json) {
			return JSON.stringify(obj)
		} else {
			return obj.toString()
		}
	} else if (typeof obj == 'string') {
        return obj;
    } else if (typeof obj == 'number' && !Number.isInteger(obj)) {
        return obj.toFixed(3);
    } else {
        return obj.toString();
    }
}

global.format_objs = function(objs: any[], json: boolean = false): string {
    let str = '\n'	
	if (objs.length == 0) {
		return str;
	}
    let keys = Object.keys(objs[0]);
    let lengths: {[key: string]: number} = {};
    for (let key of keys) {
        lengths[key] = mymath.max(objs.map((e) => obj2string(e[key], json).length))
        lengths[key] = Math.max(lengths[key], key.length) + 2;
    }
    for (let key of keys) {
        str += arrange_string(key, lengths[key]);
    }
    for (let obj of objs) {
        str += '\n'
        for (let key of keys) {
            str += arrange_string(obj2string(obj[key], json), lengths[key])
        }
    }
    return str;
}

global.format_json = function(obj: any, json: boolean = false): string {
	let arr: any[] = [];
	for (let key of Object.keys(obj)) {
		let item: any = {...{keyname: key}, ...{value: obj[key]}};
		arr.push(item);
	}
	return global.format_objs(arr, json);
}

global.format_json2 = function(obj: any, json: boolean = false): string {
	let arr: any[] = [];
	for (let key of Object.keys(obj)) {
		let item: any = {...{keyname: key}, ...(_.clone(obj[key]))};
		arr.push(item);
	}
	return global.format_objs(arr, json);
}

export function send_resource(room_from: string, room_to: string, resource: ResourceConstant, amount: number) {
	// -1: terminal not existing or cooling down, 0: successful, 1: other sending already requested, 2: sending fail
	let terminal = Game.rooms[room_from].terminal;
	if (terminal == undefined || terminal.cooldown > 0) {
		return -1;
	}
	if (Game.memory[room_from].terminal_send_requested) {
		return 1;
	}
	let out = terminal.send(resource, amount, room_to);
	if (out == 0) {
		console.log("Sending", amount.toString(), resource, "from", room_from, "to", room_to)
		Game.memory[room_from].terminal_send_requested = true;
		return 0;
	}
	return 2;
}

export function conf_body_to_boost_request(conf: type_body_conf): type_creep_boost_request {
	let result: type_creep_boost_request = {};
	for (let part of <Array<BodyPartConstant>> Object.keys(conf)) {
		result[part] = conf[part].boost;
	}
	return result;
}

export function conf_body_to_body_components(conf: type_body_conf): type_body_components {
	let result: type_body_components = {};
	for (let part of <Array<BodyPartConstant>> Object.keys(conf)) {
		result[part] = conf[part].number;
	}
	return result;
}

global.init_stat = function(): number {
	global.reset_market_stat();
	Memory.reaction_log = {};
	Memory.pb_log = {}
	Memory.stat_reset_time = Game.time;
	Memory.tot_transaction_cost = 0;
	Memory.power_processed_stat = 0;
	Memory.op_power_processed_stat = 0;
	return 0;
}

global.display_stat = function(): string {
	let str:string = '';
	str += `\nstat from ${Memory.stat_reset_time} to ${Game.time}, ${Game.time - Memory.stat_reset_time} in total\n`;
	str += '\nselling stat' + global.format_json2(Memory.market_accumulation_stat.sell, true);
	str += '\nbuying stat' + global.format_json2(Memory.market_accumulation_stat.buy, true);
	str += '\npb stat' + global.format_json2(Memory.pb_log, true);
	str += '\nreaction stat' + global.format_json(Memory.reaction_log, true);
	str += '\ntransaction cost: ' + Memory.tot_transaction_cost.toString();
	str += '\npower processed: ' + Memory.power_processed_stat.toString();
	str += '\nop power processed: ' + Memory.op_power_processed_stat.toString();
	return str;
}

export function is_pos_reachable(pos: RoomPosition): boolean {
	let structures = pos.lookFor("structure");
	if (structures.filter((e) => !['road', 'container', 'rampart'].includes(e.structureType) || (e.structureType == 'rampart' && !(<StructureRampart>e).my)).length > 0) {
		return false;
	}
	let sites = pos.lookFor("constructionSite");
	if (sites.filter((e) => e.my && !(['road', 'container', 'rampart'].includes(e.structureType))).length > 0) {
		return false;
	}
	/*
	let creeps = pos.lookFor("creep");
	if (creeps.filter((e) => my_creep_ok && e.my).length > 0) {
		return false;
	}
	let powercreeps = pos.lookFor("powerCreep");
	if (powercreeps.filter((e) => my_creep_ok && e.my).length > 0) {
		return false;
	}
	*/
	return true;
}
export function is_pathfinding_complete(creep: Creep | PowerCreep, range: number): boolean {
	let creep_move = creep.memory._move;
	if (creep_move == undefined) {
		return undefined;
	}
	let path = Room.deserializePath(creep_move.path);
	let last_pos;
	if (path.length > 0) {
		let last = path.slice(-1)[0];
		last_pos = creep.room.getPositionAt(last.x, last.y);
		if (!is_pos_reachable(last_pos)) {
			return false;
		}
	} else {
		last_pos = creep.pos;
	}
	let dest_pos = creep.room.getPositionAt(creep_move.dest.x, creep_move.dest.y);
	return dest_pos.getRangeTo(last_pos) <= range;
}

global.spawn_PC = function (name: string): number {
	let pc = Game.powerCreeps[name];
	let pc_conf = config.pc_conf[name]
	if (pc_conf == undefined || pc == undefined) {
		return 1;
	}
	let room = Game.rooms[pc_conf.room_name];
	let powerspawn_status = global.memory[room.name].unique_structures_status.powerSpawn;
	let powerspawn = Game.getObjectById(powerspawn_status.id);
	if (powerspawn == undefined) {
		return 2;
	}
	return pc.spawn(powerspawn);
}
