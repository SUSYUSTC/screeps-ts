import * as _ from "lodash"
import * as functions from "./functions"
import * as mymath from "./mymath"
import * as config from "./config"
import * as constants from "./constants"

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

type type_reactants_number = {
    [key in GeneralMineralConstant] ? : number;
}

function get_number_labs(room_name: string): number {
    let labs_status = Game.rooms[room_name].memory.named_structures_status.lab;
    let n = Object.keys(labs_status).filter((e) => labs_status[e].finished).length;
    return n;
}

/*
function get_reaction_priortiy(): type_reaction_priority {
    let reaction_products = < Array < MineralCompoundConstant >> Object.keys(Memory.product_request).filter((e) => Memory.product_request[ < MineralCompoundConstant > e] > 0);
    reaction_products = reaction_products.sort((x, y) => Memory.product_request[x] - Memory.product_request[y]);
    let reaction_priority: type_reaction_priority = {};
    let temp_all_reactants: {
        [key in MineralCompoundConstant] ? : number
    } = {};
    for (let i = 0; i < reaction_products.length; i++) {
        let product = reaction_products[i];
        let reactants = get_all_reactants(product);
        for (let r of reactants) {
            if (temp_all_reactants[ < MineralCompoundConstant > r] == undefined) {
                temp_all_reactants[ < MineralCompoundConstant > r] = constants.mineral_level[ < GeneralMineralConstant > r] - i * 5;
            }
        }
    }
    let rooms_ready = config.controlled_rooms.filter((e) => get_number_labs(e) == 10 && config.mineral_storage_room[e] !== undefined);
    for (let room_name of rooms_ready) {
        reaction_priority[room_name] = {};
        for (let r in temp_all_reactants) {
            if (config.mineral_storage_room[room_name].includes( < MineralCompoundConstant > r)) {
                reaction_priority[room_name][ < MineralCompoundConstant > r] = temp_all_reactants[ < MineralBoostConstant > r];
            }
        }
    }
    return reaction_priority;
}
*/

function get_priority_score(n: number, level: number): number {
    return -Math.ceil(n / 1960) - level * 5;
}

function get_reaction_priortiy(): type_reaction_priority {
    let reaction_priority: type_reaction_priority = {};
    let products = < Array < MineralCompoundConstant >> Object.keys(Memory.product_request);
    products = products.filter((e) => Memory.product_request[e] > 0 && constants.mineral_compounds.includes(e));
    let rooms_ready = config.controlled_rooms.filter((e) => get_number_labs(e) == 10 && config.mineral_storage_room[e] !== undefined);
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
    let priority = global.reaction_priority[room_name];
    let keys = < Array < keyof typeof priority >> Object.keys(priority);
    if (room.memory.reaction_request !== undefined && !keys.includes(room.memory.reaction_request.product)) {
        delete room.memory.reaction_request;
    }
    let available_list = keys.filter((e) => mymath.all(constants.allowed_reactions[e].map((i) => room.terminal.store.getUsedCapacity(i) >= 280)));
    if (available_list.length == 0) {
        return;
    }
    let urgent_list = available_list.filter((e) => room.terminal.store.getUsedCapacity(e) < constants.mineral_minimum_amount[e]);
    if (urgent_list.length > 0) {
        let urgent = urgent_list[0];
        console.log("Set reaction request:", room_name, urgent);
        global.set_reaction_request(room_name, urgent);
        return;
    }
    if (room.memory.reaction_request == undefined) {
        let priorities = available_list.map((e) => priority[e]);
        //priorities = mymath.array_ele_minus(priorities, available_list.map((e) => room.terminal.store.getUsedCapacity(e) / 1960));
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
                    console.log("Sending resource", reactant, "from", supply_room_name, "to", room_name);
                    Game.rooms[supply_room_name].terminal.send(reactant, minimum_amount, room_name);
                    return;
                }
            }
        }
    }
}
export function prepare() {
    if (global.reaction_priority == undefined || Game.time % 50 == 0 || global.test_var) {
        global.reaction_priority = get_reaction_priortiy();
    }
    for (let room_name of config.controlled_rooms) {
        if (global.reaction_priority[room_name] == undefined) {
            continue;
        }
        if (Game.time % 20 == 0) {
            global.reset_product_request()
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
    let conf = config.conf_rooms[room_name].labs;
    let labs_status = room.memory.named_structures_status.lab;
    if (_.map(labs_status, (e) => e.finished).length == 10) {
        let source1_id = labs_status.S1.id;
        let source2_id = labs_status.S2.id;
        let react_ids = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'].map((e) => labs_status[e].id);
        let source1_lab = Game.getObjectById(source1_id);
        let source2_lab = Game.getObjectById(source2_id);
        let react_labs = react_ids.map((e) => Game.getObjectById(e));
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
                    if (Memory.final_product_request[product] !== undefined) {
                        Memory.final_product_request[product] -= 5;
                    }
                }
            }
        }
    }
}

global.reset_product_request = function(): number {
    if (Memory.final_product_request == undefined) {
        Memory.final_product_request = {};
    }
	for (let resource of <Array<GeneralMineralConstant>>Object.keys(Memory.final_product_request)) {
		if (Memory.final_product_request[resource] <= 0) {
			delete Memory.final_product_request[resource];
		}
	}
    let terminal_amounts = global.summarize_terminal()
	for (let resource of <Array<ResourceConstant>>Object.keys(config.reserved_resources)) {
		if (terminal_amounts[resource] == undefined) {
			terminal_amounts[resource] = 0;
		}
		terminal_amounts[resource] -= config.reserved_resources[resource];
	}
    Memory.product_request = {};
	let request_final_products = <Array<GeneralMineralConstant>> Object.keys(Memory.final_product_request);
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
        let reactants = get_all_reactants(resource);
        Memory.product_request[resource] = 0;
        for (let r of reactants) {
            if (Memory.product_request[r] == undefined) {
                Memory.product_request[r] = 0;
            }
            Memory.product_request[r] += Memory.final_product_request[resource];
        }
    }
    return 0;
}
