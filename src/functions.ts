//screeps
import * as mymath from "./mymath"
import * as config from "./config"
import * as constants from "./constants"
import * as basic_job from "./basic_job"
import * as attack from "./attack"

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
	}
	else {
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

export function get_costmatrix_road(room_name: string) {
    let name_of_this_function = "costmatrices"
    if (Game.tick_cpu[name_of_this_function] == undefined) {
        Game.tick_cpu[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();
    if (Game.costmatrices == undefined) {
        Game.costmatrices = {};
    }
    if (Game.costmatrices[room_name] == undefined) {
        if (global.basic_costmatrices == undefined) {
            global.basic_costmatrices = {};
        }
        if (global.basic_costmatrices[room_name] == undefined || Game.rooms[room_name].memory.objects_updated) {
            let costmatrix = new PathFinder.CostMatrix;
            let terrain = new Room.Terrain(room_name);
            for (let i = 0; i < 50; i++) {
                for (let j = 0; j < 50; j++) {
                    if (terrain.get(i, j) == 0) {
                        costmatrix.set(i, j, 2);
                    } else if (terrain.get(i, j) == 1) {
                        costmatrix.set(i, j, 255);
                    } else if (terrain.get(i, j) == 2) {
                        costmatrix.set(i, j, 10);
                    }
                }
            }
            if (Game.rooms[room_name] !== undefined) {
                let room = Game.rooms[room_name];
                let structures = room.find(FIND_STRUCTURES);
                let sites = room.find(FIND_MY_CONSTRUCTION_SITES);
                structures.filter((e) => e.structureType == 'road').forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 1));
                structures.filter((e) => !(['road', 'container', 'rampart'].includes(e.structureType))).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
                sites.filter((e) => !(['road', 'container', 'rampart'].includes(e.structureType))).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
                structures.filter((e) => e.structureType == 'rampart' && e.owner.username !== config.username).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
            }
			for (let xy of config.conf_rooms[room_name].maincarrier.working_zone) {
				costmatrix.set(xy[0], xy[1], 255);
			}
            global.basic_costmatrices[room_name] = costmatrix.clone();
        }
        let costmatrix = global.basic_costmatrices[room_name].clone();
        if (Game.rooms[room_name] !== undefined) {
            let room = Game.rooms[room_name];
            let mycreeps = room.find(FIND_MY_CREEPS);
			let mypcs = room.find(FIND_MY_POWER_CREEPS);
            mycreeps.filter((e) => !e.memory.movable && !e.memory.crossable).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
            mypcs.filter((e) => !e.memory.movable && !e.memory.crossable).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
            let hostilecreeps = room.find(FIND_HOSTILE_CREEPS);
            hostilecreeps.forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
            Game.costmatrices[room_name] = costmatrix.clone();
        } else {
            Game.costmatrices[room_name] = costmatrix.clone();
        }
    }
    Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
    return Game.costmatrices[room_name];
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

global.visualize_cost = function(room_name: string, xmin: number = 0, xmax: number = 49, ymin: number = 0, ymax: number = 49) {
    let cost = get_costmatrix_road(room_name);
    for (let x = xmin; x <= xmax; x++) {
        for (let y = ymin; y <= ymax; y++) {
            Game.rooms[room_name].visual.text(cost.get(x, y).toString(), x, y);
        }
    }
    return 0;
}

