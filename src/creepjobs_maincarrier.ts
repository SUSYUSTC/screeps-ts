import * as _ from "lodash"
import * as mymath from "./mymath";
import * as basic_job from "./basic_job";
import * as functions from "./functions"
import * as config from "./config";
import * as constants from "./constants"

function movetopos_restricted(creep: Creep, pos: RoomPosition, range: number): number {
    // target has to be in the range of working zone
    if (creep.pos.getRangeTo(pos) <= range) {
        return 0;
    }
    let output = 1;
    let conf_maincarrier = config.conf_rooms[creep.room.name].maincarrier;
    for (let xy of conf_maincarrier.working_zone) {
        if (pos.getRangeTo(xy[0], xy[1]) <= range) {
            basic_job.movetopos_maincarrier(creep, creep.room.getPositionAt(xy[0], xy[1]), 0);
            return 0;
        }
    }
    return output;
}

function move_to_working_pos(creep: Creep, conf_maincarrier: conf_maincarrier) {
    // 0: moving, 1: arrived
    let arrived = false;
    let occupied = false;
    for (let pos of conf_maincarrier.working_zone) {
        if (creep.pos.isEqualTo(pos[0], pos[1])) {
            arrived = true;
            break;
        }
        if (creep.room.lookForAt("creep", pos[0], pos[1]).filter((e) => e.memory.role == 'maincarrier').length > 0) {
            occupied = true;
            break;
        }
    }
    if (!arrived) {
        if (occupied) {
            let waiting_pos = creep.room.getPositionAt(conf_maincarrier.waiting_pos[0], conf_maincarrier.waiting_pos[1]);
            if (!creep.pos.isEqualTo(waiting_pos)) {
                basic_job.movetopos(creep, waiting_pos, 0);
            }
        } else {
            let main_pos = creep.room.getPositionAt(conf_maincarrier.main_pos[0], conf_maincarrier.main_pos[1]);
            basic_job.movetopos_maincarrier(creep, main_pos, 0);
        }
        return 0;
    }
    return 1;
}

function transfer(creep: Creep, structure: AnyStoreStructure, resource_type: ResourceConstant, options: {
    next_structure ? : AnyStoreStructure,
    amount ? : number
} = {}) {
    let out: number;
    if (options.amount == undefined) {
        out = creep.transfer(structure, resource_type)
    } else {
        out = creep.transfer(structure, resource_type, Math.min(creep.store.getUsedCapacity(resource_type), options.amount))
    }
    if (out == ERR_NOT_IN_RANGE) {
        movetopos_restricted(creep, structure.pos, 1);
    } else if (options.next_structure !== undefined) {
        movetopos_restricted(creep, options.next_structure.pos, 1);
    }
    if (out !== ERR_NOT_IN_RANGE && out !== OK) {
        console.log(`Warning: transfer fail with return code ${out} for maincarrier at room ${creep.room.name} at time {Game.time}`);
    }
	return out
}

function withdraw(creep: Creep, structure: AnyStoreStructure, resource_type: ResourceConstant, options: {
    next_structure ? : AnyStoreStructure,
    amount ? : number
} = {}) {
    let out: number;
    if (options.amount == undefined) {
        out = creep.withdraw(structure, resource_type);
    } else {
        out = creep.withdraw(structure, resource_type, Math.min(creep.store.getFreeCapacity(), ( < GeneralStore > structure.store).getUsedCapacity(resource_type), options.amount));
    }
    if (out == ERR_NOT_IN_RANGE) {
        movetopos_restricted(creep, structure.pos, 1);
    } else if (options.next_structure !== undefined) {
        movetopos_restricted(creep, options.next_structure.pos, 1);
    }
    if (out !== ERR_NOT_IN_RANGE && out !== OK) {
        console.log(`Warning: withdraw fail with return code ${out} for maincarrier at room ${creep.room.name} at time {Game.time}`);
    }
}

function boost_serve(creep: Creep, conf_maincarrier: conf_maincarrier) {
    let request = creep.room.memory.current_boost_request;
    let lab = creep.room.lab.B1;
    if (request.finished) {
        // energy not enough
        if (lab.store.getUsedCapacity("energy") < 2000) {
            if (creep.memory.resource_type == undefined) {
                withdraw(creep, creep.room.terminal, "energy", {
                    next_structure: lab
                });
            } else if (creep.memory.resource_type == "energy") {
                transfer(creep, lab, "energy", {
                    next_structure: creep.room.terminal
                });
            } else {
                // wrong type
                transfer(creep, creep.room.terminal, creep.memory.resource_type);
            }
            // lab mineral not correct
        } else if (lab.mineralType !== undefined && creep.room.memory.reaction_request !== undefined && lab.mineralType !== creep.room.memory.reaction_request.product) {
            if (creep.memory.resource_type == undefined) {
                withdraw(creep, lab, lab.mineralType, {
                    next_structure: creep.room.terminal
                });
            } else if (creep.memory.resource_type == lab.mineralType) {
                transfer(creep, creep.room.terminal, lab.mineralType, {
                    next_structure: lab
                });
            } else {
                // wrong type
                transfer(creep, creep.room.terminal, creep.memory.resource_type);
            }
        } else {
            delete creep.room.memory.current_boost_request;
        }
    } else {
        if (lab.store.getUsedCapacity("energy") < request.amount * 20) {
            // energy is not enough
            if (creep.memory.resource_type == undefined) {
                withdraw(creep, creep.room.terminal, "energy", {
                    next_structure: lab
                });
            } else if (creep.memory.resource_type == "energy") {
                transfer(creep, lab, "energy", {
                    next_structure: creep.room.terminal
                });
            } else {
                // wrong type
                transfer(creep, creep.room.terminal, creep.memory.resource_type);
            }
        } else if (lab.mineralType !== undefined && lab.mineralType !== request.compound && !Game.memory[creep.room.name].exact_boost) {
            // mineral in lab does not match request
            if (creep.store.getUsedCapacity() !== 0) {
                transfer(creep, creep.room.terminal, creep.memory.resource_type);
            } else {
                withdraw(creep, lab, lab.mineralType, {
                    next_structure: creep.room.terminal
                });
            }
        } else if (lab.mineralType == undefined || lab.mineralAmount < request.amount * 30 || Game.memory[creep.room.name].exact_boost) {
            // mineral is not enough
            if (creep.memory.resource_type == undefined) {
                let amount = Game.memory[creep.room.name].exact_boost ? request.amount * 30 : request.amount * 30 - lab.mineralAmount;
                let structure = creep.room.terminal.store.getUsedCapacity(request.compound) > 0 ? creep.room.terminal : creep.room.storage;
                withdraw(creep, structure, request.compound, {
                    next_structure: lab,
                    amount: amount
                });
            } else if (creep.memory.resource_type == request.compound) {
                transfer(creep, lab, request.compound, {
                    next_structure: creep.room.terminal
                });
            } else {
                // wrong type
                transfer(creep, creep.room.terminal, creep.memory.resource_type);
            }
        }
    }
}

function react_serve(creep: Creep, conf_maincarrier: conf_maincarrier): number {
    let request = creep.room.memory.reaction_request;
    // fill -> running -> clear
    // !ready && !finished -- fill source labs --> ready && !finished -- running lab --> !ready && finished -- clear react labs --> !ready && finished
    if (Object.keys(creep.room.lab).length == 10) {
        let react_names = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'B1'];
        let source1_lab = creep.room.lab.S1;
        let source2_lab = creep.room.lab.S2;
        let source_labs = [source1_lab, source2_lab];
        let reactants = [request.reactant1, request.reactant2];
        if (creep.room.memory.reaction_request.status == undefined) {
            delete creep.room.memory.reaction_request;
        }
        let reaction_request = creep.room.memory.reaction_request;
        switch (reaction_request.status) {
            case 'fill': {
                for (let i of [0, 1]) {
                    let lab = source_labs[i];
                    let reactant = reactants[i];
                    // fill source labs
                    // mineralType is correct
                    if (lab.mineralType == undefined || (lab.mineralType == reactant && lab.mineralAmount < reaction_request.amount)) {
                        let amount = reaction_request.amount - lab.mineralAmount;
                        if (creep.memory.resource_type == undefined) {
                            if (creep.room.terminal.store.getUsedCapacity(reactant) == 0) {
                                creep.room.memory.reaction_request.status = 'clear';
                                return 0;
                            }
                            withdraw(creep, creep.room.terminal, reactant, {
                                next_structure: lab,
                                amount: amount
                            });
                        } else if (creep.memory.resource_type == reactant) {
                            transfer(creep, lab, reactant, {
                                next_structure: creep.room.terminal,
                                amount: amount
                            });
                        } else {
                            // return wrong resource, so don't move
                            transfer(creep, creep.room.terminal, creep.memory.resource_type);
                        }
                        return 0;
                        // mineralType is incorrect
                    } else if (lab.mineralType !== reactant) {
                        // change reactant
                        if (creep.memory.resource_type == undefined) {
                            withdraw(creep, lab, lab.mineralType, {
                                next_structure: creep.room.terminal
                            });
                        } else {
                            transfer(creep, creep.room.terminal, creep.memory.resource_type, {
                                next_structure: lab
                            });
                        }
                        return 0;
                    }
                    // else: lab.mineralType == reactant && lab.mineralAmount >= config.react_init_amount
                }
                // clear react labs
                for (let lab_name of react_names) {
                    let lab = creep.room.lab[lab_name];
                    if (lab.mineralType !== undefined && lab.mineralType !== request.product) {
                        if (creep.store.getUsedCapacity() > 0) {
                            transfer(creep, creep.room.terminal, creep.memory.resource_type, {
                                next_structure: lab
                            });
                        } else {
                            withdraw(creep, lab, lab.mineralType, {
                                next_structure: creep.room.terminal
                            });
                        }
                        return 0;
                    }
                }
                creep.room.memory.reaction_request.status = 'running';
                break;
            }
            case 'running': {
                break;
            }
            case 'clear': {
                for (let lab_name in creep.room.lab) {
                    let lab = creep.room.lab[lab_name];
                    if (lab.mineralType !== undefined) {
                        if (creep.store.getUsedCapacity() > 0) {
                            transfer(creep, creep.room.terminal, creep.memory.resource_type, {
                                next_structure: lab
                            });
                        } else {
                            withdraw(creep, lab, lab.mineralType, {
                                next_structure: creep.room.terminal
                            });
                        }
                        return 0;
                    }
                }
                delete creep.room.memory.reaction_request;
                break;
            }
        }
    } else {
        delete creep.room.memory.reaction_request;
    }
    return 1;
}

function unboost_withdraw(creep: Creep) {
    if (creep.room.memory.unboost_withdraw_request) {
        let container = creep.room.container.UB;
        let resource = < ResourceConstant > Object.keys(container.store)[0];
        if (creep.memory.resource_type !== undefined) {
            if (resource == undefined) {
                transfer(creep, creep.room.terminal, creep.memory.resource_type);
            } else {
                transfer(creep, creep.room.terminal, creep.memory.resource_type, {
                    next_structure: container
                });
            }
        } else {
            if (resource == undefined) {
                delete creep.room.memory.unboost_withdraw_request;
            } else {
                withdraw(creep, container, resource, {
                    next_structure: creep.room.terminal
                });
            }
        }
        return 0;
    }
    return 1;
}

function structure_from_name(room_name: string, name: type_main_structure_names): AnyStoreStructure {
    let target: AnyStoreStructure;
    let room = Game.rooms[room_name];
    if (name == 'storage') {
        target = room.storage;
    } else if (name == 'terminal') {
        target = room.terminal;
    } else if (name == 'link') {
        target = room.link.MAIN;
    } else if (name == 'factory') {
        target = room.factory;
    } else if (name == 'powerspawn') {
        target = room.powerSpawn;
    } else if (name == 'nuker') {
        target = room.nuker;
    }
    return target;
}

function get_amounts(room_name: string, list: type_main_structure_names[], resource_type: ResourceConstant): type_main_structure_amounts {
    let result: type_main_structure_amounts = {};
    for (let structurename of list) {
		let structure = structure_from_name(room_name, structurename);
		if (structure == undefined) {
			result[structurename] = undefined;
		} else {
			result[structurename] = (<GeneralStore>structure.store).getUsedCapacity(resource_type);
		}
    }
    return result;
}

function get_energy_transport_jobs(creep: Creep): type_transport_job[] {
    let capacity = creep.store.getCapacity();
    let room = creep.room;
    let jobs: type_transport_job[] = [];
    let amounts = get_amounts(room.name, ['storage', 'terminal', 'link', 'factory', 'powerspawn', 'nuker'], 'energy');
    let withdraw_from: type_main_structure_names = undefined;
    if (amounts.terminal >= config.terminal_min_energy + 5000) {
        withdraw_from = "terminal";
    } else if (amounts.terminal !== undefined && amounts.storage == undefined) {
        withdraw_from = "terminal";
    } else if (amounts.storage !== undefined) {
        withdraw_from = "storage";
    }
    let transfer_to: type_main_structure_names = undefined;
    if (amounts.storage < config.storage_max_energy - 5000) {
        transfer_to = "storage";
    } else if (amounts.storage !== undefined && amounts.terminal == undefined) {
        transfer_to = "storage";
    } else if (amounts.terminal !== undefined) {
        transfer_to = "terminal";
    }
    if (amounts.link !== undefined) {
        if (amounts.link < room.memory.maincarrier_link_amount) {
            if (withdraw_from !== undefined) {
                jobs.push({
					resource_type: "energy",
                    from: withdraw_from,
                    to: "link",
                    amount: room.memory.maincarrier_link_amount - amounts.link,
                })
            }
        } else if (amounts.link > room.memory.maincarrier_link_amount) {
            if (transfer_to !== undefined) {
                jobs.push({
					resource_type: "energy",
                    from: "link",
                    to: transfer_to,
                    amount: amounts.link - room.memory.maincarrier_link_amount,
                })
            }
        }
    }
    if (amounts.storage !== undefined && amounts.factory !== undefined) {
        if (amounts.storage >= config.storage_max_energy && amounts.factory < config.factory_max_energy) {
			let amount = Math.min(amounts.storage - config.storage_max_energy + 1, config.factory_max_energy - amounts.factory)
			amount = Math.ceil(amount / capacity) * capacity;
            jobs.push({
				resource_type: "energy",
                from: "storage",
                to: "factory",
                amount: amount,
            })
        } else if (amounts.storage < config.storage_min_energy && amounts.factory >= config.factory_min_energy) {
			let amount = Math.min(config.storage_min_energy - amounts.storage, amounts.factory - config.factory_min_energy + 1)
			amount = Math.ceil(amount / capacity) * capacity;
            jobs.push({
				resource_type: "energy",
                from: "factory",
                to: "storage",
                amount: amount,
            })
        }
    }
    if (amounts.storage !== undefined && amounts.terminal !== undefined) {
        if (amounts.terminal >= config.terminal_max_energy) {
			let amount = amounts.terminal - config.terminal_max_energy + 1;
			amount = Math.ceil(amount / capacity) * capacity;
            jobs.push({
				resource_type: "energy",
                from: "terminal",
                to: "storage",
                amount: amount,
            })
        } else if (amounts.terminal < config.terminal_min_energy) {
			let amount = config.terminal_min_energy - amounts.terminal;
			amount = Math.ceil(amount / capacity) * capacity;
            jobs.push({
				resource_type: "energy",
                from: "storage",
                to: "terminal",
                amount: amount,
            })
        }
    }
    if (amounts.powerspawn < config.powerspawn_min_energy) {
        if (withdraw_from !== undefined) {
			let amount = Math.floor((5000-amounts.powerspawn) / capacity) * capacity;
            jobs.push({
				resource_type: "energy",
                from: withdraw_from,
                to: "powerspawn",
                amount: amount,
            })
        }
    }
    if (amounts.nuker < 300000) {
        if (withdraw_from !== undefined) {
            jobs.push({
				resource_type: "energy",
                from: withdraw_from,
                to: "nuker",
                amount: 300000 - amounts.nuker,
            })
        }
    }
    return jobs
}

type type_requirement = {
	resource_type: ResourceConstant[];
    from: type_main_structure_names;
    to: type_main_structure_names;
    to_min_amount: number;
	to_limit_amount ?: number;
	to_expect_amount ?: number;
    to_max_amount ? : number;
}

var nuker_G_requirement: type_requirement = {
	resource_type: ["G"],
	from: "terminal",
	to: "nuker",
	to_min_amount: 5000,
	to_limit_amount: 5000,
}

var power_requirement: type_requirement = {
	resource_type: ["power"],
	from: "terminal",
	to: "powerspawn",
	to_min_amount: 4,
	to_limit_amount: 100,
}

var terminal_battery_requirement: type_requirement = {
	resource_type: ["battery"],
	from: "storage",
	to: "terminal",
	to_min_amount: config.terminal_min_battery,
	to_max_amount: config.terminal_max_battery,
}

var factory_battery_requirement: type_requirement = {
	resource_type: ["battery"],
	from: "storage",
	to: "factory",
	to_min_amount: config.factory_min_battery,
	to_max_amount: config.factory_max_battery,
}

var mineral_requirement: type_requirement = {
	resource_type: constants.general_minerals,
	from: "storage",
	to: "terminal",
	to_min_amount: config.terminal_min_mineral,
	to_max_amount: config.terminal_max_mineral,
}

var store_mineral_requirement: type_requirement = {
	resource_type: [],
	from: "storage",
	to: "terminal",
	to_min_amount: config.terminal_min_store_mineral,
	to_max_amount: config.terminal_max_store_mineral,
}

var commodity_requirement = {
	from: "storage",
	to: "terminal",
	to_min_amount: config.terminal_min_mineral,
	to_max_amount: config.terminal_max_mineral,
}

type type_commodity_requirements = {
	bar: type_requirement;
	depo: type_requirement;
	product: type_requirement
}
function get_room_commodity_requirements(room_name: string): type_commodity_requirements {
	let zones = config.commodity_room_conf[room_name];
	if (zones == undefined) {
		return undefined;
	}
	let productions = zones.map((e) => constants.basic_commodity_production[e]);
	let bars = productions.map((e) => e.bar);
	let depos = productions.map((e) => e.depo);
	let products = productions.map((e) => e.product);
	let result: type_commodity_requirements = {
		bar: {
			resource_type: bars,
			from: "terminal",
			to: "factory",
			to_min_amount: 200,
			to_expect_amount: 2000,
		},
		depo: {
			resource_type: depos,
			from: "terminal",
			to: "factory",
			to_min_amount: 200,
			to_expect_amount: 2000,
		},
		product: {
			resource_type: products,
			from: "factory",
			to: "terminal",
			to_min_amount: 50000,
		}
	};
	return result;
}

function get_required_jobs(creep: Creep, requirement: type_requirement): type_transport_job[] {
	let jobs: type_transport_job[] = [];
	let capacity = creep.store.getCapacity();
	let structure_from = structure_from_name(creep.room.name, requirement.from);
	let structure_to = structure_from_name(creep.room.name, requirement.to);
	if (structure_from == undefined || structure_to == undefined) {
		return jobs;
	}
	for (let resource of requirement.resource_type) {
		let amount_from = (<GeneralStore>structure_from.store).getUsedCapacity(resource);
		let amount_to = (<GeneralStore>structure_to.store).getUsedCapacity(resource);
		if (amount_to >= requirement.to_max_amount) {
			let amount = amount_to - requirement.to_max_amount + 1;
			amount = Math.ceil(amount / capacity) * capacity;
			let job: type_transport_job = {
				resource_type: resource,
				from: requirement.to,
				to: requirement.from,
				amount: amount,
			}
			jobs.push(job);
		} else if (amount_to < requirement.to_min_amount && amount_from > 0) {
			let amount: number;
			if (requirement.to_limit_amount !== undefined) {
				amount = requirement.to_limit_amount - amount_to;
			} else if (requirement.to_expect_amount !== undefined) {
				amount = requirement.to_expect_amount - amount_to;
				amount = Math.ceil(amount / capacity) * capacity;
			} else {
				amount = requirement.to_min_amount - amount_to;
				amount = Math.ceil(amount / capacity) * capacity;
			}
			amount = Math.min(amount, amount_from);
			let job: type_transport_job = {
				resource_type: resource,
				from: requirement.from,
				to: requirement.to,
				amount: amount,
			}
			jobs.push(job);
		}
	}
	return jobs;
}

function get_all_jobs(creep: Creep, level: number): type_transport_job[] {
	let jobs: type_transport_job[] = [];
	jobs = jobs.concat(get_energy_transport_jobs(creep));
	jobs = jobs.concat(get_required_jobs(creep, factory_battery_requirement));
	if (level >= 1) {
		jobs = jobs.concat(get_required_jobs(creep, terminal_battery_requirement));
		jobs = jobs.concat(get_required_jobs(creep, power_requirement));

		let store_mineral = config.t3_room_store[creep.room.name];
		if (store_mineral !== undefined) {
			let this_mineral_requirement = _.clone(mineral_requirement);
			this_mineral_requirement.resource_type = this_mineral_requirement.resource_type.filter((e) => e !== store_mineral);
			let this_store_mineral_requirement = _.clone(store_mineral_requirement);
			this_store_mineral_requirement.resource_type = [store_mineral];
			jobs = jobs.concat(get_required_jobs(creep, this_mineral_requirement));
			jobs = jobs.concat(get_required_jobs(creep, this_store_mineral_requirement));
		} else {
			jobs = jobs.concat(get_required_jobs(creep, mineral_requirement));
		}

		jobs = jobs.concat(get_required_jobs(creep, nuker_G_requirement));
		let commodity_requirements = get_room_commodity_requirements(creep.room.name);
		if (commodity_requirements !== undefined) {
			jobs = jobs.concat(get_required_jobs(creep, commodity_requirements.bar));
			jobs = jobs.concat(get_required_jobs(creep, commodity_requirements.depo));
			jobs = jobs.concat(get_required_jobs(creep, commodity_requirements.product));
		}
	}
    return jobs;
}

var structure_names: {
    [key: string]: string
} = {
    "storage": "S",
    "terminal": "T",
    "link": "L",
    "factory": "F",
    "powerspawn": "P",
    "nuker": "N",
}
var resource_names: {
    [key in ResourceConstant] ? : string
} = {
    "energy": "E",
    "battery": "B",
    "power": "P",
}

function get_resource_name(resource: ResourceConstant): string {
    if (resource_names[resource] !== undefined) {
        return resource_names[resource];
    } else {
        return resource;
    }
}

function transfer_resource(creep: Creep, job: type_transport_job) {
    // 0: move, 1: transfer
    creep.say(get_resource_name(job.resource_type) + ": " + structure_names[job.from] + ">" + structure_names[job.to]);
    if (creep.memory.resource_type == undefined) {
        let target = structure_from_name(creep.room.name, job.from);
        withdraw(creep, target, job.resource_type, {
            amount: job.amount,
        });
    } else if (creep.memory.resource_type == job.resource_type) {
        let target = structure_from_name(creep.room.name, job.to);
        let out = transfer(creep, target, job.resource_type, {
            amount: job.amount,
        });
		if (out == 0) {
			job.amount -= Math.min(creep.store.getUsedCapacity(job.resource_type), job.amount);
		}
    } else {
        transfer(creep, creep.room.terminal, creep.memory.resource_type, {
            amount: job.amount,
        });
	}
    return 1;
}

export function creepjob(creep: Creep): number {
    var conf = config.conf_rooms[creep.room.name];
    if (creep.memory.role == 'maincarrier') {
        creep.say("MC");
        creep.memory.movable = false;
        creep.memory.crossable = true;
		/*
        let link = creep.room.link.MAIN;
        let link_energy = link.store.getUsedCapacity("energy");
        if (link_energy == creep.room.memory.maincarrier_link_amount && creep.room.memory.current_boost_request == undefined) {
            if (Game.time < creep.memory.next_time.wakeup) {
                creep.say("sleep");
                return 0;
            }
        } else {
            creep.memory.next_time.wakeup = Game.time;
        }
		*/
        if (creep.ticksToLive < 6 && creep.store.getUsedCapacity() == 0) {
            creep.suicide();
            return 0;
        }
        let conf_maincarrier = conf.maincarrier;
        if (move_to_working_pos(creep, conf_maincarrier) == 0) {
            return 0;
        }
        if (creep.store.getUsedCapacity() == 0) {
            delete creep.memory.resource_type;
        } else {
            creep.memory.resource_type = < ResourceConstant > Object.keys(creep.store)[0]
        }
        if (creep.room.memory.current_boost_creep !== undefined && Game.creeps[creep.room.memory.current_boost_creep] == undefined) {
            console.log(`Warning: delete boost request of non-existant creep ${creep.room.memory.current_boost_creep} at room ${creep.room.name} at time ${Game.time}`);
            delete creep.room.memory.current_boost_request;
            delete creep.room.memory.current_boost_creep;
        }
        if (creep.room.memory.current_boost_request !== undefined && creep.room.terminal) {
            creep.say("boost");
            boost_serve(creep, conf_maincarrier);
            return 0;
        }
        if (creep.room.memory.reaction_request !== undefined && creep.room.memory.reaction_request.status !== 'running') {
            creep.say("react");
            if (react_serve(creep, conf_maincarrier) == 0) {
                return 0;
            }
        }
        if (unboost_withdraw(creep) == 0) {
            return 0;
        }
        creep.say("MC");
        let main_pos = creep.room.getPositionAt(conf_maincarrier.main_pos[0], conf_maincarrier.main_pos[1]);
        if (!creep.pos.isEqualTo(main_pos.x, main_pos.y)) {
            basic_job.movetopos_maincarrier(creep, main_pos, 0);
            return 0;
        }

		if (creep.memory.next_time == undefined) {
			creep.memory.next_time = {};
		}
		if (creep.memory.next_time.level0 == undefined) {
			creep.memory.next_time.level0 = Game.time;
		}
		if (creep.memory.next_time.level1 == undefined) {
			creep.memory.next_time.level1 = Game.time;
		}
		if (creep.memory.jobs == undefined) {
			creep.memory.jobs = [];
		}
		if (Game.time >= creep.memory.next_time.level1) {
			let jobs = get_all_jobs(creep, 1);
			creep.memory.jobs = jobs;
			creep.memory.next_time.level1 = Game.time + 20;
		} else if (Game.time >= creep.memory.next_time.level0 && creep.memory.resource_type == undefined && creep.memory.jobs.length == 0) {
			let jobs = get_all_jobs(creep, 0);
			creep.memory.jobs = jobs;
			creep.memory.next_time.level0 = Game.time + 5;
		}

		creep.memory.jobs = creep.memory.jobs.filter((e) => e.amount > 0);
		let job = creep.memory.jobs[0];
		if (job !== undefined) {
			transfer_resource(creep, job);
		} else if (creep.memory.resource_type) {
			transfer(creep, creep.room.terminal, creep.memory.resource_type);
		}

    }
    return 0;
}
