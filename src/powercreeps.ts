import * as config from "./config";
import * as external_room from "./external_room";
import * as basic_job from "./basic_job";

function operate_lab(pc: PowerCreep) {
	let lab_status = global.memory[pc.room.name].named_structures_status.lab;
	let effects_time: {[key: string]: number} = {};
	for (let lab_name of ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7']) {
		if (lab_status[lab_name].finished && lab_status[lab_name].effect_time !== undefined) {
			effects_time[lab_name] = lab_status[lab_name].effect_time;
		}
	}
	let lab_name: string = Object.keys(effects_time).sort((a, b) => effects_time[a] - effects_time[b])[0];
	if (lab_name == undefined) {
		return 1;
	}
	let lab = Game.getObjectById(lab_status[lab_name].id);
	if (effects_time[lab_name] < pc.pos.getRangeTo(lab) + 5 && pc.powers[PWR_OPERATE_LAB].cooldown < pc.pos.getRangeTo(lab) + 5) {
		pc.say("lab");
		if (pc.pos.getRangeTo(lab) > 3) {
			basic_job.movetopos(pc, lab.pos, 3);
		} else {
			pc.usePower(PWR_OPERATE_LAB, lab);
		}
		return 0;
	}
	return 1;
}
export function work(pc: PowerCreep) {
	if (pc == undefined || pc.shard == undefined) {
		return;
	}
	pc.memory.movable = false;
	pc.memory.crossable = true;
	if (pc.usePower(PWR_GENERATE_OPS) == 0) {
		return;
	}
	let conf = config.pc_conf[pc.name];
	pc.memory.home_room_name = conf.room_name;
	if (pc.room.name !== conf.room_name) {
		if (conf.external_room == undefined) {
			pc.say("miss1");
			return;
		}
		let conf_external = config.conf_rooms[conf.room_name].external_rooms[conf.external_room].powered_source;
		if (!conf_external.rooms_forwardpath.includes(pc.room.name)) {
			pc.say("miss2");
			return;
		}
	}
	if (!pc.room.controller.isPowerEnabled) {
		pc.say("enable");
		if (pc.pos.getRangeTo(pc.room.controller.pos) > 1) {
			pc.moveTo(pc.room.controller, {range: 1});
		} else {
			pc.enableRoom(pc.room.controller);
		}
		return;
	}
	if (pc.room.name == conf.room_name) {
		if (pc.ticksToLive < 500) {
			pc.say("renew");
			let powerspawn = Game.getObjectById(global.memory[pc.room.name].unique_structures_status.powerSpawn.id)
			if (pc.pos.getRangeTo(powerspawn.pos) > 1) {
				basic_job.movetopos(pc, powerspawn.pos, 1);
				pc.memory.movable = true;
			} else {
				pc.renew(powerspawn);
			}
			return;
		}
		if (pc.carry.getUsedCapacity("ops") > pc.carryCapacity - 50) {
			pc.say("ops");
			if (pc.pos.getRangeTo(pc.room.terminal) > 1) {
				basic_job.movetopos(pc, pc.room.terminal.pos, 1);
				pc.memory.movable = true;
			} else {
				pc.transfer(pc.room.terminal, "ops", pc.carryCapacity - 150);
			}
			return;
		}
	}
	let dict_next: {[key: string]: string};
	let source_first: string;
	let source_second: string;
	if (conf.normal_ordered) {
		source_first = "S1";
		source_second = "S2";
	} else {
		source_first = "S2";
		source_second = "S1";
	}
	if (conf.external_room !== undefined) {
		dict_next = {
			[source_first]: source_second,
			[source_second]: "external",
			"external": source_first,
		}
	} else {
		dict_next = {
			[source_first]: source_second,
			[source_second]: source_first,
		}
	}
	if (dict_next[pc.memory.current_source_target] == undefined) {
		pc.memory.current_source_target = source_first;
	}
	pc.say(pc.memory.current_source_target);
	if_operate_lab: if (pc.room.name == conf.room_name && ["S1", "S2"].includes(pc.memory.current_source_target) && pc.powers[PWR_OPERATE_LAB] !== undefined) {
		let source_name = pc.memory.current_source_target;
		let source_id = config.conf_rooms[pc.room.name].sources[source_name];
		let source = Game.getObjectById(source_id);
		let effect: RoomObjectEffect = undefined;
		if (source.effects !== undefined) {
			effect = source.effects.filter((e) => e.effect == PWR_REGEN_SOURCE)[0];
		}
		if (effect == undefined || effect.ticksRemaining < pc.pos.getRangeTo(source) + 5) {
			break if_operate_lab;
		}
		operate_lab(pc);
		return;
	}
	if (pc.room.name !== conf.room_name && Game.rooms[conf.room_name].memory.external_room_status[conf.external_room].defense_type !== '') {
		let conf_external = config.conf_rooms[conf.room_name].external_rooms[conf.external_room].powered_source;
		external_room.external_flee(pc, config.conf_rooms[conf.room_name].safe_pos, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
		return;
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
		pc.memory.movable = true;
	} else {
		if (effect == undefined || effect.ticksRemaining < 50) {
			let out = pc.usePower(PWR_REGEN_SOURCE, source);
			if (out == 0) {
				pc.memory.current_source_target = dict_next[pc.memory.current_source_target];
			}
		}
	}
}
