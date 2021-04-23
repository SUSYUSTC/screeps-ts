import * as _ from "lodash"
import * as config from "./config";
import * as mymath from "./mymath";

global.request_resource_sending = function(room_from: string, room_to: string, resource: ResourceConstant, amount: number): number {
	if (Game.rooms[room_from].memory.resource_sending_request == undefined) {
		Game.rooms[room_from].memory.resource_sending_request = [];
	}
	Game.rooms[room_from].memory.resource_sending_request.push({
		"room_to": room_to,
		"resource": resource,
		"amount": amount,
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
	let requests = room.memory.resource_sending_request
	if (requests == undefined || requests.length == 0) {
		return;
	}
	let request = requests[requests.length - 1];
	if (room.terminal.store.getUsedCapacity(request.resource) >= request.amount) {
		if (!Game.memory[room_name].terminal_send_requested) {
			Game.memory[room_name].terminal_send_requested = true;
			let out = room.terminal.send(request.resource, request.amount, request.room_to);
			if (out == 0) {
				requests.pop();
				return;
			}
		}
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
				if (!Game.memory[helping_room.name].terminal_send_requested) {
					Game.memory[helping_room.name].terminal_send_requested = true;
					helping_room.terminal.send("energy", 25000, helped_room.name);
					break;
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
			if (!Game.memory[helping_room_name].terminal_send_requested) {
				Game.memory[helping_room_name].terminal_send_requested = true;
				Game.rooms[helping_room_name].terminal.send("energy", 25000, helped_room);
				break;
			}
        }
    }
}
function balance_resource(resource: ResourceConstant, gap: number, min: number, amount: number) {
	let rooms = config.controlled_rooms.filter((e) => Game.rooms[e].storage !== undefined && Game.rooms[e].terminal !== undefined);
	let ns = rooms.map((e) => Game.rooms[e].storage.store.getUsedCapacity(resource) + Game.rooms[e].terminal.store.getUsedCapacity(resource));
	let argmin = mymath.argmin(ns);
	let argmax = mymath.argmax(ns);
	if (ns[argmax] - ns[argmin] >= gap && ns[argmin] < min) {
		let sending_room_name = rooms[argmax];
		if (!Game.memory[sending_room_name].terminal_send_requested) {
			Game.memory[sending_room_name].terminal_send_requested = true;
			console.log("Sending resource", resource, "from", sending_room_name, "to", rooms[argmin]);
			Game.rooms[sending_room_name].terminal.send(resource, amount, rooms[argmin]);
		}
	}
}
function balance_power() {
	let rooms = config.controlled_rooms.filter((e) => Game.rooms[e].storage !== undefined && Game.rooms[e].terminal !== undefined && global.memory[e].unique_structures_status.powerSpawn.finished);
	let net_power_amounts = rooms.map((e) => Game.rooms[e].terminal.store.getUsedCapacity("power") - (Game.rooms[e].storage.store.getUsedCapacity("energy") - config.storage_full)/50);
	let argmin = mymath.argmin(net_power_amounts);
	let argmax = mymath.argmax(net_power_amounts);
	let amount_diff = net_power_amounts[argmax] - net_power_amounts[argmin];
	if (amount_diff >= 1000) {
		let room_min = Game.rooms[rooms[argmin]];
		let room_max = Game.rooms[rooms[argmax]];
		let amount = Math.min(Math.floor(amount_diff/2), room_max.terminal.store.getUsedCapacity("power"));
		if (amount > 0) {
			if (!Game.memory[room_max.name].terminal_send_requested) {
				Game.memory[room_max.name].terminal_send_requested = true;
				let out = room_max.terminal.send("power", amount, rooms[argmin]) == 0;
				if (out) {
					console.log("Sending resource", "power", "from", rooms[argmax], "to", rooms[argmin]);
					return;
				}
			}
		}
	}
}
function gather_resource(room_name: string, resource: ResourceConstant, min_amount: number) {
	let target_room = Game.rooms[room_name];
	for (let controlled_room of config.controlled_rooms) {
		if (controlled_room !== room_name) {
			let room = Game.rooms[controlled_room];
			if (room.terminal !== undefined && room.terminal.store.getUsedCapacity(resource) >= min_amount) {
				if (!Game.memory[room.name].terminal_send_requested) {
					Game.memory[room.name].terminal_send_requested = true;
					if (room.terminal.send(resource, room.terminal.store.getUsedCapacity(resource), room_name) == 0) {
						console.log("Sending resource", resource, "from", controlled_room, "to", room_name);
					}
				}
			}
		}
	}
}

export function terminal_balance() {
	if (Game.time % 20 == 0) {
		supply_gcl_room();
	}
	if (Game.time % 20 == 5) {
		support_developing_rooms();
	}
	if (Game.time % 20 == 10) {
		for (let resource of <Array<ResourceConstant>>Object.keys(config.resources_balance)) {
			let conf = config.resources_balance[resource];
			balance_resource(resource, conf.gap, conf.min, conf.amount);
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
