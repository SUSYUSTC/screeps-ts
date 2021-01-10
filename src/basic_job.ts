import * as _ from "lodash";
import * as mymath from "./mymath";
import * as config from "./config";
import * as external_room from "./external_room";
import * as functions from "./functions";

var moveoptions = {
	reusePath: 5,
	//visualizePathStyle: {},
	maxRooms: 0,
	costCallback: functions.avoid_exits,
};

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
		creep.moveTo(obj_max, moveoptions);
    }
    return 0;
}

export function charge_all(creep: Creep, doaction: boolean = true): number {
    var metric = config.distance_metric;
    let store_list: AnyStorageStructure[] = creep.room.memory.storage_list.map((id) => Game.getObjectById(id));
	store_list = store_list.filter((e) => e.store.getFreeCapacity("energy") > 0 );
    let tower_list: StructureTower[] = creep.room.memory.tower_list.map((id) => Game.getObjectById(id));
	tower_list = tower_list.filter((e) => e.store.getFreeCapacity("energy") > 400 );
	let distance = store_list.map((e) => metric(creep.room.name, creep.pos, e.pos)).concat(tower_list.map((e) => metric(creep.room.name, creep.pos, e.pos)));
	if (distance.length == 0) {
		return 1;
	}
	if (!doaction) {
		return 0;
	}
	let argsort = mymath.argsort(distance);
	let obj;
	if (argsort[0]>=store_list.length) {
		obj = tower_list[argsort[0]-store_list.length];
	}
	else {
		obj = store_list[argsort[0]];
	}
	if (creep.transfer(obj, "energy") == ERR_NOT_IN_RANGE) {
		creep.moveTo(obj, moveoptions);
	}
	else {
		let obj2;
		if (argsort.length>1 && distance[argsort[1]]>1) {
			if (argsort[1]>=store_list.length) {
				obj2 = tower_list[argsort[1]-store_list.length];
			}
			else {
				obj2 = store_list[argsort[1]];
			}
		}
		if (doaction) {
			creep.moveTo(obj2, moveoptions);
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

export function withdraw_energy(creep: Creep, structure: AnyStorageStructure, left: number = 0, sourcetype: ResourceConstant = "energy") {
    if (creep.ticksToLive <= 30) {
        return 10;
    }
    var energy = structure.store.getUsedCapacity(sourcetype);
    if (energy >= left) {
        var output = creep.withdraw(structure, sourcetype, Math.min(energy - left, creep.store.getFreeCapacity(sourcetype)));
        if (output == ERR_NOT_IN_RANGE) {
			creep.moveTo(structure, moveoptions);
			//movetopos(creep, structure.pos);
        }
    }
    return 0;
}

export function transfer_energy(creep: Creep, structure: AnyStorageStructure | Creep, sourcetype: ResourceConstant = "energy") {
    var output = creep.transfer(structure, sourcetype);
    if (output == ERR_NOT_IN_RANGE) {
		//movetopos(creep, structure.pos);
		creep.moveTo(structure, moveoptions);
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
    if (targets.length) {
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
export function preferred_container (creep: Creep, containers: conf_containers, preferences: conf_preference[]): StructureContainer | null {
    var finished_preferences = preferences.filter((e) => containers[e.container].finished);
    var containers_obj: StructureContainer[] = finished_preferences.map((e) => Game.getObjectById(containers[e.container].id));
	//containers_obj = containers_obj.filter((e) => e.store.getFreeCapacity("energy") >= 100);
    let argfilter = mymath.where(containers_obj.map(function (e) { return e.store.getFreeCapacity("energy") >= 100; }));
	containers_obj = argfilter.map((e) => containers_obj[e]);
	finished_preferences = argfilter.map((e) => finished_preferences[e]);
    var containers_energies = containers_obj.map((e) => e.store.getUsedCapacity("energy"));
    var points = finished_preferences.map((e) => e.points);
    var final_scores = mymath.array_ele_plus(containers_energies, points);
	if (final_scores.length > 0) {
		var arg = mymath.argmin(final_scores);
		return containers_obj[arg];
	}
	else {
		return null;
	}
}

export function lab_request (creep: Creep, boost_request: type_boost_request, conflabs: conf_lab): StructureLab | null {
	let lab = null;
	for (let labname in conflabs) {
		let conflab = conflabs[labname];
		let match: boolean[] = Object.keys(creep.memory.boost_request).map((e) => conflab[e]==creep.memory.boost_request[e]);
		if (mymath.all(match)) {
			lab = <StructureLab> creep.room.lookForAt("structure", conflab.pos[0], conflab.pos[1])[0];
		}
	}
	return lab;
}

export function repair_container(creep: Creep) {
	let containers = creep.pos.lookFor("structure").filter((e) => e.structureType == 'container')
	if (containers.length > 0 && containers[0].hitsMax - containers[0].hits >= 1000 && creep.store.getUsedCapacity("energy") >= 10) {
		creep.repair(containers[0]);
		return 0;
	}
	return 1;
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
        creep.moveTo(closest_spawn, moveoptions);
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
	let inposition = false;
    for (var pos of poses) {
        if (creep.pos.x == pos.x && creep.pos.y == pos.y) {
			inposition=true;
        }
    }
    for (var pos of poses) {
        var obj_list = creep.room.lookAt(pos.x, pos.y);
		var vacant = (obj_list.filter((e) => e.type == 'creep').length == 0);
        if (creep.pos.x == pos.x && creep.pos.y == pos.y) {
			return 2;
		}
		if (vacant && !(inposition && creep.pos.getRangeTo(pos) > 1)) {
			creep.moveTo(pos.x, pos.y, moveoptions);
            return 0;
        }
    }
    return 1;
}
export function external_flee(creep: Creep, safe_pos: number[]) {
	if (creep.room.name == creep.memory.home_room_name){
		creep.moveTo(safe_pos[0], safe_pos[1], moveoptions);
	}
	else{
		external_room.movethroughrooms(creep, creep.memory.rooms_backwardpath, creep.memory.names_backwardpath);
	}
}
