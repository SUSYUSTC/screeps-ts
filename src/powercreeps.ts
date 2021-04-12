import * as config from "./config"
import * as external_room from "./external_room"
import * as basic_job from "./basic_job"
export function work(pc: PowerCreep) {
	if (pc == undefined || pc.shard == undefined) {
		return;
	}
	pc.memory.movable = true;
	pc.memory.crossable = true;
	if (pc.usePower(PWR_GENERATE_OPS) == 0) {
		return;
	}
	let conf = config.pc_conf[pc.name];
	pc.memory.home_room_name = conf.room_name;
	if (pc.room.name !== conf.room_name) {
		if (conf.external_room == undefined) {
			return;
		}
		let conf_external = config.conf_rooms[conf.room_name].external_rooms[conf.external_room].powered_source;
		if (!conf_external.rooms_forwardpath.includes(pc.room.name)) {
			return;
		}
	}
	if (!pc.room.controller.isPowerEnabled) {
		if (pc.pos.getRangeTo(pc.room.controller.pos) > 1) {
			basic_job.movetopos(pc, pc.room.controller.pos, 1);
		} else {
			pc.enableRoom(pc.room.controller);
		}
		return;
	}
	if (pc.room.name == conf.room_name) {
		if (pc.ticksToLive < 300) {
			let powerspawn = Game.getObjectById(pc.room.memory.unique_structures_status.powerSpawn.id)
			if (pc.pos.getRangeTo(powerspawn.pos) > 1) {
				basic_job.movetopos(pc, powerspawn.pos, 1);
			} else {
				pc.renew(powerspawn);
			}
			return;
		}
		if (pc.carry.getUsedCapacity("ops") > pc.carryCapacity - 50) {
			if (pc.pos.getRangeTo(pc.room.terminal) > 1) {
				basic_job.movetopos(pc, pc.room.terminal.pos, 1);
			} else {
				pc.transfer(pc.room.terminal, "ops");
			}
			return;
		}
	}
	let dict_next: {[key: string]: string};
	if (conf.external_room !== undefined) {
		dict_next = {
			"S1": "S2",
			"S2": "external",
			"external": "S1",
		}
	} else {
		dict_next = {
			"S1": "S2",
			"S2": "S1",
		}
	}
	if (dict_next[pc.memory.current_source_target] == undefined) {
		pc.memory.current_source_target = "S1"
	}
	pc.say(pc.memory.current_source_target);
	if (pc.room.name !== conf.room_name && Game.rooms[conf.room_name].memory.external_room_status[conf.external_room].defense_type !== '') {
		let conf_external = config.conf_rooms[conf.room_name].external_rooms[conf.external_room].powered_source;
		if (pc.room.name !== conf.external_room) {
			external_room.external_flee(pc, config.conf_rooms[conf.room_name].safe_pos, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
			return;
		}
	}
	let source_id: Id<Source>;
	if (pc.memory.current_source_target == "external") {
		let conf_external = config.conf_rooms[conf.room_name].external_rooms[conf.external_room].powered_source;
		if (pc.room.name !== conf.external_room) {
			external_room.movethroughrooms(pc, conf_external.rooms_forwardpath, conf_external.poses_forwardpath);
			return;
		}
		source_id = conf_external.id;
	} else {
		if (pc.room.name !== conf.room_name) {
			let conf_external = config.conf_rooms[conf.room_name].external_rooms[conf.external_room].powered_source;
			external_room.movethroughrooms(pc, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
			return;
		}
		let source_name = pc.memory.current_source_target;
		source_id = config.conf_rooms[pc.room.name].sources[source_name];
	}
	let source = Game.getObjectById(source_id);
	let effect: RoomObjectEffect = undefined;
	if (source.effects !== undefined) {
		effect = source.effects.filter((e) => e.effect == PWR_REGEN_SOURCE)[0];
	}
	if (pc.pos.getRangeTo(source) > 3) {
		basic_job.movetopos(pc, source.pos, 3);
	} else {
		pc.memory.movable = false;
		if (effect == undefined || effect.ticksRemaining < 50) {
			let out = pc.usePower(PWR_REGEN_SOURCE, source);
			if (out == 0) {
				pc.memory.current_source_target = dict_next[pc.memory.current_source_target];
			}
		}
	}
}
