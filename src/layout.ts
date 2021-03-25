console.log("Running module layout");
import * as _ from "lodash";
import * as mymath from "./mymath";
import * as config from "./config";

export function update_named_structures(room_name: string, structuretype: type_named_structures, conf: conf_named_structures, create_site: boolean): number {
	// 0 if all finished, 1 if not finished, 2 if create new constructionsite
    let room = Game.rooms[room_name];
	let output = 0;
	if (room.memory.named_structures_status[structuretype] == undefined) {
		room.memory.named_structures_status[structuretype] = {};
	}
	let memory_conf = room.memory.named_structures_status[structuretype];
    for (let structure_name in conf) {
		if (memory_conf[structure_name] == undefined) {
			memory_conf[structure_name] = {};
		}
        if (room.controller.level < conf[structure_name].RCL) {
            memory_conf[structure_name].exists = false;
            memory_conf[structure_name].finished = false;
            continue;
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
		}
		else {
			output = Math.max(output, 1)
			let sites = pos.lookFor("constructionSite");
			if (sites.filter((e) => e.structureType == structuretype).length > 0) {
				memory_conf[structure_name].exists = true;
				memory_conf[structure_name].finished = false;
			}
			else {
				memory_conf[structure_name].exists = false;
				memory_conf[structure_name].finished = false;
				if (create_site) {
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
	if (room.memory.unique_structures_status[structuretype] == undefined) {
		room.memory.unique_structures_status[structuretype] = {};
	}
	let memory_conf = room.memory.unique_structures_status[structuretype];
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

export function update_multiple_structures(room_name: string, structuretype: type_multiple_structures, conf: conf_multiple_structures, create_site: boolean): number {
    let room = Game.rooms[room_name];
	let output = 0;
    for (let rcl_name in conf) {
		let rcl = parseInt(rcl_name);
        if (room.controller.level !== rcl) {
            continue;
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

