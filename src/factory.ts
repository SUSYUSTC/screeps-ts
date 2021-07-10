import * as _ from "lodash"
import * as config from "./config"
import * as constants from "./constants"
import * as mymath from "./mymath"

export function produce(room_name: string) {
    let room = Game.rooms[room_name];
	if (room.factory == undefined) {
		return 1;
	}
	if (room.factory.cooldown > 0) {
		return 1;
	}
	if (room.factory.store.getUsedCapacity("energy") >= config.factory_max_energy && room.factory.cooldown == 0) {
		if (room.factory.produce("battery") == 0) {
			Memory.produce_battery_stat += 1;
		}
		return 0;
	} else if (room.factory.store.getUsedCapacity("energy") < config.factory_min_energy && room.factory.store.getUsedCapacity("battery") >= 50 && room.factory.cooldown == 0) {
		room.factory.produce("energy");
		return 0;
	}
	let commodity_conf = config.commodity_room_conf[room_name];
	if (commodity_conf !== undefined) {
		for (let resource of commodity_conf) {
			let production = constants.basic_commodity_production[resource];
			if (room.factory.produce(production.product) == 0) {
				return 0;
			}
		}
	}
}
