import * as _ from "lodash"
import * as role_init from "./role_init";
import * as mymath from "./mymath";
import * as basic_job from "./basic_job";
import * as defense from "./defense";
import * as hunting from "./hunting"
import * as functions from "./functions"
import * as external_room from "./external_room";
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

function transfer(creep: Creep, structure: AnyStoreStructure, resource_type: ResourceConstant, options: {next_structure ?: AnyStoreStructure, amount ?: number} = {}) {
	let out: number;
	if (options.amount == undefined) {
		out = creep.transfer(structure, resource_type)
	} else {
		out = creep.transfer(structure, resource_type, options.amount)
	}
    if (out == ERR_NOT_IN_RANGE) {
        movetopos_restricted(creep, structure.pos, 1);
    } else if (options.next_structure !== undefined) {
        movetopos_restricted(creep, options.next_structure.pos, 1);
	}
	if (out !== ERR_NOT_IN_RANGE && out !== OK) {
		console.log(`Warning: transfer fail with return code ${out} for maincarrier at room ${creep.room.name} at time {Game.time}`);
	}
}

function withdraw(creep: Creep, structure: AnyStoreStructure, resource_type: ResourceConstant, options: {next_structure ?: AnyStoreStructure, amount ?: number} = {}) {
	let out: number;
	if (options.amount == undefined) {
		out = creep.withdraw(structure, resource_type);
	} else {
		out = creep.withdraw(structure, resource_type, options.amount);
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
		if (lab.store.getUsedCapacity("energy") < 2000) {
			if (creep.memory.resource_type == undefined) {
				withdraw(creep, creep.room.terminal, "energy", {next_structure: lab});
			} else if (creep.memory.resource_type == "energy") {
				transfer(creep, lab, "energy", {next_structure: creep.room.terminal});
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
				withdraw(creep, creep.room.terminal, "energy", {next_structure: lab});
			} else if (creep.memory.resource_type == "energy") {
				transfer(creep, lab, "energy", {next_structure: creep.room.terminal});
			} else {
				// wrong type
				transfer(creep, creep.room.terminal, creep.memory.resource_type);
			}
		} else if (lab.mineralType !== undefined && lab.mineralType !== request.compound && !Game.memory[creep.room.name].exact_boost) {
			// mineral in lab does not match request
			if (creep.store.getUsedCapacity() !== 0) {
				transfer(creep, creep.room.terminal, creep.memory.resource_type);
			} else {
				withdraw(creep, lab, lab.mineralType, {next_structure: creep.room.terminal});
			}
		} else if (lab.mineralType == undefined || lab.mineralAmount < request.amount * 30 || Game.memory[creep.room.name].exact_boost) {
			// mineral is not enough
			if (creep.memory.resource_type == undefined) {
				let amount: number;
				if (Game.memory[creep.room.name].exact_boost) {
					amount = Math.min(creep.store.getFreeCapacity(), request.amount * 30);
				} else {
					amount = Math.min(creep.store.getFreeCapacity(), request.amount * 30 - lab.mineralAmount);
				}
				withdraw(creep, creep.room.terminal, request.compound, {next_structure: lab, amount: amount});
			} else if (creep.memory.resource_type == request.compound) {
				transfer(creep, lab, request.compound, {next_structure: creep.room.terminal});
			} else {
				// wrong type
				transfer(creep, creep.room.terminal, creep.memory.resource_type);
			}
		}
	}
}

function react_serve(creep: Creep, conf_maincarrier: conf_maincarrier): number {
    let request = creep.room.memory.reaction_request;
    if (Object.keys(creep.room.container).length == 10) {
        let react_names = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'B1'];
        let source1_lab = creep.room.lab.S1;
        let source2_lab = creep.room.lab.S2;
        if (creep.room.memory.reaction_ready) {
            if (source1_lab.mineralAmount <= config.react_min_amount || source2_lab.mineralAmount <= config.react_min_amount) {
                creep.room.memory.reaction_ready = false;
            }
			if (request == undefined) {
				return 1;
			}
        } else {
            if (source1_lab.store.getUsedCapacity(request.reactant1) >= config.react_init_amount && source2_lab.store.getUsedCapacity(request.reactant2) >= config.react_init_amount) {
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
			// enough when terminal+creep+lab >= init
            let has_enough_source = mymath.all(reactants.map((e) => creep.room.terminal.store.getUsedCapacity(e) + creep.store.getUsedCapacity(e) + temp_source_labs[e].store.getUsedCapacity(e) >= config.react_init_amount));
            for (let lab_name of react_names) {
				let lab = creep.room.lab[lab_name];
                if (lab.mineralType !== undefined && (!has_enough_source || lab.mineralType !== request.product || lab.store.getUsedCapacity(lab.mineralType) >= creep.store.getCapacity())) {
					// react labs exceeds amount or does not match
                    if (creep.store.getUsedCapacity() !== 0) {
                        transfer(creep, creep.room.terminal, creep.memory.resource_type, {next_structure: lab});
                    } else {
                        withdraw(creep, lab, lab.mineralType, {next_structure: creep.room.terminal});
                    }
					return 0;
                }
            }
            if (!has_enough_source) {
                delete creep.room.memory.reaction_request;
                return 0;
            }
			// supply the source labs
            for (let i of [0, 1]) {
                let lab = source_labs[i];
                let reactant = reactants[i];

                if (lab.mineralType == undefined || (lab.mineralType == reactant && lab.mineralAmount < config.react_init_amount)) {
					if (creep.memory.resource_type == undefined) {
						let output = creep.withdraw(creep.room.terminal, reactant);
						if (output == ERR_NOT_IN_RANGE) {
							movetopos_restricted(creep, creep.room.terminal.pos, 1);
						} else if (output == ERR_NOT_ENOUGH_RESOURCES) {
							delete creep.room.memory.reaction_request;
						} else {
							movetopos_restricted(creep, lab.pos, 1);
						}
					} else if (creep.memory.resource_type == reactant) {
						transfer(creep, lab, reactant, {next_structure: creep.room.terminal});
					} else {
						// return wrong resource, so don't move
						transfer(creep, creep.room.terminal, creep.memory.resource_type);
					}
					return 0;
                } else if (lab.mineralType !== reactant){
					// change reactant
                    if (creep.memory.resource_type == undefined) {
                        withdraw(creep, lab, lab.mineralType, {next_structure: creep.room.terminal});
                    } else {
                        transfer(creep, creep.room.terminal, creep.memory.resource_type, {next_structure: lab});
                    }
					return 0;
                }
				// else: lab.mineralType == reactant && lab.mineralAmount >= config.react_init_amount
            }
        }
	} else {
		creep.room.memory.reaction_ready = true;
	}
    return 1;
}

function unboost_withdraw(creep: Creep) {
	if (creep.room.memory.unboost_withdraw_request) {
		let container = creep.room.container.UB;
		let resource = <ResourceConstant> Object.keys(container.store)[0];
		if (creep.memory.resource_type !== undefined){
			if (resource == undefined) {
				transfer(creep, creep.room.terminal, creep.memory.resource_type);
			} else {
				transfer(creep, creep.room.terminal, creep.memory.resource_type, {next_structure: container});
			}
		} else {
			if (resource == undefined) {
				delete creep.room.memory.unboost_withdraw_request;
			} else {
				withdraw(creep, container, resource, {next_structure: creep.room.terminal});
			}
		}
		return 0;
	}
	return 1;
}

function get_energy_status(creep_amount: number, link_amount: number, link_target_amount: number, storage_amount: number, terminal_amount: number | undefined, factory_amount: number | undefined, powerspawn_amount: number | undefined, nuker_amount: number | undefined): type_resource_status {
    let source = "storage";
    let sink = "storage";
    let withdraw_amount = undefined;
    let transfer_amount = undefined;
    if (storage_amount + creep_amount >= 600000 && factory_amount !== undefined && factory_amount < 10000) {
        sink = "factory";
    } else if (storage_amount < config.storage_full && factory_amount + creep_amount >= 5000) {
        source = "factory";
    }
    if (storage_amount + creep_amount >= config.storage_full && nuker_amount !== undefined && nuker_amount < 300000) {
        sink = "nuker";
    }
    if (storage_amount + creep_amount >= config.storage_full && powerspawn_amount !== undefined && powerspawn_amount < 3000) {
        sink = "powerspawn";
    }
    if (terminal_amount !== undefined) {
        if (terminal_amount + creep_amount >= 60000) {
            source = "terminal";
        } else if (terminal_amount < 50000) {
            sink = "terminal";
        }
    }
    if (link_amount + creep_amount > link_target_amount) {
        source = "link";
        withdraw_amount = link_amount - link_target_amount;
    } else if (link_amount < link_target_amount) {
        sink = "link";
        withdraw_amount = link_target_amount - link_amount;
        transfer_amount = link_target_amount - link_amount;
    }
    if (source == "storage" && sink == "storage" && creep_amount > 0) {
        source = "link";
    }
    let resource_status: type_resource_status = {
        "source": source,
        "sink": sink,
        "withdraw_amount": withdraw_amount,
        "transfer_amount": transfer_amount,
    }
    return resource_status
}

function get_power_status(creep_amount: number, terminal_amount: number | undefined, powerspawn_amount: number | undefined): type_resource_status {
    let source = "terminal";
    let sink = "terminal";
    let withdraw_amount = undefined;
    let transfer_amount = undefined;
    if (terminal_amount !== undefined && powerspawn_amount !== undefined) {
        if (terminal_amount + creep_amount >= 100 && powerspawn_amount < 5) {
            sink = "powerspawn";
            withdraw_amount = 96;
            transfer_amount = 96;
        } else if (powerspawn_amount > 0 && creep_amount > 0) {
            source = "powerspawn";
        }
    }
    let resource_status: type_resource_status = {
        "source": source,
        "sink": sink,
        "withdraw_amount": withdraw_amount,
        "transfer_amount": transfer_amount,
    }
    return resource_status
}

function get_battery_status(creep_amount: number, storage_amount: number, terminal_amount: number | undefined, factory_amount: number | undefined): type_resource_status {
    let source = "storage";
    let sink = "storage";
    let withdraw_amount = undefined;
    let transfer_amount = undefined;
    if (terminal_amount !== undefined) {
        if (terminal_amount + creep_amount >= 3000) {
            source = "terminal";
        } else if (terminal_amount < 2000 && storage_amount + creep_amount >= 1000) {
            sink = "terminal";
        }
    }
    if (factory_amount !== undefined) {
        if (factory_amount + creep_amount >= 3000) {
            source = "factory";
        } else if (factory_amount < 2000 && storage_amount + creep_amount >= 1000) {
            sink = "factory";
        }
    }
    let resource_status: type_resource_status = {
        "source": source,
        "sink": sink,
        "withdraw_amount": withdraw_amount,
        "transfer_amount": transfer_amount,
    }
    return resource_status
}

function get_G_status(creep_amount: number, terminal_amount: number | undefined, nuker_amount: number | undefined): type_resource_status {
    let source = "terminal";
    let sink = "terminal";
    let withdraw_amount = undefined;
    let transfer_amount = undefined;
    if (terminal_amount !== undefined && nuker_amount !== undefined) {
        if (terminal_amount + creep_amount >= 100 && nuker_amount < 5000) {
            sink = "nuker";
        }
        withdraw_amount = 5000 - nuker_amount;
        transfer_amount = 5000 - nuker_amount;
    }
    let resource_status: type_resource_status = {
        "source": source,
        "sink": sink,
        "withdraw_amount": withdraw_amount,
        "transfer_amount": transfer_amount,
    }
    return resource_status
}

function get_mineral_status(creep_amount: number, storage_amount: number, terminal_amount: number | undefined): type_resource_status {
    let source = "storage";
    let sink = "storage";
    let withdraw_amount = undefined;
    let transfer_amount = undefined;
    if (terminal_amount !== undefined) {
        if (terminal_amount + creep_amount >= 20000 && storage_amount < 200000) {
            source = "terminal";
		} else if (terminal_amount < 15000 && storage_amount + creep_amount > 0) {
            sink = "terminal";
        }
    }
    let resource_status: type_resource_status = {
        "source": source,
        "sink": sink,
        "withdraw_amount": withdraw_amount,
        "transfer_amount": transfer_amount,
    }
    return resource_status
}

function structure_from_name(room_name: string, name: string): AnyStoreStructure {
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
	"G": "G",
}

function get_resource_name(resource: ResourceConstant): string {
	if (resource_names[resource] !== undefined) {
		return resource_names[resource];
	} else {
		return resource;
	}
}
function transfer_resource(creep: Creep, resource_type: ResourceConstant, resource_status: type_resource_status) {
	// 0: move, 1: transfer
    creep.say(get_resource_name(resource_type) + ": " + structure_names[resource_status.source] + ">" + structure_names[resource_status.sink]);
    if (creep.memory.resource_type == undefined) {
        let target = structure_from_name(creep.room.name, resource_status.source);
        let output;
        if (resource_status.withdraw_amount == undefined) {
            output = creep.withdraw(target, resource_type);
        } else {
            output = creep.withdraw(target, resource_type, Math.min(creep.store.getCapacity(), resource_status.withdraw_amount));
        }
        if (output == ERR_NOT_IN_RANGE) {
            movetopos_restricted(creep, target.pos, 1);
			return 0;
        }
    } else {
        let target = structure_from_name(creep.room.name, resource_status.sink);
        let output;
        if (resource_status.transfer_amount == undefined) {
            output = creep.transfer(target, resource_type);
        } else {
            output = creep.transfer(target, resource_type, Math.min(creep.store.getUsedCapacity(resource_type), resource_status.transfer_amount));
        }
        if (output == ERR_NOT_IN_RANGE) {
            movetopos_restricted(creep, target.pos, 1);
			return 0;
        }
    }
	return 1;
}

function get_mineral_urgent_score(storage_amount: number, terminal_amount: number): number {
	if (terminal_amount > 20000) {
		return terminal_amount - 20000;
	} else if (terminal_amount < 15000 && storage_amount > 0) {
		return Math.min(15000 - terminal_amount, storage_amount);
	}
	return 0;
}

export function creepjob(creep: Creep): number {
    var conf = config.conf_rooms[creep.room.name];
    if (creep.memory.role == 'maincarrier') {
        creep.say("MC");
        creep.memory.movable = false;
        creep.memory.crossable = true;
		let link = creep.room.link.MAIN;
        let link_energy = link.store.getUsedCapacity("energy")
		if (link_energy == creep.room.memory.maincarrier_link_amount && creep.room.memory.current_boost_request == undefined) {
			if (Game.time < creep.memory.next_time.wakeup) {
				creep.say("sleep");
				return 0;
			}
		} else {
			creep.memory.next_time.wakeup = Game.time;
		}
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
		if (creep.memory.maincarrier_transfer_job !== undefined) {
			creep.say("job");
			if (transfer_resource(creep, creep.memory.maincarrier_transfer_job.resource_type, creep.memory.maincarrier_transfer_job.resource_status) == 1) {
				delete creep.memory.maincarrier_transfer_job;
			}
			return 0;
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
		if (creep.memory.next_time.react_serve == undefined) {
			creep.memory.next_time.react_serve = Game.time;
		}
        if (Game.time >= creep.memory.next_time.react_serve && creep.room.terminal && (creep.room.memory.reaction_request !== undefined || creep.room.memory.reaction_ready)) {
            creep.say("react");
            if (react_serve(creep, conf_maincarrier) == 0) {
                return 0;
			} else {
				creep.memory.next_time.react_serve = Game.time + 10;
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

		if (creep.memory.resource_type !== undefined) {
			if (creep.room.terminal !== undefined) {
				creep.transfer(creep.room.terminal, creep.memory.resource_type)
				return 0;
			} else {
				return 0;
				creep.transfer(creep.room.storage, creep.memory.resource_type)
			}
		}

		if (Game.time % 20 == 0 || creep.memory.mineral_type == undefined) {
			let scores = constants.t012_minerals.map((e) => get_mineral_urgent_score(creep.room.storage.store.getUsedCapacity(e), creep.room.terminal.store.getUsedCapacity(e)));
			let argmax = mymath.argmax(scores);
			if (scores[argmax] > 0) {
				creep.memory.mineral_type = constants.t012_minerals[argmax];
			} else { 
				creep.memory.mineral_type = Game.memory[creep.room.name].mine_status.type
			}
		}
		let mineral_type = creep.memory.mineral_type;

        let creep_energy = creep.store.getUsedCapacity("energy");
        let creep_power = creep.store.getUsedCapacity("power");
        let creep_battery = creep.store.getUsedCapacity("battery");
        let creep_G = creep.store.getUsedCapacity("G");
        let creep_mineral = creep.store.getUsedCapacity(mineral_type);
        let storage_energy = creep.room.storage.store.getUsedCapacity("energy");
        let storage_battery = creep.room.storage.store.getUsedCapacity("battery");
        let storage_mineral = creep.room.storage.store.getUsedCapacity(mineral_type);
        let terminal_energy;
        let terminal_power;
        let terminal_battery;
        let terminal_G;
        let terminal_mineral;
        if (creep.room.terminal !== undefined) {
            terminal_energy = creep.room.terminal.store.getUsedCapacity("energy");
            terminal_power = creep.room.terminal.store.getUsedCapacity("power");
            terminal_battery = creep.room.terminal.store.getUsedCapacity("battery");
            terminal_G = creep.room.terminal.store.getUsedCapacity("G");
            terminal_mineral = creep.room.terminal.store.getUsedCapacity(mineral_type);
        }

        let factory = creep.room.factory;
        let factory_energy;
        let factory_battery;
        if (factory !== undefined) {
            factory_energy = factory.store.getUsedCapacity("energy");
            factory_battery = factory.store.getUsedCapacity("battery");
        }
        let powerspawn = creep.room.powerSpawn;
        let powerspawn_energy;
        let powerspawn_power;
        if (powerspawn !== undefined) {
            powerspawn_energy = powerspawn.store.getUsedCapacity("energy");
            powerspawn_power = powerspawn.store.getUsedCapacity("power");
        }

        let nuker = creep.room.nuker;
        let nuker_energy;
        let nuker_G;
        if (nuker !== undefined) {
            nuker_energy = nuker.store.getUsedCapacity("energy");
            nuker_G = nuker.store.getUsedCapacity("G");
        }


        let energy_status = get_energy_status(creep_energy, link_energy, creep.room.memory.maincarrier_link_amount, storage_energy, terminal_energy, factory_energy, powerspawn_energy, nuker_energy);
        let power_status = get_power_status(creep_power, terminal_power, powerspawn_power);
        let G_status = get_G_status(creep_G, terminal_G, nuker_G);
        let battery_status = get_battery_status(creep_battery, storage_battery, terminal_battery, factory_battery);
        let mineral_status = get_mineral_status(creep_mineral, storage_mineral, terminal_mineral);
        let resources_status: {
            [key in ResourceConstant] ? : type_resource_status
        } = {
            "energy": energy_status,
            "power": power_status,
            "battery": battery_status,
			[mineral_type]: mineral_status,
        }
		if (mineral_type !== "G") {
			resources_status.G = G_status;
		}

        for (let resource_type of <Array<ResourceConstant>>(["energy", "power", "G", "battery", mineral_type])) {
			if (resources_status[resource_type] == undefined) {
				continue;
			}
			let resource_status = resources_status[resource_type];
			if (resource_status.source !== resource_status.sink) {
				transfer_resource(creep, resource_type, resource_status);
				creep.memory.maincarrier_transfer_job = {
					"resource_type": resource_type,
					"resource_status": resource_status,
				}
				return 0;
			}
        }

		if (Game.powered_rooms[creep.room.name] == undefined) {
			creep.memory.next_time.wakeup = Game.time + 8;
		} else {
			creep.memory.next_time.wakeup = Game.time + 4;
		}
    }
    return 0;
}
