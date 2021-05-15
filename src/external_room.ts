import * as mymath from "./mymath"
import * as functions from "./functions"
import * as config from "./config"
import * as basic_job from "./basic_job"
import { Timer } from "./timer";

type type_movethroughrooms_options = {
	replace_pos ?: boolean;
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
				creep.moveTo(exit_pos, {...{
					maxRooms: 1,
					costCallback: functions.avoid_exits
				}, ...add_options});
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

