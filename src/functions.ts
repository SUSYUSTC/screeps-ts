//screeps
import * as room_list from "./room_list"
import * as mymath from "./mymath"
export function avoid_exits(room_name: string, costMatrix: CostMatrix) {
    for (var i = 0; i < 50; i++) {
        costMatrix.set(0, i, 100);
        costMatrix.set(49, i, 100);
        costMatrix.set(i, 49, 100);
        costMatrix.set(i, 0, 100);
    }
	for (var _room_name in room_list.rooms_ignore_pos) {
		if (room_name == _room_name) {
			for(let xy of room_list.rooms_ignore_pos[_room_name]) {
				costMatrix.set(xy[0], xy[1], 1);
			}
		}
	}
    for (var i = 0; i < 50; i++) {
        costMatrix.set(i, 49, 100);
        costMatrix.set(i, 48, 100);
        costMatrix.set(i, 47, 100);
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
	return {n_work: n_work, n_move: n_move, n_carry: n_carry, n_attack: n_attack, n_rangedattack: n_rangedattack, n_heal: n_heal};
}

