import * as _ from "lodash";
export function process(room_name: string) {
	let room = Game.rooms[room_name];
	let powerSpawn_status = global.memory[room_name].unique_structures_status.powerSpawn;
	if (!powerSpawn_status.finished) {
		return 1;
	}
	if (Game.cpu.bucket < 5000) {
		return 1;
	}
	let powerspawn = Game.getObjectById(powerSpawn_status.id);
	if (powerspawn.store.getUsedCapacity("energy") >= 50 && powerspawn.store.getUsedCapacity("power") >= 1) {
		powerspawn.processPower();
	}
}
