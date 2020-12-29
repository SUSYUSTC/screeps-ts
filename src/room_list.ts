//screeps

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
	'rooms': ['E16N58', 'E17N58'],
    'coor_same': 25,
	'name': 'default',
}, {
    'type': 'H',
	'rooms': ['E15N57', 'E16N57'],
    'coor_same': 9,
	'name': 'default',
}, {
    'type': 'H',
	'rooms': ['E16N57', 'E17N57'],
    'coor_same': 7,
	'name': 'default',
}, {
    'type': 'H',
	'rooms': ['E14N59', 'E15N59'],
    'coor_same': 33,
	'name': 'default',
}, {
    'type': 'H',
	'rooms': ['E14N58', 'E15N58'],
    'coor_same': 24,
	'name': 'default',
}, {
    'type': 'H',
	'rooms': ['E14N57', 'E15N57'],
    'coor_same': 19,
	'name': 'default',
}, {
    'type': 'V',
	'rooms': ['E17N59', 'E17N58'],
    'coor_same': 23,
	'name': 'default',
}, {
    'type': 'V',
	'rooms': ['E16N58', 'E16N57'],
    'coor_same': 38,
	'name': 'default',
}, {
    'type': 'V',
	'rooms': ['E15N58', 'E15N57'],
    'coor_same': 44,
	'name': 'default',
}, {
    'type': 'V',
	'rooms': ['E15N59', 'E15N58'],
    'coor_same': 12,
	'name': 'default',
}, {
    'type': 'V',
	'rooms': ['E14N58', 'E14N57'],
    'coor_same': 16,
	'name': 'default',
}]
export var room_list = new RoomList(bridges);
