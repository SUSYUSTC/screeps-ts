import * as _ from "lodash"
export function process_buy_order(room_name: string): number {
    let room = Game.rooms[room_name];
    if (room.terminal == undefined || room.terminal.cooldown > 0 || room.memory.objects_to_buy == undefined || Object.keys(room.memory.objects_to_buy).length == 0) {
        return 1;
    }
    if (Game.time % 50 !== 0 && room.memory.market_cooldown) {
        return 2;
    }
    for (let key in room.memory.objects_to_buy) {
        let obj = room.memory.objects_to_buy[key]
        if (obj.amount == 0) {
            delete room.memory.objects_to_buy[key];
            continue;
        }
        let orders = global.get_best_order(room_name, "sell", obj.resource, 1, obj.energy_price);
        if (orders.length == 0) {
            continue;
        }
        let order = orders[0];
        if (order.score < obj.max_score) {
            room.memory.market_cooldown = false;
            let transaction_amount_available;
			transaction_amount_available = Math.floor(room.terminal.store.getUsedCapacity("energy") / order.transaction_cost) - 5;
            let deal_amount = Math.min(order.amount, obj.amount, transaction_amount_available);
            console.log(`Trying to deal: ${deal_amount}, ${obj.resource}, ${room_name}, price: ${order.price}, transaction cost: ${order.transaction_cost}, score: ${order.score}, id: ${order.id}`);
            if (Game.market.deal(order.id, deal_amount, room_name) == 0) {
                obj.amount -= deal_amount;
            }
            return 0;
        } else {
            continue;
        }
    }
    room.memory.market_cooldown = true;
    return 1;
}

export function process_sell_order(room_name: string): number {
    let room = Game.rooms[room_name];
    if (room.terminal == undefined || room.terminal.cooldown > 0 || room.memory.objects_to_sell == undefined || Object.keys(room.memory.objects_to_sell).length == 0) {
        return 1;
    }
    if (Game.time % 50 !== 0 && room.memory.market_cooldown) {
        return 2;
    }
    for (let key in room.memory.objects_to_sell) {
        let obj = room.memory.objects_to_sell[key]
        if (obj.amount == 0) {
            delete room.memory.objects_to_sell[key];
            continue;
        }
        let orders = global.get_best_order(room_name, "buy", obj.resource, 1, obj.energy_price);
        if (orders.length == 0) {
            continue;
        }
        let order = orders[0];
        if (order.score < obj.max_score) {
            room.memory.market_cooldown = false;
            let transaction_amount_available;
            if (obj.resource == "energy") {
                transaction_amount_available = Math.floor(room.terminal.store.getUsedCapacity("energy") / (1 + order.transaction_cost)) - 5;
            } else {
                transaction_amount_available = Math.floor(room.terminal.store.getUsedCapacity("energy") / order.transaction_cost) - 5;
            }
            let deal_amount = Math.min(order.amount, obj.amount, transaction_amount_available);
            console.log(`Trying to deal: ${deal_amount}, ${obj.resource}, ${room_name}, price: ${order.price}, transaction cost: ${order.transaction_cost}, score: ${order.score}, id: ${order.id}`);
            if (Game.market.deal(order.id, deal_amount, room_name) == 0) {
                obj.amount -= deal_amount;
            }
            return 0;
        } else {
            continue;
        }
    }
    room.memory.market_cooldown = true;
    return 1;
}

