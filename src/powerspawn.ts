import * as config from "./config";
import * as _ from "lodash";
export function process(room_name: string) {
	let room = Game.rooms[room_name];
	if (room.powerSpawn == undefined) {
		return 1;
	}
	if (Game.cpu.bucket < 5000) {
		return 1;
	}
	let run_process = false;
	if (Game.powered_rooms[room_name] !== undefined) {
		if (room.powerSpawn.effect_time > 0) {
			run_process = true;
		}
	} else {
		if (room.terminal.store.getUsedCapacity("power") >= config.min_power_without_op && room.storage.store.getUsedCapacity("energy") >= config.storage_good_energy) {
			run_process = true;
		}
	}
	if (run_process) {
		if (room.powerSpawn.processPower() == 0) {
			if (room.powerSpawn.effect_time > 0) {
				Memory.power_processed_stat += 2;
				Memory.op_power_processed_stat += 2;
			} else {
				Memory.power_processed_stat += 1;
			}
		}
	}
}
