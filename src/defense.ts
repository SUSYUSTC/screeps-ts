import * as mymath from "./mymath";
import * as functions from "./functions";
import * as basic_job from "./basic_job";
import * as towers from "./towers";

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
    let hostile_creeps = functions.find_hostile(room);
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

export function get_defense_type(room: Room): string {
    var enemies = functions.find_hostile(room);
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
    var enemies = functions.find_hostile(creep.room);
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

function get_tough_conf(creep: Creep): type_tough_conf {
    let toughs = creep.body.filter((e) => e.type == TOUGH && e.hits > 0);
    let tough_boosts = toughs.map((e) => e.boost);
    let tough_conf: type_tough_conf = {
        "ratio": 1.0,
        "hits": mymath.array_sum(toughs.map((e) => e.hits)),
    }
    if (tough_boosts.includes("XGHO2")) {
        tough_conf.ratio = 0.3;
    } else if (tough_boosts.includes("GHO2")) {
        tough_conf.ratio = 0.5;
    } else if (tough_boosts.includes("GO")) {
        tough_conf.ratio = 0.7;
    }
    return tough_conf;
}

global.get_tough_conf = get_tough_conf;

function tower_damage(dis: number): number {
    if (dis < 5) {
        return 600;
    } else if (dis > 20) {
        return 150;
    } else {
        return 3000 / dis;
    }
}

function get_distance_matrix(poses: RoomPosition[]): number[][] {
    let distance_matrix = [];
    for (let i = 0; i < poses.length; i++) {
        let distance_array = [];
        for (let j = 0; j < poses.length; j++) {
            distance_array.push(poses[i].getRangeTo(poses[j]))
        }
        distance_matrix.push(distance_array);
    }
    return distance_matrix
}

function random_attack(creep: Creep, enemies: Creep[]) {
    let xmin = Math.max(creep.pos.x - 1, 0);
    let xmax = Math.min(creep.pos.x + 1, 49);
    let ymin = Math.max(creep.pos.y - 1, 0);
    let ymax = Math.min(creep.pos.y + 1, 49);
    let enemies_in_range = enemies.filter((e) => creep.pos.getRangeTo(e) <= 1);
    let enemy_in_range;
    if (enemies_in_range.length <= 1) {
        enemy_in_range = enemies_in_range[0];
    } else {
        let random_index = Math.floor(Math.random() * enemies_in_range.length);
        enemy_in_range = enemies_in_range[random_index];
    }
    if (enemy_in_range !== undefined) {
        creep.attack(enemy_in_range);
    }
}

export function group_enemies(n: number, distance_matrix: number[][]): number[][] {
    let result: {
        [key: string]: number[];
    } = {
        '0': [0]
    };
    let key = 1;
    for (let i = 1; i < n; i++) {
		let groupnames = Object.keys(result).filter((e) => mymath.any(result[e].map((j) => distance_matrix[i][j] <= 3)));
		if (groupnames.length == 0) {
			result[key.toString()] = [i];
		} else if (groupnames.length == 1) {
			result[groupnames[0]].push(i);
		} else {
			let keyname = key.toString();
			result[keyname] = [];
			for (let ele of groupnames) {
				result[keyname] = result[keyname].concat(result[ele]);
				delete result[ele];
			}
		}
	}
    return Object.values(result);
}

function get_pure_damage(tough_conf: type_tough_conf, damage_amount: number) {
	// need to count tough first to avoid cheating
    let current_amount = damage_amount;
    let pure_damage_amount = 0;
	if (damage_amount*tough_conf.ratio >= tough_conf.hits) {
		return tough_conf.hits + (damage_amount-tough_conf.hits/tough_conf.ratio);
	} else {
		return damage_amount*tough_conf.ratio;
	}
}

function creep_assignment_score(creeps_poses: RoomPosition[], ramparts_poses: RoomPosition[], assignment: number[]): number {
	let score = 0;
	for (let i = 0; i < creeps_poses.length; i++) {
		score += creeps_poses[i].getRangeTo(ramparts_poses[assignment[i]]);
	}
	return score;
}

function assign_creeps_try(creeps_poses: RoomPosition[], ramparts_poses: RoomPosition[]): number[] {
	let result: number[] = [];
	creeps_poses.forEach((e) => result.push(-1));
	if (creeps_poses.length > ramparts_poses.length) {
		for (let i of mymath.shuffle(mymath.range(ramparts_poses.length))) {
			let valid_indexes = mymath.range(creeps_poses.length).filter((j) => result[j] >= 0);
			let argmin = mymath.min(valid_indexes.map((j) => ramparts_poses[i].getRangeTo(creeps_poses[j])));
			result[valid_indexes[argmin]] = i;
		}
	} else {
		for (let i of mymath.shuffle(mymath.range(creeps_poses.length))) {
			let is_valid: boolean[] = [];
			ramparts_poses.forEach((e) => is_valid.push(true));
			result.filter((j) => result[j] >= 0).forEach((j) => is_valid[result[j]] = false);
			let valid_indexes = mymath.where(is_valid);
			let argmin = mymath.min(valid_indexes.map((j) => ramparts_poses[i].getRangeTo(creeps_poses[j])));
			result[i] = argmin;
		}
	}
	return result;
}

export function assign_creeps(creeps_poses: RoomPosition[], ramparts_poses: RoomPosition[]): number[] {
	let assignments: number[][] = [];
	let scores: number[] = [];
	for (let i = 0; i < 10; i++) {
		let assignment = assign_creeps_try(creeps_poses, ramparts_poses);
		let score = creep_assignment_score(creeps_poses, ramparts_poses, assignment);
		assignments.push(assignment);
		scores.push(score);
	}
	let argmin = mymath.min(scores);
	return assignments[argmin];
}

export function defend_home(room_name: string) {
	// 0: tower used, 1: tower not used
    let room = Game.rooms[room_name]
    let game_memory = Game.memory[room_name];
    let enemies = functions.find_hostile(room);
    if (enemies.length == 0) {
		if (towers.heal_all(room_name) == 1) {
			towers.repair_all(room_name);
		}
		return;
    }
	let heal_abilities = enemies.map((creep) => get_creep_invading_ability(creep).heal);
    let distance_matrix = get_distance_matrix(enemies.map((e) => e.pos));
    let max_healed_amount: number[] = [];
    for (let i = 0; i < enemies.length; i++) {
        let amount = 0;
        for (let j = 0; j < enemies.length; j++) {
            if (distance_matrix[i][j] <= 2) {
                amount += heal_abilities[j] * 12;
            } else if (distance_matrix[i][j] <= 4) {
                amount += heal_abilities[j] * 4;
			}
        }
        max_healed_amount.push(amount);
    }
    let defenders = room.find(FIND_MY_CREEPS).filter((e) => e.memory.role == 'home_defender');
    let boosted_defenders = defenders.filter((creep) => basic_job.boost_request(creep, {
        "attack": "UH2O",
        "move": "ZO"
    }, true) == 0);
    let room_towers = global.memory[room_name].tower_list.map((e) => Game.getObjectById(e));
    let damages: number[] = [];
    for (let i = 0; i < enemies.length; i++) {
        let amount = 0;
        let enemy = enemies[i];
        amount += mymath.array_sum(room_towers.map((e) => tower_damage(e.pos.getRangeTo(enemy))));
        amount += mymath.array_sum(boosted_defenders.filter((e) => e.pos.isNearTo(enemy)).map((e) => e.getActiveBodyparts(ATTACK))) * 90;
        damages.push(amount);
    }
	let pure_damages = mymath.range(enemies.length).map((i) => get_pure_damage(get_tough_conf(enemies[i]), damages[i]) - max_healed_amount[i]);
	mymath.range(enemies.length).forEach((i) => room.visual.text(Math.floor(pure_damages[i]).toString(), enemies[i].pos));
    let priorities = [];
    for (let i = 0; i < enemies.length; i++) {
        if (pure_damages[i] > 0) {
            priorities.push(pure_damages[i] + enemies[i].hitsMax - enemies[i].hits);
        } else {
            priorities.push(0);
        }
    }
    let argmax = mymath.argmax(priorities);
    if (priorities[argmax] > 0) {
        for (let tower of room_towers) {
            tower.attack(enemies[argmax]);
        }
        for (let defender of boosted_defenders) {
            if (defender.pos.getRangeTo(enemies[argmax]) <= 1) {
                defender.attack(enemies[argmax]);
            } else {
                random_attack(defender, enemies);
            }
        }
    } else {
		let hurt_defenders = boosted_defenders.filter((e) => e.hits < e.hitsMax);
		if (hurt_defenders.length > 0) {
			room_towers.forEach((e) => e.heal(hurt_defenders[0]));
		} else {
			towers.repair_all(room_name);
		}
        for (let defender of boosted_defenders) {
            random_attack(defender, enemies);
        }
    }
	if (boosted_defenders.length == 0) {
		return;
	}
	let group_indices = group_enemies(enemies.length, distance_matrix);
	let main_ramparts = global.memory[room_name].main_ramparts_id.map((e) => Game.getObjectById(e));
	Game.memory[room_name].n_defenders_needed = group_indices.length;
	let defense_poses: RoomPosition[] = [];
	for (let i = 0; i < group_indices.length; i++) {
		group_indices[i].forEach((j) => room.visual.text(i.toString(), enemies[j].pos.x, enemies[j].pos.y + 1));
		let enemies_in_this_group = group_indices[i].map((j) => enemies[j]);
		let distances_ramparts_to_hostile = main_ramparts.map((r) => mymath.min(enemies_in_this_group.map((hc) => r.pos.getRangeTo(hc))));
		let argmin_ramparts_to_hostile = mymath.argmin(distances_ramparts_to_hostile);
		let defense_rampart = main_ramparts[argmin_ramparts_to_hostile];
		defense_poses.push(defense_rampart.pos);
		room.visual.text("d"+i.toString(), defense_rampart.pos);
	}

	let assigned_indices = assign_creeps(boosted_defenders.map((e) => e.pos), defense_poses);
	for (let i = 0; i < boosted_defenders.length; i++) {
		basic_job.movetopos(boosted_defenders[i], defense_poses[assigned_indices[i]], 0, {safe_level: 2, setmovable: false});
		boosted_defenders[i].say("d"+assigned_indices[i].toString());
	}
}
