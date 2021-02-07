import * as _ from "lodash"
import * as role_init from "./role_init";
import * as mymath from "./mymath";
import * as basic_job from "./basic_job";
import * as defense from "./defense";
import * as hunting from "./hunting"
import * as functions from "./functions"
import * as external_room from "./external_room";
var moveoptions = {
    reusePath: 5,
    //visualizePathStyle: {},
    maxRooms: 0,
    costCallback: functions.avoid_exits,
};
export function creepjob(creep: Creep): number {
	var conf = Memory.rooms_conf[creep.room.name];
	var rolename = creep.memory.role;
	var link_modes = creep.room.memory.link_modes;
    if (creep.memory.role == 'init') {
        role_init.init_work(creep);
        creep.memory.movable = false;
		return 0;
	} else if (creep.memory.role == 'harvester') {
		creep.say("H")
		creep.memory.movable = false;
		let source_name = creep.memory.source_name;
		let source_id = conf.sources[source_name].id;
		let source = Game.getObjectById(source_id);
		let link_mode = false;
		let link_source: null | StructureLink = null;
		let container_source: null | StructureContainer = null;
		if (true) {
			link_mode = link_modes.includes(source_name);
			if (link_mode) {
				let conf_link_source = conf.links[source_name];
				if (!conf_link_source.finished) {
					return 0;
				}
				link_source = Game.getObjectById(conf_link_source.id);
			} else {
				let conf_container_source = conf.containers[source_name];
				if (!conf_container_source.finished) {
					return 0;
				}
				container_source = Game.getObjectById(conf_container_source.id);
			}
			let xy = conf.containers[source_name].pos;
			let pos = creep.room.getPositionAt(xy[0], xy[1]);
			let output = basic_job.movetoposexceptoccupied(creep, [pos]);
			if (output == 0) {
				return 0;
			} else if (output == 1) {
				creep.moveTo(pos.x, pos.y);
				return 0;
			}
		}
		if (creep.ticksToLive < 5) {
			if (link_mode) {
				basic_job.transfer_energy(creep, link_source);
			} else {
				basic_job.transfer_energy(creep, container_source);
			}
			return 0;
		}
		let this_container = Game.getObjectById(conf.containers[creep.memory.source_name].id);
		if (creep.store.getUsedCapacity("energy") >= 10 && this_container.hitsMax - this_container.hits >= 1000) {
			creep.repair(this_container);
			return 0;
		}
		basic_job.harvest_source(creep, source);
		if (link_mode) {
			if (this_container.store.getUsedCapacity("energy") > 1600 && creep.store.getUsedCapacity("energy") <= 10) {
				creep.withdraw(this_container, "energy");
			} else if (creep.store.getFreeCapacity() == 0 && this_container.store.getUsedCapacity("energy") >= 1200) {
				creep.transfer(link_source, "energy");
			}
		}
		return 0;
	} else if (creep.memory.role == 'carrier') {
		creep.say("C")
		creep.memory.movable = true;
		let source_name = creep.memory.source_name;
		let container_source;
		if (creep.memory.source_name == 'storage') {
			container_source = creep.room.storage;
		} else {
			let conf_container_source = conf.containers[source_name];
			let conf_container_controller = conf.containers.CT;
			if (!(conf_container_source.finished && conf_container_controller.finished)) {
				creep.memory.movable = false;
				return 0;
			}
			container_source = Game.getObjectById(conf_container_source.id);
		}
		if (creep.store["energy"] == 0) {
			if (creep.ticksToLive >= 30) {
				if (basic_job.withdraw_energy(creep, container_source, 300) == 1) {
					creep.memory.movable = false;
				}
			} else {
				console.log(creep.name, "suicide")
				creep.suicide();
			}
		} else {
			let prefered_container = basic_job.preferred_container(creep, conf.containers, conf.carriers[source_name].preferences);
			if (prefered_container !== null) {
				basic_job.transfer_energy(creep, prefered_container);
			} else {
				creep.memory.movable = false;
			}
		}
		return 0;
	} else if (creep.memory.role == 'mineharvester') {
		creep.say("M")
		creep.memory.movable = false;
		if (!creep.room.memory.mine_harvestable) {
			return 0;
		}
		let xy = conf.containers.MINE.pos;
		let pos = creep.room.getPositionAt(xy[0], xy[1]);
		let output = basic_job.movetoposexceptoccupied(creep, [pos]);
		if (output == 0) {
			return 0;
		} else if (output == 1) {
			creep.moveTo(pos.x, pos.y);
			return 0;
		}
		let mine = Game.getObjectById(conf.mine.id);
		let mine_container = Game.getObjectById(conf.containers.MINE.id);
		basic_job.harvest_source(creep, mine);
		return 0;
	} else if (creep.memory.role == 'upgrader') {
		creep.say("U")
		creep.memory.movable = false;
		if (conf.upgraders.boost_request !== undefined) {
			let boost_result = basic_job.boost_request(creep, {
				"work": conf.upgraders.boost_request
			});
			if (boost_result == 1) {
				return 0;
			}
		}
		if (true) {
			let conf_locations = conf.upgraders.locations;
			let locations = conf_locations.map((e) => creep.room.getPositionAt(e[0], e[1]));
			let output = basic_job.movetoposexceptoccupied(creep, locations);
			if (output == 0) {
				return 0;
			} else if (output == 1) {
				basic_job.movetopos(creep, creep.room.controller.pos, 1);
			}
		}
		let this_container = Game.getObjectById(conf.containers.CT.id);
		if (creep.store.getUsedCapacity("energy") >= 10 && this_container.hitsMax - this_container.hits >= 10000) {
			creep.repair(this_container);
			return 0;
		}
		let link_mode = link_modes.includes('CT');
		let container = Game.getObjectById(conf.containers.CT.id);
		let container_energy = container.store.getUsedCapacity("energy")
		let use_link = false;
		let link;
		if (link_mode) {
			link = Game.getObjectById(conf.links.CT.id);
			let link_energy = link.store.getUsedCapacity("energy");
			if (link_energy > container_energy) {
				use_link = true;
			}
		}
		if (creep.store.getUsedCapacity("energy") < creep.store.getFreeCapacity("energy") * 0.2 && creep.ticksToLive >= 10) {
			if (!creep.room.memory.danger_mode) {
				var lower_limit = (link_mode ? 100 : 800);
				if (use_link) {
					basic_job.withdraw_energy(creep, link, lower_limit);
				} else {
					basic_job.withdraw_energy(creep, container, lower_limit);
				}
			}
		}
		basic_job.upgrade_controller(creep, creep.room.controller);
		return 0;
	} else if (creep.memory.role == 'builder') {
		creep.say("B")
		creep.memory.movable = false;
		let link_mode = link_modes.includes('CT');
		if (creep.store["energy"] == 0) {
			if (creep.ticksToLive >= 50) {
				let freecapacity = creep.store.getFreeCapacity("energy");
				let lower_limit = (link_mode ? freecapacity : freecapacity + 100);
				let selected_linkcontainer = basic_job.select_linkcontainer(creep, lower_limit);
				if (selected_linkcontainer == null) {
					return 0;
				}
				if (!creep.room.memory.danger_mode) {
					basic_job.withdraw_energy(creep, selected_linkcontainer);
				}
			} else {
				//console.log("suicide here")
				creep.suicide();
			}
		} else {
			if (creep.ticksToLive >= 50) {
				if (basic_job.build_structure(creep) == 0) {
					return 0;
				}
				if (basic_job.charge_all(creep) == 0) {
					return 0;
				}
				if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
					creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
				}
			} else {
				//return energy before dying
				let selected_linkcontainer = basic_job.select_linkcontainer(creep, 0);
				if (selected_linkcontainer == null) {
					return 0;
				}
				basic_job.transfer_energy(creep, selected_linkcontainer);
			}
		}
		return 0;
	} else if (creep.memory.role == 'transferer') {
		creep.say("T")
		creep.memory.movable = true;
		let min_fill_energy;
		if (creep.room.controller.level >=7) {
			min_fill_energy = 100;
		} else {
			min_fill_energy = 50;
		}
		if (creep.store.getUsedCapacity("energy") < min_fill_energy) {
			if (creep.ticksToLive >= 30) {
				if (basic_job.charge_all(creep, false) == 0) {
					let min_energy = creep.store.getCapacity("energy") / 2;
					let selected_linkcontainer = basic_job.select_linkcontainer(creep, min_energy);
					if (selected_linkcontainer == null) {
						creep.memory.movable = false;
						if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
							creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
						}
						return 0;
					}
					basic_job.withdraw_energy(creep, selected_linkcontainer);
				} else {
					creep.memory.movable = false;
					if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
						creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
					}
					return 0;
				}
			} else {
				creep.suicide();
			}
		} else {
			if (creep.ticksToLive >= 30) {
				if (basic_job.charge_all(creep) == 0) {
					return 0;
				} else {
					creep.memory.movable = false;
					if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
						creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
					}
					return 0;
				}
			} else {
				//return energy before dying
				let selected_linkcontainer = basic_job.select_linkcontainer(creep, 0);
				if (selected_linkcontainer == null) {
					creep.memory.movable = false;
					if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
						creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
					}
					return 0;
				}
				basic_job.transfer_energy(creep, selected_linkcontainer);
			}
		}
		return 0;
	} else if (creep.memory.role == 'specialcarrier') {
		creep.say("SC")
		creep.memory.movable = true;
		let mineral_type = conf.mine.type;
		if (creep.room.memory.mine_harvestable) {
			let container = Game.getObjectById(conf.containers.MINE.id);
			if (creep.store.getUsedCapacity(conf.mine.type) == 0) {
				if (creep.pos.isNearTo(container) && container.store.getUsedCapacity(mineral_type) > creep.store.getCapacity()) {
					creep.withdraw(container, mineral_type);
				} else {
					basic_job.moveto_stayxy(creep, conf.mineral_stay_pos);
				}
			} else {
				if (creep.room.terminal && creep.room.terminal.store.getFreeCapacity() >= creep.store.getCapacity()) {
					if (creep.pos.isNearTo(creep.room.terminal)) {
						creep.transfer(creep.room.terminal, mineral_type);
					} else {
						basic_job.movetopos(creep, creep.room.terminal.pos, 1);
					}
				} else {
					basic_job.moveto_stayxy(creep, conf.mineral_stay_pos);
				}
			}
		} else {
			basic_job.moveto_stayxy(creep, conf.mineral_stay_pos);
		}
		return 0;
	} else if (creep.memory.role == 'wall_repairer') {
		creep.say("WR");
		creep.memory.movable = false;
		if (creep.store.getUsedCapacity("energy") == 0) {
			let selected_linkcontainer = basic_job.select_linkcontainer(creep, 200, true);
			basic_job.withdraw_energy(creep, selected_linkcontainer);
		} else {
			let wall_ramparts = creep.room.find(FIND_STRUCTURES).filter((e) => (e.structureType == 'constructedWall' && e.hits) || e.structureType == 'rampart');
			let hits = wall_ramparts.map((e) => e.hits);
			let hits_max = Math.max(...hits);
			let hits_min = Math.min(...hits);
			let wall;
			if (creep.memory.wall_to_repair) {
				wall = Game.getObjectById(creep.memory.wall_to_repair);
				if (wall.hits - hits_min > 200000) {
					delete creep.memory.wall_to_repair;
					return 0;
				}
			} else {
				let wall_ramparts_left = mymath.range(wall_ramparts.length).filter((i) => hits[i] < hits_min + 20000).map((i) => wall_ramparts[i]);
				let closest_id = mymath.argmin(wall_ramparts_left.map((e) => creep.pos.getRangeTo(e)));
				wall = wall_ramparts_left[closest_id];
				creep.memory.wall_to_repair = < Id < Structure_Wall_Rampart >> wall.id;
			}
			if (creep.repair(wall) == ERR_NOT_IN_RANGE) {
				basic_job.movetopos(creep, wall.pos, 3);
			}
		}
		return 0;
	}
	return 1;
}
