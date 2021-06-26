import * as _ from "lodash"
import * as functions from "./functions"
import * as mymath from "./mymath"
import * as config from "./config"
import * as constants from "./constants"
import { Timer } from "./timer"

global.set_reaction_request = function(room_name: string, compound: MineralCompoundConstant): number {
    let room = Game.rooms[room_name];
    if (constants.allowed_reactions[compound] == undefined) {
        return 1;
    } else {
        let reactants = constants.allowed_reactions[compound];
        room.memory.reaction_request = {
            "reactant1": reactants[0],
            "reactant2": reactants[1],
            "product": compound
        };
        return 0;
    }
}

type type_reactants_number = {
    [key in GeneralMineralConstant] ? : number;
}

function get_priority_score(n: number, level: number): number {
    return Math.ceil(n / 5000) - level * 20;
}

function get_reaction_priortiy(): type_reaction_priority {
    let reaction_priority: type_reaction_priority = {};
    let products = < Array < MineralCompoundConstant >> Object.keys(Memory.product_request);
    products = products.filter((e) => Memory.product_request[e] > 0 && constants.mineral_compounds.includes(e));
    let rooms_ready = config.controlled_rooms.filter((e) => Object.keys(Game.rooms[e].lab).length == 10 && config.mineral_storage_room[e] !== undefined);
    for (let room_name of rooms_ready) {
        reaction_priority[room_name] = {};
        for (let p of products) {
            if (config.mineral_storage_room[room_name].includes(p)) {
                let n = Memory.product_request[p];
                let level = constants.mineral_level[p];
                reaction_priority[room_name][p] = get_priority_score(n, level);
            }
        }
    }
    return reaction_priority;
}

function determine_reaction_request(room_name: string) {
    let room = Game.rooms[room_name];
    let priority = _.clone(global.reaction_priority[room_name]);
    let keys = < Array < keyof typeof priority >> Object.keys(priority);
    if (room.memory.reaction_request !== undefined && !keys.includes(room.memory.reaction_request.product)) {
        delete room.memory.reaction_request;
    }
	if (room.memory.reaction_request !== undefined) {
		priority[room.memory.reaction_request.product] += 10;
	}
    let available_list = keys.filter((e) => mymath.all(constants.allowed_reactions[e].map((i) => room.terminal.store.getUsedCapacity(i) >= config.react_init_amount)));
    if (available_list.length == 0) {
        return;
    }
    if (room.memory.reaction_request == undefined) {
        let priorities = available_list.map((e) => priority[e]);
        let argmax = mymath.argmax(priorities);
        console.log("Set reaction request:", room_name, available_list[argmax]);
        global.set_reaction_request(room_name, available_list[argmax]);
    }
}

function get_reaction_supply(room_name: string) {
    let room = Game.rooms[room_name];
    let priority = global.reaction_priority[room_name];
    let keys = < Array < keyof typeof priority >> Object.keys(priority);
    for (let key of keys) {
        let reactants = constants.allowed_reactions[key];
        for (let reactant of reactants) {
            let minimum_amount = constants.mineral_minimum_amount[reactant];
            if (room.terminal.store.getUsedCapacity(reactant) < minimum_amount) {
                let supplied_rooms = Object.keys(config.mineral_storage_room).filter((e) => config.mineral_storage_room[e].includes(reactant));
                let terminal_amounts = supplied_rooms.map((e) => Game.rooms[e].terminal.store.getUsedCapacity(reactant));
                let argmax = mymath.argmax(terminal_amounts);
                if (terminal_amounts[argmax] > minimum_amount * 2) {
                    let supply_room_name = supplied_rooms[argmax];
					let out = functions.send_resource(supply_room_name, room_name, reactant, minimum_amount);
					if (out == 0) {
						return;
					}
                }
            }
        }
    }
}
export function prepare() {
    if (global.reaction_priority == undefined || Game.time % 50 == 0 || !global.test_var) {
        global.reaction_priority = get_reaction_priortiy();
		global.reset_product_request();
    }
	if (Game.time % 10 !== 0) {
		return;
	}
    for (let room_name of config.controlled_rooms) {
        if (global.reaction_priority[room_name] == undefined) {
            continue;
        }
        if (Game.time % 20 == 0) {
            get_reaction_supply(room_name);
        }
        if (Game.time % 20 == 10) {
            determine_reaction_request(room_name);
        }
    }
}

function compare_product(reactants: GeneralMineralConstant[], product: MineralCompoundConstant): boolean {
    let reactants_of_product = constants.allowed_reactions[product];
    if (reactants[0] == reactants_of_product[0] && reactants[1] == reactants_of_product[1]) {
        return true;
    } else {
        return false;
    }
}
export function reaction(room_name: string) {
    let room = Game.rooms[room_name];
    if (!room.memory.reaction_ready) {
        return;
    }
	if (Game.cpu.bucket < 2000) {
		return;
	}
	if (Memory.reaction_log == undefined) {
		Memory.reaction_log = {};
	}
    let conf = config.conf_rooms[room_name].labs;
    if (Object.keys(room.lab).length == 10) {
        let react_names = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'];
		if (room.memory.current_boost_request == undefined) {
			react_names.push('B1');
		}
        let source1_lab = room.lab.S1;
        let source2_lab = room.lab.S2;
        let react_labs = react_names.map((e) => room.lab[e]);
        let product: MineralCompoundConstant;
        for (let lab of react_labs) {
            if (lab.cooldown == 0) {
                if (lab.runReaction(source1_lab, source2_lab) == 0) {
                    if (product == undefined) {
                        if (lab.mineralType !== undefined) {
                            product = < MineralCompoundConstant > lab.mineralType;
                        } else {
                            product = < MineralCompoundConstant > (Object.keys(constants.allowed_reactions).filter((p) => compare_product([source1_lab.mineralType, source2_lab.mineralType], < MineralCompoundConstant > p))[0]);
                        }
                    }
					let reaction_amount = 5;
					if (lab.effects !== undefined && lab.effects.length > 0) {
						reaction_amount += POWER_INFO[PWR_OPERATE_LAB].effect[(<PowerEffect>lab.effects[0]).level - 1];
					}
					if (Memory.reaction_log[product] == undefined) {
						Memory.reaction_log[product] = 0;
					}
					Memory.reaction_log[product] += reaction_amount;
                }
            }
        }
    }
}

function get_all_reactants(obj: GeneralMineralConstant): GeneralMineralConstant[] {
    if (['Z', 'K', 'U', 'L', 'X', 'O', 'H'].includes(obj)) {
        return [obj];
    } else {
        let reactant1 = constants.allowed_reactions[ < MineralCompoundConstant > obj][0];
        let reactant2 = constants.allowed_reactions[ < MineralCompoundConstant > obj][1];
        let s1 = get_all_reactants(reactant1);
        let s2 = get_all_reactants(reactant2);
        let reactants_set = new Set(s1.concat(s2));
        reactants_set.add(obj);
        return Array.from(reactants_set);
    }
}

function process_product_request(obj: GeneralMineralConstant, amount: number) {
	Memory.product_request[obj] += amount;
	if (Memory.product_request[obj] <= 0) {
		return;
	}
	if (constants.basic_minerals.includes(<MineralConstant>obj)) {
		return;
	}
	let reactant1 = constants.allowed_reactions[ < MineralCompoundConstant > obj][0];
	let reactant2 = constants.allowed_reactions[ < MineralCompoundConstant > obj][1];
	process_product_request(reactant1, Memory.product_request[obj]);
	process_product_request(reactant2, Memory.product_request[obj]);
}

global.reset_product_request = function(): number {
    let terminal_amounts = _.clone(global.terminal_store);
    Memory.product_request = {};
	let request_final_products = <Array<GeneralMineralConstant>> Object.keys(config.final_product_request);
	let n_store_rooms = Object.keys(config.mineral_storage_room).length;
	for (let resource of request_final_products) {
        let reactants = get_all_reactants(resource);
		for (let reactant of reactants) {
			if (terminal_amounts[reactant] == undefined) {
				terminal_amounts[reactant] = 0;
			}
			Memory.product_request[reactant] = -terminal_amounts[reactant] + constants.mineral_minimum_amount[reactant] * n_store_rooms;
		}
    }
    for (let resource of request_final_products) {
		process_product_request(resource, config.final_product_request[resource]);
    }
    return 0;
}
