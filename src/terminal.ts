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
        let terminal = Game.rooms[room_name].terminal
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
		let resource = Game.memory[room_name].mine_status.type;
		if (result[resource] == undefined) {
			result[resource] = 0
		}
		result[resource] += storage.store.getUsedCapacity(resource);
    }
    return result
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
		let out = room.terminal.send(request.resource, request.amount, request.room_to);
		if (out == 0) {
			requests.pop();
			return;
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
            Game.rooms[helping_room_name].terminal.send("energy", 25000, helped_room);
            break;
        }
    }
}
function balance_resource(resource: ResourceConstant, gap: number, min: number, amount: number) {
	let rooms = config.controlled_rooms.filter((e) => Game.rooms[e].storage !== undefined && Game.rooms[e].terminal !== undefined);
	let ns = rooms.map((e) => Game.rooms[e].storage.store.getUsedCapacity(resource) + Game.rooms[e].terminal.store.getUsedCapacity(resource));
	let argmin = mymath.argmin(ns);
	let argmax = mymath.argmax(ns);
	if (ns[argmax] - ns[argmin] >= gap && ns[argmin] < min) {
		console.log("Sending resource", resource, "from", rooms[argmax], "to", rooms[argmin]);
		Game.rooms[rooms[argmax]].terminal.send(resource, amount, rooms[argmin]);
	}
}
function balance_power() {
	let rooms = config.controlled_rooms.filter((e) => Game.rooms[e].storage !== undefined && Game.rooms[e].terminal !== undefined && Game.rooms[e].memory.unique_structures_status.powerSpawn.finished);
	let net_power_amounts = rooms.map((e) => Game.rooms[e].terminal.store.getUsedCapacity("power") - (Game.rooms[e].storage.store.getUsedCapacity("energy") - config.storage_full)/50);
	let argmin = mymath.argmin(net_power_amounts);
	let argmax = mymath.argmax(net_power_amounts);
	let amount_diff = net_power_amounts[argmax] - net_power_amounts[argmin];
	if (amount_diff >= 1000) {
		let room_min = Game.rooms[rooms[argmin]];
		let room_max = Game.rooms[rooms[argmax]];
		let amount = Math.min(Math.floor(amount_diff/2), room_max.terminal.store.getUsedCapacity("power"));
		if (amount > 0) {
			let out = room_max.terminal.send("power", amount, rooms[argmin]) == 0;
			if (out) {
				console.log("Sending resource", "power", "from", rooms[argmax], "to", rooms[argmin]);
				return;
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
				if (room.terminal.send(resource, room.terminal.store.getUsedCapacity(resource), room_name) == 0) {
					console.log("Sending resource", resource, "from", controlled_room, "to", room_name);
				}
			}
		}
	}
}

export function terminal_balance() {
	support_developing_rooms();
	for (let resource of <Array<ResourceConstant>>Object.keys(config.resources_balance)) {
		let conf = config.resources_balance[resource];
		balance_resource(resource, conf.gap, conf.min, conf.amount);
	}
	for (let resource in config.resource_gathering_pos) {
		let room_name = config.resource_gathering_pos[<ResourceConstant> resource];
		gather_resource(room_name, <ResourceConstant> resource, 1);
	}
	balance_power();
}
