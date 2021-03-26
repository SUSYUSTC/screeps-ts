import * as config from "./config"
import * as external_room from "./external_room"
import * as basic_job from "./basic_job"
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
	if (!pc.room.controller.isPowerEnabled) {
		if (pc.pos.getRangeTo(pc.room.controller.pos) > 1) {
			basic_job.movetopos(pc, pc.room.controller.pos, 1);
			pc.memory.movable = true;
		} else {
			pc.enableRoom(pc.room.controller);
		}
		return;
	}
	if (pc.ticksToLive < 100) {
		let powerspawn = Game.getObjectById(pc.room.memory.unique_structures_status.powerSpawn.id)
		if (pc.pos.getRangeTo(powerspawn.pos) > 1) {
			basic_job.movetopos(pc, powerspawn.pos, 1);
			pc.memory.movable = true;
		} else {
			pc.renew(powerspawn);
		}
		return;
	}
	if (pc.carry.getUsedCapacity("ops") > pc.carryCapacity - 20) {
		if (pc.pos.getRangeTo(pc.room.terminal) > 1) {
			basic_job.movetopos(pc, pc.room.terminal.pos, 1);
			pc.memory.movable = true;
		} else {
			pc.transfer(pc.room.terminal, "ops");
		}
		return;
	}
	for (let source_name in config.conf_rooms[pc.room.name].sources) {
		let source_id = config.conf_rooms[pc.room.name].sources[source_name];
		let source = Game.getObjectById(source_id);
		let effect;
		if (source.effects !== undefined) {
			effect = source.effects.filter((e) => e.effect == PWR_REGEN_SOURCE)[0];
		}
		if (effect == undefined || effect.ticksRemaining < 50) {
			if (pc.pos.getRangeTo(source) > 3) {
				basic_job.movetopos(pc, source.pos, 3);
				pc.memory.movable = true;
			} else {
				let out = pc.usePower(PWR_REGEN_SOURCE, source);
			}
		}
	}
}
