import * as _ from "lodash"
import * as functions from "./functions"
import * as mymath from "./mymath"
import * as config from "./config"

function determine_reaction_request(room_name: string) {
    let room = Game.rooms[room_name];
    let priority = config.reaction_priority[room_name];
    let keys = < Array < keyof typeof priority >> Object.keys(priority);
	if (room.memory.reaction_request !== undefined && !keys.includes(room.memory.reaction_request.product)) {
		delete room.memory.reaction_request;
	}
    let available_list = keys.filter((e) => mymath.all(config.allowed_reactions[e].map((i) => room.terminal.store.getUsedCapacity(i) >= 280)));
	if (available_list.length == 0) {
		return;
	}
    let urgent_list = available_list.filter((e) => room.terminal.store.getUsedCapacity(e) < config.mineral_minimum_amount[e]);
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
    let priority = config.reaction_priority[room_name];
    let keys = < Array < keyof typeof priority >> Object.keys(priority);
    for (let key of keys) {
        let reactants = config.allowed_reactions[key];
        for (let reactant of reactants) {
            let minimum_amount = config.mineral_minimum_amount[reactant];
			if (room.terminal.store.getUsedCapacity(reactant) < minimum_amount) {
				let supplied_rooms = Object.keys(config.mineral_storage_room).filter((e) => config.mineral_storage_room[e].includes(reactant));
				let terminal_amounts = supplied_rooms.map((e) => Game.rooms[e].terminal.store.getUsedCapacity(reactant));
				let argmax = mymath.argmax(terminal_amounts);
				if (terminal_amounts[argmax] > minimum_amount*2) {
					let supply_room_name = supplied_rooms[argmax];
					console.log("Sending resource", reactant, "from", supply_room_name, "to", room_name);
					Game.rooms[supply_room_name].terminal.send(reactant, minimum_amount, room_name);
					return;
				}
            }
        }
    }
}
export function prepare(room_name: string) {
	if (config.reaction_priority[room_name] == undefined) {
		return;
	}
	if (Game.time % 20 == 0) {
		get_reaction_supply(room_name);
	}
	if (Game.time % 20 == 10) {
		determine_reaction_request(room_name);
	}
}
export function reaction(room_name: string) {
    let room = Game.rooms[room_name];
    if (!room.memory.reaction_ready) {
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
        for (let lab of react_labs) {
            if (lab.cooldown == 0) {
                lab.runReaction(source1_lab, source2_lab);
            }
        }
    }
}
