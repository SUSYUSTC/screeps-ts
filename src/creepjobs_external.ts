import * as _ from "lodash"
import * as mymath from "./mymath";
import * as basic_job from "./basic_job";
import * as functions from "./functions"
import * as external_room from "./external_room";
import * as config from "./config";
import * as invade from "./invade"
import * as cross_shard from "./cross_shard";
var moveoptions_noset: type_movetopos_options = {
	        setmovable: false,
};
export function creepjob(creep: Creep): number {
	var conf = config.conf_rooms[creep.memory.home_room_name];
	var game_memory = Game.memory[creep.memory.home_room_name];
	if (creep.memory.role == 'externalharvester') {
		creep.say("EH");
		creep.memory.movable = false;
		creep.memory.crossable = true;
		if (creep.memory.working_status == undefined) {
			creep.memory.working_status = 'init';
		}
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
			creep.say("EHf");
			return 0;
		}
		if_init: if (creep.memory.working_status == 'init') {
			if (creep.store.getFreeCapacity("energy") == 0) {
				creep.memory.working_status = 'working';
				break if_init;
			}
			basic_job.get_energy(creep);
			creep.say("EHg");
			return 0;
		}
		if (creep.room.name !== creep.memory.external_room_name) {
			external_room.movethroughrooms(creep, conf_external.rooms_forwardpath, conf_external.poses_forwardpath);
			creep.memory.movable = true;
			creep.say("EHe");
		} else {
			let pos = creep.room.getPositionAt(conf_external.harvester_pos[0], conf_external.harvester_pos[1]);
			if (basic_job.trymovetopos(creep, pos) !== 2) {
				basic_job.repair_road(creep, {range: 3});
				creep.say("EHm");
				return 0;
			}
			creep.memory.crossable = false;
			if (creep.memory.half_time && Game.time % 2 == 0) {
				return 0;
			}
			let source = <Source> Game.getObjectById(conf_external.id);
			basic_job.harvest_with_container(creep, source);
			creep.say("EHh");
			return 0;
		}
		return 0;
	} else if (creep.memory.role == 'externalcarrier') {
		creep.say("EC");
		creep.memory.movable = false;
		creep.memory.crossable = true;
		/*
		if (creep.room.name == creep.memory.external_room_name) {
			basic_job.repair_road(creep);
			creep.say("ECr");
		}
		*/
		let conf_external;
		if (creep.memory.powered) {
			conf_external = conf.external_rooms[creep.memory.external_room_name].powered_source;
		} else {
			conf_external = conf.external_rooms[creep.memory.external_room_name].sources[creep.memory.source_name];
		}
		if (Game.rooms[creep.memory.home_room_name].memory.external_room_status[creep.memory.external_room_name].defense_type !== '') {
			external_room.external_flee(creep, conf.safe_pos, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
			creep.say("ECf");
			return 0;
		}
		// Using creep.room.name !== creep.memory.home_room_name here considering the possibility that the creep need to put energy into link several times
		let xy = conf_external.harvester_pos;
		let pos = creep.room.getPositionAt(xy[0], xy[1]);
		if (creep.store.getFreeCapacity("energy") <= 10 || ((creep.room.name !== creep.memory.external_room_name || creep.pos.getRangeTo(pos) > 1) && creep.store.getUsedCapacity("energy") > 0)) {
			if (creep.room.name !== creep.memory.home_room_name) {
				external_room.movethroughrooms(creep, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
				creep.memory.movable = true;
				creep.say("ECe1");
			} else {
				let structure = basic_job.get_structure_from_carry_end(creep, conf_external.carry_end);
				if (structure != undefined) {
					basic_job.transfer(creep, structure);
					creep.say("ECt");
				} else {
					creep.say("ECn");
				}
			}
		} else {
			if (creep.store.getUsedCapacity("energy") == 0 && creep.ticksToLive <= conf_external.carrier_distance + 10) {
				creep.suicide();
				creep.say("ECd");
				return 0;
			}
			// The creep has no energy so heading toward the source or is waiting to get enough energy
			if (creep.room.name !== creep.memory.external_room_name) {
				external_room.movethroughrooms(creep, conf_external.rooms_forwardpath, conf_external.poses_forwardpath);
				creep.memory.movable = true;
				creep.say("ECe2");
				return 0;
			}
			if (basic_job.movetopos(creep, pos, 1) == 0) {
				creep.say("ECm");
				return 0;
			}
			/*
			// Pickup the resources if exists
			let resource = pos.lookFor(LOOK_RESOURCES)[0];
			if (resource !== undefined && resource.resourceType == "energy" && resource.amount > 30) {
				creep.pickup(resource);
				creep.say("ECp");
			}
			*/
			let container = <StructureContainer>pos.lookFor(LOOK_STRUCTURES).filter((e) => e.structureType == 'container')[0];
			if (creep.pos.getRangeTo(pos) == 1) {
				if (container !== undefined && basic_job.discard_useless_from_container(creep, container, "energy") == 0) {
					return 0;
				}
			}
			if (container !== undefined && container.store.getUsedCapacity("energy") >= creep.store.getFreeCapacity("energy")) {
				if (creep.withdraw(container, "energy") == 0) {
					external_room.movethroughrooms(creep, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
					creep.memory.movable = true;
				}
				creep.say("ECw");
				return 0;
			}
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
					creep.say("EBe1");
					return 0;
				} else {
					let distances = containers.map((e) => creep.pos.getRangeTo(e));
					let argmin = mymath.argmin(distances);
					let container = containers[argmin];
					basic_job.withdraw(creep, container);
					creep.say("EBw");
					return 0;
				}
			} else {
				if (creep.room.name == creep.memory.home_room_name) {
					if (basic_job.get_energy(creep, {min_energy: creep.store.getCapacity()}) == 1) {
						creep.say("EBg");
						return 0;
					}
					creep.say("EBn");
				} else {
					external_room.movethroughrooms(creep, creep.memory.rooms_backwardpath, creep.memory.poses_backwardpath);
					creep.memory.movable = true;
					creep.say("EBe2");
				}
			}
		} else {
			if (creep.room.name !== creep.memory.external_room_name) {
				external_room.movethroughrooms(creep, creep.memory.rooms_forwardpath, creep.memory.poses_forwardpath);
				creep.memory.movable = true;
				creep.say("EBe3");
			} else {
				external_room.moveawayexit(creep);
				basic_job.build_structure(creep)
				if (creep.room.memory.sites_total_progressleft == 0) {
					creep.say("EBd");
					creep.suicide();
				}
				creep.say("EBb");
			}
		}
	} else if (creep.memory.role == 'reserver') {
		creep.say("R");
		creep.memory.movable = true;
		creep.memory.crossable = true;
		let conf_external = conf.external_rooms[creep.memory.external_room_name].controller;
		if (Game.rooms[creep.memory.home_room_name].memory.external_room_status[creep.memory.external_room_name].defense_type !== '') {
			external_room.external_flee(creep, conf.safe_pos, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
			creep.say("Rf");
			return 0;
		}
		if (creep.room.name !== creep.memory.external_room_name) {
			external_room.movethroughrooms(creep, conf_external.rooms_forwardpath, conf_external.poses_forwardpath);
			creep.say("Re");
		} else {
			if (creep.pos.getRangeTo(creep.room.controller) > 1) {
				basic_job.movetopos(creep, creep.room.controller.pos, 1);
				creep.say("Rm");
				return 0;
			}
			creep.memory.movable = false;
			if ((creep.room.controller.reservation !== undefined) && creep.room.controller.reservation.username !== config.username) {
				creep.attackController(creep.room.controller);
				creep.say("Ra");
			} else {
				creep.reserveController(creep.room.controller);
				creep.say("Rr");
			}
		}
		return 0;
	} else if (creep.memory.role == 'preclaimer') {
		creep.say("c");
		creep.memory.movable = true;
		creep.memory.crossable = true;
		if (creep.room.name !== creep.memory.external_room_name) {
			if (creep.memory.shard_move !== undefined) {
				external_room.movethroughshards(creep);
			} else {
				external_room.movethroughrooms(creep, creep.memory.rooms_forwardpath, creep.memory.poses_forwardpath);
			}
			creep.say("ce");
		} else {
			cross_shard.delete_creep_from_shardmemory(creep);
			if (creep.room.controller.my) {
				creep.suicide();
				return 0;
			}
			if (creep.pos.getRangeTo(creep.room.controller) > 1) {
				creep.moveTo(creep.room.controller, {range: 1, costCallback: functions.avoid_exits});
				creep.say("cm");
				return 0;
			}
			creep.claimController(creep.room.controller);
			creep.say("cc");
		}
		return 0;
	} else if (creep.memory.role == 'energy_carrier') {
		creep.say("EC");
		creep.memory.movable = false;
		creep.memory.crossable = true;
		if (creep.room.name == creep.memory.home_room_name) {
			if (creep.store.getFreeCapacity("energy") > 0) {
				basic_job.get_energy(creep);
				creep.say("ECg");
				return;
			}
		}
		if (creep.room.name !== creep.memory.external_room_name) {
			if (creep.memory.shard_move !== undefined) {
				external_room.movethroughshards(creep);
			} else {
				external_room.movethroughrooms(creep, creep.memory.rooms_forwardpath, creep.memory.poses_forwardpath);
			}
			creep.say("ECm");
			return;
		}
		cross_shard.delete_creep_from_shardmemory(creep);
		if (creep.store.getUsedCapacity("energy") > 0) {
			if (creep.room.storage !== undefined) {
				basic_job.transfer(creep, creep.room.storage);
				creep.say("ECt");
			} else {
				let container = creep.room.container.CT;
				if (container != undefined) {
					basic_job.transfer(creep, container);
					creep.say("ECt");
				}
			}
			return;
		}
		let container = creep.room.container.RC;
		if (container != undefined) {
			if (container.store.getUsedCapacity("energy") > 0) {
				basic_job.withdraw(creep, container);
				creep.say("ECw");
			} else {
				basic_job.ask_for_recycle(creep);
				creep.say("ECr");
			}
			return;
		}
	} else if (creep.memory.role == 'help_harvester') {
		creep.say("HH");
		creep.memory.movable = false;
		creep.memory.crossable = true;
		let source_name = creep.memory.source_name;
		let conf_external = config.conf_rooms[creep.memory.external_room_name];
		let container_xy = conf_external.containers[source_name].pos;
		let container_pos = Game.rooms[creep.memory.external_room_name].getPositionAt(container_xy[0], container_xy[1])
		if (creep.room.name !== creep.memory.external_room_name) {
			if (creep.memory.shard_move !== undefined) {
				external_room.movethroughshards(creep);
			} else {
				let conf_help = config.help_list[creep.memory.home_room_name][creep.memory.external_room_name];
				external_room.movethroughrooms(creep, conf_help.rooms_forwardpath, conf_help.poses_forwardpath);
			}
			creep.say("HHe");
			return 0;
		}
		cross_shard.delete_creep_from_shardmemory(creep);
		if (basic_job.trymovetopos(creep, container_pos) !== 2) {
			creep.say("HHm");
			return 0;
		}
		creep.memory.crossable = false;
		let source = Game.getObjectById(conf_external.sources[source_name]);
		if (Game.time % 2 == 1) {
			basic_job.harvest_with_container(creep, source, creep.room.container[source_name]);
			creep.say("HHh");
		}
		return 0;
	} else if (creep.memory.role == 'help_carrier') {
		creep.say("HC");
		creep.memory.movable = false;
		creep.memory.crossable = true;
		if (creep.room.name !== creep.memory.external_room_name) {
			if (creep.memory.shard_move !== undefined) {
				external_room.movethroughshards(creep);
			} else {
				let conf_help = config.help_list[creep.memory.home_room_name][creep.memory.external_room_name];
				external_room.movethroughrooms(creep, conf_help.rooms_forwardpath, conf_help.poses_forwardpath);
			}
			creep.say("HCe");
			return 0;
		}
		cross_shard.delete_creep_from_shardmemory(creep);
		let source_name = creep.memory.source_name;
		if (creep.room.link[source_name] !== undefined && creep.room.link.CT !== undefined) {
			creep.suicide();
		}
		let conf_external = config.conf_rooms[creep.memory.external_room_name];
		let room_external = Game.rooms[creep.memory.external_room_name];
		let conf_container = conf_external.containers[source_name];
		let container_source = creep.room.container[source_name];
		if (container_source == undefined) {
			let transferer_stay_pos = creep.room.getPositionAt(conf_external.transferer_stay_pos[0], conf_external.transferer_stay_pos[1]);
			basic_job.trymovetopos(creep, transferer_stay_pos);
			creep.say("HCm1");
			return 0;
		}
		let container_MDCT = creep.room.container.MD !== undefined ? creep.room.container.MD : creep.room.container.CT;
		let help_builders = creep.room.find(FIND_MY_CREEPS).filter((e) => e.memory.role == 'help_builder');
		if (container_MDCT == undefined && help_builders.length == 0) {
			let transferer_stay_pos = creep.room.getPositionAt(conf_external.transferer_stay_pos[0], conf_external.transferer_stay_pos[1]);
			basic_job.trymovetopos(creep, transferer_stay_pos);
			creep.say("HCm2");
			return 0;
		}
		if (creep.ticksToLive < 20) {
			basic_job.return_energy_before_die(creep);
			creep.say("HCd");
		}
		if (creep.store.getUsedCapacity("energy") == 0) {
			basic_job.withdraw(creep, container_source);
			creep.say("HCw");
			return 0;
		}
		if (container_MDCT !== undefined) {
			let in_range = creep.pos.getRangeTo(container_MDCT) <= 3;
			let energy_carriers_in_range = creep.room.find(FIND_MY_CREEPS).filter((e) => e.memory.role == 'energy_carrier' && e.pos.getRangeTo(container_MDCT) <= 3).length > 0;
			if (!(in_range && energy_carriers_in_range)) {
				basic_job.transfer(creep, container_MDCT);
			}
			creep.say("HCt1");
		} else {
			let help_builder = help_builders[0];
			if (help_builder.store.getFreeCapacity() > 0) {
				basic_job.transfer(creep, help_builder);
				creep.say("HCt2");
			}
		}
		return 0;
	} else if (creep.memory.role == 'help_builder') {
		creep.say("HB");
		creep.memory.movable = false;
		if (creep.memory.crossable == undefined) {
			creep.memory.crossable = true;
		}
		if (creep.memory.request_boost) {
			if (basic_job.boost_request(creep, {"work": "GH2O"}, true) == 1) {
				creep.say("HBb");
				return 0;
			}
		}
		let conf_help = config.help_list[creep.memory.home_room_name][creep.memory.external_room_name];
		let conf_external = config.conf_rooms[creep.memory.external_room_name];
		if (creep.room.name !== creep.memory.external_room_name) {
			if (creep.memory.shard_move !== undefined) {
				external_room.movethroughshards(creep);
			} else {
				external_room.movethroughrooms(creep, conf_help.rooms_forwardpath, conf_help.poses_forwardpath);
			}
			creep.say("HBe");
			return 0;
		}
		cross_shard.delete_creep_from_shardmemory(creep);
		if (creep.ticksToLive < 20 && creep.store.getUsedCapacity("energy") == 0) {
			creep.suicide();
			creep.say("HBd");
			return 0;
		}
		if (creep.room.container.CT !== undefined && creep.store.getUsedCapacity("energy") <= creep.getActiveBodyparts(WORK)) {
			if (creep.room.container.CT.store.getUsedCapacity("energy") >= creep.store.getFreeCapacity("energy")) {
				basic_job.withdraw(creep, creep.room.container.CT);
			}
			creep.say("HBw");
			return 0;
		}
		if (basic_job.build_structure(creep) == 0) {
			creep.say("HBb");
			creep.memory.crossable = true;
			return 0;
		}
		if (basic_job.charge_all(creep) == 0) {
			creep.say("HBc");
			return 0;
		}
		let locations = conf_external.upgraders.locations.map((e) => creep.room.getPositionAt(e[0], e[1]));
		basic_job.movetoposexceptoccupied(creep, locations);
		creep.upgradeController(creep.room.controller);
		creep.memory.crossable = false;
		creep.say("HBu");
		return 0;
	} else if (creep.memory.role == 'guard') {
		creep.say("G");
		creep.memory.movable = false;
		creep.memory.crossable = true;
		let conf_help = config.help_list[creep.memory.home_room_name][creep.memory.external_room_name];
		let conf_external = config.conf_rooms[creep.memory.external_room_name];
		if (creep.room.name !== creep.memory.external_room_name) {
			if (creep.memory.shard_move !== undefined) {
				external_room.movethroughshards(creep);
			} else {
				external_room.movethroughrooms(creep, conf_help.rooms_forwardpath, conf_help.poses_forwardpath);
			}
			creep.say("Ge");
			return 0;
		}
		cross_shard.delete_creep_from_shardmemory(creep);
		if (invade.single_combat_ranged(creep, false) == 0) {
			creep.say("Gra");
		} else {
			let injured_creep = creep.room.find(FIND_MY_CREEPS).filter((e)=> e.hits < e.hitsMax)[0];
			if (injured_creep !== undefined) {
				if (creep.pos.getRangeTo(injured_creep) > 1) {
					basic_job.movetopos(creep, injured_creep.pos, 1);
				} else {
					creep.heal(injured_creep);
				}
				creep.say("Gh");
			} else {
				let safe_pos = creep.room.getPositionAt(conf_external.safe_pos[0], conf_external.safe_pos[1]);
				basic_job.trymovetopos(creep, safe_pos);
				creep.say("Gm");
			}
		}
		return 0;
	}
	return 1;
}
