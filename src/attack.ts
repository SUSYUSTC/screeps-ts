import * as _ from "lodash"
import * as mymath from "./mymath"
import * as config from "./config"
import * as functions from "./functions"
import * as basic_job from "./basic_job"

interface type_invader_group_x2 {
    healer_name: string;
	invader_name: string;
}

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
	let creeps_in_range = invader.room.lookForAtArea("creep", ymin, xmin, ymax, xmax, true).map((e) => e.creep).filter((e) => !e.my && !with_rampart(e));
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

export function automove_with_flag_group_x2(group: type_invader_group_x2, flagname: string): number {
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
                        healer.moveTo(invader);
                    }
                }
            }
        }
    }
    return 0;
}

type invade_types = "attack" | "dismantle" | "ranged_attack";
var invade_functions: {[key in invade_types]: any} = {
	"attack": auto_attack,
	"dismantle": auto_dismantle,
	"ranged_attack": auto_ranged_attack,
}

export function run_invader_group_x2(invade_type: invade_types, group: type_invader_group_x2, flagname: string, invader_boost_request: type_creep_boost_request, healer_boost_request: type_creep_boost_request) {
    let invader = Game.creeps[group.invader_name];
    let healer = Game.creeps[group.healer_name];
    let output_invader = basic_job.boost_request(invader, invader_boost_request, true);
    let output_healer = basic_job.boost_request(healer, invader_boost_request, true);
    let flag = Game.flags[flagname];
    if (output_invader == 0 && output_healer == 0) {
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
