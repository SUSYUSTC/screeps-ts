import * as mymath from "./mymath"
import * as config from "./config"
export function log() {
	if (Memory.history_cpus == undefined) {
		Memory.history_cpus = [];
	}
	Memory.history_cpus.push(Game.cpu.getUsed());
	if (Memory.history_cpus.length > 20) {
		Memory.history_cpus.shift();
	}
	console.log(`GCL: ${Game.gcl.level}, ${Game.gcl.progress}/${Game.gcl.progressTotal}, GPL: ${Game.gpl.level}, ${Game.gpl.progress}/${Game.gpl.progressTotal}, Cr: ${Game.market.credits}, pixel: ${Game.resources.pixel}, CPU bucket: ${Game.cpu.bucket}, Averged CPU usage: ${mymath.array_mean(Memory.history_cpus)}`);
	if (!Memory.output_mode) {
		return;
	}
	for (let order_type of ['sell', 'buy']) {
		let str = `${order_type} `;
		for (let id in Game.market.orders) {
			let order = Game.market.orders[id];
			if (order.type == order_type) {
				str += `${order.resourceType}: ${order.amount}/${order.remainingAmount} x ${order.price}, ${order.roomName}; `;
			}
		}
		console.log(str);
	}
	for (let room_name of config.controlled_rooms) {
		let room = Game.rooms[room_name];
		let game_memory = Game.memory[room_name];
		let conf = config.conf_rooms[room_name];
		if (Game.time % 20 == 0) {
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
			room.memory.mean_wall_strength = wall_strength;
			room.memory.mean_rampart_strength = rampart_strength;
			room.memory.n_walls = walls.length;
			room.memory.n_ramparts = ramparts.length;
		}
		if (room.controller.level == 8) {
			console.log("房间:", room_name, "RCL:", room.controller.level, "room energy:", room.energyAvailable, "/", room.energyCapacityAvailable);
		}
		else {
			console.log("房间:", room_name, "RCL:", room.controller.level, "progress:", room.controller.progress, "/", room.controller.progressTotal, "room energy:", room.energyAvailable, "/", room.energyCapacityAvailable);
		}
		console.log(`mean wall strength: ${Math.floor(room.memory.mean_wall_strength/1000)}k x ${room.memory.n_walls}, mean rampart strength: ${Math.floor(room.memory.mean_rampart_strength/1000)}k x ${room.memory.n_ramparts}`);
		let log_special = '';
		if (room.memory.unique_structures_status.factory.finished) {
			log_special += "factory: " + JSON.stringify(Game.getObjectById(room.memory.unique_structures_status.factory.id).store);
		}
		if (room.memory.unique_structures_status.nuker.finished) {
			log_special += " nuker: " + JSON.stringify(Game.getObjectById(room.memory.unique_structures_status.nuker.id).store);
		}
		if (room.memory.unique_structures_status.powerSpawn.finished) {
			log_special += " powerSpawn: " + JSON.stringify(Game.getObjectById(room.memory.unique_structures_status.powerSpawn.id).store);
		}
		if (room.storage !== undefined) {
			console.log("storage:", JSON.stringify(room.storage.store), log_special);
		}
		if (room.terminal !== undefined) {
			console.log("terminal:", JSON.stringify(room.terminal.store), "Total:", room.terminal.store.getUsedCapacity(), "/", room.terminal.store.getCapacity());
		}
		if (room.memory.objects_to_buy !== undefined && Object.keys(room.memory.objects_to_buy).length > 0) {
			console.log("objects to buy:", JSON.stringify(room.memory.objects_to_buy));
		}
		if (room.memory.objects_to_sell !== undefined && Object.keys(room.memory.objects_to_sell).length > 0) {
			console.log("objects to sell:", JSON.stringify(room.memory.objects_to_sell));
		}
		let mine = Game.getObjectById(conf.mine);
		let amount_total;
		let log_minerals=`type: ${mine.mineralType}, amount: ${mine.mineralAmount}, density: ${MINERAL_DENSITY[mine.density]}, regeneration time: ${mine.ticksToRegeneration}`;
		if (room.memory.reaction_request !== undefined) {
			log_minerals += `; reaction running: ${JSON.stringify(room.memory.reaction_request.product)}`;
		}
		if (room.memory.current_boost_request !== undefined) {
			log_minerals += `; boosting: ${JSON.stringify(room.memory.current_boost_request.compound)}`;
		}
		console.log(log_minerals);
		if (room.memory.sites_total_progressleft) {
			console.log("left progress of contruction sites:", room.memory.sites_total_progressleft);
		}
	}
}
