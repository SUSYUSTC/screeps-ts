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

global.get_product_request = function(room_name: string, resource: GeneralMineralConstant, is_final: boolean): MineralCompoundConstant | '' {
	// undefined: not available, '': enough
	let final_request = config.final_product_request[resource];
	let current_amount = functions.get_total_resource_amount(room_name, resource)
	let expect_amount: number;
	if (final_request !== undefined) {
		expect_amount = final_request.store_room == room_name ? final_request.store_expect_amount : final_request.expect_amount;
		if (!is_final) {
			expect_amount += config.react_init_amount;
		}
	} else {
		expect_amount = config.react_init_amount;
	}
	if (current_amount >= expect_amount) {
		return '';
	} else {
		if (constants.basic_minerals.includes(<MineralConstant>resource)) {
			if (functions.get_total_resource_amount(room_name, resource) >= config.react_init_amount) {
				return '';
			} else {
				return undefined;
			}
		}
		resource = <MineralCompoundConstant> resource;
		let reactants = constants.allowed_reactions[resource];
		for (let reactant of reactants) {
			let out = global.get_product_request(room_name, reactant, false);
			if (out == '') {
				continue;
			} else {
				return out;
			}
		}
		return resource;
	}
}

/*
global.get_product_request = function(room_name: string): type_product_request {
	let room = Game.rooms[room_name];
	let product_request: type_product_request = {};
	let request_final_products = <Array<GeneralMineralConstant>> Object.keys(config.final_product_request);
	for (let resource of request_final_products) {
        let reactants = get_all_reactants(resource);
		for (let reactant of reactants) {
			if (product_request[reactant] == undefined) {
				product_request[reactant] = -functions.get_total_resource_amount(room_name, reactant);
			}
		}
    }
    for (let resource of request_final_products) {
		let conf_request = config.final_product_request[resource];
		let amount = room_name == conf_request.store_room ? conf_request.store_expect_amount : conf_request.expect_amount;
		process_product_request(product_request, resource, amount);
    }
    return product_request;
}

function determine_reaction_request(room_name: string) {
    let room = Game.rooms[room_name];
    if (room.memory.reaction_request == undefined) {
		let product_request = global.get_product_request(room_name);
		room.memory.product_request = product_request;
		for (let product of constants.mineral_compounds) {
			if (product_request[product] > 0) {
				let reactants = constants.allowed_reactions[product];
				if (mymath.all(reactants.map((e) => Game.rooms[room_name].terminal.store.getUsedCapacity(e) >= config.react_init_amount))) {
					console.log("going to set reaction request", room_name, product);
					global.set_reaction_request(room_name, product);
					return;
				}
			}
		}
    }
}
*/
function determine_reaction_request(room_name: string) {
    let room = Game.rooms[room_name];
    if (room.memory.reaction_request == undefined) {
		for (let compound of <Array<MineralCompoundConstant>> Object.keys(config.final_product_request)) {
			let product = global.get_product_request(room_name, compound, true);
			if (product == undefined || product == '') {
				continue;
			} else {
				console.log("going to set reaction request", room_name, product);
				global.set_reaction_request(room_name, product);
				return;
			}
		}
    }
}

export function prepare() {
	if (Game.time % 25 !== 0) {
		return;
	}
    for (let room_name of Game.controlled_rooms_with_terminal) {
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
	let pc_name = Game.powered_rooms[room_name];
	if (pc_name !== undefined && Game.powerCreeps[pc_name].powers[PWR_OPERATE_LAB] == undefined && Game.cpu.bucket < 9000) {
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

