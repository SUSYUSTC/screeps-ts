import * as _ from "lodash";
export function process(room_name: string) {
	let room = Game.rooms[room_name];
	let powerspawn_status = global.memory[room_name].unique_structures_status.powerSpawn;
	if (!powerspawn_status.finished) {
		return 1;
	}
	if (Game.cpu.bucket < 5000) {
		return 1;
	}
	let run_process = false;
	let powerspawn = Game.getObjectById(powerspawn_status.id);
	if (Game.powered_rooms[room_name] !== undefined) {
		if (powerspawn_status.effect_time !== undefined && powerspawn_status.effect_time > 0) {
			run_process = true;
		}
	} else {
		if (room.terminal.store.getUsedCapacity("power") >= 2500 && room.storage.store.getUsedCapacity("energy") >= 500000) {
			run_process = true;
		}
	}
	if (run_process) {
		if (powerspawn.processPower() == 0) {
			/*
			if (powerspawn_status.effect_time > 0) {
				Memory.power_processed_stat += 2;
				Memory.op_power_processed_stat += 2;
			} else {
				Memory.power_processed_stat += 1;
			}
			*/
		}
	}
}
