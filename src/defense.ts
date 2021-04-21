import * as mymath from "./mymath";
import * as functions from "./functions"
import * as basic_job from "./basic_job"

interface type_allowed_body_numbers {
    [key: string]: number[][];
}
const allowed_numbers: type_allowed_body_numbers = {
    'small_close': [
        [1, 0, 0],
    ],
    'small_far': [
        [0, 1, 0],
    ],
    'big_close': [
        [2, 0, 0],
        [1, 0, 1],
    ],
    'big_far': [
        [0, 1, 1],
        [1, 1, 0],
    ],
    'two_far': [
        [0, 2, 0],
    ]
}

function get_one_invader_type(creep: Creep): null | invader_type {
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
	let hostile_creeps = room.find(FIND_HOSTILE_CREEPS);
	for (let hc of hostile_creeps) {
		if (hc.owner.username == 'Invader') {
			continue;
		}
		let ability = get_creep_invading_ability(hc);
		for (let body in result) {
			result[<BodyPartConstant>body] += ability[<BodyPartConstant>body];
		}
	}
	return result;
}

export function get_defense_type(room: Room): string {
    var enemies = room.find(FIND_HOSTILE_CREEPS)
    var enemy_types = enemies.map((e) => functions.analyze_component(e));
    var argattacker = mymath.range(enemy_types.length).filter((i) => (enemy_types[i].n_attack + enemy_types[i].n_rangedattack + enemy_types[i].n_heal) > 0);
    enemies = argattacker.map((i) => enemies[i]);
    if (enemies.length == 0) {
        return "";
    }
    var types = enemies.map((e) => get_one_invader_type(e));
    if (mymath.any(types.map((e) => (e == null)))) {
        var components = enemies.map((e) => functions.analyze_component(e));
        var n_total_attack = mymath.array_sum(components.map((e) => e.n_attack));
        var n_total_rangedattack = mymath.array_sum(components.map((e) => e.n_rangedattack));
        var n_total_heal = mymath.array_sum(components.map((e) => e.n_rangedattack));
        if (n_total_attack + n_total_rangedattack > 0) {
            return "user";
        } else {
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
    return "user"
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
        creep.moveTo(creeps[argmin], {
            maxRooms: 1,
            reusePath: 0,
            costCallback: functions.avoid_exits
        });
        return;
    }
    var enemy_types = enemies.map((e) => functions.analyze_component(e));
    let distance = enemies.map((e) => creep.pos.getRangeTo(e.pos));
    let argmin = mymath.argmin(distance)
    let target = enemies[argmin];
    creep.moveTo(target, {
        maxRooms: 1,
        reusePath: 0,
        costCallback: functions.avoid_exits
    });
    if (creep.attack(target) == ERR_NOT_IN_RANGE) {
        creep.heal(creep);
    }
    creep.rangedAttack(target);
}

interface type_tough_conf {
    level: number;
    hits: number;
}

function get_tough_conf(creep: Creep): type_tough_conf {
    let toughs = creep.body.filter((e) => e.type == TOUGH && e.hits > 0);
    let tough_boosts = toughs.map((e) => e.boost);
    let tough_conf: type_tough_conf = {
        "level": 0,
        "hits": mymath.array_sum(toughs.map((e) => e.hits)),
    }
    if (tough_boosts.includes("XGHO2")) {
        tough_conf.level = 3;
    } else if (tough_boosts.includes("GHO2")) {
        tough_conf.level = 2;
    } else if (tough_boosts.includes("GO")) {
        tough_conf.level = 1;
    }
    return tough_conf;
}

function get_number_active(creep: Creep, part: BodyPartConstant) {
	return creep.body.filter((e) => e.type == part && e.hits > 0).length;
}
export function defend_home(room_name: string) {
    var room = Game.rooms[room_name]
    var game_memory = Game.memory[room_name];
    var enemies = room.find(FIND_HOSTILE_CREEPS);
    if (enemies.length == 0) {
        return;
    }
    let creep_abilities = enemies.map((creep) => get_creep_invading_ability(creep));
    let tough_confs = enemies.map((creep) => get_tough_conf(creep));
    let heal_abilities = creep_abilities.map((e) => e.heal);
    let distance_matrix = [];
    for (let i = 0; i < enemies.length; i++) {
        let distance_array = [];
        for (let j = 0; j < enemies.length; j++) {
            distance_array.push(enemies[i].pos.getRangeTo(enemies[j].pos))
        }
        distance_matrix.push(distance_array);
    }
    let max_healed_amount = [];
    for (let i = 0; i < enemies.length; i++) {
        let amount = 0;
        for (let j = 0; j < enemies.length; j++) {
            if (distance_matrix[i][j] <= 3) {
                amount += heal_abilities[j] * 12;
            }
        }
        max_healed_amount.push(amount);
    }
	let defenders = room.find(FIND_MY_CREEPS).filter((e) => e.memory.role == 'home_defender');
	let boosted_defenders = defenders.filter((creep) => basic_job.boost_request(creep, {"attack": "UH2O", "move": "ZO"}, true) == 0);
	let n_active = boosted_defenders.map((creep) => get_number_active(creep, "attack"));
    let towers = global.memory[room_name].tower_list.map((e) => Game.getObjectById(e));
    let damages = [];
    for (let i = 0; i < enemies.length; i++) {
        let amount = 0;
        for (let j = 0; j < towers.length; j++) {
            let dis = towers[j].pos.getRangeTo(enemies[i]);
            if (dis < 5) {
                amount += 600;
            } else if (dis > 20) {
                amount += 150;
            } else {
                amount += 3000 / dis;
            }
        }
		for (let j = 0; j < boosted_defenders.length; j++) {
			if (boosted_defenders[j].pos.getRangeTo(enemies[i]) <= 1) {
				amount += n_active[j]*90;
			}
		}
        damages.push(amount);
    }
    let pure_damages = [];
    for (let i = 0; i < enemies.length; i++) {
        let amount = max_healed_amount[i];
        let tough_conf = tough_confs[i];
        let ratio;
        if (tough_conf.level == 3) {
            ratio = 0.3;
        } else if (tough_conf.level == 2) {
            ratio = 0.5;
        } else if (tough_conf.level == 1) {
            ratio = 0.7;
        } else {
            ratio = 1.0;
        }
        if (damages[i] - tough_conf.hits / ratio > max_healed_amount[i]) {
            pure_damages.push(damages[i] - max_healed_amount[i]);
        } else if (damages[i] - tough_conf.hits / ratio > 0) {
            let additional_amount = damages[i] - tough_conf.hits / ratio;
            pure_damages.push((tough_conf.hits - max_healed_amount[i] + additional_amount) / ratio);
        } else if (damages[i] - tough_conf.hits / ratio <= 0) {
            pure_damages.push(0);
        }
    }
	let priorities = [];
    for (let i = 0; i < enemies.length; i++) {
		if (pure_damages[i] > 0) {
			priorities.push(pure_damages[i]+enemies[i].hitsMax-enemies[i].hits);
		} else {
			priorities.push(0);
		}
	}
	let argmax = mymath.argmax(priorities);
	if (priorities[argmax] > 0) {
		for (let tower of towers) {
			tower.attack(enemies[argmax]);
		}
		for (let defender of boosted_defenders) {
			if (defender.pos.getRangeTo(enemies[argmax]) <= 1) {
				defender.attack(enemies[argmax]);
			} else {
				let xmin = Math.max(defender.pos.x - 1, 0);
				let xmax = Math.min(defender.pos.x + 1, 49);
				let ymin = Math.max(defender.pos.y - 1, 0);
				let ymax = Math.min(defender.pos.y + 1, 49);
				let enemy_in_range = enemies.filter((e) => defender.pos.getRangeTo(e) <= 1)[0];
				if (enemy_in_range !== undefined) {
					defender.attack(enemy_in_range);
				}
			}
		}
	} else {
		for (let defender of boosted_defenders) {
			let xmin = Math.max(defender.pos.x - 1, 0);
			let xmax = Math.min(defender.pos.x + 1, 49);
			let ymin = Math.max(defender.pos.y - 1, 0);
			let ymax = Math.min(defender.pos.y + 1, 49);
			let enemy_in_range = defender.room.lookForAtArea("creep", ymin, xmin, ymax, xmax, true).map((e) => e.creep).filter((e) => !e.my)[0];
			if (enemy_in_range !== undefined) {
				defender.attack(enemy_in_range);
			}
		}
	}
}
