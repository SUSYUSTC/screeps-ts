import * as _ from "lodash"
import * as config from "./config";
import * as mymath from "./mymath";
import * as constants from "./constants";
import * as functions from "./functions";

global.send_resource = function(room_from: string, room_to: string, resource: ResourceConstant, amount: number, onetime_max = undefined): number {
	if (Game.rooms[room_from].memory.resource_sending_request == undefined) {
		Game.rooms[room_from].memory.resource_sending_request = [];
	}
	Game.rooms[room_from].memory.resource_sending_request.push({
		"room_to": room_to,
		"resource": resource,
		"amount": amount,
		"onetime_max": onetime_max,
	})
	return 0;
}

global.summarize_terminal = function(): type_resource_number {
    let result: type_resource_number = {}
    for (let room_name of config.controlled_rooms) {
        let terminal = Game.rooms[room_name].terminal;
        if (terminal) {
            let keys = < Array < ResourceConstant >> Object.keys(terminal.store)
            for (let resource of keys) {
                if (result[resource] == undefined) {
                    result[resource] = 0
                }
                result[resource] += terminal.store.getUsedCapacity(resource);
            }
        }
        let storage = Game.rooms[room_name].storage;
        if (storage) {
            let keys = < Array < ResourceConstant >> Object.keys(storage.store)
            for (let resource of keys) {
                if (result[resource] == undefined) {
                    result[resource] = 0
                }
                result[resource] += storage.store.getUsedCapacity(resource);
            }
        }
    }
    return result;
}

export function process_resource_sending_request(room_name: string) {
	let room = Game.rooms[room_name];
	if (room.terminal == undefined) {
		return;
	}
	let requests = room.memory.resource_sending_request;
	if (requests == undefined || requests.length == 0) {
		return;
	}
	let request = requests.slice(-1)[0];
	let transaction = Game.market.outgoingTransactions.find((e) => e.time < Game.time -1 || e.from == room_name);
	if (transaction !== undefined && transaction.time == Game.time - 1 && transaction.from == room_name && transaction.to == request.room_to && transaction.resourceType == request.resource) {
		request.amount -= Math.min(transaction.amount, request.amount);
		if (request.amount <= 0) {
			requests.pop();
		}
	}
	if (room.terminal.cooldown > 0) {
		return;
	}
	let current_amount = room.terminal.store.getUsedCapacity(request.resource);
	if (current_amount > 0) {
		let available_amount;
		if (request.onetime_max) {
			available_amount = Math.min(current_amount, request.amount, request.onetime_max)
		} else {
			available_amount = Math.min(current_amount, request.amount)
		}
		functions.send_resource(room_name, request.room_to, request.resource, available_amount);
	}
}

function supply_gcl_room() {
	let helped_room = Game.rooms[config.conf_gcl.conf_map.gcl_room];
	if (helped_room !== undefined && helped_room.terminal !== undefined && helped_room.terminal.isActive() && helped_room.terminal.store.getUsedCapacity("energy") < 240000) {
		for (let helping_room_name of config.conf_gcl.conf_map.energy_supply_rooms) {
			let helping_room = Game.rooms[helping_room_name];
			let source_storage = helping_room.storage.store.getUsedCapacity("energy");
			let source_terminal = helping_room.terminal.store.getUsedCapacity("energy");
			if (source_storage >= config.storage_full - 50000 && source_terminal >= 50000) {
				let out = functions.send_resource(helping_room_name, helped_room.name, "energy", 25000);
				if (out == 0) {
					return;
				}
			}
		}
	}
}
function support_developing_rooms() {
	let helping_rooms = Game.controlled_rooms_with_terminal.filter((e) => Game.rooms[e].controller.level >= 8);
	let helped_rooms = Game.controlled_rooms_with_terminal.filter((e) => Game.rooms[e].controller.level < 8);
    for (let helped_room of helped_rooms) {
		let costs = helping_rooms.map((e) => Game.market.calcTransactionCost(1000, e, helped_room));
		let helping_room_name = helping_rooms[mymath.argmin(costs)];
		let source_storage = Game.rooms[helping_room_name].storage.store.getUsedCapacity("energy");
		let source_terminal = Game.rooms[helping_room_name].terminal.store.getUsedCapacity("energy");
        let target_storage = Game.rooms[helped_room].storage.store.getUsedCapacity("energy");
        let target_terminal = Game.rooms[helped_room].terminal.store.getUsedCapacity("energy");
        if (source_storage >= config.storage_full && source_terminal >= 50000 && target_storage < config.storage_full && target_terminal < 100000) {
			let out = functions.send_resource(helping_room_name, helped_room, "energy", 25000);
			if (out == 0) {
				return;
			}
        }
    }
}
function balance_resource(resource: ResourceConstant, conf: type_resource_balance) {
	let rooms = Game.controlled_rooms_with_terminal;
	let ns = rooms.map((e) => Game.rooms[e].storage.store.getUsedCapacity(resource) + Game.rooms[e].terminal.store.getUsedCapacity(resource));
	let argmin = mymath.argmin(ns);
	let argmax = mymath.argmax(ns);
	if (ns[argmax] - ns[argmin] >= conf.gap) {
		if (conf.min == undefined || ns[argmin] < conf.min) {
			let sending_room_name = rooms[argmax];
			let out = functions.send_resource(sending_room_name, rooms[argmin], resource, conf.amount);
		}
	}
}

function balance_power() {
	let rooms = Game.controlled_rooms_with_terminal.filter((e) => Game.rooms[e].powerSpawn !== undefined);
	let net_power_amounts = rooms.map((e) => Game.rooms[e].terminal.store.getUsedCapacity("power") - (Game.rooms[e].storage.store.getUsedCapacity("energy") - config.storage_full)/50);
	let argmin = mymath.argmin(net_power_amounts);
	let argmax = mymath.argmax(net_power_amounts);
	let amount_diff = net_power_amounts[argmax] - net_power_amounts[argmin];
	if (amount_diff >= 2000) {
		let room_min = Game.rooms[rooms[argmin]];
		let room_max = Game.rooms[rooms[argmax]];
		let leave_amount = 0;
		if (room_max.powerSpawn.effect_time > 0) {
			leave_amount = 2000;
		}
		let max_real_amount = room_max.terminal.store.getUsedCapacity("power");
		let amount = Math.min(Math.floor(amount_diff/2), max_real_amount - leave_amount);
		if (amount >= 500) {
			let out = functions.send_resource(room_max.name, room_min.name, "power", amount);
		}
	}
}
function gather_resource() {
	let resources = <Array<ResourceConstant>> Object.keys(config.resource_gathering_pos);
	for (let room_name of Game.controlled_rooms_with_terminal) {
		let store = Game.rooms[room_name].terminal.store;
		for (let resource of resources) {
			let left_amount = config.resource_gathering_pos[resource].left;
			let target_room_name = config.resource_gathering_pos[resource].room;
			if (room_name == target_room_name) {
				continue;
			}
			let amount = store.getUsedCapacity(resource);
			if (amount > left_amount) {
				let out = functions.send_resource(room_name, target_room_name, resource, amount - left_amount);
				break;
			}
		}
	}
}

function get_terminal_space() {
	let valid_rooms = Game.controlled_rooms_with_terminal;
	let free_amounts = valid_rooms.map((e) => Game.rooms[e].terminal.store.getFreeCapacity());
	let argmin = mymath.argmin(free_amounts);
	if (free_amounts[argmin] < 5000 && Game.rooms[valid_rooms[argmin]].terminal.store.getUsedCapacity("energy") >= 55000) {
		let argmax = mymath.argmax(free_amounts);
		if (free_amounts[argmax] >= 15000) {
			functions.send_resource(valid_rooms[argmin], valid_rooms[argmax], "energy", 5000);
		}
	}
}

type type_resource_limits = {
	[key: string]: {
		min: number;
		max: number;
	}
}
function limit_resources(resource: ResourceConstant, limit: type_resource_limits) {
	let rooms = Object.keys(limit);
	let total_amounts = rooms.map((e) => functions.get_total_resource_amount(e, resource));
	let overflow_amounts = mymath.array_ele_minus(total_amounts, rooms.map((e) => limit[e].max));
	let argmax_overflow = mymath.argmax(overflow_amounts);
	let argmin_overflow = mymath.argmin(overflow_amounts);
	if (overflow_amounts[argmax_overflow] > 0 && overflow_amounts[argmin_overflow] < 0) {
		let sending_room_name = rooms[argmax_overflow];
		let receiving_room_name = rooms[argmin_overflow];
		let terminal_amount = Game.rooms[sending_room_name].terminal.store.getUsedCapacity(resource)
		functions.send_resource(sending_room_name, receiving_room_name, resource, Math.min(overflow_amounts[argmax_overflow], -overflow_amounts[argmin_overflow], terminal_amount));
	}
	let deficit_amounts = mymath.array_ele_minus(rooms.map((e) => limit[e].min), total_amounts);
	let argmax_deficit = mymath.argmax(deficit_amounts);
	let argmin_deficit = mymath.argmin(deficit_amounts);
	if (deficit_amounts[argmax_deficit] > 0 && deficit_amounts[argmin_deficit] < 0) {
		let sending_room_name = rooms[argmin_deficit];
		let receiving_room_name = rooms[argmax_deficit];
		let terminal_amount = Game.rooms[sending_room_name].terminal.store.getUsedCapacity(resource)
		functions.send_resource(sending_room_name, receiving_room_name, resource, Math.min(deficit_amounts[argmax_deficit], -deficit_amounts[argmin_deficit], terminal_amount));
	}
}

function send_basic_minerals() {
	for (let mine of constants.basic_minerals) {
		let limits: type_resource_limits = {};
		for (let room_name of Game.controlled_rooms_with_terminal) {
			let mineral_type = Game.memory[room_name].mine_status.type;
			if (mineral_type == mine) {
				limits[room_name] = {
					max: config.mineral_store_amount[mine].main_room_max,
					min: config.mineral_store_amount[mine].main_room_min,
				}
			} else {
				limits[room_name] = {
					max: config.mineral_store_amount[mine].sub_room_max,
					min: config.mineral_store_amount[mine].sub_room_min,
				}
			}
		}
		limit_resources(mine, limits);
	}
}

function send_compounds() {
	for (let resource of <Array<GeneralMineralConstant>> Object.keys(config.final_product_request)) {
		let conf = config.final_product_request[resource];
		let limits: type_resource_limits = {};
		for (let room_name of Game.controlled_rooms_with_terminal) {
			limits[room_name] = {
				min: conf.min_amount,
				max: conf.store_room == room_name ? conf.store_amount : conf.max_amount,
			}
		}
		limit_resources(resource, limits);

		if (conf.store_room == undefined) {
			continue;
		}
		let current_store_amount = functions.get_total_resource_amount(conf.store_room, resource);
		if (current_store_amount < conf.store_amount) {
			for (let room_name of config.controlled_rooms) {
				if (room_name == conf.store_room) {
					continue;
				}
				let room_store_amount = functions.get_total_resource_amount(room_name, resource);
				if (room_store_amount > conf.good_amount) {
					let terminal_amount = Game.rooms[room_name].terminal.store.getUsedCapacity(resource);
					functions.send_resource(room_name, conf.store_room, resource, Math.min(room_store_amount - conf.good_amount, conf.store_amount - current_store_amount, terminal_amount));
					break;
				}
			}
		}
	}
}

export function terminal_balance() {
	Game.controlled_rooms_with_terminal = config.controlled_rooms.filter((e) =>  Game.rooms[e].storage !== undefined && Game.rooms[e].storage.my && Game.rooms[e].terminal !== undefined && Game.rooms[e].terminal.my);
	if (Game.time % 5 == 0) {
		get_terminal_space();
	}
	if (Game.time % 200 == 0) {
		gather_resource();
	}
	if (Game.time % 40 == 0) {
		send_basic_minerals();
		//supply_gcl_room();
	}
	if (Game.time % 40 == 10) {
		for (let resource of <Array<ResourceConstant>>Object.keys(config.resources_balance)) {
			let conf = config.resources_balance[resource];
			balance_resource(resource, conf);
		}
	}
	if (Game.time % 40 == 20) {
		send_compounds()
		//support_developing_rooms();
	}
	if (Game.time % 40 == 30) {
		balance_power();
	}
}
