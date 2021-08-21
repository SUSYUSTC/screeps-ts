import * as _ from "lodash"
import * as functions from "./functions"
import * as mymath from "./mymath"
import * as config from "./config"
import * as constants from "./constants"
import { Timer } from "./timer"

global.cancel_reaction = function(room_name: string): number {
    let room = Game.rooms[room_name];
	room.memory.reaction_request = {
		reactant1: undefined,
		reactant2: undefined,
		product: undefined,
		status: "clear",
		amount: undefined,
	};
	return 0;
}

global.set_reaction_request = function(room_name: string, compound: MineralCompoundConstant, amount: number): number {
    let room = Game.rooms[room_name];
    if (constants.allowed_reactions[compound] == undefined) {
        return 1;
    } else {
        let reactants = constants.allowed_reactions[compound];
        room.memory.reaction_request = {
            reactant1: reactants[0],
            reactant2: reactants[1],
            product: compound,
			status: "fill",
			amount: amount,
        };
        return 0;
    }
}

type type_product_request = {
	// for enough, amount means the amount needed to reach react_min_amount
	product ?: MineralCompoundConstant;
	amount ?: number;
	status: "ok" | "fail" | "enough"
}

global.get_product_request = function(room_name: string, resource: GeneralMineralConstant, is_final: boolean): type_product_request {
	// undefined: not available, '': enough
	let final_request = config.final_product_request[resource];
	let current_amount = functions.get_total_resource_amount(room_name, resource)
	let base_amount = 0;
	if (final_request !== undefined) {
		base_amount = (final_request.store_room == room_name) ? final_request.store_expect_amount : final_request.expect_amount;
	}
	let additional_amount = is_final ? 0 : config.react_min_amount;
	if (current_amount >= base_amount + additional_amount) {
		// only used for !is_final
		return { 
			status: "enough",
			amount: current_amount - base_amount,
		};
	} else {
		if (constants.basic_minerals.includes(<MineralConstant>resource)) {
			return { status: "fail" };
		}
		resource = <MineralCompoundConstant> resource;
		let reactants = constants.allowed_reactions[resource];
		let amounts = [];
		for (let reactant of reactants) {
			let product_request = global.get_product_request(room_name, reactant, false);
			if (product_request.status == "enough") {
				amounts.push(product_request.amount);
				continue;
			} else {
				return product_request;
			}
		}
		// if not final request, only supply to max reaction amount
		let need_amount = (final_request !== undefined) ? config.react_max_amount : base_amount + config.react_max_amount - current_amount;
		let amount = Math.min(mymath.min(amounts), config.react_max_amount, need_amount);
		return {
			status: "ok", 
			product: resource,
			amount: amount,
		}
	}
}

function determine_reaction_request(room_name: string) {
    let room = Game.rooms[room_name];
    if (room.memory.reaction_request == undefined) {
		for (let compound of <Array<MineralCompoundConstant>> Object.keys(config.final_product_request)) {
			let product_request = global.get_product_request(room_name, compound, true);
			if (product_request.status == "ok") {
				console.log("going to set reaction request", room_name, product_request.product, product_request.amount);
				global.set_reaction_request(room_name, product_request.product, product_request.amount);
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
    if (!(room.memory.reaction_request !== undefined && room.memory.reaction_request.status == "running")) {
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
		if (source1_lab.mineralAmount < config.react_stop_amount || source2_lab.mineralAmount < config.react_stop_amount) {
			room.memory.reaction_request.status = 'clear';
		}
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

