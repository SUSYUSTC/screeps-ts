export function process_resource_sending_request(room_name: string) {
	let room = Game.rooms[room_name];
	if (room.terminal == undefined) {
		return;
	}
	let requests = room.memory.resource_sending_request
	if (requests == undefined || requests.length == 0) {
		return;
	}
	let request = requests[requests.length - 1];
	if (room.terminal.store.getUsedCapacity(request.resource) >= request.amount) {
		let out = room.terminal.send(request.resource, request.amount, request.room_to);
		if (out == 0) {
			requests.pop();
			return;
		}
	}
}
