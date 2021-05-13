import * as _ from "lodash"
import * as mymath from "./mymath"
import * as config from "./config"
import * as functions from "./functions"
import * as basic_job from "./basic_job"
import * as external_room from "./external_room"

function with_rampart(creep: Creep): boolean {
	return creep.pos.lookFor("structure").filter((e) => e.structureType == 'rampart').length > 0;
}

export function auto_dismantle(invader_name: string) {
	let invader = Game.creeps[invader_name];
    if (config.occupied_rooms.includes(invader.room.name)) {
		return;
	}
	// dismantle tower first, then other structure with the lowest hits
	let xmin = Math.max(invader.pos.x - 1, 0);
	let xmax = Math.min(invader.pos.x + 1, 49);
	let ymin = Math.max(invader.pos.y - 1, 0);
	let ymax = Math.min(invader.pos.y + 1, 49);
	let structures_in_range = invader.room.lookForAtArea("structure", ymin, xmin, ymax, xmax, true).map((e) => e.structure);
	structures_in_range = structures_in_range.filter((e) => !(['storage', 'terminal'].includes(e.structureType)));
	let towers = < Array < StructureTower >> structures_in_range.filter((e) => e.structureType == "tower");
	if (towers.length > 0) {
		let hits = towers.map((e) => e.hits);
		let argmin = mymath.argmin(hits);
		invader.dismantle(towers[argmin]);
	} else if (structures_in_range.length > 0) {
		let hits = structures_in_range.map((e) => e.hits);
		let argmin = mymath.argmin(hits);
		invader.dismantle(structures_in_range[argmin]);
	}
}

export function auto_attack(invader_name: string) {
	let invader = Game.creeps[invader_name];
    if (config.occupied_rooms.includes(invader.room.name)) {
		return;
	}
	let xmin = Math.max(invader.pos.x - 1, 0);
	let xmax = Math.min(invader.pos.x + 1, 49);
	let ymin = Math.max(invader.pos.y - 1, 0);
	let ymax = Math.min(invader.pos.y + 1, 49);
	let creeps_in_range = invader.room.lookForAtArea("creep", ymin, xmin, ymax, xmax, true).map((e) => e.creep).filter((e) => !e.my && !with_rampart(e));
	if (creeps_in_range.length > 0) {
		let hits = creeps_in_range.map((e) => e.hits);
		let argmin = mymath.argmin(hits);
		invader.attack(creeps_in_range[argmin]);
		return;
	}
	let structures_in_range = invader.room.lookForAtArea("structure", ymin, xmin, ymax, xmax, true).map((e) => e.structure);
	if (structures_in_range.length > 0) {
		structures_in_range = structures_in_range.filter((e) => !(['storage', 'terminal'].includes(e.structureType)));
		let towers = < Array < StructureTower >> structures_in_range.filter((e) => e.structureType == "tower");
		if (towers.length > 0) {
			let hits = towers.map((e) => e.hits);
			let argmin = mymath.argmin(hits);
			invader.attack(towers[argmin]);
		} else if (structures_in_range.length > 0) {
			let hits = structures_in_range.map((e) => e.hits);
			let argmin = mymath.argmin(hits);
			invader.attack(structures_in_range[argmin]);
		}
		return;
	}
}

var mass_damage: {[key: number]: number} = {
	1: 10,
	2: 4,
	3: 1,
}
export function auto_ranged_attack(invader_name: string) {
	let invader = Game.creeps[invader_name];
    if (config.occupied_rooms.includes(invader.room.name)) {
		return;
	}
	let xmin = Math.max(invader.pos.x - 3, 0);
	let xmax = Math.min(invader.pos.x + 3, 49);
	let ymin = Math.max(invader.pos.y - 3, 0);
	let ymax = Math.min(invader.pos.y + 3, 49);
	let creeps_in_range = invader.room.lookForAtArea("creep", ymin, xmin, ymax, xmax, true).map((e) => e.creep).filter((e) => !e.my && !with_rampart(e) && !e.spawning);
	if (creeps_in_range.length > 0) {
		let mass_damages = creeps_in_range.map((e) => mass_damage[invader.pos.getRangeTo(e)]);
		if (mymath.array_sum(mass_damages) >= 10) {
			invader.rangedMassAttack();
		} else {
			let hits = creeps_in_range.map((e) => e.hits);
			let argmin = mymath.argmin(hits);
			invader.rangedAttack(creeps_in_range[argmin]);
		}
		return;
	}
	let structures_in_range = invader.room.lookForAtArea("structure", ymin, xmin, ymax, xmax, true).map((e) => e.structure);
	if (structures_in_range.length > 0) {
		let owned_structures_in_range = structures_in_range.filter((e) => !(['wall', 'road', 'container'].includes(e.structureType)));
		let mass_damages = owned_structures_in_range.map((e) => mass_damage[invader.pos.getRangeTo(e)]);
		if (mymath.array_sum(mass_damages) >= 10) {
			invader.rangedMassAttack();
		} else {
			structures_in_range = structures_in_range.filter((e) => !(['storage', 'terminal'].includes(e.structureType)));
			let towers = < Array < StructureTower >> structures_in_range.filter((e) => e.structureType == "tower");
			if (towers.length > 0) {
				let hits = towers.map((e) => e.hits);
				let argmin = mymath.argmin(hits);
				invader.rangedAttack(towers[argmin]);
			} else if (structures_in_range.length > 0) {
				let hits = structures_in_range.map((e) => e.hits);
				let argmin = mymath.argmin(hits);
				invader.rangedAttack(structures_in_range[argmin]);
			}
			return;
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
	let costmatrix = PathFinder.CostMatrix.deserialize(Memory.invade_costmatrices[invader.name]);
	let flag = Game.flags[flagname];
    if (sameroom && !close) {
		healer.moveTo(invader, {range: 1});
		invader.moveTo(healer, {range: 1});
	} else if (external_room.moveawayexit_group_x2(healer, invader) == 1 && sameroom && healer.fatigue == 0 && invader.fatigue == 0) {
		if (invader.room.name == flag.room.name) {
			let range = 1;
			if (group.invade_type == 'ranged_attack') {
				range = 3;
			}
			if (flag.pos.lookFor("structure").length > 0) {
				invader.moveTo(flag, {range: range, costCallback: (e1, e2) => costmatrix, maxRooms: 1});
				healer.move(healer.pos.getDirectionTo(invader));
			} else {
				let towers = <Array<StructureTower>> invader.room.find(FIND_STRUCTURES).filter((e) => e.structureType == 'tower');
				if (towers.length > 0) {
					let target = invader.pos.findClosestByPath(towers, {range: range});
					invader.moveTo(target, {range: range, costCallback: (e1, e2) => costmatrix, maxRooms: 1});
					healer.move(healer.pos.getDirectionTo(invader));
				}
			}
		} else {
			external_room.movethroughrooms(invader, rooms_path, poses_path);
			healer.move(healer.pos.getDirectionTo(invader));
		}
	}
	return 0;
}

var invade_functions: {[key in invade_types]: any} = {
	"attack": auto_attack,
	"dismantle": auto_dismantle,
	"ranged_attack": auto_ranged_attack,
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

type type_invader_conf_levels = {
	[key: number]: {
		boost: {
			[key in invade_types | "heal"]: type_body_conf;
		};
		damage: number;
	}
}
let invader_conf_levels: type_invader_conf_levels = {
	1: {
		"boost": {
			"heal": {
				"tough": {
					"number": 16,
					"boost": "GHO2",
				},
				"heal": {
					"number": 20,
					"boost": "LHO2",
				},
				"move": {
					"number": 12,
					"boost": "ZHO2",
				},
			},
			"dismantle": {
				"tough": {
					"number": 16,
					"boost": "GHO2",
				},
				"work": {
					"number": 20,
					"boost": "ZH2O",
				},
				"move": {
					"number": 12,
					"boost": "ZHO2",
				},
			},
			"attack": {
				"tough": {
					"number": 16,
					"boost": "GHO2",
				},
				"attack": {
					"number": 20,
					"boost": "UH2O",
				},
				"move": {
					"number": 12,
					"boost": "ZHO2",
				},
			},
			"ranged_attack": {
				"tough": {
					"number": 16,
					"boost": "GHO2",
				},
				"ranged_attack": {
					"number": 20,
					"boost": "KHO2",
				},
				"move": {
					"number": 12,
					"boost": "ZHO2",
				},
			},
		},
		"damage": 1440,
	},
	2: {
		"boost": {
			"heal": {
				"tough": {
					"number": 16,
					"boost": "XGHO2",
				},
				"heal": {
					"number": 20,
					"boost": "LHO2",
				},
				"move": {
					"number": 12,
					"boost": "ZHO2",
				},
			},
			"dismantle": {
				"tough": {
					"number": 16,
					"boost": "XGHO2",
				},
				"work": {
					"number": 20,
					"boost": "ZH2O",
				},
				"move": {
					"number": 12,
					"boost": "ZHO2",
				},
			},
			"attack": {
				"tough": {
					"number": 16,
					"boost": "XGHO2",
				},
				"attack": {
					"number": 20,
					"boost": "UH2O",
				},
				"move": {
					"number": 12,
					"boost": "ZHO2",
				},
			},
			"ranged_attack": {
				"tough": {
					"number": 16,
					"boost": "XGHO2",
				},
				"ranged_attack": {
					"number": 20,
					"boost": "KHO2",
				},
				"move": {
					"number": 12,
					"boost": "ZHO2",
				},
			},
		},
		"damage": 2400,
	},
	3: {
		"boost": {
			"heal": {
				"tough": {
					"number": 20,
					"boost": "XGHO2",
				},
				"heal": {
					"number": 20,
					"boost": "XLHO2",
				},
				"move": {
					"number": 10,
					"boost": "XZHO2",
				},
			},
			"dismantle": {
				"tough": {
					"number": 20,
					"boost": "XGHO2",
				},
				"work": {
					"number": 20,
					"boost": "XZH2O",
				},
				"move": {
					"number": 10,
					"boost": "XZHO2",
				},
			},
			"attack": {
				"tough": {
					"number": 20,
					"boost": "XGHO2",
				},
				"attack": {
					"number": 20,
					"boost": "XUH2O",
				},
				"move": {
					"number": 10,
					"boost": "XZHO2",
				},
			},
			"ranged_attack": {
				"tough": {
					"number": 20,
					"boost": "XGHO2",
				},
				"ranged_attack": {
					"number": 20,
					"boost": "XKHO2",
				},
				"move": {
					"number": 10,
					"boost": "XZHO2",
				},
			},
		},
		"damage": 3200,
	}
}

//export function run_invader_group_x2(groupname: string, target_room_name: string, flagname: string, rooms_path: string[], poses_path: number[]) {
export function run_invader_group_x2(groupname: string, target_room_name: string, flagname: string) {
	let group = Memory.invade_groups_x2[groupname];
    let invader = Game.creeps[group.invader_name];
    let healer = Game.creeps[group.healer_name];
	invader.memory.crossable = true;
	healer.memory.crossable = true;
	let invader_boost_request = functions.conf_body_to_boost_request(invader_conf_levels[group.invade_level].boost[group.invade_type]);
	let healer_boost_request = functions.conf_body_to_boost_request(invader_conf_levels[group.invade_level].boost.heal);
    let output_invader = basic_job.boost_request(invader, invader_boost_request, true);
    let output_healer = basic_job.boost_request(healer, healer_boost_request, true);
    let flag = Game.flags[flagname];
    if (output_invader == 0 && output_healer == 0) {
		/*
		if (Memory.invade_costmatrices == undefined) {
			Memory.invade_costmatrices = {}
		}
		if (Memory.invade_costmatrices[invader.name] == undefined) {
			let observer_status = global.memory[invader.room.name].unique_structures_status.observer;
			if (observer_status.finished) {
				let observer = Game.getObjectById(observer_status.id);
				observer.observeRoom(target_room_name);
			}
			if (Game.rooms[target_room_name] !== undefined) {
				let damage = invader_conf_levels[group.invade_level].damage
				Memory.invade_costmatrices[invader.name] = functions.get_invader_costmatrix(target_room_name, damage).serialize();
			}
		} else {
			automove_group_x2(groupname, flagname, rooms_path, poses_path);
		}
		*/
		automove_with_flag_group_x2(groupname, flagname);
		invade_functions[group.invade_type](invader);
    }
}

global.spawn_invader_group_x2 = function(home_room_name: string, invade_type: invade_types, level: number, groupname: string): number {
	let invader_name = "invader"+groupname+Game.time.toString();
	let healer_name = "healer"+groupname+Game.time.toString();
	let invader_body = functions.conf_body_to_body_components(invader_conf_levels[level].boost[invade_type]);
	let heal_body = functions.conf_body_to_body_components(invader_conf_levels[level].boost.heal);
	global.spawn_in_queue(home_room_name, global.get_body(invader_body), invader_name, {}, false);
	global.spawn_in_queue(home_room_name, global.get_body(heal_body), healer_name, {}, false);
	if (Memory.invade_groups_x2 == undefined) {
		Memory.invade_groups_x2 = {};
	}
	Memory.invade_groups_x2[groupname] = {
		"home_room_name": home_room_name,
		"invader_name": invader_name,
		"healer_name": healer_name,
		"invade_type": invade_type,
		"invade_level": level,
	}
	return 0;
}

