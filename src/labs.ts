import * as _ from "lodash"
import * as functions from "./functions"
import * as mymath from "./mymath"
import * as config from "./config"
import * as constants from "./constants"
import { Timer } from "./timer"

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

function process_product_request(product_request: type_product_request, obj: GeneralMineralConstant, amount: number) {
	product_request[obj] += amount;
	if (product_request[obj] <= 0) {
		return;
	}
	if (constants.basic_minerals.includes(<MineralConstant>obj)) {
		return;
	}
	let reactant1 = constants.allowed_reactions[ < MineralCompoundConstant > obj][0];
	let reactant2 = constants.allowed_reactions[ < MineralCompoundConstant > obj][1];
	process_product_request(product_request, reactant1, product_request[obj]);
	process_product_request(product_request, reactant2, product_request[obj]);
}

global.get_product_request = function(room_name: string): type_product_request {
	let room = Game.rooms[room_name];
    let store_amounts = _.clone(room.terminal.store);
	let product_request: type_product_request = {};
	let request_final_products = <Array<GeneralMineralConstant>> Object.keys(config.final_product_request);
	for (let resource of request_final_products) {
        let reactants = get_all_reactants(resource);
		for (let reactant of reactants) {
			if (store_amounts[reactant] == undefined) {
				store_amounts[reactant] = 0;
			}
			product_request[reactant] = -store_amounts[reactant];
		}
    }
    for (let resource of request_final_products) {
		let conf_request = config.final_product_request[resource];
		let amount = room_name == conf_request.store_room ? conf_request.store_amount : conf_request.max_amount;
		process_product_request(product_request, resource, amount);
    }
    return product_request;
}

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
		room.memory.reaction_status = "fill";
        return 0;
    }
}

function determine_reaction_request(room_name: string) {
    let room = Game.rooms[room_name];
    if (room.memory.reaction_request == undefined) {
		let product_request = global.get_product_request(room_name);
		for (let product of <Array<MineralCompoundConstant>> Object.keys(product_request)) {
			if (product_request[product] < config.react_init_amount) {
				continue;
			}
			let reactants = constants.allowed_reactions[product];
			if (mymath.all(reactants.map((e) => functions.get_total_resource_amount(room_name, e) >= config.react_init_amount))) {
				global.set_reaction_request(room_name, product);
			}
		}
    }
}

export function prepare() {
	if (Game.time % 50 !== 0) {
		return;
	}
    for (let room_name of config.controlled_rooms) {
		determine_reaction_request(room_name);
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
    if (room.memory.reaction_status !== "running") {
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
        let source1_lab = room.lab.S1;
        let source2_lab = room.lab.S2;
        let react_names = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'];
		if (room.memory.current_boost_request == undefined) {
			react_names.push('B1');
		}
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

