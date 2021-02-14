import * as _ from "lodash"
import * as functions from "./functions"
import * as mymath from "./mymath"

function determine_reaction_request(room_name: string) {
    let room = Game.rooms[room_name];
    let priority = global.reaction_priority[room_name];
    let keys = < Array < keyof typeof priority >> Object.keys(priority);
    let available_list = keys.filter((e) => mymath.all(functions.allowed_reactions[e].map((i) => room.terminal.store.getUsedCapacity(i) >= 280)));
	if (available_list.length == 0) {
		return;
	}
    let urgent_list = available_list.filter((e) => room.terminal.store.getUsedCapacity(e) < global.mineral_minimum_amount[e]);
    if (urgent_list.length > 0) {
        let urgent = urgent_list[0];
		console.log("Set reaction request:", room_name, urgent);
		global.set_reaction_request(room_name, urgent);
        return;
    }
    if (room.memory.reaction_request == undefined) {
        let priorities = available_list.map((e) => priority[e]);
        let argmin = mymath.argmin(priorities);
		console.log("Set reaction request:", room_name, available_list[argmin]);
		global.set_reaction_request(room_name, available_list[argmin]);
    }
}

function get_reaction_supply(room_name: string) {
    let room = Game.rooms[room_name];
    let priority = global.reaction_priority[room_name];
    let keys = < Array < keyof typeof priority >> Object.keys(priority);
    for (let key of keys) {
        let reactants = functions.allowed_reactions[key];
        for (let reactant of reactants) {
            let minimum_amount = global.mineral_minimum_amount[reactant];
            if (room.terminal.store.getUsedCapacity(reactant) < minimum_amount && global.mineral_storage_amount[reactant] >= minimum_amount) {
                let supply_room_name = global.mineral_storage_room[reactant];
				console.log("Sending resource", reactant, "from", supply_room_name, "to", room_name);
				Game.rooms[supply_room_name].terminal.send(reactant, minimum_amount, room_name);
                return;
            }
        }
    }
}
export function prepare(room_name: string) {
	if (global.reaction_priority[room_name] == undefined) {
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
    let conf = Memory.rooms_conf[room_name].labs;
    let source1_ids = _.filter(conf, (e) => e.state == 'source1' && e.finished);
    let source2_ids = _.filter(conf, (e) => e.state == 'source2' && e.finished);
    let react_ids = _.filter(conf, (e) => e.state == 'react' && e.finished);
    if (source1_ids.length == 1 && source2_ids.length == 1 && react_ids.length == 7) {
        let source1_lab = Game.getObjectById(source1_ids[0].id);
        let source2_lab = Game.getObjectById(source2_ids[0].id);
        let react_labs = react_ids.map((e) => Game.getObjectById(e.id));
        for (let lab of react_labs) {
            if (lab.cooldown == 0) {
                lab.runReaction(source1_lab, source2_lab);
            }
        }
    }
}
