//screeps
export function get_shard_room(shard: string, room_name: string): type_shard_room {
	return <type_shard_room>(shard + '_' + room_name);
}

export function split_shard_room(shard_room: type_shard_room): {shard: string, room_name: string} {
	let splits = shard_room.split('_');
	return {
		shard: splits[0],
		room_name: splits[1],
	}
}
