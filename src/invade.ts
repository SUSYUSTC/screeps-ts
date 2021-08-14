import * as _ from "lodash"
import * as mymath from "./mymath"
import * as config from "./config"
import * as functions from "./functions"
import * as basic_job from "./basic_job"
import * as external_room from "./external_room"
import * as cross_shard from "./cross_shard"
import {
    Timer
} from "./timer";

var show_red = {
    radius: 0.2,
    fill: "#ff0000",
    opacity: 1.0,
}

var show_blue = {
    radius: 0.2,
    fill: "#0000ff",
    opacity: 1.0,
}

var show_gray = {
    radius: 0.5,
    fill: "#000000",
    opacity: 0.3,
}

var high_valued_structures: StructureConstant[] = ['extension', 'spawn', 'tower', 'link', 'lab', 'nuker', 'powerSpawn', 'factory'];
var low_valued_structures: StructureConstant[] = ['rampart', 'constructedWall'];
var valued_structures: StructureConstant[] = ['extension', 'spawn', 'tower', 'link', 'lab', 'nuker', 'powerSpawn', 'factory', 'rampart', 'constructedWall'];
var owned_structures: StructureConstant[] = ['extension', 'spawn', 'tower', 'link', 'lab', 'nuker', 'powerSpawn', 'factory', 'rampart'];
var mass_damage: {
    [key: number]: number
} = {
    1: 10,
    2: 4,
    3: 1,
}

export function single_combat_ranged(creep: Creep, aggresive: boolean = false) {
    let enemies = creep.room.find(FIND_HOSTILE_CREEPS);
    if (enemies.length > 0) {
        let distances = enemies.map((e) => creep.pos.getRangeTo(e));
        let argmin = mymath.argmin(distances);
        let enemy = enemies[argmin];
        creep.heal(creep);
        let d = creep.pos.getRangeTo(enemy);
        if (d > 3) {
            creep.moveTo(enemy.pos, {
                range: 3,
                reusePath: 0
            });
        } else {
            creep.rangedAttack(enemy);
            if (!(aggresive && d == 3)) {
                let poses_to_flee = functions.get_poses_with_fixed_range(creep.pos, 3);
                let pos_to_flee = creep.pos.findClosestByPath(poses_to_flee, {
                    algorithm: 'dijkstra'
                });
                creep.moveTo(pos_to_flee, {
                    range: 0,
                    reusePath: 0
                });
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
        hostiles = invader.pos.findInRange(FIND_HOSTILE_CREEPS, guard_range);
    }
    if (hostiles.length > 0) {
        let distances = hostiles.map((e) => invader.pos.getRangeTo(e));
        let min_distance = mymath.min(distances);
        let closeset_hostiles = hostiles.filter((e) => invader.pos.getRangeTo(e) == min_distance);
        let scores = closeset_hostiles.map((e) => e.getActiveBodyparts(ATTACK));
        let argmin = mymath.argmin(scores);
        let target = closeset_hostiles[argmin];
        if (invader.pos.getRangeTo(target) > 1) {
            let path = PathFinder.search(invader.pos, {
                pos: target.pos,
                range: 1
            });
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
        hostiles = invader.pos.findInRange(FIND_HOSTILE_CREEPS, guard_range);
    }
    if (hostiles.length > 0) {
        let distances = hostiles.map((e) => invader.pos.getRangeTo(e));
        let min_distance = mymath.min(distances);
        let closeset_hostiles = hostiles.filter((e) => invader.pos.getRangeTo(e) == min_distance);
        let scores = closeset_hostiles.map((e) => e.getActiveBodyparts(ATTACK) * 2 + e.getActiveBodyparts(RANGED_ATTACK));
        let argmin = mymath.argmin(scores);
        let target = closeset_hostiles[argmin];
		if (healer.pos.isNearTo(invader)) {
			if (!invader.pos.isNearTo(target) && invader.fatigue == 0) {
				if (healer.fatigue == 0) {
					// move together
					if (invader.pos.isNearTo(healer)) {
						invader.moveTo(target, {range: 1, reusePath: 0, maxRooms: 1, costCallback: functions.avoid_exits});
						healer.move(healer.pos.getDirectionTo(invader));
					}
				} else {
					// only invader move
					if (healer.pos.getRangeTo(target) <= 2) {
						let range2xys = functions.get_xys_with_fixed_range(healer.pos, 2);
						let costCallback = function(roomName: string, costMatrix: CostMatrix) {
							range2xys.forEach((e) => costMatrix.set(e[0], e[1], 255));
						}
						invader.moveTo(target, {range: 1, reusePath: 0, maxRooms: 1, costCallback: costCallback});
					}
				}
			} else {
				if (healer.fatigue == 0 && healer.pos.isNearTo(target)) {
					// only healer move
					let invader_range2xys = functions.get_xys_with_fixed_range(invader.pos, 2);
					let costCallback = function(roomName: string, costMatrix: CostMatrix) {
						invader_range2xys.forEach((e) => costMatrix.set(e[0], e[1], 255));
					}
					let back_pos = invader.room.getPositionAt(invader.pos.x * 2 - target.pos.x, invader.pos.y * 2 - target.pos.y);
					invader.moveTo(back_pos, {range: 0, reusePath: 0, maxRooms: 1, costCallback: costCallback});
				}
			}
		} else {
			healer.moveTo(invader, {range: 1, reusePath: 0, maxRooms: 1, costCallback: functions.avoid_exits});
		}
        invader.attack(target);
        if (healer.hits < healer.hitsMax || healer.pos.getRangeTo(invader) > 1) {
            healer.heal(healer);
        } else {
            healer.heal(invader);
        }
        return 0;
    } else if (healer.hits < healer.hitsMax) {
        healer.heal(healer);
        return 0;
    } else if (invader.hits < invader.hitsMax && healer.pos.getRangeTo(invader) == 1) {
        healer.heal(invader);
        return 0;
    }
    return 1;
}

function with_rampart(pos: RoomPosition): number {
    let rampart = < StructureRampart > (pos.lookFor("structure").filter((e) => e.structureType == 'rampart')[0]);
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

function get_structure_cost(invader: Creep, structure: Structure, ref_hits: number): number {
    ref_hits = Math.max(ref_hits, 400000);
    let hits = structure.hits + (structure.structureType == 'rampart' ? 0 : with_rampart(structure.pos));
    let tower_score = (structure.structureType == 'tower' ? 2 : 0);
    return Math.min(Math.ceil(hits * 20 / ref_hits), 240) + tower_score + 1;
}

function get_most_valued_structure_in_range(invader: Creep, range: number): Structure {
    let structures_in_range = invader.pos.findInRange(FIND_STRUCTURES, range).filter((e) => valued_structures.includes(e.structureType));
    if (structures_in_range.length == 0) {
        return undefined;
    }
    let scores = structures_in_range.map((e) => get_structure_score(invader, e));
    let argmin = mymath.argmin(scores);
    return structures_in_range[argmin];
}

function get_most_valued_creep_in_range(invader: Creep, range: number): Creep {
    let creeps_in_range = invader.pos.findInRange(FIND_HOSTILE_CREEPS, range).filter((e) => !e.my && with_rampart(e.pos) == 0 && !e.spawning);
    if (creeps_in_range.length == 0) {
        return undefined;
    }
    let scores = creeps_in_range.map((e) => e.hits);
    let argmin = mymath.argmin(scores);
    return creeps_in_range[argmin];
}

function get_mass_damage_on_creeps(invader: Creep): number {
    let creeps_in_range = invader.pos.findInRange(FIND_HOSTILE_CREEPS, 3).filter((e) => with_rampart(e.pos) == 0 && !e.spawning);
    let mass_damages = creeps_in_range.map((e) => mass_damage[invader.pos.getRangeTo(e)]);
    return mymath.array_sum(mass_damages);
}

function get_mass_damage_on_structures(invader: Creep): number {
    let structures_in_range = invader.pos.findInRange(FIND_STRUCTURES, 3).filter((e) => owned_structures.includes(e.structureType) && (e.structureType == 'rampart' || with_rampart(e.pos) == 0));
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
        invader.room.visual.circle(target_structure.pos.x, target_structure.pos.y, show_red);
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
        invader.room.visual.circle(target_creep.pos.x, target_creep.pos.y, show_red);
        return;
    }
    let target_structure = get_most_valued_structure_in_range(invader, 1);
    if (target_structure !== undefined) {
        invader.attack(target_structure);
        invader.room.visual.circle(target_structure.pos.x, target_structure.pos.y, show_red);
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

function get_total_towers_damage(xy: [number, number], towers: [number, number][]): number {
    let distances = towers.map((e) => Math.max(Math.abs(e[0] - xy[0]), Math.abs(e[1] - xy[1])))
    let damage = mymath.array_sum(distances.map((e) => functions.tower_damage(e)));
    return damage
}

function get_combat_costmatrix(room_name: string, allow_damage: number): CostMatrix {
    let room = Game.rooms[room_name];
    let costmatrix = functions.construct_elementary_costmatrix(room_name);
    let towers = < Array < StructureTower >> room.find(FIND_STRUCTURES).filter((e) => e.structureType == 'tower');
    let tower_xys = towers.map((e) => < [number, number] > [e.pos.x, e.pos.y]);
    for (let i = 0; i < 50; i++) {
        for (let j = 0; j < 50; j++) {
            if (costmatrix.get(i, j) == 255) {
                continue;
            }
            let damage = get_total_towers_damage([i, j], tower_xys);
            if (damage > allow_damage) {
                costmatrix.set(i, j, 255);
            }
        }
    }
    return costmatrix;
}

function update_combat_costmatrix(room_name: string, costmatrix: CostMatrix, allow_damage: number) {
    let room = Game.rooms[room_name];
    let towers = < Array < StructureTower >> room.find(FIND_STRUCTURES).filter((e) => e.structureType == 'tower');
    let tower_xys = towers.map((e) => < [number, number] > [e.pos.x, e.pos.y]);
    let hostiles = room.find(FIND_HOSTILE_CREEPS);
    let additional_damages: {
        [key in number]: {
            tower_damage: number;
            creep_damage: number;
            xy: [number, number];
        }
    } = {};
    for (let creep of hostiles) {
        let body_components = functions.get_creep_invading_ability(creep);
        if (body_components.ranged_attack > 0) {
            let xys = functions.get_xys_within_range(creep.pos, 5);
            for (let xy of xys) {
                let [x, y] = xy;
                if (costmatrix.get(x, y) == 255) {
                    continue;
                }
                let id = x * 50 + y;
                if (additional_damages[id] == undefined) {
                    additional_damages[id] = {
                        tower_damage: get_total_towers_damage([x, y], tower_xys),
                        creep_damage: 0,
                        xy: xy,
                    }
                }
                additional_damages[id].creep_damage += body_components.ranged_attack * 10;
            }
            if (body_components.attack > 0) {
                let xys = functions.get_xys_within_range(creep.pos, 3);
                for (let xy of xys) {
                    let [x, y] = xy;
                    if (costmatrix.get(x, y) == 255) {
                        continue;
                    }
                    let id = x * 50 + y;
                    if (additional_damages[id] == undefined) {
                        additional_damages[id] = {
                            tower_damage: get_total_towers_damage([x, y], tower_xys),
                            creep_damage: 0,
                            xy: xy,
                        }
                    }
                    additional_damages[id].creep_damage += body_components.attack * 30;
                }
            }
        }
    }
    _.filter(additional_damages).filter((e) => e.tower_damage + e.creep_damage > allow_damage).forEach((e) => costmatrix.set(e.xy[0], e.xy[1], 255));
}

function get_final_combat_costmatrix(groupname: string): CostMatrix {
    let group = Memory.invade_groups_x2[groupname];
    let allow_damage = invade_conf_levels[group.invade_level].damage;
    if (group.costmatrix == undefined || Game.time % 50 == 0) {
        group.costmatrix = get_combat_costmatrix(group.target_room_name, allow_damage).serialize();
    }
    let costmatrix = PathFinder.CostMatrix.deserialize(group.costmatrix);
    update_combat_costmatrix(group.target_room_name, costmatrix, allow_damage);
    return costmatrix;
}

function determine_attacking_structure(creep: Creep, costmatrix: CostMatrix): Structure {
    costmatrix = costmatrix.clone();
    let structures = creep.room.find(FIND_STRUCTURES).filter((e) => valued_structures.includes(e.structureType));
	let key_structures = structures.filter((e) => !low_valued_structures.includes(e.structureType)); 
	let non_key_structures = structures.filter((e) => low_valued_structures.includes(e.structureType));
    if (key_structures.length == 0) {
        return undefined;
    }
    let rampart_walls = structures.filter((e) => ['rampart', 'constructedWall'].includes(e.structureType) && e.hits >= 50000)
    let mean_hits = rampart_walls.length == 0 ? 0 : mymath.array_sum(rampart_walls.map((e) => e.hits)) / rampart_walls.length;
    let key_costs = key_structures.map((e) => get_structure_cost(creep, e, mean_hits));
    for (let i = 0; i < key_structures.length; i++) {
        let pos = key_structures[i].pos;
        let cost = key_costs[i];
        costmatrix.set(pos.x, pos.y, cost);
    }
    let structure = creep.pos.findClosestByPath(key_structures, {
        algorithm: 'dijkstra',
        maxRooms: 1,
        costCallback: function(roomName: string, costMatrix: CostMatrix) {
            if (roomName == creep.room.name) {
                return costmatrix;
            }
        },
        maxOps: 500,
    });
	if (structure != null) {
		return structure;
	}
    let non_key_costs = non_key_structures.map((e) => get_structure_cost(creep, e, mean_hits));
    for (let i = 0; i < non_key_structures.length; i++) {
        let pos = non_key_structures[i].pos;
        let cost = non_key_costs[i];
        costmatrix.set(pos.x, pos.y, cost);
    }
    structure = creep.pos.findClosestByPath(structures, {
        algorithm: 'dijkstra',
        maxRooms: 1,
        costCallback: function(roomName: string, costMatrix: CostMatrix) {
            if (roomName == creep.room.name) {
                return costmatrix;
            }
        },
        maxOps: 500,
    });
    return structure;
}

export function automove_group_x2(groupname: string): number {
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

    let flag = Game.flags[groupname];
    if (flag == undefined) {
        console.log("Cannot find flag", groupname);
        return -1;
    }
    if (invader.room.name !== flag.pos.roomName) {
        if (!external_room.is_moving_target_defined(invader, 'forward') || flag.pos.roomName !== group.target_room_name) {
            let path = PathFinder.search(invader.pos, flag.pos);
            let exits = functions.get_exits_from_path(path.path);
            group.target_room_name = flag.pos.roomName;
            external_room.save_external_moving_targets(invader, exits.rooms_path, exits.poses_path, 'forward');
        }
    }
    if (external_room.movethroughrooms_group_x2(invader, healer, 'forward', group.target_room_name) == 0) {
        return 0;
    }
    if (invader.fatigue > 0 || healer.fatigue > 0) {
        return 0;
    }

    let timer = new Timer("get_costmatrix", false);
    let costmatrix = get_final_combat_costmatrix(groupname);
    timer.end()
    let show_range = 5;
    for (let i = invader.pos.x - show_range; i <= invader.pos.x + show_range; i++) {
        for (let j = invader.pos.y - show_range; j <= invader.pos.y + show_range; j++) {
            if (costmatrix.get(i, j) == 255) {
                invader.room.visual.circle(i, j, show_gray);
            }
        }
    }
    let moveoptions: MoveToOpts = {
        maxRooms: 1,
        costCallback: function(roomName: string, costMatrix: CostMatrix) {
            if (roomName == invader.room.name) {
                let temp_costmatrix = costmatrix.clone();
                temp_costmatrix.set(healer.pos.x, healer.pos.y, 0);
                return temp_costmatrix;
            }
        },
        maxOps: 500,
    }
    if (costmatrix.get(invader.pos.x, invader.pos.y) == 255 || costmatrix.get(invader.pos.x, invader.pos.y) == 255) {
        let timer = new Timer("flee", false);
        let poses_to_flee = functions.get_poses_with_fixed_range(invader.pos, 8);
        let pos_to_flee = healer.pos.findClosestByPath(poses_to_flee, {
            algorithm: 'dijkstra'
        });
		if (!healer.pos.isEqualTo(pos_to_flee)) {
			healer.moveTo(pos_to_flee, {
				...moveoptions,
				...{
					range: 0,
					reusePath: 0
				}
			});
			invader.move(invader.pos.getDirectionTo(healer));
		}
        invader.room.visual.circle(pos_to_flee, show_blue);
        timer.end()
    } else {
        let hostiles = invader.pos.findInRange(FIND_HOSTILE_CREEPS, 8);
        if (hostiles.length > 0 && (invader.getActiveBodyparts(ATTACK) > 0 || invader.getActiveBodyparts(RANGED_ATTACK) > 0)) {
            let timer = new Timer("fight", false);
            let closest = invader.pos.findClosestByPath(hostiles, {
                ...moveoptions,
                ...{
                    maxOps: 50
                }
            });
            if (closest != null) {
                let range = invader.getActiveBodyparts(ATTACK) > 0 ? 1 : 3;
				if (invader.pos.getRangeTo(closest) > range) {
					invader.moveTo(closest, {
						...moveoptions,
						...{
							range: range
						}
					});
					healer.move(healer.pos.getDirectionTo(invader));
				}
                invader.room.visual.circle(closest.pos, show_blue);
                return;
            }
            timer.end()
        }
        let timer = new Timer("attack_structure", false);
        let refind_structure = false;
        if (group.target_structure_id == undefined || Game.time % 20 == 0) {
            refind_structure = true;
        } else {
            let structure = Game.getObjectById(group.target_structure_id);
            if (structure == null) {
                refind_structure = true;
            }
        }
        if (refind_structure) {
            let structure = determine_attacking_structure(invader, costmatrix);
            if (structure == undefined) {
                return 0;
            }
            group.target_structure_id = structure.id;
        }
        let structure = Game.getObjectById(group.target_structure_id);
        invader.room.visual.circle(structure.pos, show_blue);
		if (!invader.pos.isNearTo(structure)) {
			invader.moveTo(structure, {
				...moveoptions,
				...{
					range: 1,
					reusePath: 0
				}
			})
			healer.move(healer.pos.getDirectionTo(invader));
		}
        timer.end()
    }
    return 0;
}

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
        3: "XZH2O",
    },
}

function invade_conf_to_body_conf(conf: type_invade_conf, assign: type_invade_assign): {
    [key in "healer" | "invader"]: type_body_conf
} {
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
    for (let part of < Array < keyof typeof assign >> Object.keys(assign)) {
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
export function run_invader_group_x2(groupname: string) {
    let group = Memory.invade_groups_x2[groupname];
    if (!functions.creep_exists(group.invader_name, group.home_room_name, {search_shard: true}) || !functions.creep_exists(group.healer_name, group.home_room_name, {search_shard: true})) {
        delete Memory.invade_groups_x2[groupname];
        return;
    }
    if (group.working_status == undefined) {
        group.working_status = 'spawn';
    }
    let invader = Game.creeps[group.invader_name];
    if (invader !== undefined) {
        invader.memory.movable = false;
        invader.memory.crossable = true;
    }
    let healer = Game.creeps[group.healer_name];
    if (healer !== undefined) {
        healer.memory.movable = false;
        healer.memory.crossable = true;
    }
    switch (group.working_status) {
        case 'spawn': {
            let out = basic_job.waiting_for_spawn([group.invader_name, group.healer_name]);
            if (out == 1) {
                group.working_status = 'boost';
            }
            break;
        }
        case 'boost': {
            let invade_conf = invade_conf_levels[group.invade_level];
            let body_confs = invade_conf_to_body_conf(invade_conf.conf, group.assign);
            let invader_boost_request = functions.conf_body_to_boost_request(body_confs.invader);
            let healer_boost_request = functions.conf_body_to_boost_request(body_confs.healer);
            let output_invader = basic_job.boost_request(invader, invader_boost_request, true);
            let output_healer = basic_job.boost_request(healer, healer_boost_request, true);
            if (output_invader == 0 && output_healer == 0) {
                group.working_status = 'shard_move';
            }
            break;
        }
        case 'shard_move': {
            let n_finished = 0;
            if (invader !== undefined) {
                if (invader.memory.shard_move == undefined) {
                    invader.memory.shard_move = {
                        shard_path: group.shard_path,
                    }
                }
                if (external_room.movethroughshards(invader) == 1) {
                    n_finished += 1;
                }
            }
            if (healer !== undefined) {
                if (healer.memory.shard_move == undefined) {
                    healer.memory.shard_move = {
                        shard_path: group.shard_path,
                    }
                }
                if (external_room.movethroughshards(healer) == 1) {
                    n_finished += 1;
                }
            }
            if (n_finished == 2) {
                group.working_status = 'work';
                cross_shard.delete_creep_from_shardmemory(invader.name);
                cross_shard.delete_creep_from_shardmemory(healer.name);
            }
            break;
        }
        case 'work': {
            let timer = new Timer("automove", false);
            automove_group_x2(groupname);
            timer.end()
            timer = new Timer("autoinvade", false);
            auto_invade(invader.name);
            timer.end()
            break;
        }
    }
}

export function init() {
    global.spawn_invader_group_x2 = function(home_room_name: string, level: number, groupname: string, assign: type_invade_assign, shard_path: type_shard_exit_point[] = []): number {
        let invader_name = "invader" + groupname + Game.time.toString();
        let healer_name = "healer" + groupname + Game.time.toString();
        let invade_conf = invade_conf_levels[level];
        let body_confs = invade_conf_to_body_conf(invade_conf.conf, assign);
        let invader_body = functions.conf_body_to_body_components(body_confs.invader);
        let heal_body = functions.conf_body_to_body_components(body_confs.healer);
        global.spawn_in_queue(home_room_name, global.get_body(invader_body), invader_name, {}, false);
        global.spawn_in_queue(home_room_name, global.get_body(heal_body), healer_name, {}, false);
        //global.spawn_in_queue(home_room_name, [ATTACK, MOVE], invader_name, {}, false);
        //global.spawn_in_queue(home_room_name, [HEAL, MOVE], healer_name, {}, false);
        if (Memory.invade_groups_x2 == undefined) {
            Memory.invade_groups_x2 = {};
        }
        Memory.invade_groups_x2[groupname] = {
            "home_room_name": home_room_name,
            "invader_name": invader_name,
            "healer_name": healer_name,
            "invade_level": level,
            "assign": assign,
            "shard_path": shard_path,
        }
        return 0;
    }
}
