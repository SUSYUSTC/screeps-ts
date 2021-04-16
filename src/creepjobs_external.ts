import * as _ from "lodash"
import * as mymath from "./mymath";
import * as basic_job from "./basic_job";
import * as functions from "./functions"
import * as external_room from "./external_room";
import * as config from "./config";
var moveoptions_noset: type_movetopos_options = {
	        setmovable: false,
};
export function creepjob(creep: Creep): number {
	var conf = config.conf_rooms[creep.memory.home_room_name];
	var game_memory = Game.memory[creep.memory.home_room_name];
	if (creep.memory.role == 'help_harvester') {
		creep.say("HH")
		creep.memory.movable = false;
		creep.memory.crossable = true;
		let source_name = creep.memory.source_name;
		let conf_external = config.conf_rooms[creep.memory.external_room_name];
		let container_xy = conf_external.containers[source_name].pos;
		let container_pos = Game.rooms[creep.memory.external_room_name].getPositionAt(container_xy[0], container_xy[1])
		let container_status = creep.room.memory.named_structures_status.container[source_name];
		if (creep.room.name !== creep.memory.external_room_name) {
			let conf_help = config.help_list[creep.memory.home_room_name][creep.memory.external_room_name];
			external_room.movethroughrooms(creep, conf_help.rooms_forwardpath, conf_help.poses_forwardpath);
			creep.memory.movable = true;
			return 0;
		}
		if (basic_job.trymovetopos(creep, container_pos) !== 2) {
			return 0;
		}
		creep.memory.crossable = false;
		let source = Game.getObjectById(conf_external.sources[source_name]);
		basic_job.harvest_with_container(creep, source, container_status);
		return 0;
	} else if (creep.memory.role == 'help_carrier') {
		creep.say("HC")
		creep.memory.movable = false;
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
			let transferer_stay_pos = creep.room.getPositionAt(conf.transferer_stay_pos[0], conf.transferer_stay_pos[1]);
			if (basic_job.trymovetopos(creep, transferer_stay_pos) == 0) {
				creep.memory.movable = true;
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
			let transferer_stay_pos = creep.room.getPositionAt(conf.transferer_stay_pos[0], conf.transferer_stay_pos[1]);
			basic_job.trymovetopos(creep, transferer_stay_pos);
			return 0;
		}
		if (creep.ticksToLive < 20) {
			basic_job.return_energy_before_die(creep);
		}
		if (creep.store.getFreeCapacity("energy") > 0) {
			if (basic_job.withdraw(creep, container_source, {left: 300}) == 1) {
			}
			return 0;
		}
		let container_MDCT;
		if (container_MDCT_finished) {
			container_MDCT = Game.getObjectById(containers_status[MDCT].id);
		}
		if (container_MDCT !== undefined) {
			basic_job.transfer(creep, container_MDCT);
		} else {
			let help_builder = help_builders[0];
			if (help_builder.store.getFreeCapacity() > 0) {
				basic_job.transfer(creep, help_builder);
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
		if (creep.ticksToLive < 20 && creep.store.getUsedCapacity("energy") == 0) {
			creep.suicide();
			return 0;
		}
		if (creep.store.getUsedCapacity("energy") == 0) {
			let freecapacity = creep.store.getFreeCapacity("energy");
			let lower_limit = freecapacity + 100;
			if (basic_job.get_energy(creep, {min_energy: lower_limit}) == 1) {
				let transferer_stay_pos = creep.room.getPositionAt(conf.transferer_stay_pos[0], conf.transferer_stay_pos[1]);
				basic_job.trymovetopos(creep, transferer_stay_pos);
			}
			return 0;
		} else {
			if (basic_job.build_structure(creep) == 0) {
				return 0;
			}
			if (basic_job.charge_all(creep) == 0) {
				return 0;
			}
			basic_job.upgrade_controller(creep, creep.room.controller);
		}
		return 0;
	} else if (creep.memory.role == 'externalharvester') {
		creep.say("EH")
		creep.memory.movable = false;
		creep.memory.crossable = true;
		//Game.rooms[creep.memory.home_room_name].memory.external_harvester[creep.memory.external_room_name][creep.memory.source_name] = creep.name;
		let conf_external;
		if (creep.memory.powered) {
			conf_external = conf.external_rooms[creep.memory.external_room_name].powered_source;
		} else {
			conf_external = conf.external_rooms[creep.memory.external_room_name].sources[creep.memory.source_name];
		}
		if (Game.rooms[creep.memory.home_room_name].memory.external_room_status[creep.memory.external_room_name].defense_type !== '' || creep.hits < creep.hitsMax) {
			if (creep.store.getUsedCapacity("energy") > 0) {
				creep.drop("energy");
			}
			if (external_room.external_flee(creep, conf.safe_pos, conf_external.rooms_backwardpath, conf_external.poses_backwardpath) == 1) {
				creep.memory.movable = true;
			}
			return 0;
		}
		if (creep.room.name !== creep.memory.external_room_name) {
			external_room.movethroughrooms(creep, conf_external.rooms_forwardpath, conf_external.poses_forwardpath);
			creep.memory.movable = true;
		} else {
			let pos = creep.room.getPositionAt(conf_external.harvester_pos[0], conf_external.harvester_pos[1]);
			if (basic_job.trymovetopos(creep, pos) == 2) {
				return 0;
			}
			creep.memory.crossable = false;
			let source = <Source> Game.getObjectById(conf_external.id);
			basic_job.harvest_with_container(creep, source);
			return 0;
		}
		return 0;
	} else if (creep.memory.role == 'externalcarrier') {
		creep.say("EC");
		creep.memory.movable = false;
		creep.memory.crossable = true;
		let conf_external;
		if (creep.memory.powered) {
			conf_external = conf.external_rooms[creep.memory.external_room_name].powered_source;
		} else {
			conf_external = conf.external_rooms[creep.memory.external_room_name].sources[creep.memory.source_name];
		}
		if (Game.rooms[creep.memory.home_room_name].memory.external_room_status[creep.memory.external_room_name].defense_type !== '') {
			external_room.external_flee(creep, conf.safe_pos, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
			return 0;
		}
		// Using creep.room.name !== creep.memory.home_room_name here considering the possibility that the creep need to put energy into link several times
		if (creep.room.name == creep.memory.external_room_name) {
			basic_job.repair_road(creep);
		}
		let xy = conf_external.harvester_pos;
		let pos = creep.room.getPositionAt(xy[0], xy[1]);
		if (creep.store.getFreeCapacity("energy") <= 10 || ((creep.room.name !== creep.memory.external_room_name || creep.pos.getRangeTo(pos) > 1) && creep.store.getUsedCapacity("energy") > 0)) {
			if (creep.room.name !== creep.memory.home_room_name) {
				external_room.movethroughrooms(creep, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
				creep.memory.movable = true;
			} else {
				let structure = basic_job.get_structure_from_carry_end(creep, conf_external.carry_end);
				if (structure !== null) {
					basic_job.transfer(creep, structure);
				} else {
					creep.say("NF!");
				}
			}
		} else {
			if (creep.store.getUsedCapacity("energy") == 0 && creep.ticksToLive < conf_external.carrier_distance + 20) {
				creep.suicide();
				return 0;
			}
			// The creep has no energy so heading toward the source or is waiting to get enough energy
			if (creep.room.name !== creep.memory.external_room_name) {
				external_room.movethroughrooms(creep, conf_external.rooms_forwardpath, conf_external.poses_forwardpath);
				creep.memory.movable = true;
				return 0;
			}
			if (basic_job.movetopos(creep, pos, 1) == 0) {
				return 0;
			}
			// Pickup the resources if exists
			let resource = pos.lookFor(LOOK_RESOURCES)[0];
			if (resource !== undefined && resource.resourceType == "energy" && resource.amount > 30) {
				creep.pickup(resource);
			}
			/*
			let tombstone = pos.lookFor(LOOK_TOMBSTONES)[0];
			if (tombstone !== undefined && tombstone.store.getUsedCapacity("energy") > 0) {
				if (creep.withdraw(tombstone, "energy") == ERR_NOT_IN_RANGE) {
					basic_job.movetopos(creep, tombstone.pos, 1);
					creep.memory.movable = true;
				}
				return 0;
			}
			let site = pos.lookFor(LOOK_CONSTRUCTION_SITES)[0];
			if (site !== undefined) {
				if (basic_job.movetopos(creep, site.pos, 1) == 0) {
					creep.memory.movable = true;
				}
				return 0;
			}
			*/
			let container = <StructureContainer>pos.lookFor(LOOK_STRUCTURES).filter((e) => e.structureType == 'container')[0];
			if (container !== undefined && container.store.getUsedCapacity("energy") >= creep.store.getFreeCapacity("energy")) {
				creep.withdraw(container, "energy");
			}
			/*
			// Go to the position if the harvester is absent (not spawned or not in the same room
			if (creep.pos.x == pos.x && creep.pos.y == pos.y) {
				creep.memory.movable = false;
			}
			let harvester_name = Game.rooms[creep.memory.home_room_name].memory.external_harvester[creep.memory.external_room_name][creep.memory.source_name];
			if (harvester_name == "") {
				basic_job.movetopos(creep, pos, 1);
				return 0;
			}
			let withdraw_target = Game.creeps[harvester_name];
			// harvester died, remove the mark
			if (withdraw_target == undefined) {
				Game.rooms[creep.memory.home_room_name].memory.external_harvester[creep.memory.external_room_name][creep.memory.source_name] = "";
			}
			if (withdraw_target.room.name !== creep.memory.external_room_name) {
				basic_job.movetopos(creep, pos, 1);
				return 0;
			}
			// Go to the harvester if any of the creeps is not in its position
			let ready = (creep.pos.isNearTo(withdraw_target) && withdraw_target.pos.x == pos.x && withdraw_target.pos.y == pos.y);
			if (!ready) {
				basic_job.movetopos(creep, withdraw_target.pos, 1);
				return 0;
			}
			withdraw_target.memory.transfer_target = creep.name;
			*/
		}
		return 0;
	} else if (creep.memory.role == 'externalbuilder') {
		creep.say("EB");
		creep.memory.movable = false;
		creep.memory.crossable = true;
		if (creep.store.getUsedCapacity("energy") == 0) {
			if (creep.room.name == creep.memory.external_room_name) {
				let containers = (<Array<StructureContainer>> creep.room.find(FIND_STRUCTURES).filter((e) => e.structureType == 'container')).filter((e) => e.store.getUsedCapacity("energy") >= creep.store.getCapacity()/2);
				if (containers.length == 0) {
					external_room.movethroughrooms(creep, creep.memory.rooms_backwardpath, creep.memory.poses_backwardpath);
					creep.memory.movable = true;
					return 0;
				} else {
					let distances = containers.map((e) => creep.pos.getRangeTo(e));
					let argmin = mymath.argmin(distances);
					let container = containers[argmin];
					basic_job.withdraw(creep, container);
					return 0;
				}
			} else {
				if (creep.room.name == creep.memory.home_room_name) {
					if (basic_job.get_energy(creep, {min_energy: creep.store.getCapacity()}) == 1) {
						return 0;
					}
				} else {
					external_room.movethroughrooms(creep, creep.memory.rooms_backwardpath, creep.memory.poses_backwardpath);
					creep.memory.movable = true;
				}
			}
		} else {
			if (creep.room.name !== creep.memory.external_room_name) {
				external_room.movethroughrooms(creep, creep.memory.rooms_forwardpath, creep.memory.poses_forwardpath);
				creep.memory.movable = true;
			} else {
				external_room.moveawayexit(creep);
				basic_job.build_structure(creep)
				if (creep.room.memory.sites_total_progressleft == 0) {
					creep.suicide();
				}
			}
		}
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
				basic_job.movetopos(creep, creep.room.controller.pos, 1);
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
	} else if (creep.memory.role == 'preclaimer') {
		creep.say("claim");
		creep.memory.movable = true;
		creep.memory.crossable = true;
		if (creep.room.name !== creep.memory.external_room_name) {
			external_room.movethroughrooms(creep, creep.memory.rooms_forwardpath, creep.memory.poses_forwardpath);
		} else {
			if (creep.pos.getRangeTo(creep.room.controller) > 1) {
				basic_job.movetopos(creep, creep.room.controller.pos, 1);
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
				basic_job.movetopos(creep, creep.room.controller.pos, 1);
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
	} else if (creep.memory.role == 'gcl_upgrader') {
		creep.say("GU");
		creep.memory.movable = false;
		creep.memory.crossable = true;
		let gcl_room_name = config.conf_gcl_map.gcl_room;
		let supporting_room_name = config.conf_gcl_map.supporting_room;
		if (creep.room.name == supporting_room_name) {
			if (basic_job.boost_request(creep, {"work": config.upgrader_boost_request}, true) == 1) {
				return 0;
			}
		}
		if (creep.room.name !== gcl_room_name) {
			external_room.movethroughrooms(creep, config.conf_gcl_map.rooms_forwardpath, config.conf_gcl_map.poses_forwardpath);
			creep.memory.movable = true;
			return 0;
		} else {
			let upper_poses = config.conf_gcl.upper_poses.map((e) => creep.room.getPositionAt(e[0], e[1]));
			let lower_poses = config.conf_gcl.lower_poses.map((e) => creep.room.getPositionAt(e[0], e[1]));
			let store: AnyStoreStructure;
			if (creep.room.terminal !== undefined && creep.room.terminal.store.getUsedCapacity("energy") > 5000) {
				upper_poses = [upper_poses[3], upper_poses[2], upper_poses[1]];
				lower_poses = [lower_poses[3], lower_poses[2], lower_poses[1]];
				store = creep.room.terminal;
			} else if (creep.room.storage !== undefined && creep.room.storage.store.getUsedCapacity("energy") > 5000) {
				upper_poses = [upper_poses[2], upper_poses[1], upper_poses[0]];
				lower_poses = [lower_poses[2], lower_poses[1], lower_poses[0]];
				store = creep.room.storage;
			} else {
				upper_poses = [upper_poses[1], upper_poses[0]];
				lower_poses = [lower_poses[1], lower_poses[0]];
				let container_status = creep.room.memory.named_structures_status.container.CT;
				if (container_status.finished) {
					store = Game.getObjectById(container_status.id);
				}
			}
			let n_upper = mymath.array_sum(upper_poses.map((e) => e.lookFor("creep").length));
			let n_lower = mymath.array_sum(lower_poses.map((e) => e.lookFor("creep").length));
			let out: number;
			if (n_upper >= n_lower) {
				out = basic_job.movetoposexceptoccupied(creep, upper_poses);
			} else {
				out = basic_job.movetoposexceptoccupied(creep, lower_poses);
			}
			
			if (store == undefined) {
				return 0;
			}
			if (creep.store.getUsedCapacity("energy") < creep.store.getFreeCapacity() * 0.2 && creep.ticksToLive >= 10) {
				creep.withdraw(store, "energy");
			}
			if (creep.store.getUsedCapacity("energy") > 0) {
				let xmin = Math.max(creep.pos.x - 3, 0);
				let xmax = Math.min(creep.pos.x + 3, 49);
				let ymin = Math.max(creep.pos.y - 3, 0);
				let ymax = Math.min(creep.pos.y + 3, 49);
				let site = creep.room.lookForAtArea("constructionSite", ymin, xmin, ymax, xmax, true)[0];
				if (site !== undefined) {
					creep.build(site.constructionSite);
				} else if (store.structureType == 'container' && store.hitsMax - store.hits >= 50000) {
					creep.repair(store);
				} else {
					creep.upgradeController(creep.room.controller);
				}
			}
			return 0;
		}
	} else if (creep.memory.role == 'gcl_carrier') {
		creep.say("GC");
		creep.memory.movable = false;
		creep.memory.crossable = true;
		let gcl_room_name = config.conf_gcl_map.gcl_room;
		let supporting_room_name = config.conf_gcl_map.supporting_room;
		if (creep.room.name == supporting_room_name) {
			if (creep.store.getUsedCapacity("energy") == 0) {
				basic_job.withdraw(creep, creep.room.storage);
				return 0;
			} else {
				external_room.movethroughrooms(creep, config.conf_gcl_map.rooms_forwardpath, config.conf_gcl_map.poses_forwardpath);
				creep.memory.movable = true;
				return 0;
			}
		} else if (creep.room.name !== gcl_room_name) {
			if (creep.store.getUsedCapacity("energy") == 0) {
				external_room.movethroughrooms(creep, config.conf_gcl_map.rooms_backwardpath, config.conf_gcl_map.poses_backwardpath);
				creep.memory.movable = true;
				return 0;
			} else {
				external_room.movethroughrooms(creep, config.conf_gcl_map.rooms_forwardpath, config.conf_gcl_map.poses_forwardpath);
				creep.memory.movable = true;
				return 0;
			}
		} else {
			if (creep.store.getUsedCapacity("energy") == 0) {
				external_room.movethroughrooms(creep, config.conf_gcl_map.rooms_backwardpath, config.conf_gcl_map.poses_backwardpath);
				creep.memory.movable = true;
				return 0;
			} else {
				if (basic_job.repair_road(creep) == 0) {
					return 0;
				}
				let tower = creep.room.memory.tower_list.map((e) => Game.getObjectById(e)).filter((e) => e.store.getUsedCapacity("energy") < 600)[0];
				if (tower !== undefined) {
					if (creep.transfer(tower, "energy") == ERR_NOT_IN_RANGE) {
						basic_job.movetopos(creep, tower.pos, 1);
						creep.memory.movable = true;
					}
					return;
				}
				let store: AnyStoreStructure;
				if (creep.room.storage !== undefined && creep.room.storage.isActive()) {
					store = creep.room.storage;
				} else {
					let container_status = creep.room.memory.named_structures_status.container.CT;
					if (container_status.finished) {
						store = Game.getObjectById(container_status.id);
					}
				}
				if (store !== undefined) {
					basic_job.transfer(creep, store);
				}
				return 0;
			}
		}
	}
	return 1;
}
