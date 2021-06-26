import * as _ from "lodash"
import * as mymath from "./mymath"

export function produce(room_name: string) {
    let room = Game.rooms[room_name];
	if (room.factory == undefined) {
		return 1;
	}
	if (room.factory.store.getUsedCapacity("energy") >= 8000 && room.factory.cooldown == 0) {
		if (room.factory.produce("battery") == 0) {
			Memory.produce_battery_stat += 1;
		}
	} else if (room.factory.store.getUsedCapacity("energy") < 5000 && room.factory.store.getUsedCapacity("battery") >= 50 && room.factory.cooldown == 0) {
		room.factory.produce("energy");
	}
}
