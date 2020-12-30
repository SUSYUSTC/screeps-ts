//screeps
import * as room_list from "./room_list"
export function avoid_exits(room_name: string, costMatrix: CostMatrix) {
    for (var i = 0; i < 50; i++) {
        costMatrix.set(0, i, 100);
        costMatrix.set(49, i, 100);
        costMatrix.set(i, 49, 100);
        costMatrix.set(i, 0, 100);
    }
	for (var _room_name in room_list.rooms_ignore_pos) {
		if (room_name == _room_name) {
			for(let xy of room_list.rooms_ignore_pos[_room_name]) {
				costMatrix.set(xy[0], xy[1], 1);
			}
		}
	}
}
