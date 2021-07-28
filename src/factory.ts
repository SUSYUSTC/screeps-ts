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
    if (room.memory.next_time == undefined) {
        room.memory.next_time = {};
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
    if (Game.time < room.memory.next_time.produce_commodity) {
        return 0;
    }
    let commodity_conf = config.commodity_room_conf[room_name];
    if (commodity_conf !== undefined) {
        for (let resource of commodity_conf) {
            let production = constants.commodities_related_requirements[resource];
            for (let level = production.products.length - 1; level >= 0; level--) {
                let product = production.products[level];
                if (level > 0 && room.factory.effect_level !== level) {
                    continue;
                }
                if (room.terminal.store.getUsedCapacity(product) >= config.commodity_amount_to_stop_production_by_level[level]) {
                    continue;
                }
                if (room.factory.produce(product) == 0) {
                    return 0;
                }
            }
        }
    }
    room.memory.next_time.produce_commodity = Game.time + 50;
}
