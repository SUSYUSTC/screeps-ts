import * as _ from "lodash"
import * as mymath from "./mymath"

export function produce(room_name: string) {
    let room = Game.rooms[room_name];
	if (room.memory.factory_id == undefined) {
		return 1;
	}
	let factory = Game.getObjectById(room.memory.factory_id);
	if (factory.store.getUsedCapacity("energy") >= 600 && factory.cooldown == 0) {
		factory.produce("battery");
	}
}
