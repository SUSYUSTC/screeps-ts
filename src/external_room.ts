import * as mymath from "./mymath"
import * as functions from "./functions"
import * as config from "./config"
import * as basic_job from "./basic_job"

export function movethroughrooms(creep: Creep | PowerCreep, rooms_path: string[], poses_path: number[], add_options: any = {}) {
    if (rooms_path.length != poses_path.length + 1) {
        throw Error("Unexpected length of arguments")
    }
	/*
	var check_defined = rooms_path.map((e) => Object.keys(room_list.room_list.rooms).includes(e));
    if (!(mymath.all(check_defined))) {
        throw Error("Contain room not defined in config")
    }
	 */
    if (!(rooms_path.includes(creep.room.name))) {
        console.log(creep.name, "is missing in a unknown room")
        return;
    }
	//var room_info = room_list.room_list.rooms[creep.room.name];
    var arg = mymath.where(rooms_path.map((e) => e == creep.room.name))[0];
    if (arg == rooms_path.length - 1) {
        let room1_coor = functions.room2coor(rooms_path[arg - 1]);
        let room2_coor = functions.room2coor(rooms_path[arg]);
        let coor_diff = mymath.array_ele_minus(room2_coor, room1_coor);
        let standpoint_xy;
        let pos = poses_path[arg - 1];
        if (coor_diff[0] == 0) {
            if (coor_diff[1] == 1) {
                standpoint_xy = [pos, 1];
            } else {
                standpoint_xy = [pos, 48];
            }
        }
        else {
            if (coor_diff[1] == 1) {
                standpoint_xy = [1, pos];
            } else {
                standpoint_xy = [48, pos];
            }
        }
        if (creep.pos.x == standpoint_xy[0] && creep.pos.y == standpoint_xy[1]) {
            return 1;
        } else {
			creep.moveTo(standpoint_xy[0], standpoint_xy[1], {...{
                maxRooms: 0,
                costCallback: functions.avoid_exits
			}, ...add_options});
            return 0;
        }
    } else {
        let room1_coor = functions.room2coor(rooms_path[arg]);
        let room2_coor = functions.room2coor(rooms_path[arg + 1]);
        let coor_diff = mymath.array_ele_minus(room2_coor, room1_coor);
        let pos = poses_path[arg];
        let exit_xy;
        if (coor_diff[0] == 0) {
            if (coor_diff[1] == 1) {
                exit_xy = [pos, 49];
            } else {
                exit_xy = [pos, 0];
            }
        }
        else {
            if (coor_diff[0] == 1) {
                exit_xy = [49, pos];
            } else {
                exit_xy = [0, pos];
            }
        }
        let creeps_at_exit = creep.room.lookForAt("creep", exit_xy[0], exit_xy[1]);
        if (creep.pos.getRangeTo(exit_xy[0], exit_xy[1]) < 3 && creeps_at_exit.length > 0 && creeps_at_exit[0].name !== creep.name) {
			let path = PathFinder.search(creep.pos, {pos: creep.room.getPositionAt(exit_xy[0], exit_xy[1]), range: 2}, {maxRooms: 1, flee: true});
            creep.moveByPath(path.path);
        } else {
			if (config.controlled_rooms.includes(creep.room.name)) {
				basic_job.movetopos(creep, creep.room.getPositionAt(exit_xy[0], exit_xy[1]), 0)
			} else {
				creep.moveTo(exit_xy[0], exit_xy[1], {...{
					maxRooms: 0,
					costCallback: functions.avoid_exits
				}, ...add_options});
			}
        }
        return 0;
    }
}

export function external_flee(creep: Creep, safe_pos: number[], rooms_backwardpath: string[], poses_backwardpath: number[]) {
    if (creep.room.name == creep.memory.home_room_name) {
        creep.memory.movable = false;
		let pos = creep.room.getPositionAt(safe_pos[0], safe_pos[1]);
		if (pos.lookFor("creep").length > 0) {
			basic_job.movetopos(creep, pos, 1);
		} else {
			basic_job.movetopos(creep, pos, 0);
		}
    } else {
        movethroughrooms(creep, rooms_backwardpath, poses_backwardpath);
    }
}

