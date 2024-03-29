//screeps
import * as mymath from "./mymath"
import * as config from "./config"
import {
    Timer
} from "./timer"

export function sort_str(s1: string, s2: string): number {
       let s1_upper = (s1[0] == s1[0].toUpperCase());
       let s2_upper = (s2[0] == s2[0].toUpperCase());
       if (s1_upper !== s2_upper) {
               return s1_upper ? -1 : 1;
       }
    if (s1.length !== s2.length) {
        return s1.length - s2.length;
    }
    if (s1 > s2) {
        return 1;
    } else {
        return -1;
    }
}

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
    } else {
        if (coor_diff[0] == 1) {
            return FIND_EXIT_RIGHT
        } else {
            return FIND_EXIT_LEFT
        }
    }
}

var exitconstant_to_pos: {
    [key in ExitConstant]: [number, number]
} = {
    [FIND_EXIT_BOTTOM]: [0, 0],
    [FIND_EXIT_TOP]: [0, 1],
    [FIND_EXIT_RIGHT]: [1, 0],
    [FIND_EXIT_LEFT]: [1, 1],
}

export function get_exit_xy(coor_diff: [number, number], pos: number, poses: [number, number]) {
    let [pos_index, poses_index] = exitconstant_to_pos[coordiff_to_exitconstant(coor_diff)];
    let exit_xy: [number, number] = [undefined, undefined];
    exit_xy[pos_index] = pos;
    exit_xy[1 - pos_index] = poses[poses_index];
    return exit_xy;
}

export function avoid_exits(room_name: string, costMatrix: CostMatrix) {
    let timer = new Timer("avoid_exits", false);
    for (let i = 0; i < 50; i++) {
        costMatrix.set(0, i, 255);
        costMatrix.set(49, i, 255);
        costMatrix.set(i, 49, 255);
        costMatrix.set(i, 0, 255);
    }
    timer.end();
}

export function ignore_objects(costMatrix: CostMatrix, poses: RoomPosition[]) {
	for (let pos of poses) {
		costMatrix.set(pos.x, pos.y, 0);
	}
}

export function tower_damage(dis: number): number {
    if (dis < 5) {
        return 600;
    } else if (dis > 20) {
        return 150;
    } else {
        return 750 - dis * 30
    }
}

export function find_hostile(room: Room): Creep[] {
    if (room.memory.military_exercise) {
        return room.find(FIND_MY_CREEPS).filter((e) => e.memory.role == 'enemy');
    } else {
        return room.find(FIND_HOSTILE_CREEPS);
    }
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

export function is_single_boost_resource_enough(room_name: string, resource: ResourceConstant, n_boost_parts: number) {
    return Game.rooms[room_name].terminal.store.getUsedCapacity(resource) >= n_boost_parts * 30;
}

export function is_boost_resource_enough(room_name: string, request: type_body_conf): boolean {
    let parts = < Array < BodyPartConstant >> Object.keys(request);
    return mymath.all(parts.filter((e) => request[e].boost !== undefined).map((e) => is_single_boost_resource_enough(room_name, request[e].boost, request[e].number)));
}

export function send_resource(room_from: string, room_to: string, resource: ResourceConstant, amount: number) {
    // -1: terminal not existing or cooling down, -2: filling reactants, 0: successful, 1: other sending already requested, 2: sending fail
    let terminal = Game.rooms[room_from].terminal;
    if (terminal == undefined || terminal.cooldown > 0) {
        return -1;
    }
    if (Game.memory[room_from].terminal_send_requested) {
        return 1;
    }
    if (Game.rooms[room_from].memory.reaction_request !== undefined && Game.rooms[room_from].memory.reaction_request.status == 'fill') {
        return -2;
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
    for (let part of < Array < BodyPartConstant >> Object.keys(conf)) {
        if (conf[part].boost !== undefined) {
            result[part] = conf[part].boost;
        }
    }
    return result;
}

export function boost_request_to_conf_body(creep: Creep, request: type_creep_boost_request): type_body_conf {
    let result: type_body_conf = {};
    for (let part of < Array < BodyPartConstant >> Object.keys(BODYPART_COST)) {
        result[part] = {
            number: creep.getActiveBodyparts(part),
            boost: request[part],
        }
        if (request[part] !== undefined) {
            result[part].boost = request[part];
        }
    }
    return result;
}

export function conf_body_to_body_components(conf: type_body_conf): type_body_components {
    let result: type_body_components = {};
    for (let part of < Array < BodyPartConstant >> Object.keys(conf)) {
        result[part] = conf[part].number;
    }
    return result;
}

export function is_pos_reachable(pos: RoomPosition): boolean {
    let structures = pos.lookFor("structure");
    if (structures.filter((e) => !['road', 'container', 'rampart'].includes(e.structureType) || (e.structureType == 'rampart' && !( < StructureRampart > e).my)).length > 0) {
        return false;
    }
    let sites = pos.lookFor("constructionSite");
    if (sites.filter((e) => e.my && !(['road', 'container', 'rampart'].includes(e.structureType))).length > 0) {
        return false;
    }
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

export function get_exits_from_path(path: RoomPosition[], start_room: string) {
    let rooms_path: string[] = [start_room];
    let poses_path: number[] = [];
    for (let pos of path) {
        if (pos.roomName != rooms_path[rooms_path.length - 1]) {
            rooms_path.push(pos.roomName);
            if (pos.x == 0 || pos.x == 49) {
                poses_path.push(pos.y);
            }
            if (pos.y == 0 || pos.y == 49) {
                poses_path.push(pos.x);
            }
        }
    }
    return {
        rooms_path: rooms_path,
        poses_path: poses_path,
    }
}

export function copy_key(obj_A: any, obj_B: any, keys: string[], B_existance: boolean) {
    // true: key must exist, false: key must not exist, undefined: both are fine
    let lst: string[] = [];
    for (let key of keys) {
        if (obj_A[key] !== undefined) {
            let modify = true;
            if (obj_B[key] !== undefined) {
                if (B_existance == false) {
                    modify = false;
                }
            } else {
                if (B_existance == true) {
                    modify = false;
                }
            }
            if (modify) {
                obj_B[key] = obj_A[key]
                lst.push(key);
            }
        }
    }
    return lst;
}

export function get_total_resource_amount(room_name: string, resource: ResourceConstant, factory: boolean = false) {
    let room = Game.rooms[room_name];
	let amount = 0;
	if (room.storage !== undefined) {
		amount += room.storage.store.getUsedCapacity(resource);
	}
	if (room.terminal !== undefined) {
		amount += room.terminal.store.getUsedCapacity(resource);
	}
	if (factory && room.factory !== undefined) {
		amount += room.factory.store.getUsedCapacity(resource);
	}
	return amount;
}

export function creep_exists(creep_name: string, room_name: string, options: {filter ?: (creep: Creep) => boolean, search_shard ?: boolean} = {}): boolean {
	let creep = Game.creeps[creep_name];
    if (creep !== undefined) {
		if (creep.spawning) {
			return true;
		} else if (options.filter == undefined) {
			return true;
		} else if (options.filter(creep)) {
			return true;
		}
    }
    let spawning_list = Game.rooms[room_name].memory.additional_spawn_queue;
    if (spawning_list !== undefined) {
        if (spawning_list.first !== undefined && spawning_list.first.filter((e) => e.name == creep_name).length > 0) {
            return true;
        }
        if (spawning_list.last !== undefined && spawning_list.last.filter((e) => e.name == creep_name).length > 0) {
            return true;
        }
    }
	if (options.search_shard) {
		if (Game.InterShardMemory[Game.shard.name].all_creeps[creep_name] !== undefined) {
			return true;
		}
	}
    return false;
}

export function get_xys_with_fixed_range(pos: RoomPosition, range: number): [number, number][] {
    let x = pos.x;
    let y = pos.y;
    let xys: [number, number][] = [
        [x - range, y - range],
        [x - range, y + range],
        [x + range, y - range],
        [x + range, y + range]
    ];
    for (let d = -range + 1; d < range; d++) {
        xys.push([x - range, y + d]);
        xys.push([x + range, y + d]);
        xys.push([x - d, y - range]);
        xys.push([x + d, y + range]);
    }
    xys = xys.filter((e) => e[0] > 0 && e[1] > 0 && e[0] < 49 && e[1] < 49);
	return xys;
}
export function get_poses_with_fixed_range(pos: RoomPosition, range: number): RoomPosition[] {
	let xys = get_xys_with_fixed_range(pos, range)
    return xys.map((e) => new RoomPosition(e[0], e[1], pos.roomName));
}

export function get_xys_within_range(pos: RoomPosition, range: number): [number, number][] {
	let xmin = Math.max(0, pos.x - range);
	let xmax = Math.min(49, pos.x + range);
	let ymin = Math.max(0, pos.y - range);
	let ymax = Math.min(49, pos.y + range);
	let xys: [number, number][] = [];
	for (let x=xmin;x<=xmax;x++) {
		for (let y=ymin;y<=ymax;y++) {
			xys.push([x, y]);
		}
	}
	return xys
}

export function get_poses_within_range(pos: RoomPosition, range: number): RoomPosition[] {
	let xys = get_xys_within_range(pos, range);
    return xys.map((e) => new RoomPosition(e[0], e[1], pos.roomName));
}

export function can_use_cached_path(pos: RoomPosition, _move: type_creep_move, reuse_time: number) {
	if ( _move !== undefined && Game.time <= _move.time + reuse_time && pos.x == _move.dest.x && pos.y == _move.dest.y && pos.roomName == _move.dest.room) {
		return true;
	} else {
		return false;
	}
}

export function get_creep_invading_ability(creep: Creep): type_body_components {
    let result: type_body_components = {
        "work": 0,
        "move": 0,
        "attack": 0,
        "ranged_attack": 0,
        "heal": 0,
        "tough": 0,
    }
    for (let body of creep.body) {
        if (result[body.type] == undefined) {
            continue;
        }
        if (body.boost !== undefined) {
            let compound_letter_number = ( < string > body.boost).length;
            if (compound_letter_number == 2) {
                result[body.type] += 2;
            } else if (compound_letter_number == 4) {
                result[body.type] += 3;
            } else if (compound_letter_number == 5) {
                result[body.type] += 4;
            }
        } else {
            result[body.type] += 1;
        }
    }
    return result;
}

export function get_room_invading_ability(room_name: string): type_body_components {
    let result: type_body_components = {
        "work": 0,
        "move": 0,
        "attack": 0,
        "ranged_attack": 0,
        "heal": 0,
        "tough": 0,
    }
    let room = Game.rooms[room_name];
    let hostile_creeps = find_hostile(room);
    for (let hc of hostile_creeps) {
        if (hc.owner.username == 'Invader') {
            continue;
        }
        let ability = get_creep_invading_ability(hc);
        for (let body in result) {
            result[ < BodyPartConstant > body] += ability[ < BodyPartConstant > body];
        }
    }
    return result;
}

export function get_first_resource_type(store: GeneralStore): ResourceConstant {
	return <ResourceConstant> Object.keys(store)[0]
}

export function get_shard_room(shard: type_main_shards, room_name: string): type_shard_room {
	return <type_shard_room>(shard + '_' + room_name);
}

export function split_shard_room(shard_room: type_shard_room): {shard: type_main_shards, room_name: string} {
	let splits = shard_room.split('_');
	return {
		shard: <type_main_shards> splits[0],
		room_name: splits[1],
	}
}

global.spawn_PC = function(name: string): number {
    let pc = Game.powerCreeps[name];
    let pc_conf = config.pc_conf[name]
    if (pc_conf == undefined || pc == undefined) {
        return 1;
    }
    let room = Game.rooms[pc_conf.room_name];
    if (room.powerSpawn == undefined) {
        return 2;
    }
    return pc.spawn(room.powerSpawn);
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
    if (is_highway || Game.controlled_rooms.includes(room_name) || config.allowed_passing_rooms.includes(room_name)) {
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

export function get_invader_costmatrix(room_name: string, damage_threshold: number): CostMatrix {
    let timer = new Timer("get_invader_costmatrix", false);
    let room = Game.rooms[room_name];
    let costmatrix = new PathFinder.CostMatrix;
    let terrain = new Room.Terrain(room_name);
    let towers = < Array < StructureTower >> room.find(FIND_STRUCTURES).filter((e) => e.structureType == 'tower');
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

export function construct_elementary_costmatrix(room_name: string, costmatrix: CostMatrix = undefined) {
    let timer = new Timer("construct_elementary_costmatrix", false);
	if (costmatrix == undefined) {
		costmatrix = new PathFinder.CostMatrix;
	}
	let terrain = new Room.Terrain(room_name);
	let room = Game.rooms[room_name];
	let structures = room.find(FIND_STRUCTURES);
	let sites = room.find(FIND_MY_CONSTRUCTION_SITES);
	structures.filter((e) => e.structureType == 'road').forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 1));
	structures.filter((e) => !(['road', 'container', 'rampart'].includes(e.structureType))).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
	sites.filter((e) => !(['road', 'container', 'rampart'].includes(e.structureType))).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
	structures.filter((e) => e.structureType == 'rampart' && e.owner.username !== config.username).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
	for (let i=0; i<50; i++) {
		costmatrix.set(i, 0, 255);
		costmatrix.set(i, 49, 255);
		costmatrix.set(0, i, 255);
		costmatrix.set(49, i, 255);
	}
	timer.end()
	return costmatrix;
}

export function update_basic_costmatrices() {
    if (global.basic_costmatrices == undefined) {
        global.basic_costmatrices = {};
        global.basic_costmatrices_safe = {};
        global.basic_costmatrices_defense = {};
    }
    for (let room_name of config.occupied_rooms) {
        if (Game.rooms[room_name] == undefined) {
            continue;
        }
        if (global.basic_costmatrices[room_name] == undefined || Game.time % 200 == 0) {
			let costmatrix = construct_elementary_costmatrix(room_name);
            global.basic_costmatrices[room_name] = costmatrix.clone();
            if (Game.controlled_rooms.includes(room_name)) {
                global.basic_costmatrices_safe[room_name] = costmatrix.clone();
                global.basic_costmatrices_defense[room_name] = costmatrix.clone();
                config.conf_rooms[room_name].safe_boundary.forEach((e) => global.basic_costmatrices_safe[room_name].set(e[0], e[1], 255));
                config.conf_rooms[room_name].defense_boundary.forEach((e) => global.basic_costmatrices_defense[room_name].set(e[0], e[1], 255));
            }
        }
    }
}
export function get_basic_costmatrices(room_name: string, safe_level: 0 | 1 | 2): CostMatrix {
    let basic_costmatrices: type_costmatrices;
    if (safe_level == 0) {
        basic_costmatrices = global.basic_costmatrices;
    } else if (safe_level == 1) {
        basic_costmatrices = global.basic_costmatrices_safe;
    } else if (safe_level == 2) {
        basic_costmatrices = global.basic_costmatrices_defense;
    }
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

