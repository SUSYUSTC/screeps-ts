import * as _ from "lodash"
import * as mymath from "./mymath"
import * as config from "./config"

global.get_best_order = function(room_name: string, typ: "sell" | "buy", resource: MarketResourceConstant, num: number = 8, energy_price: number = 0.2): type_order_result[] {
    let orders = Game.market.getAllOrders({
        "type": typ,
        "resourceType": resource
    });
    let costs = orders.map((e) => Game.market.calcTransactionCost(1000, room_name, e.roomName) / 1000);
    let prices = orders.map((e) => e.price);
    let scores;
    if (typ == "buy") {
        if (resource == "energy") {
            scores = mymath.array_ele_divide(prices, costs.map((e) => 1 + e)).map((e) => -e);
        } else {
            scores = mymath.array_ele_minus(costs.map((e) => e * energy_price), prices);
        }
    } else {
        scores = mymath.array_ele_plus(prices, costs.map((e) => e * energy_price));
    }
    let argsort = mymath.argsort(scores);
    let result: type_order_result[] = [];
    for (let index of argsort.slice(0, num)) {
        console.log(orders[index].id, orders[index].price, costs[index], orders[index].amount, scores[index]);
        result.push({
            "id": orders[index].id,
            "price": orders[index].price,
            "transaction_cost": costs[index],
            "energy_price": energy_price,
            "score": scores[index],
            "amount": orders[index].amount
        });
    }
    return result;
}

global.auto_buy = function(room_name: string, resource: MarketResourceConstant, max_score: number, amount: number, energy_price: number = 0.2): number {
    let room = Game.rooms[room_name];
    if (room.memory.objects_to_buy == undefined) {
        room.memory.objects_to_buy = {};
    }
    for (let key in room.memory.objects_to_buy) {
        let obj = room.memory.objects_to_buy[key];
        if (obj.resource == resource && Math.abs(obj.max_score - max_score) < 0.01) {
            obj.amount += amount;
            return 0;
        }
    }
    let newobj: type_object_to_trade = {
        "max_score": max_score,
        "resource": resource,
        "amount": amount,
        "energy_price": energy_price,
    }
    let time_name = Game.time.toString();
    room.memory.objects_to_buy[time_name] = newobj;
    room.memory.market_cooldown = false;
    return 0;
}

global.auto_sell = function(room_name: string, resource: MarketResourceConstant, max_score: number, amount: number, energy_price: number = 0.2): number {
    let room = Game.rooms[room_name];
    if (room.memory.objects_to_sell == undefined) {
        room.memory.objects_to_sell = {};
    }
    for (let key in room.memory.objects_to_sell) {
        let obj = room.memory.objects_to_sell[key];
        if (obj.resource == resource && Math.abs(obj.max_score - max_score) < 0.01) {
            obj.amount += amount;
            return 0;
        }
    }
    let newobj: type_object_to_trade = {
        "max_score": max_score,
        "resource": resource,
        "amount": amount,
        "energy_price": energy_price,
    }
    let time_name = Game.time.toString();
    room.memory.objects_to_sell[time_name] = newobj;
    room.memory.market_cooldown = false;
    return 0;
}

export function clear_used() {
    if (Game.time % 10 == 0) {
        for (let id in Game.market.orders) {
            if (Game.market.orders[id].remainingAmount == 0) {
                Game.market.cancelOrder(id);
            }
        }
    }
}
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
                if (room.terminal.store.getUsedCapacity("energy") < 20000) {
                    continue;
                }
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

global.regulate_order_price = function(id: Id < Order > ): number {
    let order = Game.market.getOrderById(id);
    let orders = Game.market.getAllOrders({
        "type": order.type,
        "resourceType": order.resourceType
    });
    let amount = 0;
    if (order.type == 'buy') {
        orders = orders.filter((e) => e.price > order.price && Game.market.orders[e.id] == undefined).sort((x, y) => y.price - x.price);
		let acceptable_price = config.acceptable_prices.buy[order.resourceType];
		if (acceptable_price == undefined) {
			return -2;
		}
        for (let o of orders) {
            amount += o.amount;
            if (amount > order.amount / 3) {
                if (o.price < acceptable_price) {
                    console.log("Going to change order", order.resourceType, "to", o.price + 0.001);
                    Game.market.changeOrderPrice(id, o.price + 0.001);
					return o.price + 0.001;
                }
				return 0;
            }
        }
    } else if (order.type == 'sell') {
        orders = orders.filter((e) => e.price < order.price && Game.market.orders[e.id] == undefined).sort((x, y) => x.price - y.price);
		let acceptable_price = config.acceptable_prices.sell[order.resourceType];
		if (acceptable_price == undefined) {
			return -2;
		}
        for (let o of orders) {
            amount += o.amount;
            if (amount > order.amount / 3) {
                let acceptable_price = config.acceptable_prices.sell[order.resourceType];
                if (o.price > acceptable_price) {
                    console.log("Going to change order", order.resourceType, "to", o.price - 0.001);
                    Game.market.changeOrderPrice(id, o.price - 0.001);
					return o.price - 0.001;
                }
				return 0;
            }
        }
    } else {
		return -1;
	}
	return 0;
}

export function regulate_all_order_prices(): number {
	if (Game.time % 100 !== 0) {
		return 1;
	}
	for (let id of <Array<Id<Order>>>Object.keys(Game.market.orders)) {
		let order = Game.market.orders[id];
		let acceptable_price = config.acceptable_prices[<keyof typeof config.acceptable_prices>order.type][order.resourceType];
		if (acceptable_price == undefined) {
			continue;
		}
		global.regulate_order_price(id);
	}
	return 0;
}

