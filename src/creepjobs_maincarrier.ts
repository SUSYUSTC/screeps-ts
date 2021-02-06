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
	if (creep.memory.role == 'maincarrier') {
		creep.say("MC");
		creep.memory.movable = false;
		if (creep.ticksToLive < 20 && creep.store.getUsedCapacity() == 0) {
			creep.suicide();
			return 0;
		}
		let conf_maincarrier = conf.maincarriers.MAIN;
		let main_pos = creep.room.getPositionAt(conf_maincarrier.main_pos[0], conf_maincarrier.main_pos[1]);
		let arrived = false;
		let occupied = false;
		for (let pos of conf_maincarrier.working_zone) {
			if (creep.pos.isEqualTo(pos[0], pos[1])) {
				arrived = true;
				break;
			}
			if (creep.room.lookForAt("creep", pos[0], pos[1]).length > 0) {
				occupied = true;
				break;
			}
		}
		if (!arrived) {
			if (occupied) {
				basic_job.movetopos(creep, creep.room.getPositionAt(conf_maincarrier.waiting_pos[0], conf_maincarrier.waiting_pos[1]), 0);
			} else {
				basic_job.movetopos(creep, main_pos, 0);
			}
			return 0;
		}
		if (creep.store.getUsedCapacity() == 0) {
			delete creep.memory.resource_type;
		} else {
			creep.memory.resource_type = < ResourceConstant > Object.keys(creep.store)[0]
		}
		if_boost: if (creep.room.memory.current_boost_request !== undefined) {
			creep.say("boost");
			let request = creep.room.memory.current_boost_request;
			let conf_labs = Memory.rooms_conf[creep.room.name].labs;
			let lab_id = Object.values(conf_labs).filter((e) => e.state == 'boost')[0].id;
			let lab = Game.getObjectById(lab_id);
			if (lab.store.getUsedCapacity("energy") < request.amount * 20) {
				// energy is not enough
				if (creep.memory.resource_type == undefined) {
					basic_job.withdraw_energy(creep, creep.room.terminal, 0, "energy");
					return 0;
				} else if (creep.memory.resource_type == "energy") {
					basic_job.transfer_energy(creep, lab, "energy");
					return 0;
				} else {
					basic_job.transfer_energy(creep, creep.room.terminal, creep.memory.resource_type);
					return 0;
				}
			} else if (lab.mineralType !== undefined && lab.mineralType !== request.compound) {
				// mineral in lab does not match request
				if (creep.store.getUsedCapacity() !== 0) {
					basic_job.transfer_energy(creep, creep.room.terminal, creep.memory.resource_type);
					return 0;
				} else {
					basic_job.withdraw_energy(creep, lab, 0, lab.mineralType);
					return 0;
				}
			} else if (lab.mineralType == undefined || lab.mineralAmount < request.amount * 30) {
				// mineral is not enough
				if (creep.memory.resource_type == undefined) {
					basic_job.withdraw_energy(creep, creep.room.terminal, 0, request.compound);
					return 0;
				} else if (creep.memory.resource_type == request.compound) {
					basic_job.transfer_energy(creep, lab, request.compound);
					return 0;
				} else {
					basic_job.transfer_energy(creep, creep.room.terminal, creep.memory.resource_type);
					return 0;
				}
			}
			return 0;
		}
		if_reaction: if (creep.room.memory.reaction_request !== undefined) {
			creep.say("react");
			let request = creep.room.memory.reaction_request;
			let conf_labs = Memory.rooms_conf[creep.room.name].labs;
			let source1_ids = _.filter(conf_labs, (e) => e.state == 'source1' && e.finished);
			let source2_ids = _.filter(conf_labs, (e) => e.state == 'source2' && e.finished);
			let react_ids = _.filter(conf_labs, (e) => e.state == 'react' && e.finished);
			if (source1_ids.length == 1 && source2_ids.length == 1 && react_ids.length == 7) {
				let source1_lab = Game.getObjectById(source1_ids[0].id);
				let source2_lab = Game.getObjectById(source2_ids[0].id);
				let react_labs = react_ids.map((e) => Game.getObjectById(e.id));
				if (creep.room.memory.reaction_ready) {
					if (source1_lab.mineralType == undefined && source2_lab.mineralType == undefined) {
						creep.room.memory.reaction_ready = false;
					}
				} else {
					if (source1_lab.store.getUsedCapacity(request.reactant1) == 280 && source2_lab.store.getUsedCapacity(request.reactant2) == 280) {
						creep.room.memory.reaction_ready = true;
					}
				}
				if (!creep.room.memory.reaction_ready) {
					let source_labs = [source1_lab, source2_lab];
					let reactants = [request.reactant1, request.reactant2];
					let temp_source_labs = {
						[reactants[0]]: source_labs[0],
						[reactants[1]]: source_labs[1]
					}
					let has_enough_source = mymath.all(reactants.map((e) => creep.room.terminal.store.getUsedCapacity(e) >= 280 || creep.store.getUsedCapacity(e) >= 280 || temp_source_labs[e].store.getUsedCapacity(e) >= 280));
					for (let lab of react_labs) {
						if (lab.mineralType !== undefined && (!has_enough_source || lab.mineralType !== request.product || lab.store.getUsedCapacity(lab.mineralType) >= 280)) {
							if (creep.store.getUsedCapacity() !== 0) {
								basic_job.transfer_energy(creep, creep.room.terminal, creep.memory.resource_type);
								return 0;
							} else {
								basic_job.withdraw_energy(creep, lab, 0, lab.mineralType);
								return 0;
							}
						}
					}
					if (!has_enough_source) {
						delete creep.room.memory.reaction_request;
						return 0;
					}
					for (let i of [0, 1]) {
						let lab = source_labs[i];
						let reactant = reactants[i];
						if (lab.mineralType == undefined) {
							if (creep.memory.resource_type == reactant && creep.store.getUsedCapacity(creep.memory.resource_type) == 280) {
								basic_job.transfer_energy(creep, lab, reactant);
								return 0;
							} else if (creep.memory.resource_type == undefined) {
								let output = creep.withdraw(creep.room.terminal, reactant, 280);
								if (output == ERR_NOT_IN_RANGE) {
									basic_job.movetopos(creep, creep.room.terminal.pos, 1);
								} else if (output == ERR_NOT_ENOUGH_RESOURCES) {
									delete creep.room.memory.reaction_request;
								}
								return 0;
							} else {
								basic_job.transfer_energy(creep, creep.room.terminal, creep.memory.resource_type);
								return 0;
							}
						} else if (lab.mineralType !== reactant || lab.store.getUsedCapacity(lab.mineralType) !== 280) {
							if (creep.memory.resource_type == undefined) {
								basic_job.withdraw_energy(creep, lab, 0, lab.mineralType);
								return 0;
							} else {
								basic_job.transfer_energy(creep, creep.room.terminal, creep.memory.resource_type);
								return 0;
							}
						}
					}
				}
			}
		}
		creep.say("MC");
		if (!creep.pos.isEqualTo(main_pos.x, main_pos.y)) {
			basic_job.movetopos(creep, main_pos, 0);
		}
		if (creep.memory.resource_type !== undefined && creep.memory.resource_type !== "energy") {
			basic_job.transfer_energy(creep, creep.room.terminal, creep.memory.resource_type)
		}
		let link_id = conf.links[conf_maincarrier.link_name].id;
		let link = Game.getObjectById(link_id);
		let link_energy = link.store.getUsedCapacity("energy")
		let creep_energy = creep.store.getUsedCapacity("energy")
		let terminal_energy;
		let storage_energy = creep.room.storage.store.getUsedCapacity("energy");
		let storage_leftenergy = creep.room.storage.store.getFreeCapacity("energy");
		if (conf_maincarrier.terminal) {
			terminal_energy = creep.room.terminal.store.getUsedCapacity("energy");
		}
		if (link_energy < conf_maincarrier.link_amount && (storage_energy > 5000 || creep_energy !== 0)) {
			if (creep_energy == 0) {
				creep.withdraw(creep.room.storage, "energy");
			} else {
				creep.transfer(link, "energy", Math.min(conf_maincarrier.link_amount - link_energy, creep_energy));
			}
			return 0;
		} else if (link_energy > conf_maincarrier.link_amount) {
			if (creep_energy == 0) {
				creep.withdraw(link, "energy", Math.min(link_energy - conf_maincarrier.link_amount, creep_energy));
			} else {
				if (creep.transfer(creep.room.storage, "energy") !== 0) {
					creep.transfer(creep.room.terminal, "energy");
				}
			}
		} else if (conf_maincarrier.terminal && terminal_energy < 50000 && storage_energy > 50000) {
			if (creep_energy == 0) {
				creep.withdraw(creep.room.storage, "energy");
			} else {
				creep.transfer(creep.room.terminal, "energy");
			}
		} else if (conf_maincarrier.terminal && terminal_energy > 60000 && storage_leftenergy > 60000) {
			if (creep_energy == 0) {
				creep.withdraw(creep.room.terminal, "energy");
			} else {
				creep.transfer(creep.room.storage, "energy");
			}
		}
    }
	return 1;
}
