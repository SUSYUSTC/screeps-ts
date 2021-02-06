export function log() {
	if (!Memory.output_mode) {
		return;
	}
	for (let room_name of Memory.controlled_rooms) {
		console.log(room_name);
		let room = Game.rooms[room_name];
		if (room.controller.level == 8) {
			console.log("RCL:", room.controller.level);
		}
		else {
			console.log("RCL:", room.controller.level, "progress:", room.controller.progress, "/", room.controller.progressTotal);
		}
		console.log("room energy:", room.energyAvailable, "/", room.energyCapacityAvailable);
		if (room.storage !== undefined) {
			console.log("storage:", JSON.stringify(room.storage.store));
		}
		if (room.terminal !== undefined) {
			console.log("terminal:", JSON.stringify(room.terminal.store));
		}
		if (room.memory.reaction_request !== undefined) {
			console.log("reaction running:", JSON.stringify(room.memory.reaction_request));
		}
		if (room.memory.current_boost_request !== undefined) {
			console.log("boosting:", JSON.stringify(room.memory.current_boost_request));
		}
		if (room.memory.sites_total_progressleft !== 0) {
			console.log("left progress of contruction sites:", room.memory.sites_total_progressleft);
		}
	}
}
