import * as _ from "lodash"
import * as role_init from "./role_init";
import * as mymath from "./mymath";
import * as basic_job from "./basic_job";
import * as defense from "./defense";
import * as hunting from "./hunting"
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
    var conf = config.conf_rooms[creep.room.name];
    if (creep.memory.role == 'maincarrier') {
        creep.say("MC");
        creep.memory.movable = false;
        if (creep.ticksToLive < 20 && creep.store.getUsedCapacity() == 0) {
            creep.suicide();
            return 0;
        }
        let conf_maincarrier = conf.maincarrier;
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
        if_boost: if (creep.room.memory.current_boost_request !== undefined && creep.room.terminal) {
            creep.say("boost");
            let request = creep.room.memory.current_boost_request;
            let labs_status = creep.room.memory.named_structures_status.lab;
            let lab_id = labs_status.B1.id;
            let lab = Game.getObjectById(lab_id);
            if (lab.store.getUsedCapacity("energy") < request.amount * 20) {
                // energy is not enough
                if (creep.memory.resource_type == undefined) {
                    basic_job.withdraw_energy(creep, creep.room.terminal, 0, "energy");
                    return 0;
                } else if (creep.memory.resource_type == "energy") {
                    basic_job.transfer_energy(creep, lab, "energy", conf_maincarrier.working_zone);
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
                    basic_job.withdraw_energy(creep, lab, 0, lab.mineralType, conf_maincarrier.working_zone);
                    return 0;
                }
            } else if (lab.mineralType == undefined || lab.mineralAmount < request.amount * 30) {
                // mineral is not enough
                if (creep.memory.resource_type == undefined) {
                    basic_job.withdraw_energy(creep, creep.room.terminal, 0, request.compound);
                    return 0;
                } else if (creep.memory.resource_type == request.compound) {
                    basic_job.transfer_energy(creep, lab, request.compound, conf_maincarrier.working_zone);
                    return 0;
                } else {
                    basic_job.transfer_energy(creep, creep.room.terminal, creep.memory.resource_type);
                    return 0;
                }
            }
            return 0;
        }
        if_reaction: if (creep.room.memory.reaction_request !== undefined && creep.room.terminal) {
            creep.say("react");
            let request = creep.room.memory.reaction_request;
            let labs_status = creep.room.memory.named_structures_status.lab;
            if (_.map(labs_status, (e) => e.finished).length == 10) {
                let source1_id = labs_status.S1.id;
                let source2_id = labs_status.S2.id;
                let react_ids = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'].map((e) => labs_status[e].id);
                let source1_lab = Game.getObjectById(source1_id);
                let source2_lab = Game.getObjectById(source2_id);
                let react_labs = react_ids.map((e) => Game.getObjectById(e));
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
                                basic_job.withdraw_energy(creep, lab, 0, lab.mineralType, conf_maincarrier.working_zone);
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
                                basic_job.transfer_energy(creep, lab, reactant, conf_maincarrier.working_zone);
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
                                basic_job.withdraw_energy(creep, lab, 0, lab.mineralType, conf_maincarrier.working_zone);
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
            if (creep.memory.resource_type == "battery" || creep.room.terminal == undefined) {
                creep.say("ba: C>S");
                creep.transfer(creep.room.storage, creep.memory.resource_type);
            } else {
                creep.say("ba: C>T");
                creep.transfer(creep.room.terminal, creep.memory.resource_type);
            }
        }
        let game_memory = Game.memory[creep.room.name];
        let links_status = creep.room.memory.named_structures_status.link;
        let link_id = links_status.MAIN.id;
        let link = Game.getObjectById(link_id);
        let link_energy = link.store.getUsedCapacity("energy")
        let creep_energy = creep.store.getUsedCapacity("energy")
        let terminal_energy;
        let storage_energy = creep.room.storage.store.getUsedCapacity("energy");
        let storage_leftenergy = creep.room.storage.store.getFreeCapacity("energy");
        let energy_source = "storage";
        let energy_sink = "storage";
        let factory_id = creep.room.memory.unique_structures_status.factory.id;
        let factory;
        let energy_withdraw_amount = undefined;
        let energy_transfer_amount = undefined;
        if (creep_energy == 0) {
            basic_job.withdraw_energy(creep, creep.room.terminal);
        }
        if (storage_energy > 800000 && factory_id !== undefined) {
            energy_sink = "factory";
        }
        if (creep.room.terminal) {
            terminal_energy = creep.room.terminal.store.getUsedCapacity("energy");
            if (terminal_energy + creep_energy > 60000) {
                energy_source = "terminal";
            } else if (terminal_energy + creep_energy < 50000) {
                energy_sink = "terminal";
            }
        }
		if (link_energy > creep.room.memory.maincarrier_link_amount) {
			energy_source = "link";
			energy_withdraw_amount = link_energy - creep.room.memory.maincarrier_link_amount;
		} else if (link_energy < creep.room.memory.maincarrier_link_amount) {
			energy_sink = "link";
			energy_transfer_amount = creep.room.memory.maincarrier_link_amount - link_energy;
		}
        let strings: {
            [key: string]: string
        } = {
            "storage": "S",
            "terminal": "T",
            "link": "L",
            "factory": "F",
        }
        creep.say(strings[energy_source] + ">" + strings[energy_sink]);
        if (energy_source !== energy_sink) {
            if (creep_energy == 0) {
                let target: AnyStorageStructure;
                if (energy_source == 'storage') {
                    target = creep.room.storage;
                } else if (energy_source == 'terminal') {
                    target = creep.room.terminal;
                } else if (energy_source == 'link') {
                    target = link;
                }
                let output;
                if (energy_withdraw_amount == undefined) {
                    output = creep.withdraw(target, "energy");
                } else {
                    output = creep.withdraw(target, "energy", Math.min(creep.store.getCapacity(), energy_withdraw_amount));
                }
                if (output == 0) {
                    basic_job.movetopos(creep, target.pos, 1);
                }
            } else {
                let target: AnyStorageStructure;
                if (energy_sink == 'storage') {
                    target = creep.room.storage;
                } else if (energy_sink == 'terminal') {
                    target = creep.room.terminal;
                } else if (energy_sink == 'link') {
                    target = link;
                } else if (energy_sink == 'factory') {
                    target = Game.getObjectById(factory_id);
                }
                let output;
                if (energy_transfer_amount == undefined) {
                    output = creep.transfer(target, "energy");
                } else {
                    output = creep.transfer(target, "energy", Math.min(creep_energy, energy_transfer_amount));
                }
                if (output == 0) {
                    basic_job.movetopos(creep, target.pos, 1);
                }
            }
            return 0;
        } else if (Game.time % 10 == 0 && creep_energy == 0 && factory_id !== undefined && (factory = Game.getObjectById(factory_id)) && factory.store.getUsedCapacity("battery") >= 300) {
            creep.say("ba: F>C");
            creep.withdraw(factory, "battery");
            return 0;
        }
    }
    return 1;
}
