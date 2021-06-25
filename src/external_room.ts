import * as mymath from "./mymath"
import * as functions from "./functions"
import * as config from "./config"
import * as basic_job from "./basic_job"
import { Timer } from "./timer";

type type_movethroughrooms_options = {
	replace_pos ?: boolean;
	ignore_creep_xys ?: [number, number][],
}
export function movethroughrooms(creep: Creep | PowerCreep, rooms_path: string[], poses_path: number[], add_options: MoveToOpts = {}, options: type_movethroughrooms_options = {} ) {
	// -1: error, 0: normal success, 1: already done, 2: correcting path
	let timer = new Timer("movethroughrooms", false);
    if (rooms_path.length != poses_path.length + 1) {
        console.log(`Warning: Unexpected length of arguments in movethroughrooms for creep ${creep.name} at ${creep.room.name} at time ${Game.time}`);
		return -1;
    }
    if (!(rooms_path.includes(creep.room.name))) {
        console.log(`Warning: Creep ${creep.name} is missing in a unknown room ${creep.room.name} at time ${Game.time}`);
		timer.end();
        return -1;
    }
	if (options.replace_pos == undefined) {
		options.replace_pos = false;
	}
	if (options.ignore_creep_xys == undefined) {
		options.ignore_creep_xys = [];
	}
    let arg = mymath.where(rooms_path.map((e) => e == creep.room.name))[0];
    if (arg == rooms_path.length - 1) {
        let room1_coor = functions.room2coor(rooms_path[arg - 1]);
        let room2_coor = functions.room2coor(rooms_path[arg]);
        let coor_diff = <[number, number]> mymath.array_ele_minus(room2_coor, room1_coor);
        let pos = poses_path[arg - 1];
        let standpoint_xy = functions.get_exit_xy(coor_diff, pos, [1, 48]);
        if (creep.pos.x == standpoint_xy[0] && creep.pos.y == standpoint_xy[1]) {
			timer.end();
            return 1;
        } else {
			creep.moveTo(standpoint_xy[0], standpoint_xy[1], {...{
                maxRooms: 1,
                costCallback: functions.avoid_exits
			}, ...add_options});
			timer.end();
            return 0;
        }
    } else {
		let return_value = 0;
        let room1_coor = functions.room2coor(rooms_path[arg]);
        let room2_coor = functions.room2coor(rooms_path[arg + 1]);
        let coor_diff = <[number, number]> mymath.array_ele_minus(room2_coor, room1_coor);
        let pos = poses_path[arg];
        let exit_xy = functions.get_exit_xy(coor_diff, pos, [49, 0]);
        let creeps_at_exit = creep.room.lookForAt("creep", exit_xy[0], exit_xy[1]);
        if (creep.pos.getRangeTo(exit_xy[0], exit_xy[1]) < 3 && creeps_at_exit.length > 0 && creeps_at_exit[0].name !== creep.name) {
			let path = PathFinder.search(creep.pos, {pos: creep.room.getPositionAt(exit_xy[0], exit_xy[1]), range: 2}, {maxRooms: 1, flee: true});
            creep.moveByPath(path.path);
        } else {
			if (config.occupied_rooms.includes(creep.room.name)) {
				basic_job.movetopos(creep, creep.room.getPositionAt(exit_xy[0], exit_xy[1]), 0)
			} else {
				let exit_pos = creep.room.getPositionAt(exit_xy[0], exit_xy[1]);
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
						costMatrix.set(exit_pos.x, exit_pos.y, 1);
						for (let xy of options.ignore_creep_xys) {
							costMatrix.set(xy[0], xy[1], 0);
						}
					}
				}});
				// check is path valid
				if_check_path: if (Game.time % 10 == 0 && options.replace_pos) {
					if (!functions.is_pathfinding_complete(creep, 0)) {
						let findconstant = functions.coordiff_to_exitconstant(coor_diff);
						let all_exits = creep.room.find(findconstant).filter((e) => e.lookFor("structure").filter((s) => s.structureType == 'constructedWall').length == 0);
						let new_exit_pos = creep.pos.findClosestByPath(all_exits);
						let new_exit_xy = [new_exit_pos.x, new_exit_pos.y];
						let correct_pos = new_exit_xy.filter((e) => e > 0 && e < 49)[0];
						poses_path[arg] = correct_pos;
						console.log(`Warning: Invalid exit position detected for creep ${creep.name} at ${creep.room.name} at time ${Game.time}. Automatically change to closest position`);
						return_value = 2;
					}
				}
			}
        }
		timer.end();
        return return_value;
    }
}

export function external_flee(creep: Creep | PowerCreep, safe_pos: number[], rooms_backwardpath: string[], poses_backwardpath: number[], moveoptions: type_movetopos_options = {}) {
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
        movethroughrooms(creep, rooms_backwardpath, poses_backwardpath);
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

/*
export function moveawayexit_group_x2(follower: Creep, decider: Creep): number {
	if (decider.pos.x == 0) {
		decider.move(RIGHT);
		if (follower.room.name !== decider.room.name) {
			follower.move(follower.pos.getDirectionTo(49, decider.pos.y));
		}
		return 0;
	} else if (decider.pos.x == 49) {
		decider.move(LEFT);
		if (follower.room.name !== decider.room.name) {
			follower.move(follower.pos.getDirectionTo(0, decider.pos.y));
		}
		return 0;
	} else if (decider.pos.y == 0) {
		decider.move(BOTTOM);
		if (follower.room.name !== decider.room.name) {
			follower.move(follower.pos.getDirectionTo(decider.pos.x, 49));
		}
		return 0;
	} else if (decider.pos.y == 49) {
		decider.move(TOP);
		if (follower.room.name !== decider.room.name) {
			follower.move(follower.pos.getDirectionTo(decider.pos.x, 0));
		}
		return 0;
	} else if (follower.pos.x == 0) {
		if (decider.fatigue == 0) {
			follower.move(RIGHT);
			decider.move(BOTTOM);
		} else {
			follower.move(TOP_RIGHT);
		}
		return 0;
	} else if (follower.pos.x == 49) {
		if (decider.fatigue == 0) {
			follower.move(LEFT);
			decider.move(TOP);
		} else {
			follower.move(BOTTOM_LEFT);
		}
		return 0;
	} else if (follower.pos.y == 0) {
		if (decider.fatigue == 0) {
			follower.move(BOTTOM);
			decider.move(LEFT);
		} else {
			follower.move(BOTTOM_RIGHT);
		}
		return 0;
	} else if (follower.pos.y == 49) {
		if (decider.fatigue == 0) {
			follower.move(TOP);
			decider.move(RIGHT);
		} else {
			follower.move(TOP_LEFT);
		}
		return 0;
	} else {
		return 1;
	}
}
*/

export function movethroughrooms_group_x2(invader: Creep, healer: Creep, rooms_path: string[], poses_path: number[], add_options: MoveToOpts = {}, options: type_movethroughrooms_options = {} ) {
	// -1: error, 0: normal success, 1: already done
	let out_invader = moveawayexit(invader);
	let out_healer = moveawayexit(healer);
	if (out_invader == 0 && out_healer == 0) {
		return 0;
	} else if (out_invader == 0 || out_healer == 0) {
		console.log(`Warning: movethroughrooms_group_x2 fail at exit for invader ${invader.name} and healer ${healer.name} at time ${Game.time}`)
		return -1;
	}
	let target_room_name = rooms_path.slice(-1)[0];
	if (invader.room.name == target_room_name && healer.room.name == target_room_name) {
		return 1;
	}
	if (invader.fatigue > 0 || healer.fatigue > 0) {
		return 0;
	}
    let arg = mymath.where(rooms_path.map((e) => e == invader.room.name))[0];
	let room1_coor = functions.room2coor(rooms_path[arg]);
	let room2_coor = functions.room2coor(rooms_path[arg + 1]);
	let coor_diff = <[number, number]> mymath.array_ele_minus(room2_coor, room1_coor);
	let pos = poses_path[arg];
	let exit_xy = functions.get_exit_xy(coor_diff, pos, [49, 0]);
	let exit_pos = invader.room.getPositionAt(exit_xy[0], exit_xy[1]);
	if (invader.pos.getRangeTo(exit_pos) > 1) {
		movethroughrooms(invader, rooms_path, poses_path, add_options, {...{ignore_creep_xys: [[healer.pos.x, healer.pos.y]]}, ...options});
		healer.move(healer.pos.getDirectionTo(invader.pos));
		return 0;
	}
	let findconstant = functions.coordiff_to_exitconstant(coor_diff);
	let all_exits = invader.room.find(findconstant).filter((e) => e.lookFor("structure").filter((s) => s.structureType == 'constructedWall').length == 0);
	let closest_exit = all_exits.filter((e) => exit_pos.getRangeTo(e) == 1)[0];
	if (closest_exit == undefined) {
		console.log(`Warning: movethroughrooms_group_x2 fail at exit for invader ${invader.name} and healer ${healer.name} at time ${Game.time}`)
		return -1;
	}
	let healer_target_pos = invader.room.getPositionAt(invader.pos.x + closest_exit.x - exit_pos.x, invader.pos.y + closest_exit.y - exit_pos.y);
	if (healer.pos.isEqualTo(healer_target_pos)) {
		let direction = invader.pos.getDirectionTo(exit_pos);
		invader.move(direction);
		healer.move(direction);
	} else {
		healer.moveTo(healer_target_pos, {
			maxRooms: 1,
			costCallback: functions.avoid_exits
		})
	}
	return 0;
}

export function movethroughshards(creep: Creep | PowerCreep) {
	let this_shardmemory = Game.InterShardMemory[Game.shard.name];
	if (this_shardmemory.creeps[creep.name] == undefined) {
		this_shardmemory.creeps[creep.name] = _.clone(creep.memory);
		Game.require_update_intershardmemory = true;
		if (this_shardmemory.all_creeps[creep.name] == undefined) {
			this_shardmemory.all_creeps[creep.name] = { }
			functions.copy_key((<Creep>creep).memory, this_shardmemory.all_creeps[creep.name], ['role', 'home_room_name', 'external_room_name', 'source_name'], undefined);
			Game.require_update_intershardmemory_modify_time = true;
		}
	}
	let shard_move = Game.InterShardMemory[Game.shard.name].creeps[creep.name].shard_move;
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
	if (pathfinding) {
		let target_rxy = shard_move.shard_path[0];
		let target_pos = new RoomPosition(target_rxy.x, target_rxy.y, target_rxy.roomName);
		let path = PathFinder.search(creep.pos, {pos: target_pos, range: 0});
		let exits_path = functions.get_exits_from_path(path.path);
		shard_move.shard = Game.shard.name;
		shard_move.rooms_path = exits_path.rooms_path;
		shard_move.poses_path = exits_path.poses_path;
		Game.require_update_intershardmemory = true;
	}
	if (Game.shard.name !== shard_move.shard_path[0].shard) {
		console.log("Warning: wrong shard");
		return -1;
	}
	if (creep.room.name == shard_move.shard_path[0].roomName) {
		let x = shard_move.shard_path[0].x;
		let y = shard_move.shard_path[0].y;
		if (creep.pos.isNearTo(x, y)) {
			creep.move(creep.pos.getDirectionTo(x, y));
		} else {
			creep.moveTo(x, y, {range: 1, reusePath: 8});
		}
	} else {
		movethroughrooms(creep, shard_move.rooms_path, shard_move.poses_path);
	}
}

