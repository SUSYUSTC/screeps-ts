import * as mymath from "./mymath"
import * as config from "./config"
export function log() {
	if (!Memory.output_mode) {
		return;
	}
	for (let room_name of config.controlled_rooms) {
		let room = Game.rooms[room_name];
		let game_memory = Game.memory[room_name];
		let conf = config.conf_rooms[room_name];
		if (room.controller.level == 8) {
			console.log("房间:", room_name, "RCL:", room.controller.level);
		}
		else {
			console.log("房间:", room_name, "RCL:", room.controller.level, "progress:", room.controller.progress, "/", room.controller.progressTotal);
		}
		console.log("room energy:", room.energyAvailable, "/", room.energyCapacityAvailable);
		let walls = room.find(FIND_STRUCTURES).filter((e) => (e.structureType == 'constructedWall' && e.hits));
		let ramparts = room.find(FIND_STRUCTURES).filter((e) => e.structureType == 'rampart');
		let wall_strength = 0;
		let rampart_strength = 0;
		if (walls.length > 0) {
			wall_strength = mymath.array_mean(walls.map((e) => e.hits));
		}
		if (ramparts.length > 0) {
			rampart_strength = mymath.array_mean(ramparts.map((e) => e.hits));
		}
		console.log(`mean wall strength: ${Math.floor(wall_strength/1000)}k x ${walls.length}, mean rampart strength: ${Math.floor(rampart_strength/1000)}k x ${ramparts.length}`);
		if (room.storage !== undefined) {
			console.log("storage:", JSON.stringify(room.storage.store), "Total:", room.storage.store.getUsedCapacity(), "/", room.storage.store.getCapacity());
		}
		if (room.terminal !== undefined) {
			console.log("terminal:", JSON.stringify(room.terminal.store), "Total:", room.terminal.store.getUsedCapacity(), "/", room.terminal.store.getCapacity());
		}
		if (room.memory.objects_to_buy !== undefined && Object.keys(room.memory.objects_to_buy).length > 0) {
			console.log("objects to buy:", JSON.stringify(room.memory.objects_to_buy));
		}
		if (room.memory.reaction_request !== undefined) {
			console.log("reaction running:", JSON.stringify(room.memory.reaction_request));
		}
		if (room.memory.current_boost_request !== undefined) {
			console.log("boosting:", JSON.stringify(room.memory.current_boost_request));
		}
		if (game_memory.sites_total_progressleft !== 0) {
			console.log("left progress of contruction sites:", game_memory.sites_total_progressleft);
		}
		let mine = Game.getObjectById(conf.mine);
		let amount_total;
		console.log("type:", mine.mineralType, "amount:", mine.mineralAmount, "density:", MINERAL_DENSITY[mine.density], "regeneration time:", mine.ticksToRegeneration);
	}
}
