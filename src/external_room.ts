import * as room_list from "./room_list"
import * as mymath from "./mymath"
import * as functions from "./functions"

export function movethroughrooms(creep: Creep, rooms_path: string[], names_path: string[]) {
    if (rooms_path.length != names_path.length + 1) {
        throw Error("Unexpected length of arguments")
    }
    var check_defined = rooms_path.map((e) => Object.keys(room_list.room_list.rooms).includes(e));
    if (!(mymath.all(check_defined))) {
        throw Error("Contain room not defined in config")
    }
    if (!(rooms_path.includes(creep.room.name))) {
        throw Error("The current creep is not along the path")
    }
    var room_info = room_list.room_list.rooms[creep.room.name];
    var arg = mymath.where(rooms_path.map((e) => e == creep.room.name))[0];
    if (arg == rooms_path.length - 1) {
        let standpoint_xy = room_info.connected_rooms[rooms_path[arg - 1]][names_path[arg - 1]].standpoint;
        if (creep.pos.x == standpoint_xy[0] && creep.pos.y == standpoint_xy[1]) {
            return 1;
        } else {
			creep.moveTo(standpoint_xy[0], standpoint_xy[1], {maxRooms: 0, costCallback: functions.avoid_exits});
            return 0;
        }
    } else {
        let exit_xy = room_info.connected_rooms[rooms_path[arg + 1]][names_path[arg]].exit;
		let creeps_at_exit = creep.room.lookForAt("creep", exit_xy[0], exit_xy[1]);
		if (creep.pos.getRangeTo(exit_xy[0], exit_xy[1]) < 3 && creeps_at_exit.length > 0 && creeps_at_exit[0].name !== creep.name) { 
			creep.moveTo(2*creep.pos.x - exit_xy[0], 2*creep.pos.y - exit_xy[1], {maxRooms: 0, costCallback: functions.avoid_exits});
		}
		else {
			creep.moveTo(exit_xy[0], exit_xy[1], {maxRooms: 0, costCallback: functions.avoid_exits});
		}
        return 0;
    }
}

