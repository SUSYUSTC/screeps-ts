import * as config from "./config";
import * as external_room from "./external_room";
import * as basic_job from "./basic_job";

function generate_ops(pc: PowerCreep): number {
	// -1: not ready, 0: scheduled
	if (pc.usePower(PWR_GENERATE_OPS) == 0) {
		return 0;
	}
	return -1;
}

function check_status(pc: PowerCreep): number {
	// -1: good, 0: bad
	let conf = config.pc_conf[pc.name];
	pc.memory.home_room_name = conf.room_name;
	if (pc.room.name !== conf.room_name) {
		if (conf.external_room == undefined) {
			pc.say("miss1");
			return 0;
		}
		let conf_external = config.conf_rooms[conf.room_name].external_rooms[conf.external_room].powered_source;
		if (!conf_external.rooms_forwardpath.includes(pc.room.name)) {
			pc.say("miss2");
			return 0;
		}
	}
	return -1;
}

function enable(pc: PowerCreep): number {
	// -1: not ready, 0: scheduled
	if (!pc.room.controller.isPowerEnabled) {
		pc.say("enable");
		if (pc.pos.getRangeTo(pc.room.controller.pos) > 1) {
			pc.moveTo(pc.room.controller, {range: 1});
		} else {
			pc.enableRoom(pc.room.controller);
		}
		return 0;
	}
	return -1;
}

function renew(pc: PowerCreep): number {
	// -1: not ready, 0: scheduled
	let conf = config.pc_conf[pc.name];
	if (pc.room.name !== conf.room_name) {
		return -1;
	}
	if (pc.ticksToLive < 500) {
		pc.say("renew");
		let powerspawn = Game.getObjectById(global.memory[pc.room.name].unique_structures_status.powerSpawn.id)
		if (pc.pos.getRangeTo(powerspawn.pos) > 1) {
			basic_job.movetopos(pc, powerspawn.pos, 1);
			pc.memory.movable = true;
		} else {
			pc.renew(powerspawn);
		}
		return 0;
	}
	return -1;
}

var ops_lower_space = 250
var ops_upper_space = 50
var ops_exchange_space = ops_lower_space + ops_upper_space + 200;
function exchange_ops(pc: PowerCreep): number {
	// -1: not ready, 0: scheduled
	let conf = config.pc_conf[pc.name];
	if (pc.room.name !== conf.room_name) {
		return -1;
	}
	if (pc.carry.getUsedCapacity("ops") >= pc.carryCapacity - ops_upper_space) {
		pc.say("ops>");
		if (pc.pos.getRangeTo(pc.room.terminal) > 1) {
			basic_job.movetopos(pc, pc.room.terminal.pos, 1);
			pc.memory.movable = true;
		} else {
			pc.transfer(pc.room.terminal, "ops", pc.carryCapacity - ops_exchange_space);
		}
		return 0;
	} else if (pc.carry.getUsedCapacity("ops") < ops_lower_space && pc.room.terminal.store.getUsedCapacity("ops") >= pc.carryCapacity - ops_exchange_space) {
		pc.say("ops<");
		if (pc.pos.getRangeTo(pc.room.terminal) > 1) {
			basic_job.movetopos(pc, pc.room.terminal.pos, 1);
			pc.memory.movable = true;
		} else {
			pc.withdraw(pc.room.terminal, "ops", pc.carryCapacity - ops_exchange_space);
		}
		return 0;
	}
	return -1;
}

function is_time_for_source(pc: PowerCreep) {
	let source_name = pc.memory.current_source_target;
	if (source_name == 'external') {
		return true;
	}
	let conf = config.pc_conf[pc.name];
	if (pc.room.name !== conf.room_name) {
		return true;
	}
	let source_id = config.conf_rooms[pc.room.name].sources[source_name];
	let source = Game.getObjectById(source_id);
	let effect: RoomObjectEffect = undefined;
	let effect_time = 0;
	if (source.effects !== undefined) {
		effect = source.effects.filter((e) => e.effect == PWR_REGEN_SOURCE)[0];
	}
	if (effect !== undefined) {
		effect_time = effect.ticksRemaining;
	}
	if (Math.max(effect_time, pc.powers[PWR_REGEN_SOURCE].cooldown) < pc.pos.getRangeTo(source) + 5) {
		return true;
	}
	return false;
}

function get_next_source_target(pc: PowerCreep): string {
	let conf = config.pc_conf[pc.name];
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
	return dict_next[pc.memory.current_source_target];
}

function operate_source(pc: PowerCreep) {
	// -1: not ready, 0: operate, 1: wait, 2: moving inside room, 3: moving between rooms, 4: find invader in external room
	if (pc.powers[PWR_REGEN_SOURCE] == undefined) {
		return -1;
	}
	let next_target = get_next_source_target(pc);
	if (!is_time_for_source(pc)) {
		return -1;
	}
	pc.say(pc.memory.current_source_target);
	let conf = config.pc_conf[pc.name];
	if (pc.memory.current_source_target == 'external' && Game.rooms[conf.room_name].memory.external_room_status[conf.external_room].defense_type !== '') {
		let conf_external = config.conf_rooms[conf.room_name].external_rooms[conf.external_room].powered_source;
		external_room.external_flee(pc, config.conf_rooms[conf.room_name].safe_pos, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
		return 4;
	}
	let source_id: Id<Source>;
	if (pc.memory.current_source_target == "external") {
		let conf_external = config.conf_rooms[conf.room_name].external_rooms[conf.external_room].powered_source;
		if (pc.room.name !== conf.external_room) {
			external_room.movethroughrooms(pc, conf_external.rooms_forwardpath, conf_external.poses_forwardpath);
			return 3;
		}
		source_id = conf_external.id;
	} else {
		if (pc.room.name !== conf.room_name) {
			let conf_external = config.conf_rooms[conf.room_name].external_rooms[conf.external_room].powered_source;
			external_room.movethroughrooms(pc, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
			return 3;
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
		return 2;
	} else {
		if (effect == undefined || effect.ticksRemaining < 50) {
			let out = pc.usePower(PWR_REGEN_SOURCE, source);
			if (out == 0) {
				pc.memory.current_source_target = next_target;
				return 0;
			}
		}
		return 1;
	}
}

function operate_extension(pc: PowerCreep) {
	// -1: not ready, 0: operate, 1: moving
	if (pc.powers[PWR_OPERATE_EXTENSION] == undefined) {
		return -1;
	}
	if (pc.room.energyCapacityAvailable - pc.room.energyAvailable <= 4000) {
		return -1;
	}
	pc.say("ext");
	if (pc.pos.getRangeTo(pc.room.storage) > 3) {
		basic_job.movetopos(pc, pc.room.storage.pos, 3);
		return 1;
	} else {
		pc.usePower(PWR_OPERATE_EXTENSION, pc.room.storage);
		return 0;
	}
}

function operate_power(pc: PowerCreep) {
	// -1: not ready, 0: operate, 1: moving
	if (pc.powers[PWR_OPERATE_POWER] == undefined) {
		return -1;
	}
	if (pc.carry.getUsedCapacity("ops") < 200) {
		return -1;
	}
	if (pc.room.terminal.store.getUsedCapacity("power") < 2000) {
		return -1;
	}
	if (Game.time < pc.memory.next_time.op_power) {
		return -1;
	}
	let powerspawn_status = global.memory[pc.room.name].unique_structures_status.powerSpawn;
	if (powerspawn_status.effect_time > 0) {
		return -1;
	}
	let powerspawn = Game.getObjectById(powerspawn_status.id)
	pc.say("power");
	if (pc.pos.getRangeTo(powerspawn) > 3) {
		basic_job.movetopos(pc, powerspawn.pos, 3);
		return 1;
	} else {
		if (pc.usePower(PWR_OPERATE_POWER, powerspawn) == 0) {
			pc.memory.next_time.op_power = Game.time + 1200;
		}
		return 0;
	}
}

function operate_lab(pc: PowerCreep) {
	// -1: not ready, 0: operate, 1: moving
	if (pc.powers[PWR_OPERATE_LAB] == undefined) {
		return -1;
	}
	if (pc.carry.getUsedCapacity("ops") < 10) {
		return -1;
	}
	let lab_status = global.memory[pc.room.name].named_structures_status.lab;
	let effects_time: {[key: string]: number} = {};
	for (let lab_name of ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'B1']) {
		if (lab_status[lab_name].finished && lab_status[lab_name].effect_time !== undefined) {
			effects_time[lab_name] = lab_status[lab_name].effect_time;
		}
	}
	let lab_name: string = Object.keys(effects_time).sort((a, b) => effects_time[a] - effects_time[b])[0];
	if (lab_name == undefined) {
		return -1;
	}
	let lab = Game.getObjectById(lab_status[lab_name].id);
	if (effects_time[lab_name] < pc.pos.getRangeTo(lab) + 5 && pc.powers[PWR_OPERATE_LAB].cooldown < pc.pos.getRangeTo(lab) + 5) {
		pc.say("lab");
		if (pc.pos.getRangeTo(lab) > 3) {
			basic_job.movetopos(pc, lab.pos, 3);
			return 1;
		} else {
			pc.usePower(PWR_OPERATE_LAB, lab);
			return 0;
		}
	}
	return -1;
}

export function work(pc: PowerCreep) {
	if (pc == undefined) {
		return;
	}
	if (pc.room == undefined) {
		console.log(`Warning: pc ${pc.name} does not exist at time ${Game.time}`);
		return;
	}
	pc.memory.movable = false;
	pc.memory.crossable = true;
	if (pc.memory.next_time == undefined) {
		pc.memory.next_time = {}
	}
	for (let func of [generate_ops, check_status, enable, renew, exchange_ops, operate_source, operate_extension, operate_power, operate_lab]) {
		if (func(pc) >= 0) {
			return;
		}
	}
}
