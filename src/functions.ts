//screeps
import * as room_list from "./room_list"
import * as mymath from "./mymath"
export function avoid_exits(room_name: string, costMatrix: CostMatrix) {
    for (let i = 0; i < 50; i++) {
        costMatrix.set(0, i, 255);
        costMatrix.set(49, i, 255);
        costMatrix.set(i, 49, 255);
        costMatrix.set(i, 0, 255);
    }
    for (let _room_name in room_list.rooms_ignore_pos) {
        if (room_name == _room_name) {
            for (let xy of room_list.rooms_ignore_pos[_room_name]) {
                costMatrix.set(xy[0], xy[1], 1);
            }
        }
    }
}

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
                structures.filter((e) => e.structureType == 'rampart' && e.owner.username !== Memory.username).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
            }
            global.basic_costmatrices[room_name] = costmatrix.clone();
        }
        let costmatrix = global.basic_costmatrices[room_name].clone();
        if (Game.rooms[room_name] !== undefined) {
            let room = Game.rooms[room_name];
            let mycreeps = room.find(FIND_MY_CREEPS);
            mycreeps.filter((e) => !e.memory.movable).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
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

global.visualize_cost = function(room_name: string) {
	let cost = get_costmatrix_road('E15N58');
	for (let x = 0; x < 50; x++) {
		for (let y = 0; y < 50; y++) {
			Game.rooms.E15N58.visual.text(cost.get(x,y).toString(), x, y);
		}
	}
	return 0;
}
