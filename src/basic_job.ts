import * as _ from "lodash";
import * as mymath from "./mymath";
import * as config from "./config";
import * as external_room from "./external_room";
import * as functions from "./functions";

var vision_options: any = {
    visualizePathStyle: {}
};

export function movetopos(creep: Creep | PowerCreep, pos: RoomPosition, range: number, options: type_movetopos_options = {}): number {
	// 0: moving, 1: already arrived, 2: not in the same room
    if (creep.pos.getRangeTo(pos) <= range) {
        return 1;
    }
	if (creep.room.name !== pos.roomName) {
		return 2;
	}
    let name_of_this_function = "movetopos";
    if (Game.tick_cpu[name_of_this_function] == undefined) {
        Game.tick_cpu[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();

    let regenerate_path;
    if (options.setmovable == undefined) {
        options.setmovable = true;
    }
    let costmatrix = options.costmatrix;
    if (costmatrix == undefined) {
        costmatrix = functions.get_costmatrix_road(creep.room.name);
    }
    out: if (creep.memory.stored_path !== undefined && creep.memory.stored_path.time_left > 0) {
        let stored_path = creep.memory.stored_path;
        let target_pos = new RoomPosition(stored_path.target_xy[0], stored_path.target_xy[1], stored_path.target_room);
        if (pos.isEqualTo(target_pos) && range == stored_path.range) {
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
            if (costmatrix == undefined) {
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
        if (costmatrix == undefined) {
            costmatrix = functions.get_costmatrix_road(creep.room.name);
        }
        let pathfinderoptions = {
            //visualizePathStyle: {},
            maxRooms: 1,
            roomCallback: function(room_name: string) {
                return costmatrix;
            },
        };
		let name_of_this_function = "pathfinder";
		if (Game.tick_cpu[name_of_this_function] == undefined) {
			Game.tick_cpu[name_of_this_function] = 0
		}
		let cpu_used = Game.cpu.getUsed();

        let path = PathFinder.search(creep.pos, {
            pos: pos,
            range: range
        }, pathfinderoptions);

		Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;

        creep.memory.stored_path = {
            "path": path.path.map(function(e) {
                return [e.x, e.y];
            }),
            "target_room": pos.roomName,
            "target_xy": [pos.x, pos.y],
            "time_left": 8,
            "range": range,
            "moveoptions": {
                "setmovable": options.setmovable
            },
        };
    } else {
        creep.memory.stored_path.time_left -= 1;
    }
    let path_pos = creep.memory.stored_path.path.slice(0, 1).map((e) => creep.room.getPositionAt(e[0], e[1]));
    Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;

	// cross
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
    } else {
        if (options.setmovable) {
            creep.memory.movable = true;
        }
    }
    return 0;
}

export function move_with_path_in_memory(creep: Creep) {
    // 0: moving, 1: fail to move
	let stored_path = creep.memory.stored_path;
	if (stored_path == undefined) {
		return 1;
	}
	let target_pos = new RoomPosition(stored_path.target_xy[0], stored_path.target_xy[1], stored_path.target_room);
	let out = movetopos(creep, target_pos, stored_path.range, stored_path.moveoptions);
	return out;
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
        movetopos(creep, obj_max.pos, 1);
    }
    return 0;
}

export function charge_all(creep: Creep, moveoptions: type_movetopos_options = {}): number {
    // 0: found, 1: not found
    if (creep.room.memory.energy_filling_list.length == 0) {
        return 1;
    }
    let game_memory = Game.memory[creep.room.name];
    let store_list = creep.room.memory.energy_filling_list.map((id) => Game.getObjectById(id));
    let distance = store_list.map((e) => creep.pos.getRangeTo(e));
    let argmin = mymath.argmin(distance);
    let obj = store_list[argmin];
    if (creep.transfer(obj, "energy") == ERR_NOT_IN_RANGE) {
        movetopos(creep, obj.pos, 1, moveoptions);
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

export function withdraw(creep: Creep, structure: AnyStoreStructure, options: {
    left ? : number,
    sourcetype ? : ResourceConstant,
    moveoptions ? : type_movetopos_options
} = {}) {
    // 0: move, 1: withdraw
    if (options.left == undefined) {
        options.left = 0;
    }
    if (options.sourcetype == undefined) {
        options.sourcetype = "energy";
    }
    if (options.moveoptions == undefined) {
        options.moveoptions = {};
    }
    let amount = ( < GeneralStore > structure.store).getUsedCapacity(options.sourcetype);
    if (amount >= options.left) {
        var output = creep.withdraw(structure, options.sourcetype, Math.min(amount - options.left, creep.store.getFreeCapacity(options.sourcetype)));
        if (output == ERR_NOT_IN_RANGE) {
            movetopos(creep, structure.pos, 1, options.moveoptions);
            return 0;
        } else if (output !== 0) {
            return 1;
        }
    } else {
        return 1;
    }
}

export function transfer(creep: Creep, structure: AnyStoreStructure | Creep, options: {
    sourcetype ? : ResourceConstant,
    moveoptions ? : type_movetopos_options
} = {}) {
    // 0: transfer, 1: move
    if (options.sourcetype == undefined) {
        options.sourcetype = "energy";
    }
    if (options.moveoptions == undefined) {
        options.moveoptions = {};
    }
    let output = creep.transfer(structure, options.sourcetype);
    if (output == ERR_NOT_IN_RANGE) {
        movetopos(creep, structure.pos, 1, options.moveoptions);
        return 1;
    }
    return 0;
}
export function upgrade_controller(creep: Creep, controller: StructureController, moveoptions: type_movetopos_options = {}) {
    let output = creep.upgradeController(controller);
    if (output == ERR_NOT_IN_RANGE) {
        movetopos(creep, controller.pos, 1, moveoptions);
    }
}

export function build_structure(creep: Creep, moveoptions: type_movetopos_options = {}): number {
    // 0: found, 1: not found
    let targets = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
    if (targets.length > 0) {
        let distance = targets.map((e) => creep.pos.getRangeTo(e));
        let argmin = mymath.argmin(distance);
        let target = targets[argmin];
        if (creep.build(target) == ERR_NOT_IN_RANGE) {
            movetopos(creep, target.pos, 1, moveoptions)
        }
        return 0;
    }
    return 1;
}
export function select_linkcontainer(creep: Creep, min_energy: number = 0): AnyStoreStructure {
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
export function get_energy(creep: Creep, options: {
    moveoptions ? : type_movetopos_options,
    min_energy ? : number,
    left ? : number,
    cache_time ? : number,
} = {}) {
    // 0: found, 1: not found
    if (options.moveoptions == undefined) {
        options.moveoptions = {};
    }
    if (options.min_energy == undefined) {
        options.min_energy = creep.store.getFreeCapacity("energy");
    }
    if (options.left == undefined) {
        options.left = 0;
    }
    if (options.cache_time == undefined) {
        options.cache_time = 3;
    }
    if (creep.memory.next_time == undefined) {
        creep.memory.next_time = {};
    }
    if (creep.memory.next_time.select_linkcontainer == undefined) {
        creep.memory.next_time.select_linkcontainer = Game.time;
    }
    let store_structure: AnyStoreStructure;
    if (Game.time >= creep.memory.next_time.select_linkcontainer) {
        store_structure = select_linkcontainer(creep, options.min_energy);
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
        withdraw(creep, store_structure, {
            left: options.left,
            moveoptions: options.moveoptions
        });
        return 0;
    }
    return 1;
}
export function preferred_container(creep: Creep, containers_status: type_named_structures_status < StructureContainer > , preferences: conf_preference[]): StructureContainer {
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
export function return_energy_before_die(creep: Creep, moveoptions: type_movetopos_options = {}) {
    // 0: found, 1: not found
    if (creep.store.getUsedCapacity("energy") == 0) {
        creep.suicide();
        return 0;
    } else {
        let linkcontainer = select_linkcontainer(creep, 0);
        if (linkcontainer !== null && ( < GeneralStore > linkcontainer.store).getFreeCapacity("energy") > 0) {
            transfer(creep, linkcontainer, {
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
export function process_boost_request(creep: Creep, request: type_creep_boost_request, moveoptions: type_movetopos_options = {}): number {
    // return 0 for boost finished, 1 for processing, 2 for energy not enough, 3 for compound not enough, 4 for no lab or terminal
    if (!creep.room.memory.named_structures_status.lab.B1.finished || !creep.room.terminal) {
        return 4;
    }
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
            movetopos(creep, lab.pos, 1, moveoptions);
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
                movetopos(creep, lab.pos, 1, moveoptions);
            }
            return 1;
        }
    }
}
export function boost_request(creep: Creep, request: type_creep_boost_request, required: boolean, moveoptions: type_movetopos_options = {}): number {
    // 0: finished, 1: processing, 2: not found
    if (creep.memory.request_boost == undefined) {
        creep.memory.request_boost = true;
    }
    if (!creep.memory.request_boost) {
        return 2;
    }
    let out = process_boost_request(creep, request, moveoptions);
    if (required) {
        if (out > 0) {
            return 1;
        } else {
            return 0;
        }
    } else {
        if (out > 1) {
            creep.memory.request_boost = false;
            return 2;
        } else {
            return out;
        }
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
    if (container.hitsMax - container.hits >= 100000 && creep.store.getUsedCapacity("energy") >= creep.getActiveBodyparts(WORK) * 5) {
        creep.repair(container);
        return 0;
    }
    return 1;
}
export function ask_for_renew(creep: Creep, moveoptions: type_movetopos_options) {
    let metric = config.distance_metric;
    let spawns: StructureSpawn[] = creep.room.memory.spawn_list.map((e) => Game.getObjectById(e));
    let distances = spawns.map((e) => metric(creep.room.name, creep.pos, e.pos));
    let argmin = mymath.argmin(distances);
    let closest_spawn = spawns[argmin];
    if (creep.pos.isNearTo(closest_spawn)) {
        closest_spawn.renewCreep(creep);
    } else {
        movetopos(creep, closest_spawn.pos, 1, moveoptions);
    }
}
export function unboost(creep: Creep, moveoptions: type_movetopos_options) {
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
        movetopos(creep, container.pos, 0, moveoptions);
        return 1;
    } else {
        let out = lab.unboostCreep(creep);
        return out;
    }
}
export function repair_road(creep: Creep, options: {
    range ? : number,
    factor ? : number
} = {}): number {
    if (creep.store.getUsedCapacity("energy") == 0 || creep.getActiveBodyparts(WORK) == 0) {
        return 1;
    }
    if (options.factor == undefined) {
        options.factor = 0.8;
    }
    if (options.range == undefined) {
        options.range = 1;
    }
    let xmin = Math.max(creep.pos.x - options.range, 0);
    let xmax = Math.min(creep.pos.x + options.range, 49);
    let ymin = Math.max(creep.pos.y - options.range, 0);
    let ymax = Math.min(creep.pos.y + options.range, 49);
    let road = creep.room.lookForAtArea("structure", ymin, xmin, ymax, xmax, true).map((e) => e.structure).filter((e) => e.structureType == 'road' && e.hits < e.hitsMax * options.factor)[0];
    if (road !== undefined) {
        creep.repair(road);
        return 0;
    }
    return 1;
}
export function get_structure_from_carry_end(creep: Creep, carry_end: {
    type: string,
    name: string
}): AnyStoreStructure {
    if (carry_end.type == 'storage') {
        return creep.room.storage;
    } else if (carry_end.type == 'termina') {
        return creep.room.terminal;
    } else if (carry_end.type == 'link') {
        let link_status = creep.room.memory.named_structures_status.link[carry_end.name];
        if (link_status == undefined || !link_status.finished) {
            return null;
        }
        let link = Game.getObjectById(link_status.id);
        return link;
    }
}
export function harvest_with_container(creep: Creep, source: Source, status: {
    id ? : Id < StructureContainer > ,
    finished ? : boolean,
    exists ? : boolean
} = undefined): number {
    // 0: ok, 1: not adjacent
    if (!creep.pos.isNearTo(source)) {
        return 1;
    }
    if_container: if (status == undefined) {
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
    } else {
        if (status.finished) {
            let container = Game.getObjectById(status.id)
            if (repair_container(creep, container) == 0) {
                return 0;
            }
        } else if (status.exists) {
            let site = creep.pos.lookFor("constructionSite")[0]
            if (creep.store.getUsedCapacity("energy") >= creep.getActiveBodyparts(WORK) * 5) {
                creep.build(site);
                return 0;
            }
        } else {
            creep.pos.createConstructionSite("container");
        }
    }
    creep.harvest(source);
    return 0;
}
