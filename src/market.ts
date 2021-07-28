import * as _ from "lodash"
import * as mymath from "./mymath"
import * as config from "./config"
import * as constants from "./constants"
import * as functions from "./functions"
import { Timer } from "./timer"

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
        if (resource == "energy") {
            scores = mymath.array_ele_divide(prices, costs.map((e) => 1 - e));
        } else {
			scores = mymath.array_ele_plus(prices, costs.map((e) => e * energy_price));
		}
    }
    let argsort = mymath.argsort(scores);
    let result: type_order_result[] = [];
    for (let index of argsort.slice(0, num)) {
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

global.history_orders = function(resource: MarketResourceConstant): type_history_order[] {
	return Game.market.incomingTransactions.filter((e) => e.resourceType == resource && e.order !== undefined).map((e) => <type_history_order> {time: e.time, amount: e.amount, price: e.order.price});
}

function order_score_sort(order1: Order, order2: Order): number {
	if (order1.type !== order2.type) {
		if (order1.type == 'sell') {
			return 1;
		} else {
			return -1;
		}
	}
	return functions.sort_str(order1.resourceType, order2.resourceType);
}
global.my_orders = function (): Order[] {
	return <Array<Order>>Object.values(Game.market.orders).sort((a, b) => order_score_sort(a, b));
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

function get_market_orders(type: "sell" | "buy", resourcetype: MarketResourceConstant) {
	if (Game.market_orders_cache == undefined) {
		Game.market_orders_cache = {
			sell: {},
			buy: {},
		};
	}
	if (Game.market_orders_cache[type][resourcetype] == undefined) {
		let orders = Game.market.getAllOrders({
			type: type, 
			resourceType: resourcetype
		});
		switch(type) {
			case "sell": {
				Game.market_orders_cache[type][resourcetype] = orders.sort((x, y) => x.price - y.price);;
				break;
			}
			case "buy": {
				Game.market_orders_cache[type][resourcetype] = orders.sort((x, y) => y.price - x.price);;
				break;
			}
		}
	}
	return Game.market_orders_cache[type][resourcetype];
}

function classify_my_orders() {
	Game.my_orders = {
		sell: {},
		buy: {},
	}
	for (let order of <Array<Order>> Object.values(Game.market.orders)) {
		let type = <"sell"|"buy"> order.type;
		if (Game.my_orders[type][order.roomName] == undefined) {
			Game.my_orders[type][order.roomName] = {};
		}
		if (Game.my_orders[type][order.roomName][order.resourceType] == undefined) {
			Game.my_orders[type][order.roomName][order.resourceType] = [];
		}
		Game.my_orders[type][order.roomName][order.resourceType].push(order);
	}
}

global.regulate_order_price = function(id: Id < Order > ): number {
    let order = Game.market.getOrderById(id);
	if (order.remainingAmount < order.totalAmount / 10) {
		Game.market.cancelOrder(order.id);
		return 0;
	}
	let orders = get_market_orders(<"sell"|"buy"> order.type, order.resourceType);
    let amount = 0;
    if (order.type == 'buy') {
		let index = orders.findIndex((e) => e.price <= order.price);
		if (index !== -1) {
			orders = orders.slice(0, index);
		}
        let acceptable_price = config.acceptable_prices.buy[order.resourceType];
		if (Game.rooms[order.roomName].controller.level < 8 && order.resourceType == 'energy') {
			acceptable_price = config.newroom_energy_buying_price;
		}
        if (acceptable_price == undefined) {
            return -2;
        }
		if (order.price < acceptable_price.lowest_price) {
			console.log("Going to change order", order.resourceType, "to", acceptable_price.lowest_price);
			Game.market.changeOrderPrice(order.id, acceptable_price.lowest_price);
			return 0;
		}
		if (order.price > acceptable_price.price) {
			return 0;
		}
        for (let o of orders) {
            amount += o.amount;
            if (amount > order.amount / 3) {
                if (o.price < acceptable_price.price && o.price >= order.price) {
                    console.log("Going to change order", order.resourceType, "to", o.price + 0.001);
                    Game.market.changeOrderPrice(id, o.price + 0.001);
                    return 0;
                }
				if (!acceptable_price.always_increase) {
					return 0;
				}
            }
        }
        if (acceptable_price.interval > 0 && Game.time % acceptable_price.interval == 0 && (order.price < acceptable_price.price)) {
			let newprice = order.price + acceptable_price.price * 0.02;
			console.log("Going to change order", order.resourceType, "to", newprice);
            Game.market.changeOrderPrice(id, newprice);
            return 0;
        }
    } else if (order.type == 'sell') {
		let index = orders.findIndex((e) => e.price >= order.price);
		if (index !== -1) {
			orders = orders.slice(0, index);
		}
        let acceptable_price = config.acceptable_prices.sell[order.resourceType];
        if (acceptable_price == undefined) {
            return -2;
        }
        for (let o of orders) {
            amount += o.amount;
            if (amount > order.amount / 3) {
                let acceptable_price = config.acceptable_prices.sell[order.resourceType];
                if (o.price > acceptable_price.price) {
                    console.log("Going to change order", order.resourceType, "to", o.price - 0.001);
                    Game.market.changeOrderPrice(id, o.price - 0.001);
                    return o.price - 0.001;
                }
                return 0;
            }
        }
        if (acceptable_price.interval > 0 && Game.time % acceptable_price.interval == 0 && order.price > acceptable_price.price) {
            Game.market.changeOrderPrice(id, order.price - acceptable_price.price * 0.02);
            return 0;
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
	let timer = new Timer("regulate_all_order_prices", false);
    for (let id of < Array < Id < Order >>> Object.keys(Game.market.orders)) {
        let order = Game.market.orders[id];
        let acceptable_price = config.acceptable_prices[ < keyof typeof config.acceptable_prices > order.type][order.resourceType];
        if (acceptable_price == undefined) {
            continue;
        }
        global.regulate_order_price(id);
    }
	timer.end();
    return 0;
}

global.set_resource_price = function(type: "buy" | "sell", resource: MarketResourceConstant, price: number): number {
    let orders = _.filter(Game.market.orders, (e) => e.type == type && e.resourceType == resource).forEach((e) => Game.market.changeOrderPrice(e.id, price));
    return 0;
}

function buy_from_market(room_name: string, resource: ResourceConstant, expected_amount: number, order_amount: number) {
	let orders = get_market_orders("sell", resource).filter((e) => e.amount > 0);
	let current_amount = functions.get_total_resource_amount(room_name, resource);
	if (current_amount >= expected_amount) {
		return 1;
	}
	let prices = orders.map((e) => e.price);
	let argmin = mymath.argmin(prices);
	let best_order = orders[argmin];
	let acceptable_price = config.acceptable_prices.buy[resource];
	if (acceptable_price == undefined) {
		return -1;
	}
	if (best_order.price <= acceptable_price.price) {
		let amount = Math.min(best_order.amount, order_amount);
		Game.market.deal(best_order.id, amount, room_name);
        console.log("deal", amount, resource, "at", room_name);
		return 0;
	} else {
		return 1;
	}
}

function auto_supply_from_market(room_name: string, resource: ResourceConstant, expected_amount: number, order_amount: number) {
	if (Game.my_orders == undefined) {
		classify_my_orders();
	}
    let room = Game.rooms[room_name];
    let current_amount = functions.get_total_resource_amount(room_name, resource);
	if (resource == 'energy') {
		current_amount += functions.get_total_resource_amount(room_name, 'battery') * 10;
	} else if (resource == 'battery') {
		current_amount += functions.get_total_resource_amount(room_name, 'energy') / 10;
	}
	let orders: Order[];
	if (Game.my_orders.buy[room_name] == undefined) {
		orders = [];
	} else {
		orders = Game.my_orders.buy[room_name][resource];
	}
	if (orders == undefined) {
		orders = [];
	}
	if (config.acceptable_prices.buy[resource] !== undefined) {
		orders.filter((e) => e.remainingAmount < order_amount / 10).forEach((e) => Game.market.cancelOrder(e.id));
	}
    let orders_amount = orders.map((e) => e.remainingAmount);
    current_amount += mymath.array_sum(orders_amount);
    if (current_amount < expected_amount) {
        console.log("create order", resource, "at", room_name);
		let price = 0.001;
		if (config.acceptable_prices.buy[resource] !== undefined) {
			price = config.acceptable_prices.buy[resource].price / 2;
		}
        Game.market.createOrder({
            "type": "buy",
            "resourceType": resource,
            "price": price,
            "totalAmount": order_amount,
            "roomName": room_name,
        });
    }
    return 0;
}

export function auto_supply_resources(room_name: string) {
    let room = Game.rooms[room_name];
    if (Game.time % 200 !== 0 || room == undefined || room.storage == undefined || room.terminal == undefined || Game.memory[room_name] == undefined || Game.memory[room_name].mine_status == undefined) {
        return 1;
    }
	let timer = new Timer("auto_supply_resources", false);
    if (Game.controlled_rooms_with_terminal.includes(room_name)) {
        let mineral_type = Game.memory[room_name].mine_status.type
		for (let mineral of constants.basic_minerals) {
			let conf_mineral_store = config.mineral_store_amount[mineral];
			let amount = conf_mineral_store.expect_amount;;
			auto_supply_from_market(room_name, mineral, amount, config.mineral_buy_onetime_amount);
		}
		auto_supply_from_market(room_name, 'energy', config.energy_bar_of_market_supply, config.energy_buy_onetime_amount);
		if (room.controller.level == 8) {
			auto_supply_from_market(room_name, 'battery', config.energy_bar_of_market_supply / 10, config.battery_buy_onetime_amount);
		}
		if (Game.powered_rooms[room_name] !== undefined) {
			auto_supply_from_market(room_name, 'ops', config.ops_store_amount, config.ops_buy_onetime_amount);
		}
    }
	timer.end();
}

export function auto_buy_resources(room_name: string) {
    let room = Game.rooms[room_name];
	let timer = new Timer("auto_supply_resources", false);
    if (Game.controlled_rooms_with_terminal.includes(room_name)) {
		if (room_name == config.buy_power_room && Game.time % 50 == 49 && Game.market.credits >= config.credit_line) {
			buy_from_market(room_name, "power", config.power_store_amount, config.power_buy_onetime_amount);
		}
    }
	timer.end();
}

export function auto_sell() {
	if (Game.time % 200 !== 0) {
		return 1;
	}
	for (let resource of <Array<MarketResourceConstant>> Object.keys(config.auto_sell_list)) {
		let sell_conf = config.auto_sell_list[resource];
		let orders = _.filter(Game.market.orders, (e) => e.type == 'sell' && e.resourceType == resource && e.roomName == sell_conf.room)
		orders.filter((e) => e.remainingAmount < sell_conf.amount / 10).forEach((e) => Game.market.cancelOrder(e.id));
		orders.filter((e) => Math.abs(e.price - sell_conf.price) >= 0.001).forEach((e) => Game.market.changeOrderPrice(e.id, sell_conf.price));
		let orders_amount = orders.map((e) => e.remainingAmount);
		let total_amount = mymath.array_sum(orders_amount);
		if (total_amount < sell_conf.amount / 2) {
			console.log("create sell order", resource, "at", sell_conf.room);
			Game.market.createOrder({
				"type": "sell",
				"resourceType": resource,
				"price": sell_conf.price,
				"totalAmount": sell_conf.amount,
				"roomName": sell_conf.room,
			});
		}
	}
}

function sell_commodity(room_name: string, commodity: CommodityConstant) {
	let room = Game.rooms[room_name];
	if (room.terminal.store.getUsedCapacity(commodity) == 0) {
		return;
	}
	let acceptable_price = config.acceptable_prices.sell[commodity].price;
	let amount = room.terminal.store.getUsedCapacity(commodity);
	if (amount * acceptable_price >= 200000) {
		let orders = get_market_orders("buy", commodity).filter((e) => e.amount > 0);
		if (orders.length == 0) {
			return;
		}
		let argmax = mymath.argmax(orders.map((e) => e.price));
		let order = orders[argmax];
		if (order.price >= acceptable_price) {
			Game.market.deal(order.id, Math.min(order.amount, amount), room_name);
			return;
		}
	}
}

export function commodity_orders() {
	let timer = new Timer("commodity_orders", false);
	for (let room_name in config.commodity_room_conf) {
		let room = Game.rooms[room_name];
		for (let zone of config.commodity_room_conf[room_name]) {
			let production = constants.commodities_related_requirements[zone];
			for (let product of production.products) {
				let level = constants.commodity_levels[product];
				if (room.terminal.store.getUsedCapacity(product) >= config.commodity_amount_to_start_selling_by_level[level]) {
					sell_commodity(room_name, product);
				}
			}
			if (Game.time % 100 == 0) {
				for (let bar of production.bars) {
					auto_supply_from_market(room_name, bar, config.bar_store_amount, config.bar_buy_onetime_amount);
				}
			}
		}
	}
	timer.end();
}

function order_stat(): type_order_total_amount {
	let order_total_amount: type_order_total_amount = {
		sell: {}, 
		buy: {},
	};
	for (let order of <Array<Order>> Object.values(Game.market.orders)) {
		if (order_total_amount[<"sell" | "buy" >order.type][order.resourceType] == undefined) {
			order_total_amount[<"sell" | "buy" >order.type][order.resourceType] = order.remainingAmount;
		} else {
			order_total_amount[<"sell" | "buy" >order.type][order.resourceType] += order.remainingAmount;
		}
	}
	return order_total_amount;
}

global.reset_market_stat = function(): number {
	Memory.market_accumulation_stat = {
		sell: {},
		buy: {},
	}
	return 0;
}

export function market_stat() {
	if (Game.time % 50 !== 0) {
		return;
	}
	for (let transaction of Game.market.incomingTransactions) {
		if (transaction.time < Game.time - 50) {
			break;
		}
		if (transaction.order == undefined) {
			continue;
		} else {
			let order = transaction.order;
			if (Memory.market_accumulation_stat.buy[transaction.resourceType] == undefined) {
				Memory.market_accumulation_stat.buy[transaction.resourceType] = {
					tot_number: 0,
					tot_price: 0,
				}
			}
			let stat = Memory.market_accumulation_stat.buy[transaction.resourceType];
			stat.tot_number += transaction.amount;
			stat.tot_price += transaction.amount * order.price;
		}
	}

	for (let transaction of Game.market.outgoingTransactions) {
		if (transaction.time < Game.time - 50) {
			break;
		}
		if (transaction.order == undefined) {
			Memory.tot_transaction_cost += Game.market.calcTransactionCost(transaction.amount, transaction.from, transaction.to);
		} else {
			let order = transaction.order;
			if (Memory.market_accumulation_stat.sell[transaction.resourceType] == undefined) {
				Memory.market_accumulation_stat.sell[transaction.resourceType] = {
					tot_number: 0,
					tot_price: 0,
				}
			}
			let stat = Memory.market_accumulation_stat.sell[transaction.resourceType];
			stat.tot_number += transaction.amount;
			stat.tot_price += transaction.amount * order.price;
		}
	}
}
