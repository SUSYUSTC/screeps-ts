import * as mymath from "./mymath";
import * as functions from "./functions"

interface type_allowed_body_numbers {
    [key: string]: number[][];
}
const allowed_numbers: type_allowed_body_numbers = {
    'small_close': [
        [1, 0, 0]
    ],
    'small_far': [
        [0, 1, 0]
    ],
    'big_close': [
        [2, 0, 0],
        [1, 0, 1]
    ],
    'big_far': [
        [0, 1, 1]
    ]
}

function _get_one_invader_type(creep: Creep): null | invader_type {
    if (!(creep.owner.username == 'Invader')) {
        return null;
    }
    if (creep.body.length == 10) {
        var level = 1;
        var body_index = 8;
    } else if (creep.body.length == 50) {
        var level = 2;
        var body_index = 47;
    } else {
        throw Error("Undefined body number of invader");
    }
    var bodyname = creep.body[body_index].type;
    if (bodyname == ATTACK) {
        var name = 'melee';
    } else if (bodyname == RANGED_ATTACK) {
        var name = 'ranged';
    } else if (bodyname == HEAL) {
        var name = 'healer';
    } else {
        throw Error("Undefined body type of invader");
    }
    if ("boost" in creep.body[8]) {
        var boost = true;
    } else {
        var boost = false;
    }
    return {
        "level": level,
        "name": name,
        "boost": boost
    };
}

export function get_defense_type(room: Room): string {
    var enemies = room.find(FIND_HOSTILE_CREEPS)
	var enemy_types = enemies.map((e) => functions.analyze_component(e));
	var argattacker = mymath.range(enemy_types.length).filter((i) => (enemy_types[i].n_attack+ enemy_types[i].n_rangedattack + enemy_types[i].n_heal) > 0);
	enemies = argattacker.map((i) => enemies[i]);
    if (enemies.length == 0) {
        return "";
    }
    var types = enemies.map((e) => _get_one_invader_type(e));
    if (mymath.any(types.map((e) => (e == null)))) {
		var components = enemies.map((e) => functions.analyze_component(e));
		var n_total_attack = mymath.array_sum(components.map((e) => e.n_attack));
		var n_total_rangedattack = mymath.array_sum(components.map((e) => e.n_rangedattack));
		var n_total_heal = mymath.array_sum(components.map((e) => e.n_rangedattack));
		if (n_total_attack + n_total_rangedattack > 0) {
			return "user";
		}
		else {
			return "";
		}
    }
    if (mymath.any(types.map((e) => e.level !== 1))) {
        throw Error("Invader with level 2")
    }
    var names = types.map((e) => e.name);
    var n_melee = names.filter((e) => e == 'melee').length;
    var n_ranged = names.filter((e) => e == 'ranged').length;
    var n_healer = names.filter((e) => e == 'healer').length;
    var numbers = [n_melee, n_ranged, n_healer];
    for (var allowed_name in allowed_numbers) {
        for (var allowed_number of allowed_numbers[allowed_name]) {
            if (mymath.array_equal(numbers, allowed_number)) {
                return allowed_name;
            }
        }
    }
    if (mymath.any(types.map((e) => e.level !== 1))) {
        throw Error("Unexpected type of invader")
    }
}

export function defend(creep: Creep) {
    var enemies = creep.room.find(FIND_HOSTILE_CREEPS);
    if (enemies.length == 0) {
        let creeps = creep.room.find(FIND_MY_CREEPS);
        creeps = creeps.filter((e) => e.hits < e.hitsMax);
        if (creeps.length == 0) {
            return;
        }
        let distance = creeps.map((e) => creep.pos.getRangeTo(e.pos));
        let argmin = mymath.argmin(distance);
        creep.heal(creeps[argmin]);
		creep.moveTo(creeps[argmin], {maxRooms: 0, reusePath: 0, costCallback: functions.avoid_exits});
        return;
    }
	var enemy_types = enemies.map((e) => functions.analyze_component(e));
	let distance = enemies.map((e) => creep.pos.getRangeTo(e.pos));
	let argmin = mymath.argmin(distance)
	let target = enemies[argmin];
	creep.moveTo(target, {maxRooms: 0, reusePath: 0, costCallback: functions.avoid_exits});
    if (creep.attack(target) == ERR_NOT_IN_RANGE) {
        creep.heal(creep);
    }
    creep.rangedAttack(target);
}
