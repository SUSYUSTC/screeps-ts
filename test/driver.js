class RoomPosition {
	constructor(x, y, room_name) {
		this.x = x;
		this.y = y;
		this.room_name = room_name;
	}
	getRangeTo(pos) {
		if (pos.room_name == this.room_name) {
			return Math.max(Math.abs(pos.x-this.x), Math.abs(pos.y-this.y));
		} else {
			return Infinity;
		}
	}
	isNearTo(pos) {
		return getRangeTo(pos) <= 1
	}
	isEqualTo(pos) {
		return getRangeTo(pos) == 0
	}
}
module.exports.RoomPosition = RoomPosition
