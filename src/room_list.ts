var bridges = [{
    'type': 'H',
    'axis_same': 'N3',
    'axis_diff': ['W7', 'W6'],
    'coor_same': 13,
	'name': 'default'
}, {
    'type': 'H',
    'axis_same': 'N3',
    'axis_diff': ['W8', 'W7'],
    'coor_same': 14,
	'name': 'default'
}, {
    'type': 'V',
    'axis_same': 'W7',
    'axis_diff': ['N4', 'N3'],
    'coor_same': 37,
	'name': 'right'
}, {
    'type': 'V',
    'axis_same': 'W7',
    'axis_diff': ['N4', 'N3'],
    'coor_same': 30,
	'name': 'left'
}]
export var rooms: type_room_list_rooms = {};
for (var bridge of bridges) {
    if (bridge.type == 'H') {
        var rooms_name = bridge.axis_diff.map(e => e + bridge.axis_same);
        var exits = [49, 0].map(e => [e, bridge.coor_same]);
        var standpoints = [48, 1].map(e => [e, bridge.coor_same]);
    } else {
        var rooms_name = bridge.axis_diff.map(e => bridge.axis_same + e);
        var exits = [49, 0].map(e => [bridge.coor_same, e]);
        var standpoints = [48, 1].map(e => [bridge.coor_same, e]);
    }
	for (var i of [0,1]) {
		var j=1-i;
		var room_name=rooms_name[i]
		if (!(room_name in rooms)) {
			rooms[room_name]={"room_name": room_name, "connected_rooms": {}}
		}
		if (!(rooms_name[j] in rooms[room_name].connected_rooms)){
			rooms[room_name].connected_rooms[rooms_name[j]]={}
		}
		rooms[room_name].connected_rooms[rooms_name[j]][bridge.name]={"exit": exits[i], 'standpoint': standpoints[i]};
	}
}
