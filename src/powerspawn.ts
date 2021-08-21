import * as config from "./config";
import * as functions from "./functions";
import * as _ from "lodash";
export function process(room_name: string) {
	let room = Game.rooms[room_name];
	if (room.powerSpawn == undefined) {
		return 1;
	}
	let run_process = false;
	//if (Game.memory[room_name].pc_power_level >= 2) {
	if (room.powerSpawn.effect_time > 0) {
		run_process = true;
	//	}
	} else {
		if (Game.cpu.bucket < 5000) {
			return 1;
		}
		if (room.terminal.store.getUsedCapacity("power") >= config.min_power_without_op && functions.get_total_resource_amount(room_name, "energy") + functions.get_total_resource_amount(room_name, "battery") * 10 >= config.energy_bar_to_process_not_operated_power) {
			run_process = true;
		}
	}
	if (run_process) {
		if (room.powerSpawn.processPower() == 0) {
			if (room.powerSpawn.effect_time > 0) {
				Memory.power_processed_stat += room.powerSpawn.effect_level + 1;
				Memory.op_power_processed_stat += room.powerSpawn.effect_level + 1;
			} else {
				Memory.power_processed_stat += 1;
			}
		}
	}
}
