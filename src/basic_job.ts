import * as _ from "lodash";
import * as mymath from "./mymath";
import * as config from "./config";
import * as external_room from "./external_room";
import * as functions from "./functions";

var moveoptions = {
    reusePath: 5,
    //visualizePathStyle: {},
    maxRooms: 1,
    costCallback: functions.avoid_exits,
};


var vision_options: any = {
    visualizePathStyle: {}
};

export function movetopos(creep: Creep | PowerCreep, pos: RoomPosition, range: number, costmatrix: CostMatrix = null) {
    let name_of_this_function = "movetopos"
    if (Game.tick_cpu[name_of_this_function] == undefined) {
        Game.tick_cpu[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();
    let regenerate_path;
	if (costmatrix == null) {
		costmatrix = functions.get_costmatrix_road(creep.room.name);
	}
    out: if (creep.memory.stored_path !== undefined && creep.memory.stored_path.time_left > 0) {
        let target = creep.memory.stored_path.target;
        if (pos.isEqualTo(target[0], target[1])) {
            let path = creep.memory.stored_path.path;
            if (path.length == 0) {
                regenerate_path = true;
                //console.log(creep.room.name, creep.memory.role, "Regenerating path because path is wrong");
                break out;
            }
            let last_xy = path.slice(-1)[0];
            if (pos.getRangeTo(last_xy[0], last_xy[1]) > range) {
                regenerate_path = true;
                //console.log(creep.room.name, creep.memory.role, "Regenerating path because path is wrong");
                break out;
            }
            let arg_pos;
            let i = 0;
			if (creep.pos.isEqualTo(path[0][0], path[0][1])) {
				creep.memory.stored_path.path = creep.memory.stored_path.path.slice(1);
				path = creep.memory.stored_path.path;
			}
            if (path.length == 0) {
                regenerate_path = true;
                //console.log(creep.room.name, creep.memory.role, "Regenerating path because path is wrong");
                break out;
            }
			if (!creep.pos.isNearTo(path[0][0], path[0][1])) {
				regenerate_path = true;
				//console.log(creep.room.name, creep.memory.role, "Regenerating path because path is wrong");
				break out;
			}
			let next_xy = path[0];
			if (costmatrix == null) {
				costmatrix = functions.get_costmatrix_road(creep.room.name);
			}
			if (costmatrix.get(next_xy[0], next_xy[1]) !== 255) {
				regenerate_path = false;
				break out;
			} else {
				regenerate_path = true;
				//console.log(creep.room.name, creep.memory.role, "Regenerating path because blocked");
				break out;
			}
        } else {
            regenerate_path = true;
            //console.log(creep.room.name, creep.memory.role, "Regenerating path because target changed");
            break out;
        }
    }
    else {
        regenerate_path = true;
		//console.log(creep.room.name, creep.memory.role, "Regenerating path because long time passed");
    }
    if (regenerate_path) {
		if (costmatrix == null) {
			costmatrix = functions.get_costmatrix_road(creep.room.name);
		}
        let pathfinderoptions = {
            //visualizePathStyle: {},
            maxRooms: 1,
            roomCallback: function(room_name: string) {
                return costmatrix;
            },
        };
        let path = PathFinder.search(creep.pos, {
            pos: pos,
            range: range
        }, pathfinderoptions);
        creep.memory.stored_path = {
            "path": path.path.map(function(e) {
                return [e.x, e.y];
            }),
            "target": [pos.x, pos.y],
            "time_left": 8,
        };
    } else {
        creep.memory.stored_path.time_left -= 1;
    }
	let path_pos = creep.memory.stored_path.path.slice(0, 1).map((e) => creep.room.getPositionAt(e[0], e[1]));
	if (path_pos.length > 0) {
		let potential_creep = path_pos[0].lookFor("creep")[0]
		if (potential_creep !== undefined && !potential_creep.memory.movable && potential_creep.memory.crossable) {
			potential_creep.moveByPath([creep.pos]);
		}
		let potential_pc = path_pos[0].lookFor("powerCreep")[0]
		if (potential_pc !== undefined && !potential_pc.memory.movable && potential_pc.memory.crossable) {
			potential_pc.moveByPath([creep.pos]);
		}
	}
    if (creep.moveByPath(path_pos) == ERR_NOT_FOUND) {
        console.log("Creep moving outside path!");
        //console.log(JSON.stringify(creep.pos), creep.memory.stored_path.path);
        creep.memory.stored_path.time_left = 0;
    }
    Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
}

export function moveto_stayxy(creep: Creep, xy: number[]) {
    let stay_pos = creep.room.getPositionAt(xy[0], xy[1]);
    if (stay_pos.lookFor("creep").length == 0) {
        if (creep.pos.getRangeTo(xy[0], xy[1]) > 0) {
            creep.memory.movable = true;
            movetopos(creep, stay_pos, 0);
        } else {
            creep.memory.movable = false;
        }
    } else {
        if (creep.pos.getRangeTo(xy[0], xy[1]) > 1) {
            creep.memory.movable = true;
            movetopos(creep, stay_pos, 1);
        } else {
            creep.memory.movable = false;
        }
    }
}
export function movetoposexceptoccupied(creep: Creep, poses: RoomPosition[]) {
    //return 0 if successfully moving to position, 1 if no vacance left, 2 if already at position
    let inposition = false;
    for (var pos of poses) {
        if (creep.pos.x == pos.x && creep.pos.y == pos.y) {
            inposition = true;
        }
    }
    for (var pos of poses) {
        var obj_list = creep.room.lookAt(pos.x, pos.y);
        var vacant = (obj_list.filter((e) => e.type == 'creep').length == 0);
        if (creep.pos.x == pos.x && creep.pos.y == pos.y) {
            return 2;
        }
        if (vacant && !(inposition && creep.pos.getRangeTo(pos) > 1)) {
			if (config.conf_rooms[creep.room.name] !== undefined) {
				movetopos(creep, pos, 0);
			} else {
				creep.moveTo(pos.x, pos.y, moveoptions);
			}
            return 0;
        }
    }
    return 1;
}
export function charge_list(creep: Creep, obj_list: AnyStoreStructure[], bydistance = false) {
    var metric = config.distance_metric;
    if (obj_list.length == 0) {
        return 1;
    }
    var sort_list: number[];
    if (bydistance) {
        sort_list = obj_list.map((obj) => -metric(creep.room.name, creep.pos, obj.pos));
    } else {
        sort_list = obj_list.map((obj) => ( < GeneralStore > obj.store).getFreeCapacity("energy"));
    }
    var arg_max = mymath.argmax(sort_list);
    var obj_max = obj_list[arg_max];
    if (creep.transfer(obj_max, "energy") == ERR_NOT_IN_RANGE) {
        creep.moveTo(obj_max, moveoptions);
    }
    return 0;
}

export function charge_all(creep: Creep, doaction: boolean = true): number {
    var metric = config.distance_metric;
    let game_memory = Game.memory[creep.room.name];
    let store_list: AnyStoreStructure[] = creep.room.memory.energy_filling_list.map((id) => Game.getObjectById(id));
    store_list = store_list.filter((e) => ( < GeneralStore > e.store).getFreeCapacity("energy") > 0);
    let tower_list: StructureTower[] = creep.room.memory.tower_list.map((id) => Game.getObjectById(id));
    tower_list = tower_list.filter((e) => e.store.getFreeCapacity("energy") > 400);
    let distance = store_list.map((e) => metric(creep.room.name, creep.pos, e.pos)).concat(tower_list.map((e) => metric(creep.room.name, creep.pos, e.pos)));
    if (distance.length == 0) {
        return 1;
    }
    if (!doaction) {
        return 0;
    }
    let argsort = mymath.argsort(distance);
    let obj;
    if (argsort[0] >= store_list.length) {
        obj = tower_list[argsort[0] - store_list.length];
    } else {
        obj = store_list[argsort[0]];
    }
    if (creep.transfer(obj, "energy") == ERR_NOT_IN_RANGE) {
        movetopos(creep, obj.pos, 1);
    } else {
        let obj2;
        if (argsort.length > 1 && distance[argsort[1]] > 1) {
            if (argsort[1] >= store_list.length) {
                obj2 = tower_list[argsort[1] - store_list.length];
            } else {
                obj2 = store_list[argsort[1]];
            }
        }
        if (doaction && obj2 !== undefined) {
			movetopos(creep, obj2.pos, 1);
        }
    }
    return 0;
}

export function harvest_source(creep: Creep, source: Source | Mineral) {
    var output = creep.harvest(source);
    if (output == ERR_NOT_IN_RANGE) {
        creep.moveTo(source, moveoptions);
        //movetopos(creep, source.pos);
    }
}

export function withdraw_energy(creep: Creep, structure: AnyStoreStructure, left: number = 0, sourcetype: ResourceConstant = "energy") {
    var energy = ( < GeneralStore > structure.store).getUsedCapacity(sourcetype);
    if (energy >= left) {
        var output = creep.withdraw(structure, sourcetype, Math.min(energy - left, creep.store.getFreeCapacity(sourcetype)));
        if (output == ERR_NOT_IN_RANGE) {
			movetopos(creep, structure.pos, 1);
            return 0;
        } else if (output !== 0) {
            return 1;
        }
    } else {
        return 1;
    }
}

export function transfer_energy(creep: Creep, structure: AnyStoreStructure | Creep, sourcetype: ResourceConstant = "energy") {
    var output = creep.transfer(structure, sourcetype);
    if (output == ERR_NOT_IN_RANGE) {
		movetopos(creep, structure.pos, 1);
        return 1;
    }
    return 0;
}
export function upgrade_controller(creep: Creep, controller: StructureController) {
    var output = creep.upgradeController(controller);
    if (output == ERR_NOT_IN_RANGE) {
        //movetopos(creep, controller.pos);
        creep.moveTo(controller, moveoptions);
    }
}

export function build_structure(creep: Creep): number {
    var metric = config.distance_metric;
    var targets = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
	if (targets.length > 0) {
        var sort_list = Array.from(targets, obj => metric(creep.room.name, creep.pos, obj.pos));
        var arg = mymath.argmin(sort_list);
        var target = targets[arg];
        if (creep.build(target) == ERR_NOT_IN_RANGE) {
            //movetopos(creep, target.pos)
            creep.moveTo(target, moveoptions);
        }
        return 0;
    }
    return 1;
}
export function select_linkcontainer(creep: Creep, min_energy: number = 0): AnyStoreStructure | null {
    var metric = config.distance_metric;
    var structures: AnyStoreStructure[] = creep.room.memory.energy_storage_list.map((e) => < AnyStoreStructure > Game.getObjectById(e));
    structures = structures.filter((e) => ( < GeneralStore > e.store).getUsedCapacity("energy") >= min_energy);
    if (structures.length == 0) {
        return null;
    }
    var distances = structures.map((e) => metric(creep.room.name, creep.pos, e.pos));
    //var energy = structures.map((e) => e.store["energy"]);
    //var preference = mymath.array_minus(energy, distances * 100);
    var arg = mymath.argmin(distances);
    return structures[arg];
}
export function preferred_container(creep: Creep, containers_status: type_named_structures_status < StructureContainer > , preferences: conf_preference[]): StructureContainer | null {
    var finished_preferences = preferences.filter((e) => containers_status[e.container].finished);
    var containers_obj: StructureContainer[] = finished_preferences.map((e) => Game.getObjectById(containers_status[e.container].id));
    //containers_obj = containers_obj.filter((e) => e.store.getFreeCapacity("energy") >= 100);
    let argfilter = mymath.where(containers_obj.map(function(e) {
        return e.store.getFreeCapacity("energy") >= 100;
    }));
    containers_obj = argfilter.map((e) => containers_obj[e]);
    finished_preferences = argfilter.map((e) => finished_preferences[e]);
    var containers_energies = containers_obj.map((e) => e.store.getUsedCapacity("energy"));
    var points = finished_preferences.map((e) => e.points);
    var final_scores = mymath.array_ele_plus(containers_energies, points);
    if (final_scores.length > 0) {
        var arg = mymath.argmin(final_scores);
        return containers_obj[arg];
    } else {
        return null;
    }
}

function number_of_specific_bodypart_not_boosted(creep: Creep, bodypart: BodyPartConstant, compound: MineralBoostConstant) {
    let parts = creep.body.filter((e) => e.type == bodypart);
    let n_boosted = parts.filter((e) => e.boost == undefined).length;
    return n_boosted;
}
export function boost_request(creep: Creep, request: type_creep_boost_request): number {
    //TODO: not able to handle the case that many creeps waiting for boosting
    // return 0 for boost finished, 1 for still requiring boost, 2 for energy not enough, 3 for compound not enough
    if (creep.memory.boost_status == undefined) {
        creep.memory.boost_status = {
            boosting: false,
            boost_finished: false,
        }
    }
    if (creep.memory.boost_status.boost_finished) {
        return 0;
    }
    if (creep.memory.boost_status.boosting) {
        let labs_status = creep.room.memory.named_structures_status.lab;
        let lab_id = labs_status.B1.id;
        let lab = Game.getObjectById(lab_id);
		if (creep.pos.getRangeTo(lab) > 1) { 
			movetopos(creep, lab.pos, 1);
		}
        for (let temp_bodypart in request) {
            let bodypart = < BodyPartConstant > temp_bodypart;
            let n_not_boosted = number_of_specific_bodypart_not_boosted(creep, bodypart, request[bodypart])
            if (n_not_boosted == 0) {
                continue;
            } else {
                if (lab.mineralType == request[bodypart] && lab.store.getUsedCapacity(lab.mineralType) >= n_not_boosted * 30 && lab.store.getUsedCapacity("energy") >= n_not_boosted * 20) {
                    let output = lab.boostCreep(creep);
                    if (output == 0) {
                        return 1;
                    }
                }
                creep.room.memory.current_boost_request = {
                    compound: request[bodypart],
                    amount: n_not_boosted
                };
                return 1;
            }
        }
        delete creep.room.memory.current_boost_request;
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
            let labs_status = creep.room.memory.named_structures_status.lab;
            let lab_id = labs_status.B1.id;
            let lab = Game.getObjectById(lab_id);
            if (creep.pos.isNearTo(lab)) {
                if (creep.room.memory.current_boost_creep == undefined) {
                    creep.room.memory.current_boost_creep = creep.name;
                } else if (creep.room.memory.current_boost_creep !== creep.name) {
                    return 1;
                }
                creep.memory.boost_status.boosting = true;
            } else {
                movetopos(creep, lab.pos, 1);
            }
            return 1;
        }
    }
}

export function repair_container(creep: Creep) {
    let containers = creep.pos.lookFor("structure").filter((e) => e.structureType == 'container')
    if (containers.length > 0 && containers[0].hitsMax - containers[0].hits >= 1000 && creep.store.getUsedCapacity("energy") >= 10) {
        creep.repair(containers[0]);
        return 0;
    }
    return 1;
}
export function ask_for_renew(creep: Creep) {
    let metric = config.distance_metric;
    let spawns: StructureSpawn[] = creep.room.memory.spawn_list.map((e) => Game.getObjectById(e));
    let distances = spawns.map((e) => metric(creep.room.name, creep.pos, e.pos));
    let argmin = mymath.argmin(distances);
    let closest_spawn = spawns[argmin];
    if (creep.pos.isNearTo(closest_spawn)) {
        closest_spawn.renewCreep(creep);
    } else {
        creep.moveTo(closest_spawn, moveoptions);
    }
}
export function unboost(creep: Creep) {
	// negative: unboost return value, 0: success, 1: in progress, 2: container not found, 3: lab not found
	let container_status = creep.room.memory.named_structures_status.container.Lab;
	let lab_status = creep.room.memory.named_structures_status.lab.B1;
	if (!container_status.finished) {
		return 2;
	}
	if (!lab_status.finished) {
		return 3;
	}
	let container = Game.getObjectById(container_status.id);
	let lab = Game.getObjectById(lab_status.id);
	if (!creep.pos.isEqualTo(container)) {
		movetopos(creep, container.pos, 0);
		return 1;
	} else {
		let out = lab.unboostCreep(creep);
		return out;
	}
}
