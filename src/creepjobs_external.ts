import * as _ from "lodash"
import * as basic_job from "./basic_job";
import * as functions from "./functions"
import * as external_room from "./external_room";
import * as config from "./config";
var moveoptions = {
    reusePath: 5,
    //visualizePathStyle: {},
    maxRooms: 0,
    costCallback: functions.avoid_exits,
};
export function creepjob(creep: Creep): number {
	var conf = config.conf_rooms[creep.memory.home_room_name];
	var game_memory = Game.memory[creep.memory.home_room_name];
	if (creep.memory.role == 'help_harvester') {
		creep.say("HH")
		creep.memory.movable = false;
		creep.memory.crossable = true;
		let source_name = creep.memory.source_name;
		let conf_help = config.help_list[creep.memory.home_room_name][creep.memory.external_room_name];
		let conf_external = config.conf_rooms[creep.memory.external_room_name];
		let room_external = Game.rooms[creep.memory.external_room_name];
		let conf_container = conf_external.containers[source_name];
		let container_status = room_external.memory.named_structures_status.container[source_name];
		let container_xy = conf_container.pos;
		let container_pos = Game.rooms[creep.memory.external_room_name].getPositionAt(container_xy[0], container_xy[1])
		let container_finished = container_status.finished;
		if (creep.room.name !== creep.memory.external_room_name) {
			external_room.movethroughrooms(creep, conf_help.rooms_forwardpath, conf_help.poses_forwardpath);
			return 0;
		}
		let output = basic_job.movetoposexceptoccupied(creep, [container_pos]);
		if (output == 0) {
			return 0;
		} else if (output == 1) {
			basic_job.movetopos(creep, container_pos, 0);
			return 0;
		}
		creep.memory.crossable = false;
		if (container_finished) {
			let container = Game.getObjectById(container_status.id);
			if (container.hitsMax - container.hits > 10000 && creep.store.getUsedCapacity("energy") >= 25) {
				creep.repair(container);
				return 0;
			}
		} else {
			let site = container_pos.lookFor("constructionSite")[0]
			if (creep.store.getUsedCapacity("energy") >= 25) {
				creep.build(site);
				return 0;
			}
		}
		let source = Game.getObjectById(conf_external.sources[source_name]);
		creep.harvest(source);
		return 0;
	} else if (creep.memory.role == 'help_carrier') {
		creep.say("HC")
		creep.memory.movable = true;
		creep.memory.crossable = true;
		let conf_help = config.help_list[creep.memory.home_room_name][creep.memory.external_room_name];
		if (creep.room.name !== creep.memory.external_room_name) {
			external_room.movethroughrooms(creep, conf_help.rooms_forwardpath, conf_help.poses_forwardpath);
			return 0;
		}
		let source_name = creep.memory.source_name;
		let conf_external = config.conf_rooms[creep.memory.external_room_name];
		let room_external = Game.rooms[creep.memory.external_room_name];
		let conf_container = conf_external.containers[source_name];
		let containers_status = room_external.memory.named_structures_status.container;
		//let conf_external = Memory.rooms_conf[creep.memory.external_room_name];
		let container_source_finished = containers_status[source_name].finished;
		if (!container_source_finished) {
			creep.memory.movable = false;
			if (!creep.pos.isEqualTo(conf_external.transferer_stay_pos[0], conf_external.transferer_stay_pos[1])) {
				basic_job.movetopos(creep, creep.room.getPositionAt.apply(conf_external.transferer_stay_pos), 1)
			}
			return 0;
		}
		let MDCT;
		if (containers_status.MD == undefined) {
			MDCT="CT";
		}
		else {
			MDCT="MD";
		}
		let container_source = Game.getObjectById(containers_status[source_name].id);
		let container_MDCT_finished = containers_status[MDCT].finished;
		let help_builders = creep.room.find(FIND_MY_CREEPS).filter((e) => e.memory.role == 'help_builder');
		if (!container_MDCT_finished && help_builders.length == 0) {
			creep.memory.movable = false;
			if (!creep.pos.isEqualTo(conf_external.transferer_stay_pos[0], conf_external.transferer_stay_pos[1])) {
				basic_job.movetopos(creep, creep.room.getPositionAt.apply(conf_external.transferer_stay_pos), 1)
			}
			return 0;
		}
		if (creep.store.getUsedCapacity("energy") == 0) {
			if (creep.ticksToLive >= 30) {
				if (basic_job.withdraw_energy(creep, container_source, 300) == 1) {
					creep.memory.movable = false;
				}
			} else {
				console.log(creep.name, "suicide")
				creep.suicide();
			}
			return 0;
		}
		if (container_MDCT_finished) {
			let container_MDCT = Game.getObjectById(containers_status[MDCT].id);
			if (container_MDCT.store.getUsedCapacity("energy") >= 1500 && help_builders.length > 0) {
				let help_builder = help_builders[0];
				if (help_builder.store.getFreeCapacity() > 0) {
					if (creep.transfer(help_builder, "energy") == ERR_NOT_IN_RANGE) {
						basic_job.movetopos(creep, help_builder.pos, 1);
					}
				} else {
					creep.memory.movable = false;
				}
			} else {
				basic_job.transfer_energy(creep, container_MDCT);
			}
		} else {
			let help_builder = help_builders[0];
			if (help_builder.store.getFreeCapacity() > 0) {
				if (creep.transfer(help_builder, "energy") == ERR_NOT_IN_RANGE) {
					basic_job.movetopos(creep, help_builder.pos, 1);
				}
			} else {
				creep.memory.movable = false;
			}
		}
		return 0;
	} else if (creep.memory.role == 'help_builder') {
		creep.say("HB")
		creep.memory.movable = false;
		creep.memory.crossable = true;
		let conf_help = config.help_list[creep.memory.home_room_name][creep.memory.external_room_name];
		let conf_external = config.conf_rooms[creep.memory.external_room_name];
		if (creep.room.name !== creep.memory.external_room_name) {
			external_room.movethroughrooms(creep, conf_help.rooms_forwardpath, conf_help.poses_forwardpath);
			return 0;
		}
		if (creep.store.getUsedCapacity("energy") == 0) {
			if (creep.ticksToLive >= 50) {
				let freecapacity = creep.store.getFreeCapacity("energy");
				let lower_limit = freecapacity + 100;
				let selected_linkcontainer = basic_job.select_linkcontainer(creep, lower_limit);
				if (selected_linkcontainer == null) {
					if (!creep.pos.isEqualTo(conf_external.transferer_stay_pos[0], conf_external.transferer_stay_pos[1])) {
						basic_job.movetopos(creep, creep.room.getPositionAt.apply(conf_external.transferer_stay_pos), 1)
					}
					return 0;
				} else {
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
				basic_job.upgrade_controller(creep, creep.room.controller);
			} else {
				//return energy before dying
				let selected_linkcontainer = basic_job.select_linkcontainer(creep, 0);
				if (selected_linkcontainer == null) {
					if (!creep.pos.isEqualTo(conf_external.transferer_stay_pos[0], conf_external.transferer_stay_pos[1])) {
						basic_job.movetopos(creep, creep.room.getPositionAt.apply(conf_external.transferer_stay_pos), 1)
					}
					return 0;
				}
				basic_job.transfer_energy(creep, selected_linkcontainer);
			}
		}
		return 0;
	} else if (creep.memory.role == 'externalharvester') {
		creep.say("EH")
		creep.memory.movable = true;
		creep.memory.crossable = true;
		Game.rooms[creep.memory.home_room_name].memory.external_harvester[creep.memory.external_room_name][creep.memory.source_name] = creep.name;
		let conf_external = conf.external_rooms[creep.memory.external_room_name].sources[creep.memory.source_name];
		if (Game.rooms[creep.memory.home_room_name].memory.external_room_status[creep.memory.external_room_name].defense_type !== '') {
			creep.drop("energy");
			external_room.external_flee(creep, conf.safe_pos, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
			return 0;
		}
		if (creep.hits < creep.hitsMax) {
			external_room.movethroughrooms(creep, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
			return 0;
		}
		if (creep.room.name !== creep.memory.external_room_name) {
			external_room.movethroughrooms(creep, conf_external.rooms_forwardpath, conf_external.poses_forwardpath);
		} else {
			let pos = creep.room.getPositionAt(conf_external.harvester_pos[0], conf_external.harvester_pos[1]);
			let output = basic_job.movetoposexceptoccupied(creep, [pos]);
			if (output == 0) {
				return 0;
			} else if (output == 1) {
				creep.moveTo(pos.x, pos.y);
			}
			creep.memory.movable = true;
			if (conf.external_rooms[creep.memory.external_room_name].container) {
				let site = pos.lookFor(LOOK_CONSTRUCTION_SITES)[0];
				let container = pos.lookFor(LOOK_STRUCTURES).filter((e) => e.structureType == 'container')[0];
				if (site == undefined && container == undefined) {
					pos.createConstructionSite("container");
					return 0;
				}
				if (site !== undefined && creep.store.getUsedCapacity("energy") >= 25) {
					creep.build(site);
					return 0;
				}
				if (container !== undefined && container.hitsMax - container.hits > 10000 && creep.store.getUsedCapacity("energy") >= 25) {
					creep.repair(container);
					return 0;
				}
			}
			var source = Game.getObjectById(conf_external.id);
			basic_job.harvest_source(creep, source);
			if ("transfer_target" in creep.memory) {
				let transfer_target = Game.creeps[creep.memory.transfer_target];
				creep.transfer(transfer_target, "energy");
				delete creep.memory.transfer_target;
			}
			return 0;
		}
		return 0;
	} else if (creep.memory.role == 'externalcarrier') {
		creep.say("EC");
		creep.memory.movable = true;
		creep.memory.crossable = true;
		let conf_external = conf.external_rooms[creep.memory.external_room_name].sources[creep.memory.source_name]
		if (Game.rooms[creep.memory.home_room_name].memory.external_room_status[creep.memory.external_room_name].defense_type !== '') {
			external_room.external_flee(creep, conf.safe_pos, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
			return 0;
		}
		// Using creep.room.name !== creep.memory.home_room_name here considering the possibility that the creep need to put energy into link several times
		if (creep.store.getFreeCapacity("energy") == 0 || (creep.room.name == creep.memory.home_room_name && creep.store.getUsedCapacity("energy") > 0)) {
			if (creep.room.name !== creep.memory.home_room_name) {
				external_room.movethroughrooms(creep, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
			} else {
				if (Game.rooms[creep.memory.home_room_name].storage !== undefined) {
					let output = basic_job.transfer_energy(creep, Game.rooms[creep.memory.home_room_name].storage);
				} else {
					let output = basic_job.transfer_energy(creep, Game.rooms[creep.memory.home_room_name].terminal);
				}
			}
		} else {
			if (creep.store.getUsedCapacity("energy") == 0 && creep.ticksToLive < conf_external.single_distance + 30) {
				creep.suicide();
				return 0;
			}
			// The creep has no energy so heading toward the source or is waiting to get enough energy
			if (creep.room.name !== creep.memory.external_room_name) {
				external_room.movethroughrooms(creep, conf_external.rooms_forwardpath, conf_external.poses_forwardpath);
				return 0;
			}
			// Pickup the resources if exists
			let xy = conf_external.harvester_pos;
			let pos = creep.room.getPositionAt(xy[0], xy[1]);
			let resource = pos.lookFor(LOOK_RESOURCES)[0];
			if (resource !== undefined && resource.resourceType == "energy" && resource.amount >= 20) {
				if (creep.pickup(resource) == ERR_NOT_IN_RANGE) {
					creep.moveTo(resource, moveoptions);
				}
				return 0;
			}
			let tombstone = pos.lookFor(LOOK_TOMBSTONES)[0];
			if (tombstone !== undefined && tombstone.store.getUsedCapacity("energy") > 0) {
				if (creep.withdraw(tombstone, "energy") == ERR_NOT_IN_RANGE) {
					creep.moveTo(tombstone, moveoptions);
				}
				return 0;
			}
			let site = pos.lookFor(LOOK_CONSTRUCTION_SITES)[0];
			if (site !== undefined) {
				creep.moveTo(site, {...moveoptions, ...{range: 1}});
				return 0;
			}
			let container = <StructureContainer>pos.lookFor(LOOK_STRUCTURES).filter((e) => e.structureType == 'container')[0];
			if (container !== undefined && container.store.getUsedCapacity("energy") > 0) {
				if (creep.withdraw(container, "energy") == ERR_NOT_IN_RANGE) {
					creep.moveTo(container, {...moveoptions, ...{range: 1}});
				}
				return 0;
			}
			// Go to the position if the harvester is absent (not spawned or not in the same room
			if (creep.pos.x == pos.x && creep.pos.y == pos.y) {
				creep.memory.movable = false;
			}
			let harvester_name = Game.rooms[creep.memory.home_room_name].memory.external_harvester[creep.memory.external_room_name][creep.memory.source_name];
			if (harvester_name == "") {
				creep.moveTo(pos.x, pos.y, {...moveoptions, ...{range: 1}});
				return 0;
			}
			let withdraw_target = Game.creeps[harvester_name];
			// harvester died, remove the mark
			if (withdraw_target == undefined) {
				Game.rooms[creep.memory.home_room_name].memory.external_harvester[creep.memory.external_room_name][creep.memory.source_name] = "";
			}
			if (withdraw_target.room.name !== creep.memory.external_room_name) {
				creep.moveTo(pos.x, pos.y, {...moveoptions, ...{range: 1}});
				return 0;
			}
			// Go to the harvester if any of the creeps is not in its position
			let ready = (creep.pos.isNearTo(withdraw_target) && withdraw_target.pos.x == pos.x && withdraw_target.pos.y == pos.y);
			if (!ready) {
				creep.moveTo(withdraw_target, {...moveoptions, ...{range: 1}});
				return 0;
			}
			withdraw_target.memory.transfer_target = creep.name;
		}
		return 0;
	} else if (creep.memory.role == 'reserver') {
		creep.say("R");
		creep.memory.movable = true;
		creep.memory.crossable = true;
		let conf_external = conf.external_rooms[creep.memory.external_room_name].controller;
		if (Game.rooms[creep.memory.home_room_name].memory.external_room_status[creep.memory.external_room_name].defense_type !== '') {
			external_room.external_flee(creep, conf.safe_pos, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
			return 0;
		}
		if (creep.room.name !== creep.memory.external_room_name) {
			external_room.movethroughrooms(creep, conf_external.rooms_forwardpath, conf_external.poses_forwardpath);
		} else {
			if (creep.pos.getRangeTo(creep.room.controller) > 1) {
				creep.moveTo(creep.room.controller, moveoptions);
				return 0;
			}
			creep.memory.movable = false;
			if ((creep.room.controller.reservation !== undefined) && creep.room.controller.reservation.username !== config.username) {
				creep.attackController(creep.room.controller);
			} else {
				creep.reserveController(creep.room.controller);
			}
		}
		return 0;
	} else if (creep.memory.role == 'claimer') {
		creep.say("claim");
		creep.memory.movable = true;
		creep.memory.crossable = true;
		let conf_external = conf.external_rooms[creep.memory.external_room_name].controller;
		if (creep.room.name !== creep.memory.external_room_name) {
			external_room.movethroughrooms(creep, conf_external.rooms_forwardpath, conf_external.poses_forwardpath);
		} else {
			if (creep.pos.getRangeTo(creep.room.controller) > 1) {
				creep.moveTo(creep.room.controller, moveoptions);
				return 0;
			}
			creep.claimController(creep.room.controller);
		}
		return 0;
	} else if (creep.memory.role == 'newroom_claimer') {
		creep.say("claim");
		creep.memory.movable = true;
		creep.memory.crossable = true;
		let conf_help = config.help_list[creep.memory.home_room_name][creep.memory.external_room_name];
		if (creep.room.name !== creep.memory.external_room_name) {
			external_room.movethroughrooms(creep, conf_help.rooms_forwardpath, conf_help.poses_forwardpath);
		} else {
			if (creep.pos.getRangeTo(creep.room.controller) > 1) {
				creep.moveTo(creep.room.controller, moveoptions);
				return 0;
			}
			if (creep.room.controller.my) {
				if (creep.room.controller.sign == undefined || creep.room.controller.sign.text !== config.sign) {
					creep.signController(creep.room.controller, config.sign);
				}
			} else {
				creep.claimController(creep.room.controller);
			}
		}
		return 0;
	}
	return 1;
}
