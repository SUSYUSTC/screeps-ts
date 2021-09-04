import * as _ from "lodash";
import * as mymath from "./mymath";
import * as config from "./config";

export function update_named_structures(room_name: string, structuretype: type_named_structures, conf: conf_named_structures, create_site: boolean): number {
	// 0 if all finished, 1 if not finished, 2 if create new constructionsite
    let room = Game.rooms[room_name];
	let output = 0;
	if (global.memory[room_name].named_structures_status[structuretype] == undefined) {
		global.memory[room_name].named_structures_status[structuretype] = {};
	}
	let memory_conf = global.memory[room_name].named_structures_status[structuretype];
    for (let structure_name in conf) {
		if (memory_conf[structure_name] == undefined) {
			memory_conf[structure_name] = {};
		}
		let remove = false;
        if (room.controller.level < conf[structure_name].RCL) {
            memory_conf[structure_name].exists = false;
            memory_conf[structure_name].finished = false;
            continue;
        } else if (room.controller.level > conf[structure_name].RCL_to_remove) {
			remove = true;
		}
        let xy = conf[structure_name].pos;
        let pos = room.getPositionAt(xy[0], xy[1]);
		let objs = pos.lookFor("structure");
		objs = objs.filter((e) => e.structureType == structuretype);
		type id_type = typeof memory_conf[string]['id'];
		if (objs.length > 0) {
            memory_conf[structure_name].exists = true;
            memory_conf[structure_name].finished = true;
			memory_conf[structure_name].id = <id_type> (objs[0].id);
			if (remove) {
				objs[0].destroy();
			}
		}
		else {
			output = Math.max(output, 1)
			let sites = pos.lookFor("constructionSite");
			if (sites.filter((e) => e.structureType == structuretype).length > 0) {
				memory_conf[structure_name].exists = true;
				memory_conf[structure_name].finished = false;
				if (remove) {
					sites[0].remove();
				}
			}
			else {
				memory_conf[structure_name].exists = false;
				memory_conf[structure_name].finished = false;
				if (create_site && !remove) {
					let return_value;
					if (structuretype == 'spawn') {
						return_value = pos.createConstructionSite(structuretype, structure_name);
					} else {
						return_value = pos.createConstructionSite(structuretype);
					}
					if (return_value == 0) {
						output = 2;
						memory_conf[structure_name].exists = true;
					}
				}
			}
		}
    }
	return output;
};

export function update_unique_structures(room_name: string, structuretype: type_unique_structures, conf: conf_unique_structures, create_site: boolean): number {
    let room = Game.rooms[room_name];
	let output = 0;
	if (global.memory[room_name].unique_structures_status[structuretype] == undefined) {
		global.memory[room_name].unique_structures_status[structuretype] = {};
	}
	let memory_conf = global.memory[room_name].unique_structures_status[structuretype];
    for (let structure_name in conf) {
        if (room.controller.level < conf.RCL) {
            memory_conf.exists = false;
            memory_conf.finished = false;
            continue;
        }
        let xy = conf.pos;
        let pos = room.getPositionAt(xy[0], xy[1]);
		let objs = pos.lookFor("structure");
		objs = objs.filter((e) => e.structureType == structuretype);
		type id_type = typeof memory_conf['id'];
		if (objs.length > 0) {
            memory_conf.exists = true;
            memory_conf.finished = true;
			memory_conf.id = <id_type> (objs[0].id);
		}
		else {
			output = Math.max(output, 1)
			let sites = pos.lookFor("constructionSite");
			if (sites.filter((e) => e.structureType == structuretype).length > 0) {
				memory_conf.exists = true;
				memory_conf.finished = false;
			}
			else {
				memory_conf.exists = false;
				memory_conf.finished = false;
				if (create_site) {
					let return_value = pos.createConstructionSite(structuretype);
					if (return_value == 0) {
						output = 2;
						memory_conf.exists = true;
					}
				}
			}
		}
    }
	return output;
};

export function update_multiple_structures(room_name: string, structuretype: type_multiple_structures, conf: conf_multiple_structures, create_site: boolean, check_all: boolean = false): number {
    let room = Game.rooms[room_name];
	let output = 0;
    for (let rcl_name in conf) {
		let rcl = parseInt(rcl_name);
		if (check_all) {
			if (room.controller.level < rcl) {
				continue;
			}
		} else {
			if (room.controller.level !== rcl) {
				continue;
			}
		}
		let xys = conf[rcl_name];
		for (let xy of xys) {
			let pos = room.getPositionAt(xy[0], xy[1]);
			let objs = pos.lookFor("structure");
			if (objs.filter((e) => e.structureType == structuretype).length == 0) {
				output = Math.max(output, 1)
				let sites = pos.lookFor("constructionSite");
				if (sites.filter((e) => e.structureType == structuretype).length == 0) {
					if (create_site) {
						let return_value = pos.createConstructionSite(structuretype);
						if (return_value == 0) {
							output = 2;
						}
					}
				}
			}
		}
    }
	return output;
};

global.create_room_walls = function(room_name: string): number {
	let room = Game.rooms[room_name];
	let conf = config.conf_rooms[room_name];
	for (let xy of conf.main_ramparts.concat(conf.secondary_ramparts)) {
		let pos = room.getPositionAt(xy[0], xy[1]);
		pos.createConstructionSite("rampart");
	}
	for (let xy of conf.walls) {
		let pos = room.getPositionAt(xy[0], xy[1]);
		pos.createConstructionSite("constructedWall");
	}
	Memory.look_broken_ramparts = true;
	return 0;
}

var show_options = {
	radius: 0.6,
	fill: "#ff0000",
	opacity: 1.0,
}
function remove_unregistered_named_structures(room_name: string, structuretype: type_named_structures, conf: conf_named_structures, action: boolean = false): number {
	let room = Game.rooms[room_name];
	let structures = room.find(FIND_STRUCTURES).filter((e) => e.structureType == structuretype);
	let compressed_conf_xys: number[] = [];
	for (let name in conf) {
		compressed_conf_xys = compressed_conf_xys.concat(conf[name].pos[0] * 50 + conf[name].pos[1]);
	}
	let set_compressed_conf_xys = new Set(compressed_conf_xys);
	structures = structures.filter((e) => !set_compressed_conf_xys.has(e.pos.x * 50 + e.pos.y))
	for (let structure of structures) {
		if (action) {
			structure.destroy();
		}
		room.visual.circle(structure.pos, show_options);
	}
	return structures.length;
}
function remove_unregistered_multiple_structures(room_name: string, structuretype: type_multiple_structures, conf: conf_multiple_structures, action: boolean = false): number {
	let room = Game.rooms[room_name];
	let structures = room.find(FIND_STRUCTURES).filter((e) => e.structureType == structuretype);
	let compressed_conf_xys: number[] = [];
	for (let name in conf) {
		compressed_conf_xys = compressed_conf_xys.concat(conf[name].map((xy) => xy[0] * 50 + xy[1]));
	}
	let set_compressed_conf_xys = new Set(compressed_conf_xys);
	structures = structures.filter((e) => !set_compressed_conf_xys.has(e.pos.x * 50 + e.pos.y))
	for (let structure of structures) {
		if (action) {
			structure.destroy();
		}
		room.visual.circle(structure.pos, show_options);
	}
	return structures.length;
}

global.remove_unregistered_structures = function(room_name: string, action: boolean = false): number {
	let conf = config.conf_rooms[room_name];
	let n = 0;
	n += remove_unregistered_multiple_structures(room_name, 'road', conf.roads, action);
	n += remove_unregistered_multiple_structures(room_name, 'extension', conf.extensions, action);
	n += remove_unregistered_multiple_structures(room_name, 'tower', conf.towers, action);
	n += remove_unregistered_named_structures(room_name, 'link', conf.links, action);
	n += remove_unregistered_named_structures(room_name, 'container', conf.containers, action);
	n += remove_unregistered_named_structures(room_name, 'spawn', conf.spawns, action);
	n += remove_unregistered_named_structures(room_name, 'lab', conf.labs, action);
	return n;
}
