import * as _ from "lodash"
import * as config from "./config";
import * as mymath from "./mymath";
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
	let helping_rooms = config.controlled_rooms.filter((e) => Game.rooms[e].controller.level >= 8);
	let helped_rooms = config.controlled_rooms.filter((e) => Game.rooms[e].controller.level < 8 && Game.rooms[e].terminal !== undefined);
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
	let rooms = config.controlled_rooms.filter((e) => Game.rooms[e].storage !== undefined && Game.rooms[e].terminal !== undefined);
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
	let rooms = config.controlled_rooms.filter((e) => Game.rooms[e].storage !== undefined && Game.rooms[e].terminal !== undefined && Game.rooms[e].powerSpawn !== undefined);
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
function gather_resource(room_name: string, resource: ResourceConstant, min_amount: number) {
	let target_room = Game.rooms[room_name];
	for (let controlled_room of config.controlled_rooms) {
		if (controlled_room !== room_name) {
			let room = Game.rooms[controlled_room];
			let current_amount = room.terminal.store.getUsedCapacity(resource);
			if (room.terminal !== undefined && current_amount >= min_amount) {
				let out = functions.send_resource(room.name, room_name, resource, current_amount);
			}
		}
	}
}

function get_terminal_space() {
	let valid_rooms = config.controlled_rooms.filter((e) => Game.rooms[e].terminal !== undefined && Game.rooms[e].terminal.my);
	let free_amounts = valid_rooms.map((e) => Game.rooms[e].terminal.store.getFreeCapacity());
	let argmin = mymath.argmin(free_amounts);
	if (free_amounts[argmin] < 5000 && Game.rooms[valid_rooms[argmin]].terminal.store.getUsedCapacity("energy") >= 55000) {
		let argmax = mymath.argmax(free_amounts);
		if (free_amounts[argmax] >= 15000) {
			functions.send_resource(valid_rooms[argmin], valid_rooms[argmax], "energy", 5000);
		}
	}
}

export function terminal_balance() {
	if (Game.time % 5 == 0) {
		get_terminal_space();
	}
	if (Game.time % 20 == 0) {
		supply_gcl_room();
	}
	if (Game.time % 20 == 5) {
		support_developing_rooms();
	}
	if (Game.time % 20 == 10) {
		for (let resource of <Array<ResourceConstant>>Object.keys(config.resources_balance)) {
			let conf = config.resources_balance[resource];
			balance_resource(resource, conf);
		}
	}
	if (Game.time % 20 == 15) {
		balance_power();
	}
	if (Game.time % 200 == 0) {
		for (let resource in config.resource_gathering_pos) {
			let room_name = config.resource_gathering_pos[<ResourceConstant> resource];
			gather_resource(room_name, <ResourceConstant> resource, 1);
		}
	}
}
