import * as mymath from "./mymath"
import * as functions from "./functions"
import * as config from "./config"
import * as basic_job from "./basic_job"
import { Timer } from "./timer";

type type_movethroughrooms_options = {
	ignore_creep_xys ?: [number, number][],
	avoid_exits_at_home ?: boolean,
}

function get_external_moving_targets(rooms_path: string[], poses_path: number[]): type_external_moving_targets {
	// -1: error, 0: normal success, 1: already done, 2: correcting path
	let dict: type_external_moving_targets = {};
    if (rooms_path.length != poses_path.length + 1) {
		return undefined
    }
	for (let arg of mymath.range(rooms_path.length - 1)) {
		let room_name = rooms_path[arg];
		let return_value = 0;
		let room1_coor = functions.room2coor(rooms_path[arg]);
		let room2_coor = functions.room2coor(rooms_path[arg + 1]);
		let coor_diff = <[number, number]> mymath.array_ele_minus(room2_coor, room1_coor);
		let findconstant = functions.coordiff_to_exitconstant(coor_diff);
		let pos = poses_path[arg];
		let exit_xy = functions.get_exit_xy(coor_diff, pos, [49, 0]);
		dict[room_name] = {
			xy: exit_xy,
			findconstant: findconstant,
			room_name: rooms_path[arg + 1],
		}
	}
	return dict
}

export function is_moving_target_defined(creep: Creep | PowerCreep, password: string) {
	let external_dict = creep.memory.external_dict;
	if (external_dict == undefined) {
		return false;
	}
	let dict = external_dict[password];
	if (dict == undefined) {
		return false;
	}
	if (dict[creep.room.name] == undefined) {
		return false;
	} else {
		return true;
	}
}
export function save_external_moving_targets(creep: Creep | PowerCreep, rooms_path: string[], poses_path: number[], password: string) {
	// -1: error, 0: normal success, 1: already done, 2: correcting path
	if (creep.memory.external_dict == undefined) {
		creep.memory.external_dict = {};
	}
	let dict = get_external_moving_targets(rooms_path, poses_path);
	creep.memory.external_dict[password] = dict;
}

export function clear_external_moving_targets(creep: Creep | PowerCreep, password: string = undefined) {
	// -1: error, 0: normal success, 1: already done, 2: correcting path
	if (creep.memory.external_dict == undefined) {
		creep.memory.external_dict = {};
	}
	if (password == undefined) {
		creep.memory.external_dict = {};
	} else {
		delete creep.memory.external_dict[password];
	}
}

export function external_move(creep: Creep | PowerCreep, password: string, add_options: MoveToOpts = {}, options: type_movethroughrooms_options = {} ) {
	// -1: error, 0: normal success, 1: already done, 2: correcting path
	if (creep.memory.external_dict == undefined) {
        console.log(`Warning: Creep ${creep.name} calling external_move without external_dict`);
		return -1;
	}
	let dict = creep.memory.external_dict[password];
    if (dict == undefined) {
        console.log(`Warning: No password ${password} for creep ${creep.name}`);
        return -1;
    }
	let room_dict = dict[creep.room.name];
	if (room_dict == undefined) {
        console.log(`Warning: Creep ${creep.name} is missing in a unknown room ${creep.room.name} at time ${Game.time}`);
        return -1;
	}
	let exit_xy = room_dict.xy;
	let timer = new Timer("external_move", false);
	if (options.ignore_creep_xys == undefined) {
		options.ignore_creep_xys = [];
	}
	let exit_pos = creep.room.getPositionAt(exit_xy[0], exit_xy[1]);
	let _move = creep.memory._move;
	let reusepath = add_options.reusePath;
	if (reusepath == undefined) {
		reusepath = 5;
	}
	if (config.occupied_rooms.includes(creep.room.name)) {
		let movetopos_options = options.avoid_exits_at_home ? {avoid_exits: true} : {};
		basic_job.movetopos(creep, exit_pos, 0, movetopos_options);
	} else if (_move != undefined && _move.dest.room == creep.room.name && _move.dest.x == exit_pos.x && _move.dest.y == exit_pos.y && Game.time <= _move.time + reusepath) {
		creep.moveByPath(Room.deserializePath(_move.path));
	} else {
		console.log(creep.name, creep.room.name, "do path finding");
		creep.moveTo(exit_pos, {...{add_options}, ...{
			maxRooms: 1,
				costCallback: function(roomName: string, costMatrix: CostMatrix) {
					if (add_options.costCallback !== undefined) {
						let result = add_options.costCallback(roomName, costMatrix);
						if (result) {
							costMatrix = result;
						}
					}
					functions.avoid_exits(roomName, costMatrix);
					for (let xy of options.ignore_creep_xys) {
						costMatrix.set(xy[0], xy[1], 0);
					}
					costMatrix.set(exit_pos.x, exit_pos.y, 0);
				}
		}});
	}
	timer.end();
}

export function external_flee(creep: Creep | PowerCreep, safe_pos: number[], password: string, moveoptions: type_movetopos_options = {}) {
	// 0: home room, 1: external room
    if (creep.room.name == creep.memory.home_room_name) {
        creep.memory.movable = false;
		let pos = creep.room.getPositionAt(safe_pos[0], safe_pos[1]);
		if (pos.lookFor("creep").length > 0) {
			basic_job.movetopos(creep, pos, 1, moveoptions);
		} else {
			basic_job.movetopos(creep, pos, 0, moveoptions);
		}
		return 0;
    } else {
		external_move(creep, password, {reusePath: 8, maxRooms: 1, costCallback: functions.avoid_exits});
		return 1;
    }
}

export function moveawayexit(creep: Creep | PowerCreep): number {
	if (creep.pos.x == 0) {
		creep.move(RIGHT);
		return 0;
	} else if (creep.pos.x == 49) {
		creep.move(LEFT);
		return 0;
	} else if (creep.pos.y == 0) {
		creep.move(BOTTOM);
		return 0;
	} else if (creep.pos.y == 49) {
		creep.move(TOP);
		return 0;
	} else {
		return 1;
	}
}

export function movethroughrooms_group_x2(invader: Creep, healer: Creep, password: string, target_room_name: string, add_options: MoveToOpts = {}, options: type_movethroughrooms_options = {} ) {
	// -1: error, 0: normal success, 1: already done
	let out_invader = moveawayexit(invader);
	let out_healer = moveawayexit(healer);
	options.avoid_exits_at_home = true;
	if (out_invader == 0 && out_healer == 0) {
		return 0;
	} else if (out_invader == 0 || out_healer == 0) {
		console.log(`Warning: movethroughrooms_group_x2 fail at exit for invader ${invader.name} and healer ${healer.name} at time ${Game.time}`)
		return -1;
	}
	if (invader.room.name == target_room_name && healer.room.name == target_room_name) {
		return 1;
	}
	if (invader.fatigue > 0 || healer.fatigue > 0) {
		return 0;
	}
	if (invader.room.name !== healer.room.name) {
		healer.moveTo(invader, {range: 1});
		return -1;
	}
	if (healer.pos.getRangeTo(invader) > 1) {
		if (config.occupied_rooms.includes(healer.room.name)) {
			basic_job.movetopos(healer, invader.pos, 1, {avoid_exits: true})
		} else {
			healer.moveTo(invader, {range: 1, maxRooms: 1, costCallback: functions.avoid_exits});
		}
		return 0;
	}
	let dict = invader.memory.external_dict[password];
	let info = dict[invader.room.name];
	let exit_xy = info.xy;
	let exit_pos = invader.room.getPositionAt(exit_xy[0], exit_xy[1]);
	if (invader.pos.getRangeTo(exit_pos) > 1) {
		external_move(invader, password, add_options, {...{ignore_creep_xys: [[healer.pos.x, healer.pos.y]], avoid_exits_at_home: true}, ...options});
		healer.move(healer.pos.getDirectionTo(invader.pos));
		return 0;
	}
	let findconstant = info.findconstant;
	let all_exits = invader.room.find(findconstant).filter((e) => e.lookFor("structure").filter((s) => s.structureType == 'constructedWall').length == 0);
	let closest_exits = all_exits.filter((e) => exit_pos.getRangeTo(e) == 1);
	if (closest_exits.length == 0) {
		console.log(`Warning: movethroughrooms_group_x2 fail at exit for invader ${invader.name} and healer ${healer.name} at time ${Game.time}`)
		return -1;
	}
	let closest_exit = healer.pos.findClosestByRange(closest_exits);
	let healer_target_pos = invader.room.getPositionAt(invader.pos.x + closest_exit.x - exit_pos.x, invader.pos.y + closest_exit.y - exit_pos.y);
	healer.room.visual.text("here", healer_target_pos.x, healer_target_pos.y);
	if (healer.pos.isEqualTo(healer_target_pos)) {
		let direction = invader.pos.getDirectionTo(exit_pos);
		invader.move(direction);
		healer.move(direction);
	} else {
		healer.moveTo(healer_target_pos, {
			maxRooms: 1,
			costCallback: function(room_name: string, costmatrix: CostMatrix) {
				functions.avoid_exits(room_name, costmatrix);
				if (room_name == healer_target_pos.roomName) {
					costmatrix.set(healer_target_pos.x, healer_target_pos.y, 0);
				}
			}
		})
	}
	return 0;
}

export function movethroughshards(creep: Creep) {
	console.log(creep.name, "at", Game.shard.name, JSON.stringify(creep.pos), creep.memory._move == undefined ? undefined : creep.memory._move.time);
	let timer = new Timer("movethroughshards", false);
	let timer_only = new Timer("movethroughshards_only", false);
	if (global.is_main_server) {
		let this_shardmemory = Game.InterShardMemory[Game.shard.name];
		if (global.main_shards.includes(Game.shard.name)) {
			if (this_shardmemory.creeps[creep.name] == undefined) {
				// add shardmemory.creeps
				this_shardmemory.creeps[creep.name] = _.clone(creep.memory);
				Game.require_update_intershardmemory = true;
			}
			if (this_shardmemory.all_creeps[creep.name] == undefined) {
				// add shardmemory.all_creeps
				this_shardmemory.all_creeps[creep.name] = { }
				functions.copy_key(creep.memory, this_shardmemory.all_creeps[creep.name], ['role', 'home_room_name', 'external_room_name', 'source_name'], undefined);
				Game.require_update_intershardmemory_modify_time = true;
			}
		}
		if (Game.time % 10 == 0 || this_shardmemory.all_creeps[creep.name].ticksToLive == undefined) {
			this_shardmemory.all_creeps[creep.name].ticksToLive = creep.ticksToLive;
			Game.require_update_intershardmemory = true;
			Game.require_update_intershardmemory_modify_time = true;
		}
	}
	let shard_move = global.is_main_server ? Game.InterShardMemory[Game.shard.name].creeps[creep.name].shard_move : creep.memory.shard_move;
	let pathfinding = false;
	if (shard_move.shard !== Game.shard.name) {
		let first_index = shard_move.shard_path.findIndex((e) => e.shard == Game.shard.name);
		if (first_index == -1 && shard_move.shard.length == 1) {
			shard_move.shard_path = [];
		} else {
			shard_move.shard_path = shard_move.shard_path.slice(first_index);
		}
		pathfinding = true;
	} else if (!shard_move.rooms_path.includes(creep.room.name)) {
		shard_move.shard_path = shard_move.shard_path.slice(1);
		pathfinding = true;
	}
	/*
	if (!is_moving_target_defined(creep, 'shard')) {
		pathfinding = true;
	}
	*/
	if (pathfinding) {
		console.log("shard path finding");
		let this_shardmemory = Game.InterShardMemory[Game.shard.name];
		let target_rxy = shard_move.shard_path[0];
		let target_pos = new RoomPosition(target_rxy.x, target_rxy.y, target_rxy.roomName);
		let path = PathFinder.search(creep.pos, {pos: target_pos, range: 0}, {roomCallback: function(room_name: string) { return new PathFinder.CostMatrix } });
		let exits_path = functions.get_exits_from_path(path.path);
		shard_move.shard = Game.shard.name;
		shard_move.rooms_path = exits_path.rooms_path;
		shard_move.poses_path = exits_path.poses_path;
		clear_external_moving_targets(creep, 'shard');
		save_external_moving_targets(creep, exits_path.rooms_path, exits_path.poses_path, 'shard');
		this_shardmemory.creeps[creep.name].external_dict = _.clone(creep.memory.external_dict);
		Game.require_update_intershardmemory = true;
	}
	if (Game.shard.name !== shard_move.shard_path[0].shard) {
		console.log("Warning: wrong shard");
		return -1;
	}
	timer_only.end();
	if (creep.room.name == shard_move.shard_path[0].roomName) {
		let x = shard_move.shard_path[0].x;
		let y = shard_move.shard_path[0].y;
		if (creep.pos.isNearTo(x, y)) {
			creep.move(creep.pos.getDirectionTo(x, y));
		} else {
			creep.moveTo(x, y, {range: 1, reusePath: 20, costCallback: functions.avoid_exits});
		}
	} else {
		external_move(creep, 'shard', {reusePath: 20});
	}
	timer.end();
}

