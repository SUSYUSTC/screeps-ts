import * as _ from "lodash";
import * as mymath from "./mymath";
import * as config from "./config";
import * as external_room from "./external_room";
import * as functions from "./functions";
import { Timer } from "./timer";

var vision_options: any = {
    visualizePathStyle: {}
};

var reverse_directions: {[key in DirectionConstant]: DirectionConstant} = {
	[RIGHT]: LEFT,
	[LEFT]: RIGHT,
	[TOP]: BOTTOM,
	[BOTTOM]: TOP,
	[TOP_RIGHT]: BOTTOM_LEFT,
	[TOP_LEFT]: BOTTOM_RIGHT,
	[BOTTOM_RIGHT]: TOP_LEFT,
	[BOTTOM_LEFT]: TOP_RIGHT,
}
export function movetopos(creep: Creep | PowerCreep, pos: RoomPosition, range: number, options: type_movetopos_options = {}) {
	// 0: moving, 1: already arrived, 2: not in the same room, 3: path not found
    if (creep.pos.getRangeTo(pos) <= range) {
        return 1;
    }
	if (creep.room.name !== pos.roomName) {
		return 2;
	}

	let timer = new Timer("movetopos", false);
    if (options.setmovable == undefined) {
        options.setmovable = true;
    }
	if (options.safe_level == undefined) {
		options.safe_level = 0;
	}

	function costCallback(roomName: string, costMatrix: CostMatrix) {
		let costmatrix = options.costmatrix;
		if (costmatrix == undefined) {
			costmatrix = functions.get_costmatrix_road(roomName, options.safe_level);
		}
		if (pos.x == 0 || pos.x == 49 || pos.y == 0 || pos.y == 49) {
			costmatrix = costmatrix.clone();
			costmatrix.set(pos.x, pos.y, 0);
		}
		return costmatrix;
	}
	if (creep.moveTo(pos, {costCallback: costCallback, reusePath: 8, maxRooms: 1, range: range, plainCost: 2, swampCost: 10}) == ERR_NO_PATH) {
		timer.end();
		return 3;
	}

	// cross
	if_cross: if (creep.memory._move !== undefined) {
		let next_path = Room.deserializePath(creep.memory._move.path)[0];
		if (next_path == undefined) {
			break if_cross;
		}
		let next_pos = creep.room.getPositionAt(next_path.x, next_path.y);
		if (creep.pos.isEqualTo(next_pos)) {
			break if_cross;
		}
		let reverse_direction = reverse_directions[next_path.direction];
        let potential_creep = next_pos.lookFor("creep")[0];
        if (potential_creep !== undefined && !potential_creep.memory.movable && potential_creep.memory.crossable) {
			potential_creep.move(reverse_direction);
        }
        let potential_pc = next_pos.lookFor("powerCreep")[0];
        if (potential_pc !== undefined && !potential_pc.memory.movable && potential_pc.memory.crossable) {
			potential_pc.move(reverse_direction);
        }
    }
	if (options.setmovable) {
		creep.memory.movable = true;
	}
	timer.end();
    return 0;
}

export function moveto_stayxy(creep: Creep, xy: number[], moveoptions: type_movetopos_options = {}) {
    let stay_pos = creep.room.getPositionAt(xy[0], xy[1]);
    if (stay_pos.lookFor("creep").length == 0) {
        if (creep.pos.getRangeTo(xy[0], xy[1]) > 0) {
            creep.memory.movable = true;
            movetopos(creep, stay_pos, 0, moveoptions);
        } else {
            creep.memory.movable = false;
        }
    } else {
        if (creep.pos.getRangeTo(xy[0], xy[1]) > 1) {
            creep.memory.movable = true;
            movetopos(creep, stay_pos, 1, moveoptions);
        } else {
            creep.memory.movable = false;
        }
    }
}
export function movetoposexceptoccupied(creep: Creep, poses: RoomPosition[], moveoptions: type_movetopos_options = {}) {
    //return 0 if successfully moving to position, 1 if no vacance left, 2 if already at position
    let inposition = false;
    for (var pos of poses) {
        if (creep.pos.x == pos.x && creep.pos.y == pos.y) {
            inposition = true;
        }
    }
    for (var pos of poses) {
        let vacant = (pos.lookFor("creep").length == 0);
        if (creep.pos.x == pos.x && creep.pos.y == pos.y) {
            return 2;
        }
        if (vacant && !(inposition && creep.pos.getRangeTo(pos) > 1)) {
            movetopos(creep, pos, 0, moveoptions);
            return 0;
        }
    }
    return 1;
}
export function trymovetopos(creep: Creep, pos: RoomPosition, moveoptions: type_movetopos_options = {}) {
    //return 0 if successfully moving to position, 1 if no vacance left, 2 if already at position
    let out = movetoposexceptoccupied(creep, [pos], moveoptions);
    if (out == 1) {
        movetopos(creep, pos, 1, moveoptions);
        return 1;
    }
    return out;
}
export function charge_list(creep: Creep, obj_list: AnyStoreStructure[], bydistance = false) {
    if (obj_list.length == 0) {
        return 1;
    }
    var sort_list: number[];
    if (bydistance) {
        sort_list = obj_list.map((obj) => -creep.pos.getRangeTo(obj.pos));
    } else {
        sort_list = obj_list.map((obj) => ( < GeneralStore > obj.store).getFreeCapacity("energy"));
    }
    var arg_max = mymath.argmax(sort_list);
    var obj_max = obj_list[arg_max];
    if (creep.transfer(obj_max, "energy") == ERR_NOT_IN_RANGE) {
        movetopos(creep, obj_max.pos, 1);
    }
    return 0;
}

export function movetopos_maincarrier(creep: Creep, pos: RoomPosition, range: number, options: type_movetopos_options = {}) {
	let costmatrix = functions.get_costmatrix_road(creep.room.name).clone()
	let conf_maincarrier = config.conf_rooms[creep.room.name].maincarrier;
	for (let xy of conf_maincarrier.working_zone) {
		costmatrix.set(xy[0], xy[1], 1);
	}
	return movetopos(creep, pos, range, {...options, ...{costmatrix: costmatrix}});
}

export function charge_all(creep: Creep, moveoptions: type_movetopos_options = {}): number {
    // 0: found, 1: not found
	if (creep.memory.current_filling_target == undefined) {
		let game_memory = Game.memory[creep.room.name];
		let store_list = global.memory[creep.room.name].energy_filling_list.map((id) => Game.getObjectById(id));
		if (store_list.length == 0) {
			return 1;
		}
		let distance = store_list.map((e) => creep.pos.getRangeTo(e));
		let argmin = mymath.argmin(distance);
		let obj = store_list[argmin];
		creep.memory.current_filling_target = obj.id;
		if (creep.transfer(obj, "energy") == ERR_NOT_IN_RANGE) {
			movetopos(creep, obj.pos, 1, moveoptions);
		}
	} else {
		let obj = Game.getObjectById(creep.memory.current_filling_target);
		if (obj == undefined || (<GeneralStore>obj.store).getFreeCapacity("energy") == 0) {
			delete creep.memory.current_filling_target;
			charge_all(creep, moveoptions);
		} else {
			if (creep.transfer(obj, "energy") == ERR_NOT_IN_RANGE) {
				movetopos(creep, obj.pos, 1, moveoptions);
			}
		}
	}
    return 0;
}

export function harvest_source(creep: Creep, source: Source | Mineral, moveoptions: type_movetopos_options = {}) {
    // 0: harvester, 1: move
    let output = creep.harvest(source);
    if (output == ERR_NOT_IN_RANGE) {
        movetopos(creep, source.pos, 1, moveoptions);
        return 1;
    }
    return 0;
}

export function withdraw(creep: Creep, structure: AnyStoreStructure, resourceType: ResourceConstant, options: {
    left ? : number,
	exact ? : boolean,
    moveoptions ? : type_movetopos_options,
	max_amount ?: number,
	pickup ?: boolean,
} = {}) {
    // -1: not doing anything, 0: move, 1: withdraw
    if (options.moveoptions == undefined) {
        options.moveoptions = {};
    }
	if (creep.pos.getRangeTo(structure) > 1) {
		movetopos(creep, structure.pos, 1, options.moveoptions);
		return 0;
	} else {
		if (options.left == undefined) {
			options.left = 0;
		}
		if (options.exact == undefined) {
			options.exact = false;
		}
		if (options.max_amount == undefined) {
			options.max_amount = creep.store.getFreeCapacity(resourceType);
		}
		let amount = ( < GeneralStore > structure.store).getUsedCapacity(resourceType);
		if (amount < options.left) {
			return -1;
		}
		if (options.exact && amount - options.left < creep.store.getFreeCapacity(resourceType)) {
			return -1;
		}
		creep.withdraw(structure, resourceType, Math.min(amount - options.left, options.max_amount));
	}
}

export function transfer(creep: Creep, structure: AnyStoreStructure | Creep, resourceType: ResourceConstant, options: {
    moveoptions ? : type_movetopos_options
} = {}) {
    // 0: transfer, 1: move
    if (options.moveoptions == undefined) {
        options.moveoptions = {};
    }
    let output = creep.transfer(structure, resourceType);
    if (output == ERR_NOT_IN_RANGE) {
        movetopos(creep, structure.pos, 1, options.moveoptions);
        return 1;
    }
    return 0;
}
export function upgrade_controller(creep: Creep, controller: StructureController, moveoptions: type_movetopos_options = {}) {
	if (creep.pos.getRangeTo(controller) <= 3) {
		creep.upgradeController(controller);
	} else {
		movetopos(creep, controller.pos, 3, moveoptions)
	}
}

export function build_structure(creep: Creep, moveoptions: type_movetopos_options = {}, options: {priority_list ?: StructureConstant[]} = {}) {
    // 0: found, 1: not found
	if (options.priority_list == undefined) {
		options.priority_list = [];
	}
    let targets = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
	if (targets.length == 0) {
		return 1;
	}
	if (creep.memory.current_building_target == undefined) {
		for (let structureType of options.priority_list) {
			let prior_targets = targets.filter((e) => e.structureType == structureType);
			if (prior_targets.length > 0) {
				targets = prior_targets;
				break;
			}
		}
		let distance = targets.map((e) => creep.pos.getRangeTo(e));
		let argmin = mymath.argmin(distance);
		let target = targets[argmin];
		creep.memory.current_building_target = target.id;
		if (creep.pos.getRangeTo(target) <= 3) {
			creep.build(target);
		} else {
			movetopos(creep, target.pos, 3, moveoptions);
		}
	} else {
		let target = Game.getObjectById(creep.memory.current_building_target);
		if (target == undefined) {
			delete creep.memory.current_building_target;
		} else {
			if (creep.pos.getRangeTo(target) <= 3) {
				creep.build(target);
			} else {
				movetopos(creep, target.pos, 3, moveoptions);
			}
		}
	}
	return 0;
}
export function select_linkcontainer(creep: Creep, options: {min_energy ?: number, require_safe ?: boolean} = {}): AnyStoreStructure {
	if (options.min_energy == undefined) {
		options.min_energy = 0;
	}
	if (options.require_safe == undefined) {
		options.require_safe = false;
	}
	let energy_storage_list;
	if (options.require_safe) {
		energy_storage_list = global.memory[creep.room.name].energy_storage_list_safe;
	} else {
		energy_storage_list = global.memory[creep.room.name].energy_storage_list;
	}
    let structures: AnyStoreStructure[] = energy_storage_list.map((e) => < AnyStoreStructure > Game.getObjectById(e));
    structures = structures.filter((e) => ( < GeneralStore > e.store).getUsedCapacity("energy") >= options.min_energy);
    if (structures.length == 0) {
        return null;
    }
    let distances = structures.map((e) => creep.pos.getRangeTo(e.pos));
    //var energy = structures.map((e) => e.store["energy"]);
    //var preference = mymath.array_minus(energy, distances * 100);
    let arg = mymath.argmin(distances);
    return structures[arg];
}
export function get_energy(creep: Creep, options: {
    moveoptions ? : type_movetopos_options,
    min_energy ? : number,
    left ? : number,
    cache_time ? : number,
	require_safe ? : boolean,
	max_amount ?: number,
} = {}) {
    // 0: found, 1: not found
    let store_structure: AnyStoreStructure;
	if (creep.memory.next_time == undefined) {
		creep.memory.next_time = {};
	}
	if (creep.memory.next_time.select_linkcontainer == undefined) {
		creep.memory.next_time.select_linkcontainer = Game.time;
	}
    if (Game.time >= creep.memory.next_time.select_linkcontainer) {
		if (options.min_energy == undefined) {
			options.min_energy = creep.store.getFreeCapacity("energy");
		}
		if (options.cache_time == undefined) {
			options.cache_time = 3;
		}
        store_structure = select_linkcontainer(creep, {min_energy: options.min_energy, require_safe: options.require_safe});
        if (store_structure == null) {
            creep.memory.next_time.select_linkcontainer = Game.time + 1;
        } else {
            creep.memory.next_time.select_linkcontainer = Game.time + options.cache_time;
            creep.memory.withdraw_target = store_structure.id;
        }
    } else {
        store_structure = Game.getObjectById(creep.memory.withdraw_target);
    }
    if (store_structure !== null) {
		withdraw(creep, store_structure, "energy", {
			left: options.left,
			moveoptions: options.moveoptions,
			max_amount: options.max_amount
		});
        return 0;
    }
    return 1;
}
export function preferred_container(creep: Creep, preferences: conf_preference): StructureContainer {
    var container_names = Object.keys(preferences).filter((e) => creep.room.container[e] !== undefined && creep.room.container[e].store.getFreeCapacity("energy") >= 300);
	var points = container_names.map((e) => preferences[e] + creep.room.container[e].store.getUsedCapacity("energy"));
    if (points.length > 0) {
        var arg = mymath.argmin(points);
        return creep.room.container[container_names[arg]];
    } else {
        return null;
    }
}
export function return_energy_before_die(creep: Creep, moveoptions: type_movetopos_options = {}) {
    // 0: found, 1: not found
    if (creep.store.getUsedCapacity("energy") == 0) {
        creep.suicide();
        return 0;
    } else {
		if (creep.room.storage !== undefined) {
            transfer(creep, creep.room.storage, "energy", {
                moveoptions: moveoptions
            });
			return 0;
		}
        let linkcontainer = select_linkcontainer(creep, {min_energy: 0});
        if (linkcontainer !== null && ( < GeneralStore > linkcontainer.store).getFreeCapacity("energy") > 0) {
            transfer(creep, linkcontainer, "energy", {
                moveoptions: moveoptions
            });
            return 0;
        } else {
            return 1;
        }
    }
}

function number_of_specific_bodypart_not_boosted(creep: Creep, bodypart: BodyPartConstant, compound: MineralBoostConstant) {
    let parts = creep.body.filter((e) => e.type == bodypart);
    let n_boosted = parts.filter((e) => e.boost == undefined).length;
    return n_boosted;
}
export function process_boost_request(creep: Creep, request: type_creep_boost_request, moveoptions: type_movetopos_options = {}) {
    // return 0 for boost finished, 1 for processing, 2 for energy not enough, 3 for compound not enough, 4 for no lab or terminal
    if (creep.memory.boost_status == undefined) {
        creep.memory.boost_status = {
            boosting: false,
            boost_finished: false,
        }
    }
    if (creep.memory.boost_status.boost_finished) {
        return 0;
    }
    if (!creep.room.lab.B1 || !creep.room.terminal) {
        return 4;
    }
    if (creep.memory.boost_status.boosting) {
        let lab = creep.room.lab.B1;
        if (creep.pos.getRangeTo(lab) > 1) {
            movetopos(creep, lab.pos, 1, moveoptions);
        }
        for (let bodypart of <Array<BodyPartConstant>> Object.keys(request)) {
            let n_not_boosted = number_of_specific_bodypart_not_boosted(creep, bodypart, request[bodypart])
            if (n_not_boosted == 0) {
                continue;
            } else {
				let mineral_left = lab.store.getUsedCapacity(lab.mineralType) - n_not_boosted * 30;
				let energy_left = lab.store.getUsedCapacity("energy") - n_not_boosted * 20;
                if (lab.mineralType == request[bodypart] && mineral_left >= 0 && energy_left >= 0) {
                    let output = lab.boostCreep(creep);
                    if (output == 0) {
						if (mineral_left == 0) {
							Game.memory[creep.room.name].exact_boost = true;
						}
						continue;
                    } else {
						return 1;
					}
                } else {
					creep.room.memory.current_boost_request = {
						compound: request[bodypart],
						amount: n_not_boosted,
						finished: false,
					};
					return 1;
				}
            }
        }
		if (creep.room.memory.current_boost_request == undefined) {
			creep.room.memory.current_boost_request = {
				compound: undefined,
				amount: 0,
				finished: true,
			}
		}
        creep.room.memory.current_boost_request.finished = true;
        delete creep.room.memory.current_boost_creep;
        creep.memory.boost_status.boosting = false;
        creep.memory.boost_status.boost_finished = true;
        return 0;
    } else {
        //check if boost still available
        let n_total_parts = 0;
        for (let temp_bodypart in request) {
            let bodypart = < BodyPartConstant > temp_bodypart;
            let n_parts = creep.body.filter((e) => e.type == bodypart).length;
            if (creep.room.terminal.store.getUsedCapacity(request[bodypart]) < n_parts * 30) {
                // compound not enough
                return 3;
            }
            n_total_parts += n_parts;
        }
        if (creep.room.terminal.store.getUsedCapacity("energy") < n_total_parts * 20) {
            // energy not enough
            return 2;
        } else {
            let lab = creep.room.lab.B1;
            if (creep.pos.isNearTo(lab)) {
                if (creep.room.memory.current_boost_creep == undefined) {
                    creep.room.memory.current_boost_creep = creep.name;
                } else if (creep.room.memory.current_boost_creep !== creep.name) {
                    return 1;
                }
                creep.memory.boost_status.boosting = true;
            } else if (creep.room.memory.current_boost_creep == undefined) {
                movetopos(creep, lab.pos, 1, moveoptions);
            }
            return 1;
        }
    }
}
export function boost_request(creep: Creep, request: type_creep_boost_request, required: boolean, moveoptions: type_movetopos_options = {}) {
    // 0: finished, 1: processing, 2: not found
    if (creep.memory.request_boost == undefined) {
        creep.memory.request_boost = required || functions.is_boost_resource_enough(creep.room.name, functions.boost_request_to_conf_body(creep, request));
    }
    if (!creep.memory.request_boost) {
        return 2;
    }
    let out = process_boost_request(creep, request, moveoptions);
	if (out > 0) {
		return 1;
	} else {
		return 0;
	}
}

export function repair_container(creep: Creep, container: StructureContainer = undefined) {
    // 0: repair, 1: healthy, 2: not found
    if (container == undefined) {
        container = < StructureContainer > creep.pos.lookFor("structure").filter((e) => e.structureType == 'container')[0];
    }
    if (container == undefined) {
        return 2;
    }
    if (container.hitsMax - container.hits >= 10000 && creep.store.getUsedCapacity("energy") >= creep.getActiveBodyparts(WORK) * 5) {
        creep.repair(container);
        return 0;
    }
    return 1;
}
export function ask_for_renew(creep: Creep, moveoptions: type_movetopos_options = {}) {
	//  -1: not necessary, 0: scheduled, 1: cannot find spawn
	let time_add = Math.floor(600/creep.body.length);
	if (creep.ticksToLive > 1500 - time_add) {
		return -1;
	}
    let spawns = global.memory[creep.room.name].spawn_list.map((e) => Game.getObjectById(e)).filter((e) => !e.spawning);
	if (spawns.length == 0) {
		return 1;
	}
    let distances = spawns.map((e) => creep.pos.getRangeTo(e));
    let argmin = mymath.argmin(distances);
    let closest_spawn = spawns[argmin];
    if (creep.pos.isNearTo(closest_spawn)) {
        closest_spawn.renewCreep(creep);
    } else {
        movetopos(creep, closest_spawn.pos, 1, moveoptions);
    }
	return 0;
}
export function fill_and_renew(creep: Creep, moveoptions: type_movetopos_options = {}) {
	//  -2: energy not enough, -1: not necessary, 0: scheduled, 1: cannot find spawn
	let time_add = Math.floor(600/creep.body.length);
	if (creep.ticksToLive > 1500 - time_add) {
		return -1;
	}
    let spawns = global.memory[creep.room.name].spawn_list.map((e) => Game.getObjectById(e)).filter((e) => !e.spawning);
	if (spawns.length == 0) {
		return 1;
	}
    let distances = spawns.map((e) => creep.pos.getRangeTo(e));
    let argmin = mymath.argmin(distances);
    let closest_spawn = spawns[argmin];
    if (creep.pos.isNearTo(closest_spawn)) {
		if (closest_spawn.store.getFreeCapacity("energy") > 0) {
			creep.transfer(closest_spawn, "energy");
		}
        let out = closest_spawn.renewCreep(creep);
		if (out == -6 && creep.store.getUsedCapacity("energy") == 0) {
			return -2;
		}
    } else {
        movetopos(creep, closest_spawn.pos, 1, moveoptions);
    }
	return 0;
}
export function ask_for_recycle(creep: Creep, moveoptions: type_movetopos_options = {}) {
	let container = creep.room.container.RC;
	if (container != undefined) {
		if (creep.pos.isEqualTo(container.pos)) {
			let spawns = global.memory[creep.room.name].spawn_list.map((e) => Game.getObjectById(e)).filter((e) => creep.pos.isNearTo(e));
			spawns[0].recycleCreep(creep);
		} else {
			movetopos(creep, container.pos, 0, moveoptions);
		}
	}
	return 0;
}
export function ask_for_recycle_full(creep: Creep, moveoptions: type_movetopos_options = {}) {
	if (creep.store.getUsedCapacity() > 0) {
		let resource = functions.get_first_resource_type(creep.store);
		let store_structure = creep.room.storage !== undefined ? creep.room.storage : creep.room.container.CT;
		if (store_structure !== undefined) {
			if (store_structure.store.getFreeCapacity() > 0) {
				transfer(creep, store_structure, resource);
			}
		}
		return 0;
	}
	let container = creep.room.container.RC;
	if (container != undefined) {
		let resource = functions.get_first_resource_type(container.store);
		if (container.store.getUsedCapacity() > 0) {
			withdraw(creep, container, resource);
		} else {
			ask_for_recycle(creep);
		}
		return 0;
	}
	return -1;
}
export function unboost(creep: Creep, moveoptions: type_movetopos_options = {}) {
    // negative: unboost return value, 0: success, 1: in progress, 2: container not found, 3: lab not found, 4: cooling down
	let container = creep.room.container.UB;
	if (container == undefined) {
		return 2;
	}
    if (!creep.pos.isEqualTo(container)) {
        movetopos_maincarrier(creep, container.pos, 0, moveoptions);
        return 1;
    }
	if (creep.body.filter((e) => e.boost != undefined).length == 0) {
		creep.suicide();
		return 0;
	}
	for (let lab_name of ['S1', 'S2']) {
		let lab = creep.room.lab[lab_name];
		if (lab == undefined) {
			return 3;
		}
		if (lab.cooldown > 0) {
			continue;
		}
		let out = lab.unboostCreep(creep);
		if (out == 0) {
			creep.room.memory.unboost_withdraw_request = true;
		}
		return out;
	}
	return 4;
}
export function repair_road(creep: Creep, options: {
    range ? : number,
} = {}) {
    if (creep.store.getUsedCapacity("energy") == 0 || creep.getActiveBodyparts(WORK) == 0) {
        return 1;
    }
    if (options.range == undefined) {
        options.range = 1;
    }
    let xmin = Math.max(creep.pos.x - options.range, 0);
    let xmax = Math.min(creep.pos.x + options.range, 49);
    let ymin = Math.max(creep.pos.y - options.range, 0);
    let ymax = Math.min(creep.pos.y + options.range, 49);
    let roads = creep.room.lookForAtArea("structure", ymin, xmin, ymax, xmax, true).map((e) => e.structure).filter((e) => e.structureType == 'road' && e.hitsMax - e.hits >= creep.getActiveBodyparts(WORK) * 100);
	if (roads.length == 0) {
		return 1;
	}
	let ratios = roads.map((e) => e.hits / e.hitsMax);
	let argmin = mymath.argmin(ratios);
	let road = roads[argmin];
	creep.repair(road);
	return 0;
}

export function discard_useless_from_container(creep: Creep, container: StructureContainer, resource_to_keep: ResourceConstant) {
	// 0: working, 1: no work needed, 2: distance is not 1
	if (creep.pos.getRangeTo(container) !== 1) {
		return 2;
	}
	if (creep.store.getUsedCapacity(resource_to_keep) > 0) {
		console.log(`Warning: creep ${creep.name} at room ${creep.room.name} have resource to keep when discarding useless resources at time ${Game.time}`);
		return 1;
	}
	if (creep.store.getUsedCapacity() > 0) {
		let current_resource = _.filter(<Array<ResourceConstant>> Object.keys(creep.store), (e) => creep.store[e] > 0)[0];
		creep.drop(current_resource);
		return 0;
	}
	for (let key of <Array<ResourceConstant>>(Object.keys(container.store))) {
		if (key !== resource_to_keep) {
			creep.withdraw(container, key);
			return 0;
		}
	}
	return 1;
}
export function get_structure_from_carry_end(creep: Creep, carry_end: {
    type: string,
    name: string
}): AnyStoreStructure {
    if (carry_end.type == 'storage') {
        return creep.room.storage;
    } else if (carry_end.type == 'terminal') {
        return creep.room.terminal;
    } else if (carry_end.type == 'link') {
		return creep.room.link[carry_end.name];
    }
}
export function harvest_with_container(creep: Creep, source: Source, container: StructureContainer = undefined) {
    // 0: ok, 1: not adjacent
    if (!creep.pos.isNearTo(source)) {
        return 1;
    }
    if_container: if (container == undefined) {
        let container = < StructureContainer > creep.pos.lookFor("structure").filter((e) => e.structureType == 'container')[0];
        if (container !== undefined) {
            if (repair_container(creep, container) == 0) {
                return 0;
            }
            break if_container;
        }
        let site = creep.pos.lookFor("constructionSite").filter((e) => e.structureType == 'container')[0];
        if (site !== undefined) {
            if (creep.store.getUsedCapacity("energy") >= creep.getActiveBodyparts(WORK) * 5) {
                creep.build(site);
                return 0;
            }
            break if_container;
        }
        creep.pos.createConstructionSite("container");
        break if_container;
    } else if (repair_container(creep, container) == 0) {
		return 0;
	}
    creep.harvest(source);
    return 0;
}

export function waiting_for_spawn(names: string[]) {
	// 0: scheduled, 1: all spawned
	let creeps = names.map((e) => Game.creeps[e]);
	let spawned_creeps = creeps.filter((e) => e !== undefined && !e.spawning);
	if (spawned_creeps.length == creeps.length) {
		return 1;
	} else {
		for (let creep of spawned_creeps) {
			ask_for_renew(creep);
		}
		return 0;
	}
}
