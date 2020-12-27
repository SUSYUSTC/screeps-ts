import * as mymath from "./mymath"
export interface RoomList_interface {
	bridges: type_room_list_bridge[];
	rooms: type_room_list_rooms;
	rooms_from_bridge(bridges: type_room_list_bridge[]): type_room_list_rooms;
}
class RoomList implements RoomList_interface {
	bridges: type_room_list_bridge[] = [];
	rooms: type_room_list_rooms = {};
	rooms_from_bridge(bridges: type_room_list_bridge[]): type_room_list_rooms {
		var rooms: type_room_list_rooms = {};
		var exits: number[][];
		var standpoints: number[][];
		for (var index of mymath.range(bridges.length)) {
			var bridge=bridges[index];
			if (bridge.type == 'H') {
				exits = [49, 0].map(e => [e, bridge.coor_same]);
				standpoints = [48, 1].map(e => [e, bridge.coor_same]);
			} else {
				exits = [49, 0].map(e => [bridge.coor_same, e]);
				standpoints = [48, 1].map(e => [bridge.coor_same, e]);
			}
			for (var i of [0, 1]) {
				let j = 1 - i;
				let rooms_name = bridge.rooms;
				let room_name = rooms_name[i]
				if (!(room_name in rooms)) {
					rooms[room_name] = {
						"room_name": room_name,
						"connected_rooms": {}
					}
				}
				if (!(rooms_name[j] in rooms[room_name].connected_rooms)) {
					rooms[room_name].connected_rooms[rooms_name[j]] = {}
				}
				rooms[room_name].connected_rooms[rooms_name[j]][bridge.name] = {
					"exit": exits[i],
					'standpoint': standpoints[i],
					"index": index
				};
			}
		}
		return rooms;
	}
	constructor(bridges: type_room_list_bridge[]) {
		this.bridges = bridges;
		this.rooms = this.rooms_from_bridge(bridges);
	}
}
export var bridges: type_room_list_bridge[] = [{
	'type': 'H',
	'rooms': ['W7N3', 'W6N3'],
	'coor_same': 13,
	'name': 'default'
}, {
	'type': 'H',
	'rooms': ['W8N3', 'W7N3'],
	'coor_same': 14,
	'name': 'default'
}, {
	'type': 'V',
	'rooms': ['W7N4', 'W7N3'],
    'coor_same': 37,
    'name': 'right'
}, {
    'type': 'V',
    'rooms': ['W7N4', 'W7N3'],
    'coor_same': 30,
    'name': 'left'
}]
export var room_list = new RoomList(bridges);
