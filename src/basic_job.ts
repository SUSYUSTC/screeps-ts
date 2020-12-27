import * as _ from "lodash";
import * as mymath from "./mymath";
import * as config from "./config";

var vision_options: any = {
    visualizePathStyle: {}
};

export function charge_list(creep: Creep, obj_list: AnyStorageStructure[], bydistance = false) {
    var metric = config.distance_metric;
    if (obj_list.length == 0) {
        return 1;
    }
    var sort_list: number[];
    if (bydistance) {
        sort_list = obj_list.map((obj) => -metric(creep.room.name, creep.pos, obj.pos));
    } else {
        sort_list = obj_list.map((obj) => obj.store.getFreeCapacity("energy"));
    }
    var arg_max = mymath.argmax(sort_list);
    var obj_max = obj_list[arg_max];
    if (creep.transfer(obj_max, "energy") == ERR_NOT_IN_RANGE) {
		creep.moveTo(obj_max, {maxRooms: 0});
    }
    return 0;
}

export function charge_all(creep: Creep, doaction: boolean = true) {
    var store_list: AnyStorageStructure[] = creep.room.memory.storage_list.map((id) => Game.getObjectById(id));
    if (store_list.length > 0) {
        store_list = store_list.filter((e) => e.store.getFreeCapacity("energy") > 0);
        if (store_list.length > 0) {
            if (doaction) {
                var output = charge_list(creep, store_list, true);
            }
            return 0;
        }
    }
    var tower_list: StructureTower[] = creep.room.memory.tower_list.map((id) => Game.getObjectById(id));
    if (tower_list.length > 0) {
        tower_list = tower_list.filter((e) => e.store.getFreeCapacity("energy") >= 200);
        if (tower_list.length > 0) {
            if (doaction) {
                var output = charge_list(creep, tower_list, true);
            }
            return 0;
        }
    }
    return 1;
}

export function harvest_source(creep: Creep, source: Source | Mineral) {
    var output = creep.harvest(source);
    if (output == ERR_NOT_IN_RANGE) {
        movetopos(creep, source.pos);
    }
}

export function withdraw_energy(creep: Creep, structure: AnyStorageStructure, lower_limit: number = 0, sourcetype: ResourceConstant = "energy") {
    if (creep.ticksToLive <= 30) {
        return 10;
    }
    var energy = structure.store.getUsedCapacity(sourcetype);
    if (energy >= lower_limit) {
        var output = creep.withdraw(structure, sourcetype, Math.min(energy - lower_limit, creep.store.getFreeCapacity(sourcetype)));
        if (output == ERR_NOT_IN_RANGE) {
            movetopos(creep, structure.pos);
        }
    }
    return 0;
}

export function transfer_energy(creep: Creep, structure: AnyStorageStructure | Creep, sourcetype: ResourceConstant = "energy") {
    var output = creep.transfer(structure, sourcetype);
    if (output == ERR_NOT_IN_RANGE) {
        movetopos(creep, structure.pos);
        return 1;
    }
    return 0;
}
export function upgrade_controller(creep: Creep, controller: StructureController) {
    var output = creep.upgradeController(controller);
    if (output == ERR_NOT_IN_RANGE) {
        movetopos(creep, controller.pos);
    }
}

export function build_structure(creep: Creep): number {
    var metric = config.distance_metric;
    var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
    if (targets.length) {
        var sort_list = Array.from(targets, obj => metric(creep.room.name, creep.pos, obj.pos));
        var arg = mymath.argmin(sort_list);
        var target = targets[arg];
        if (creep.build(target) == ERR_NOT_IN_RANGE) {
            movetopos(creep, target.pos)
        }
        return 0;
    }
    return 1;
}
export function select_linkcontainer (creep: Creep, min_energy: number = 0, allow_link: boolean = true): AnyStorageStructure | null {
    var metric = config.distance_metric;
    if (allow_link) {
        var allowed_structures = ['container', 'link', 'storage', 'terminal'];
    } else {
        var allowed_structures = ['container', 'storage', 'terminal'];
    }
	var temp_structures: Structure[] = _.filter(creep.room.find(FIND_STRUCTURES), (e) => allowed_structures.includes(e.structureType));
	var structures: AnyStorageStructure[] = temp_structures.map((e) => <AnyStorageStructure> e);
    structures = structures.filter((e) => e.store.getUsedCapacity("energy") >= min_energy);
    if (structures.length == 0) {
        return null;
    }
    var distances = structures.map((e) => metric(creep.room.name, creep.pos, e.pos));
    //var energy = structures.map((e) => e.store["energy"]);
    //var preference = mymath.array_minus(energy, distances * 100);
    var arg = mymath.argmin(distances);
    return structures[arg];
}
export function preferred_container (creep: Creep, containers: conf_containers, preferences: conf_preference[]) {
    var finished_preferences = preferences.filter((e) => containers[e.container].finished);
    var containers_obj: StructureContainer[] = finished_preferences.map((e) => Game.getObjectById(containers[e.container].id));
    var containers_energies = containers_obj.map((e) => e.store.getUsedCapacity("energy"));
    var points = finished_preferences.map((e) => e.points);
    var final_scores = mymath.array_ele_plus(containers_energies, points);
    var arg = mymath.argmin(final_scores);
    return containers_obj[arg];
}

export function ask_for_renew (creep: Creep) {
	var metric = config.distance_metric;
	var spawns: StructureSpawn[] = creep.room.memory.spawn_list.map((e) => Game.getObjectById(e));
    var distances = spawns.map((e) => metric(creep.room.name, creep.pos, e.pos));
    var argmin = mymath.argmin(distances);
    var closest_spawn = spawns[argmin];
    if (creep.pos.isNearTo(closest_spawn)) {
        closest_spawn.renewCreep(creep);
    } else {
        creep.moveTo(closest_spawn, {maxRooms: 0});
    }
}

export function movetopos (creep: Creep, pos: RoomPosition, plot: boolean = false) {
    if (plot) {
        creep.moveTo(pos.x, pos.y, {
            reusePath: 2,
            visualizePathStyle: {},
			maxRooms: 0
        });
    } else {
        creep.moveTo(pos.x, pos.y, {
            reusePath: 2,
			maxRooms: 0
        });
    }
}
export function movetoposexceptoccupied (creep: Creep, poses: RoomPosition[]) {
    for (var pos of poses) {
        if (creep.pos.x == pos.x && creep.pos.y == pos.y) {
            return 2;
        }
        var obj_list = creep.room.lookAt(pos.x, pos.y);
        if (obj_list.filter((e) => e.type == 'creep').length == 0) {
            movetopos(creep, pos);
            return 0;
        }
    }
    return 1;
}
/*
module.exports.charge_list = charge_list;
module.exports.charge_all = charge_all;
module.exports.harvest_source = harvest_source;
module.exports.withdraw_energy = withdraw_energy;
module.exports.transfer_energy = transfer_energy;
module.exports.upgrade_controller = upgrade_controller;
module.exports.build_structure = build_structure;
module.exports.select_linkcontainer = select_linkcontainer;
module.exports.preferred_container = preferred_container;
module.exports.ask_for_renew = ask_for_renew;
module.exports.movetopos = movetopos;
module.exports.movetoposexceptoccupied = movetoposexceptoccupied;
 */
