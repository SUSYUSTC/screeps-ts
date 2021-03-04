import * as _ from "lodash"
import * as mymath from "./mymath"

export function produce(room_name: string) {
    let room = Game.rooms[room_name];
	let factory_status = room.memory.unique_structures_status.factory;
	if (!factory_status.finished) {
		return 1;
	}
	let factory = Game.getObjectById(factory_status.id);
	if (factory.store.getUsedCapacity("energy") >= 600 && factory.cooldown == 0) {
		factory.produce("battery");
	}
}