import * as _ from "lodash"
import * as mymath from "./mymath"
import * as config from "./config"
import * as functions from "./functions"
import * as basic_job from "./basic_job"
import * as external_room from "./external_room"

export function single_combat_ranged(creep: Creep, aggresive: boolean = false) {
	let enemies = creep.room.find(FIND_HOSTILE_CREEPS);
	if (enemies.length > 0) {
		let distances = enemies.map((e) => creep.pos.getRangeTo(e));
		let argmin = mymath.argmin(distances);
		let enemy = enemies[argmin];
		creep.heal(creep);
		let d = creep.pos.getRangeTo(enemy);
		if (d > 3) {
			creep.moveTo(enemy.pos, {range: 3, reusePath: 0});
		} else {
			creep.rangedAttack(enemy);
			if (!(aggresive && d == 3)) {
				let poses_to_flee = functions.get_poses_with_fixed_range(creep.pos, 3);
				let pos_to_flee = creep.pos.findClosestByPath(poses_to_flee, {algorithm: 'dijkstra'});
				creep.moveTo(pos_to_flee, {range: 0, reusePath: 0});
			}
		}
		return 0;
	} else {
		return 1;
	}
}

export function single_combat_melee(invader: Creep, guard_range: number = undefined) {
	let hostiles: Creep[];
	if (guard_range == undefined) {
		hostiles = invader.room.find(FIND_HOSTILE_CREEPS);
	} else {
		let xmin = Math.max(invader.pos.x - guard_range, 0);
		let xmax = Math.min(invader.pos.x + guard_range, 49);
		let ymin = Math.max(invader.pos.y - guard_range, 0);
		let ymax = Math.min(invader.pos.y + guard_range, 49);
		hostiles = invader.room.lookForAtArea("creep", ymin, xmin, ymax, xmax, true).map((e) => e.creep).filter((e) => !e.my);
	}
	if (hostiles.length > 0) {
		let distances = hostiles.map((e) => invader.pos.getRangeTo(e));
		let min_distance = mymath.min(distances);
		let closeset_hostiles = hostiles.filter((e) => invader.pos.getRangeTo(e) == min_distance);
		let scores = closeset_hostiles.map((e) => e.getActiveBodyparts(ATTACK));
		let argmin = mymath.argmin(scores);
		let target = closeset_hostiles[argmin];
		if (invader.pos.getRangeTo(target) > 1) {
			let path = PathFinder.search(invader.pos, {pos: target.pos, range: 1});
			invader.moveByPath(path.path);
		} else {
			invader.attack(target);
			invader.move(invader.pos.getDirectionTo(target));
		}
		return 0;
	}
	return 1;
}

export function group2_combat_melee(invader: Creep, healer: Creep, guard_range: number = undefined) {
	let hostiles: Creep[];
	if (guard_range == undefined) {
		hostiles = invader.room.find(FIND_HOSTILE_CREEPS);
	} else {
		let xmin = Math.max(invader.pos.x - guard_range, 0);
		let xmax = Math.min(invader.pos.x + guard_range, 49);
		let ymin = Math.max(invader.pos.y - guard_range, 0);
		let ymax = Math.min(invader.pos.y + guard_range, 49);
		hostiles = invader.room.lookForAtArea("creep", ymin, xmin, ymax, xmax, true).map((e) => e.creep).filter((e) => !e.my);
	}
	if (hostiles.length > 0) {
		let distances = hostiles.map((e) => invader.pos.getRangeTo(e));
		let min_distance = mymath.min(distances);
		let closeset_hostiles = hostiles.filter((e) => invader.pos.getRangeTo(e) == min_distance);
		let scores = closeset_hostiles.map((e) => e.getActiveBodyparts(ATTACK) * 2 + e.getActiveBodyparts(RANGED_ATTACK));
		let argmin = mymath.argmin(scores);
		let target = closeset_hostiles[argmin];
		invader.attack(target);
		if (invader.fatigue == 0 && healer.fatigue == 0 && invader.pos.getRangeTo(healer) <= 1 && invader.pos.getRangeTo(target) > 1) {
			invader.moveTo(target);
		}
		if (healer.hits < healer.hitsMax || healer.pos.getRangeTo(invader) > 1) {
			healer.heal(healer);
		} else {
			healer.heal(invader);
		}
		healer.move(healer.pos.getDirectionTo(invader));
		return 0;
	} else if (healer.hits < healer.hitsMax) {
		healer.heal(healer);
		return 1;
	} else if (invader.hits < invader.hitsMax && healer.pos.getRangeTo(invader) == 1) {
		healer.heal(invader);
		return 1;
	}
	return 1;
}

var high_valued_structures: StructureConstant[] = ['extension', 'spawn', 'tower', 'link', 'lab', 'nuker', 'powerSpawn', 'factory'];
var valued_structures: StructureConstant[] = ['extension', 'spawn', 'tower', 'link', 'lab', 'nuker', 'powerSpawn', 'factory', 'rampart', 'constructedWall'];
var owned_structures: StructureConstant[] = ['extension', 'spawn', 'tower', 'link', 'lab', 'nuker', 'powerSpawn', 'factory', 'rampart'];
var mass_damage: {[key: number]: number} = {
	1: 10,
	2: 4,
	3: 1,
}

function with_rampart(pos: RoomPosition): number {
	let rampart = <StructureRampart> (pos.lookFor("structure").filter((e) => e.structureType == 'rampart')[0]);
	if (rampart == undefined) {
		return 0;
	} else {
		return rampart.hits
	}
}

function get_structure_score(invader: Creep, structure: Structure): number {
	let score = structure.hits + (structure.structureType == 'rampart' ? 0 : with_rampart(structure.pos)) + invader.pos.getRangeTo(structure) * 1000 + (structure.structureType == 'tower' ? 0 : 10000)
	return score;
}

function get_structures_in_range(invader: Creep, range: number): Structure[] {
	let xmin = Math.max(invader.pos.x - range, 0);
	let xmax = Math.min(invader.pos.x + range, 49);
	let ymin = Math.max(invader.pos.y - range, 0);
	let ymax = Math.min(invader.pos.y + range, 49);
	let structures_in_range = invader.room.lookForAtArea("structure", ymin, xmin, ymax, xmax, true).map((e) => e.structure);
	return structures_in_range;
}

function get_creeps_in_range(invader: Creep, range: number): Creep[] {
	let xmin = Math.max(invader.pos.x - range, 0);
	let xmax = Math.min(invader.pos.x + range, 49);
	let ymin = Math.max(invader.pos.y - range, 0);
	let ymax = Math.min(invader.pos.y + range, 49);
	let creeps_in_range = invader.room.lookForAtArea("creep", ymin, xmin, ymax, xmax, true).map((e) => e.creep);
	return creeps_in_range;
}

function get_most_valued_structure_in_range(invader: Creep, range: number): Structure {
	let structures_in_range = get_structures_in_range(invader, range).filter((e) => valued_structures.includes(e.structureType));
	if (structures_in_range.length == 0) {
		return undefined;
	}
	let scores = structures_in_range.map((e) => get_structure_score(invader, e));
	let argmin = mymath.argmin(scores);
	return structures_in_range[argmin];
}

function get_most_valued_creep_in_range(invader: Creep, range: number): Creep {
	let creeps_in_range = get_creeps_in_range(invader, range).filter((e) => !e.my && with_rampart(e.pos) == 0 && !e.spawning);
	if (creeps_in_range.length == 0) {
		return undefined;
	}
	let scores = creeps_in_range.map((e) => e.hits);
	let argmin = mymath.argmin(scores);
	return creeps_in_range[argmin];
}

function get_mass_damage_on_creeps(invader: Creep): number {
	let creeps_in_range = get_creeps_in_range(invader, 3).filter((e) => !e.my && with_rampart(e.pos) == 0 && !e.spawning);
	let mass_damages = creeps_in_range.map((e) => mass_damage[invader.pos.getRangeTo(e)]);
	return mymath.array_sum(mass_damages);
}

function get_mass_damage_on_structures(invader: Creep): number {
	let structures_in_range = get_structures_in_range(invader, 3).filter((e) => owned_structures.includes(e.structureType) && (e.structureType == 'rampart' || with_rampart(e.pos) == 0));
	let mass_damages = structures_in_range.map((e) => mass_damage[invader.pos.getRangeTo(e)]);
	return mymath.array_sum(mass_damages);
}

export function auto_dismantle(invader_name: string) {
	let invader = Game.creeps[invader_name];
    if (config.occupied_rooms.includes(invader.room.name)) {
		return;
	}
	let target_structure = get_most_valued_structure_in_range(invader, 1);
	if (target_structure !== undefined) {
		invader.dismantle(target_structure);
		invader.room.visual.circle(target_structure.pos.x, target_structure.pos.y);
		return;
	}
}

export function auto_attack(invader_name: string) {
	let invader = Game.creeps[invader_name];
    if (config.occupied_rooms.includes(invader.room.name)) {
		return;
	}
	let target_creep = get_most_valued_creep_in_range(invader, 1);
	if (target_creep !== undefined) {
		invader.attack(target_creep);
		invader.room.visual.circle(target_creep.pos.x, target_creep.pos.y);
		return;
	}
	let target_structure = get_most_valued_structure_in_range(invader, 1);
	if (target_structure !== undefined) {
		invader.attack(target_structure);
		invader.room.visual.circle(target_structure.pos.x, target_structure.pos.y);
		return;
	}
}

export function auto_ranged_attack(invader_name: string) {
	let invader = Game.creeps[invader_name];
    if (config.occupied_rooms.includes(invader.room.name)) {
		return;
	}
	if (get_mass_damage_on_creeps(invader) >= 10) {
		invader.rangedMassAttack();
		return;
	}
	let target_creep = get_most_valued_creep_in_range(invader, 3);
	if (target_creep !== undefined) {
		invader.rangedAttack(target_creep);
		return;
	}
	if (get_mass_damage_on_structures(invader) >= 10) {
		invader.rangedMassAttack();
		return;
	}
	let target_structure = get_most_valued_structure_in_range(invader, 3);
	if (target_structure !== undefined) {
		invader.rangedAttack(target_structure);
		return;
	}
}

export function auto_invade(invader_name: string) {
	let invader = Game.creeps[invader_name];
	if (invader.getActiveBodyparts(ATTACK) > 0) {
		auto_attack(invader_name);
	} else {
		if (invader.getActiveBodyparts(RANGED_ATTACK) > 0) {
			auto_ranged_attack(invader_name);
		}
		if (invader.getActiveBodyparts(WORK) > 0) {
			auto_dismantle(invader_name);
		}
	}
}

export function automove_with_flag_group_x2(groupname: string, flagname: string): number {
	let group = Memory.invade_groups_x2[groupname];
    let healer = Game.creeps[group.healer_name];
    let invader = Game.creeps[group.invader_name];
    let healer_damage = healer.hitsMax - healer.hits;
    let invader_damage = invader.hitsMax - invader.hits;
    let close = false;
    let sameroom = false;
    if (healer.room.name == invader.room.name) {
        sameroom = true;
        if (healer.pos.getRangeTo(invader) <= 1) {
            close = true;
        }
    }
    // try to heal invader first if close
    if (close && invader_damage >= healer_damage) {
        healer.heal(invader);
    } else {
        healer.heal(healer);
    }
    if (sameroom) {
        if (!close) {
            healer.moveTo(invader);
            invader.moveTo(healer);
        } else {
            if (healer.pos.x == 0 && invader.pos.x == 0) {
                invader.move(RIGHT);
                healer.move(RIGHT);
            } else if (healer.pos.x == 49 && invader.pos.x == 49) {
                invader.move(LEFT);
                healer.move(LEFT);
            } else if (healer.pos.y == 0 && invader.pos.y == 0) {
                invader.move(BOTTOM);
                healer.move(BOTTOM);
            } else if (healer.pos.y == 49 && invader.pos.y == 49) {
                invader.move(TOP);
                healer.move(TOP);
            } else {
                let flag = Game.flags[flagname];
                if (flag !== undefined && flag.room !== undefined && flag.room.name == invader.room.name) {
                    if (flag.pos.x == 0) {
                        if (invader.pos.x == 1 && healer.pos.x == 1) {
                            invader.move(LEFT);
                            healer.move(LEFT);
                        }
                    } else if (flag.pos.x == 49) {
                        if (invader.pos.x == 48 && healer.pos.x == 48) {
                            invader.move(RIGHT);
                            healer.move(RIGHT);
                        }
                    } else if (flag.pos.y == 0) {
                        if (invader.pos.y == 1 && healer.pos.y == 1) {
                            invader.move(TOP);
                            healer.move(TOP);
                        }
                    } else if (flag.pos.y == 49) {
                        if (invader.pos.y == 48 && healer.pos.y == 48) {
                            invader.move(BOTTOM);
                            healer.move(BOTTOM);
                        }
                    } else {
                        invader.moveTo(flag, {
                            maxRooms: 1,
                            reusePath: 0,
                            costCallback: functions.avoid_exits
                        });
                        healer.move(healer.pos.getDirectionTo(invader));
                    }
                }
            }
        }
    }
    return 0;
}

export function automove_group_x2(groupname: string, flagname: string, rooms_path: string[], poses_path: number[]): number {
	let group = Memory.invade_groups_x2[groupname];
    let healer = Game.creeps[group.healer_name];
    let invader = Game.creeps[group.invader_name];
    let healer_damage = healer.hitsMax - healer.hits;
    let invader_damage = invader.hitsMax - invader.hits;
    let close = false;
    let sameroom = false;
    if (healer.room.name == invader.room.name) {
        sameroom = true;
        if (healer.pos.getRangeTo(invader) <= 1) {
            close = true;
        }
    }
    // try to heal invader first if close
    if (close && invader_damage >= healer_damage) {
        healer.heal(invader);
    } else {
        healer.heal(healer);
    }
	//let costmatrix = PathFinder.CostMatrix.deserialize(Memory.invade_costmatrices[invader.name]);
    if (sameroom && !close) {
		healer.moveTo(invader, {range: 1});
		invader.moveTo(healer, {range: 1});
	} else {
		if (!external_room.is_moving_target_defined(invader, 'forward')) {
			external_room.save_external_moving_targets(invader, rooms_path, poses_path, 'forward');
		}
		if (external_room.movethroughrooms_group_x2(invader, healer, 'forward', rooms_path.slice(-1)[0]) == 0) {
			return 0;
		}
	}
	if (invader.fatigue > 0 || healer.fatigue > 0) {
		return 0;
	}
	let structures = invader.room.find(FIND_STRUCTURES);
	let enemies = invader.room.find(FIND_HOSTILE_CREEPS).filter((e) => e.getActiveBodyparts(ATTACK) + e.getActiveBodyparts(RANGED_ATTACK) > 0);
	//structures.filter((e) => !(['road', 'container'].includes(e.structureType))).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
	function costCallback(roomName: string, costMatrix: CostMatrix) {
		costMatrix.set(healer.pos.x, healer.pos.y, 0);
		for (let enemy of enemies) {
			for (let dx of [-3, -2, -1, 0, 1, 2, 3]) {
				let x = enemy.pos.x + dx;
				if (x < 0 || x > 49) {
					continue;
				}
				for (let dy of [-3, -2, -1, 0, 1, 2, 3]) {
					let y = enemy.pos.y + dy;
					if (y < 0 || y > 49) {
						continue;
					}
				}
			}
		}
	}
	if (enemies.length > 0) {
		let closest_enemy = invader.pos.findClosestByRange(enemies);
		if (invader.pos.getRangeTo(closest_enemy) <= 3) {
			let rooms_path_reverse = _.clone(rooms_path);
			let poses_path_reverse = _.clone(poses_path);
			rooms_path_reverse.reverse();
			poses_path_reverse.reverse();
			if (!external_room.is_moving_target_defined(invader, 'backward')) {
				external_room.save_external_moving_targets(invader, rooms_path_reverse, poses_path_reverse, 'backward');
			}
			external_room.movethroughrooms_group_x2(invader, healer, 'backward', rooms_path[0], {costCallback: costCallback, reusePath: 0, maxOps: 200});
			return 0;
		}
	}
	let flag;
	if (flagname !== undefined) {
		flag = Game.flags[flagname];
	}
	if (flag !== undefined && invader.room.name == flag.room.name && flag.pos.lookFor("structure").length > 0) {
		invader.moveTo(flag, {range: 1, costCallback: costCallback, maxRooms: 1, reusePath: 0, maxOps: 200});
		healer.move(healer.pos.getDirectionTo(invader));
	} else {
		let valued_structures = structures.filter((e) => high_valued_structures.includes(e.structureType));
		if (valued_structures.length > 0) {
			let scores = valued_structures.map((e) => get_structure_score(invader, e))
			let argmin = mymath.argmin(scores);
			let target_structure = valued_structures[argmin];
			invader.moveTo(target_structure, {range: 1, costCallback: costCallback, maxRooms: 1, reusePath: 0, maxOps: 200});
			healer.move(healer.pos.getDirectionTo(invader));
		}
	}
	return 0;
}

/*
export function run_invader_group_x2(invade_type: invade_types, group: type_invader_group_x2, flagname: string, invader_boost_request: type_creep_boost_request, healer_boost_request: type_creep_boost_request) {
    let invader = Game.creeps[group.invader_name];
    let healer = Game.creeps[group.healer_name];
    let output_invader = basic_job.boost_request(invader, invader_boost_request, true);
    let output_healer = basic_job.boost_request(healer, healer_boost_request, true);
    let flag = Game.flags[flagname];
    if (output_invader == 0 && output_healer == 0) {
		if (Memory.invade_costmatrices == undefined) {
			Memory.invade_costmatrices = {}
		}
		if (Memory.invade_costmatrices[invader.name] == undefined) {
			let heal_amount = healer.getActiveBodyparts(HEAL);
			if (healer_boost_request.heal !== undefined) {
				heal_amount *= BOOSTS.heal[<keyof typeof BOOSTS.heal> healer_boost_request.heal].heal
			}
			if (healer_boost_request.tough !== undefined) {
				heal_amount /= BOOSTS.tough[<keyof typeof BOOSTS.tough> healer_boost_request.tough].damage;
			}
			functions.get_invader_costmatrix(target_room_name, heal_amount);
		}
        automove_with_flag_group_x2(group, flagname);
		invade_functions[invade_type](invader);
    } else if (output_invader == 0) {
        if (flag !== undefined) {
            invader.moveTo(flag);
        }
    } else if (output_healer == 0) {
        if (flag !== undefined) {
            healer.moveTo(flag);
        }
    }
}
*/

type invade_types = "attack" | "ranged_attack" | "dismantle";
type body_types = "invade" | "heal" | "tough" | "move";
/*
type type_invader_conf_levels = {
	[key: number]: {
		boost: {
			[key in invade_types | "heal"]: type_body_conf;
		};
		damage: number;
	}
}
*/
type type_invade_conf = {
	[key in body_types]: {
		number: number;
		boost_level: number;
	}
}
type type_invade_conf_levels = {
	[key: number]: {
		conf: type_invade_conf
		damage: number;
	}
}

var boost_mapping: {
	[key in "tough" | "heal" | "move" | "attack" | "ranged_attack" | "work"]: {
		[key: number]: MineralBoostConstant
	}
} = {
	tough: {
		2: "GHO2",
		3: "XGHO2"
	},
	heal: {
		2: "LHO2",
		3: "XLHO2"
	},
	move: {
		2: "ZHO2",
		3: "XZHO2"
	},
	attack: {
		2: "UH2O",
		3: "XUH2O"
	},
	ranged_attack: {
		2: "KHO2",
		3: "XKHO2",
	},
	work: {
		2: "ZH2O",
		3: "XKHO2",
	},
}
function invade_conf_to_body_conf(conf: type_invade_conf, assign: type_invade_assign): {[key in "healer" | "invader"]: type_body_conf} {
	let body_conf_invader: type_body_conf = {};
	let body_conf_healer: type_body_conf = {};
	if (assign.attack == undefined) {
		assign.attack = 0;
	}
	if (assign.ranged_attack == undefined) {
		assign.ranged_attack = 0;
	}
	if (assign.work == undefined) {
		assign.work = 0;
	}
	if (assign.attack + assign.ranged_attack + assign.work !== conf.invade.number) {
		return undefined;
	}
	body_conf_invader.tough = body_conf_healer.tough = {
		number: conf.tough.number,
		boost: boost_mapping.tough[conf.tough.boost_level],
	}
	body_conf_invader.move = body_conf_healer.move = {
		number: conf.move.number,
		boost: boost_mapping.move[conf.move.boost_level],
	}
	body_conf_healer.heal = {
		number: conf.heal.number,
		boost: boost_mapping.heal[conf.heal.boost_level],
	}
	for (let part of <Array<keyof typeof assign>> Object.keys(assign)) {
		if (assign[part] == 0) {
			continue;
		}
		body_conf_invader[part] = {
			number: assign[part],
			boost: boost_mapping[part][conf.invade.boost_level],
		}
	}
	return {
		invader: body_conf_invader,
		healer: body_conf_healer,
	}
}

let invade_conf_levels: type_invade_conf_levels = {
	1: {
		conf: {
			"invade": {
				"number": 20,
				"boost_level": 2,
			},
			"heal": {
				"number": 20,
				"boost_level": 2,
			},
			"tough": {
				"number": 16,
				"boost_level": 2,
			},
			"move": {
				"number": 12,
				"boost_level": 2,
			},
		},
		damage: 1440,
	},
	2: {
		conf: {
			"invade": {
				"number": 20,
				"boost_level": 2,
			},
			"heal": {
				"number": 20,
				"boost_level": 2,
			},
			"tough": {
				"number": 16,
				"boost_level": 3,
			},
			"move": {
				"number": 12,
				"boost_level": 2,
			},
		},
		damage: 2400,
	},
	3: {
		conf: {
			"invade": {
				"number": 20,
				"boost_level": 3,
			},
			"heal": {
				"number": 20,
				"boost_level": 3,
			},
			"tough": {
				"number": 20,
				"boost_level": 3,
			},
			"move": {
				"number": 10,
				"boost_level": 3,
			},
		},
		damage: 3200,
	},
}

//export function run_invader_group_x2(groupname: string, target_room_name: string, flagname: string, rooms_path: string[], poses_path: number[]) {
export function run_invader_group_x2(groupname: string, flagname: string, rooms_path: string[], poses_path: number[]) {
	let group = Memory.invade_groups_x2[groupname];
    let invader = Game.creeps[group.invader_name];
    let healer = Game.creeps[group.healer_name];
	if (invader == undefined || healer == undefined) {
		return;
	}
	invader.memory.movable = false;
	invader.memory.crossable = true;
	healer.memory.movable = false;
	healer.memory.crossable = true;
	let invade_conf = invade_conf_levels[group.invade_level];
	let body_confs = invade_conf_to_body_conf(invade_conf.conf, group.assign);
	let invader_boost_request = functions.conf_body_to_boost_request(body_confs.invader);
	let healer_boost_request = functions.conf_body_to_boost_request(body_confs.healer);
    let output_invader = basic_job.boost_request(invader, invader_boost_request, true);
    let output_healer = basic_job.boost_request(healer, healer_boost_request, true);
    let flag = Game.flags[flagname];
	let target_room_name = rooms_path.slice(-1)[0];
    if (output_invader == 0 && output_healer == 0) {
		automove_group_x2(groupname, flagname, rooms_path, poses_path);
		auto_invade(invader.name);
    }
}

export function init() {
	global.spawn_invader_group_x2 = function(home_room_name: string, level: number, groupname: string, assign: type_invade_assign): number {
		let invader_name = "invader"+groupname+Game.time.toString();
		let healer_name = "healer"+groupname+Game.time.toString();
		let invade_conf = invade_conf_levels[level];
		let body_confs = invade_conf_to_body_conf(invade_conf.conf, assign);
		let invader_body = functions.conf_body_to_body_components(body_confs.invader);
		let heal_body = functions.conf_body_to_body_components(body_confs.healer);
		global.spawn_in_queue(home_room_name, global.get_body(invader_body), invader_name, {}, false);
		global.spawn_in_queue(home_room_name, global.get_body(heal_body), healer_name, {}, false);
		if (Memory.invade_groups_x2 == undefined) {
			Memory.invade_groups_x2 = {};
		}
		Memory.invade_groups_x2[groupname] = {
			"home_room_name": home_room_name,
			"invader_name": invader_name,
			"healer_name": healer_name,
			"invade_level": level,
			"assign": assign,
		}
		return 0;
	}
}
