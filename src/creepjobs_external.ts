import * as _ from "lodash"
import * as basic_job from "./basic_job";
import * as functions from "./functions"
import * as external_room from "./external_room";
var moveoptions = {
    reusePath: 5,
    //visualizePathStyle: {},
    maxRooms: 0,
    costCallback: functions.avoid_exits,
};
export function creepjob(creep: Creep): number {
	var conf = Memory.rooms_conf[creep.memory.home_room_name];
	if (creep.memory.role == 'help_harvester') {
		creep.say("HH")
		creep.memory.movable = false;
		let conf_help = Memory.help_list[creep.memory.home_room_name][creep.memory.external_room_name];
		let conf_external = Memory.rooms_conf[creep.memory.external_room_name];
		let conf_container = conf_external.containers[creep.memory.source_name];
		let container_xy = conf_container.pos;
		let container_pos = Game.rooms[creep.memory.external_room_name].getPositionAt(container_xy[0], container_xy[1])
		let container_finished = conf_container.finished;
		if (creep.room.name !== creep.memory.external_room_name) {
			external_room.movethroughrooms(creep, conf_help.rooms_forwardpath, conf_help.poses_forwardpath);
			return 0;
		}
		let output = basic_job.movetoposexceptoccupied(creep, [container_pos]);
		if (output == 0) {
			return 0;
		} else if (output == 1) {
			creep.moveTo(container_pos.x, container_pos.y);
			return 0;
		}
		if (container_finished) {
			let container = Game.getObjectById(conf_container.id);
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
		let source = Game.getObjectById(conf_external.sources[creep.memory.source_name].id);
		creep.harvest(source);
		return 0;
	} else if (creep.memory.role == 'help_carrier') {
		creep.say("HC")
		creep.memory.movable = true;
		let conf_help = Memory.help_list[creep.memory.home_room_name][creep.memory.external_room_name];
		if (creep.room.name !== creep.memory.external_room_name) {
			external_room.movethroughrooms(creep, conf_help.rooms_forwardpath, conf_help.poses_forwardpath);
			return 0;
		}
		let conf_external = Memory.rooms_conf[creep.memory.external_room_name];
		let container_source_finished = conf_external.containers[creep.memory.source_name].finished;
		let container_source = Game.getObjectById(conf_external.containers[creep.memory.source_name].id);
		if (!container_source_finished) {
			creep.memory.movable = false;
			if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
				creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
			}
			return 0;
		}
		let container_MD_finished = conf_external.containers.MD.finished;
		let help_builders = creep.room.find(FIND_MY_CREEPS).filter((e) => e.memory.role == 'help_builder');
		if (!container_MD_finished && help_builders.length == 0) {
			creep.memory.movable = false;
			if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
				creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
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
		if (container_MD_finished) {
			let container_MD = Game.getObjectById(conf_external.containers.MD.id);
			if (container_MD.store.getUsedCapacity("energy") >= 1500 && help_builders.length > 0) {
				let help_builder = help_builders[0];
				if (creep.transfer(help_builder, "energy") == ERR_NOT_IN_RANGE) {
					creep.moveTo(help_builder);
				}
			} else {
				basic_job.transfer_energy(creep, container_MD);
			}
		} else {
			let help_builder = help_builders[0];
			if (creep.transfer(help_builder, "energy") == ERR_NOT_IN_RANGE) {
				creep.moveTo(help_builder);
			}
		}
		return 0;
	} else if (creep.memory.role == 'help_builder') {
		creep.say("HB")
		creep.memory.movable = false;
		let conf_help = Memory.help_list[creep.memory.home_room_name][creep.memory.external_room_name];
		let conf_external = Memory.rooms_conf[creep.memory.external_room_name];
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
					if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
						creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
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
					if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
						creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
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
		let conf_external = conf.external_rooms[creep.memory.external_room_name].sources[creep.memory.source_name];
		if (Game.rooms[creep.memory.home_room_name].memory.external_room_status[creep.memory.external_room_name].defense_type !== '') {
			creep.drop("energy");
			basic_job.external_flee(creep, conf.safe_pos, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
			return 0;
		}
		if (creep.hits < creep.hitsMax) {
			//external_room.movethroughrooms(creep, creep.memory.rooms_backwardpath, creep.memory.poses_backwardpath);
			external_room.movethroughrooms(creep, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
			return 0;
		}
		if (creep.room.name !== creep.memory.external_room_name) {
			external_room.movethroughrooms(creep, conf_external.rooms_forwardpath, conf_external.poses_forwardpath);
		} else {
			let pos = creep.room.getPositionAt(conf_external.harvest_pos[0], conf_external.harvest_pos[1]);
			let output = basic_job.movetoposexceptoccupied(creep, [pos]);
			if (output == 0) {
				return 0;
			} else if (output == 1) {
				creep.moveTo(pos.x, pos.y);
			}
			creep.memory.movable = true;
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
		let conf_external = conf.external_rooms[creep.memory.external_room_name].sources[creep.memory.source_name]
		if (Game.rooms[creep.memory.home_room_name].memory.external_room_status[creep.memory.external_room_name].defense_type !== '') {
			basic_job.external_flee(creep, conf.safe_pos, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
			return 0;
		}
		// Using creep.room.name !== creep.memory.home_room_name here considering the possibility that the creep need to put energy into link several times
		if (creep.store.getFreeCapacity("energy") == 0 || (creep.room.name == creep.memory.home_room_name && creep.store.getUsedCapacity("energy") > 0)) {
			if (creep.room.name !== creep.memory.home_room_name) {
				external_room.movethroughrooms(creep, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
			} else {
				let transfer_target = Game.getObjectById(conf_external.transfer_target_id);
				let output = basic_job.transfer_energy(creep, transfer_target);
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
			let xy = conf_external.harvest_pos;
			let pos = creep.room.getPositionAt(xy[0], xy[1]);
			let resources = pos.lookFor(LOOK_RESOURCES);
			let tombstones = pos.lookFor(LOOK_TOMBSTONES);
			if (resources.length > 0 && resources[0].resourceType == "energy" && resources[0].amount >= 20) {
				if (creep.pickup(resources[0]) == ERR_NOT_IN_RANGE) {
					creep.moveTo(resources[0], moveoptions);
				}
				return 0;
			}
			if (tombstones.length > 0 && tombstones[0].store.getUsedCapacity("energy")) {
				if (creep.withdraw(tombstones[0], "energy") == ERR_NOT_IN_RANGE) {
					creep.moveTo(tombstones[0], moveoptions);
				}
				return 0;
			}
			// Go to the position if the harvester is absent (not spawned or not in the same room
			if (creep.pos.x == pos.x && creep.pos.y == pos.y) {
				creep.memory.movable = false;
			}
			if (conf_external.harvester_name == "") {
				creep.moveTo(pos.x, pos.y, moveoptions);
				return 0;
			}
			let withdraw_target = Game.creeps[conf_external.harvester_name];
			if (withdraw_target.room.name !== creep.memory.external_room_name) {
				creep.moveTo(pos.x, pos.y, moveoptions);
				return 0;
			}
			// Go to the harvester if any of the creeps is not in its position
			let ready = (creep.pos.isNearTo(withdraw_target) && withdraw_target.pos.x == pos.x && withdraw_target.pos.y == pos.y);
			if (!ready) {
				creep.moveTo(withdraw_target, moveoptions);
				return 0;
			}
			withdraw_target.memory.transfer_target = creep.name;
		}
		return 0;
	} else if (creep.memory.role == 'reserver') {
		creep.say("R");
		creep.memory.movable = true;
		let conf_external = conf.external_rooms[creep.memory.external_room_name].controller;
		if (Game.rooms[creep.memory.home_room_name].memory.external_room_status[creep.memory.external_room_name].defense_type !== '') {
			basic_job.external_flee(creep, conf.safe_pos, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
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
			if ((creep.room.controller.reservation !== undefined) && creep.room.controller.reservation.username !== Memory.username) {
				creep.attackController(creep.room.controller);
			} else {
				creep.reserveController(creep.room.controller);
			}
		}
		return 0;
	}
	return 1;
}
