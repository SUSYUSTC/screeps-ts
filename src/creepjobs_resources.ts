import * as _ from "lodash"
import * as basic_job from "./basic_job";
import * as functions from "./functions"
import * as external_room from "./external_room";
import * as config from "./config";
var moveoptions = {
    reusePath: 5,
    //visualizePathStyle: {},
    maxRooms: 0,
    costCallback: functions.avoid_exits,
};
export function creepjob(creep: Creep): number {
	var conf = config.conf_rooms[creep.memory.home_room_name];
	var game_memory = Game.memory[creep.memory.home_room_name];
	if (creep.memory.role == 'pb_attacker') {
		// 5 tough, 20 attack, 25 move
		creep.say("PA");
		let output = basic_job.boost_request(creep, {"tough": "GHO2", "attack": "UH2O"});
		if (output !== 0) {
			return 0;
		}
		let pb_status = Game.rooms[creep.memory.home_room_name].memory.external_resources.pb[creep.memory.external_room_name];
		let rooms_path = pb_status.rooms_path;
		let poses_path = pb_status.poses_path;
		let target_room = rooms_path[rooms_path.length-1];
		if (creep.room.name !== target_room) {
			external_room.movethroughrooms(creep, rooms_path, poses_path);
		} else {
			let pb_xy = pb_status.xy;
			let pb_pos = creep.room.getPositionAt(pb_xy[0], pb_xy[1]);
			let pb = <StructurePowerBank>(pb_pos.lookFor("structure").filter((e) => e.structureType == 'powerBank')[0]);
			if (pb == undefined) {
				creep.suicide();
			}
			if (creep.pos.getRangeTo(pb) > 1) {
				creep.moveTo(pb, {range: 1, maxRooms: 1});
			} else {
				let healer = Game.creeps[pb_status.pb_healer_name];
				if (healer.room.name !== creep.room.name) {
					return 0;
				}
				if (creep.pos.getRangeTo(healer) == 1 && creep.hits == creep.hitsMax) {
					creep.attack(pb);
				}
			}
		}
		return 0;
	} else if (creep.memory.role == 'pb_healer') {
		// 20 heal, 20 move
		creep.say("PH");
		let output = basic_job.boost_request(creep, {"heal": "LO"});
		if (output !== 0) {
			return 0;
		}
		let pb_status = Game.rooms[creep.memory.home_room_name].memory.external_resources.pb[creep.memory.external_room_name];
		let rooms_path = pb_status.rooms_path;
		let poses_path = pb_status.poses_path;
		let target_room = rooms_path[rooms_path.length-1];
		if (creep.room.name !== target_room) {
			external_room.movethroughrooms(creep, rooms_path, poses_path);
		} else {
			let pb_xy = pb_status.xy;
			let pb_pos = creep.room.getPositionAt(pb_xy[0], pb_xy[1]);
			let pb = <StructurePowerBank>(pb_pos.lookFor("structure").filter((e) => e.structureType == 'powerBank')[0]);
			if (pb == undefined) {
				creep.suicide();
				return 0;
			}
			if (creep.pos.x > 1 && creep.pos.x < 48 && creep.pos.y > 1 && creep.pos.y < 48) {
				let attacker = Game.creeps[pb_status.pb_attacker_name];
				if (attacker.room.name !== creep.room.name) {
					return 0;
				}
				if (creep.pos.getRangeTo(attacker) > 1) {
					creep.moveTo(attacker, {range: 1, maxRooms: 1});
				} else {
					creep.heal(attacker);
				}
			} else {
				creep.moveTo(pb, {range: 1, maxRooms: 1});
			}
		}
		return 0;
	} else if (creep.memory.role == 'pb_carrier') {
		// 40 carry, 10 move
		creep.say("PC");
		let output = basic_job.boost_request(creep, {"move": "ZO"});
		if (output !== 0) {
			return 0;
		}
		let pb_status = Game.rooms[creep.memory.home_room_name].memory.external_resources.pb[creep.memory.external_room_name];
		let rooms_path = pb_status.rooms_path;
		let poses_path = pb_status.poses_path;
		let rooms_path_reverse = _.clone(rooms_path);
		let poses_path_reverse = _.clone(poses_path);
		rooms_path_reverse.reverse();
		poses_path_reverse.reverse();
		let target_room = rooms_path[rooms_path.length-1];
		if (creep.store.getUsedCapacity("power") > 0) {
			if (creep.room.name !== creep.memory.home_room_name) {
				external_room.movethroughrooms(creep, rooms_path_reverse, poses_path_reverse);
			} else {
				if (creep.pos.getRangeTo(creep.room.terminal) > 1) {
					basic_job.movetopos(creep, creep.room.terminal.pos, 1);
				} else {
					creep.transfer(creep.room.terminal, "power");
				}
			}
		}
		if (creep.room.name !== target_room) {
			external_room.movethroughrooms(creep, rooms_path, poses_path);
		} else {
			let pb_xy = pb_status.xy;
			let pb_pos = creep.room.getPositionAt(pb_xy[0], pb_xy[1]);
			let ruin = pb_pos.lookFor("ruin")[0];
			if (ruin !== undefined) {
				if (creep.withdraw(ruin, "power") == ERR_NOT_IN_RANGE) {
					creep.moveTo(pb_xy[0], pb_xy[1], {range: 1, maxRooms: 1});
				}
			}
			let resource = pb_pos.lookFor("resource")[0];
			if (resource == undefined) {
				if (creep.pickup(resource) == ERR_NOT_IN_RANGE) {
					creep.moveTo(pb_xy[0], pb_xy[1], {range: 1, maxRooms: 1});
				}
			}
			if (creep.pos.getRangeTo(pb_xy[0], pb_xy[1]) > 2) {
				creep.moveTo(pb_xy[0], pb_xy[1], {range: 2, maxRooms: 1});
			}
		}
	}
	return 1;
}
