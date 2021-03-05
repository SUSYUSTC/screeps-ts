//screeps
import * as mymath from "./mymath"
import * as config from "./config"
import * as basic_job from "./basic_job"
import * as attack from "./attack"
export function avoid_exits(room_name: string, costMatrix: CostMatrix) {
    for (let i = 0; i < 50; i++) {
        costMatrix.set(0, i, 255);
        costMatrix.set(49, i, 255);
        costMatrix.set(i, 49, 255);
        costMatrix.set(i, 0, 255);
    }
}

export function get_costmatrix_road(room_name: string) {
    let name_of_this_function = "costmatrices"
    if (Game.tick_cpu[name_of_this_function] == undefined) {
        Game.tick_cpu[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();
    if (Game.costmatrices == undefined) {
        Game.costmatrices = {};
    }
    if (Game.costmatrices[room_name] == undefined) {
        if (global.basic_costmatrices == undefined) {
            global.basic_costmatrices = {};
        }
        if (global.basic_costmatrices[room_name] == undefined || Game.rooms[room_name].memory.objects_updated) {
            let costmatrix = new PathFinder.CostMatrix;
            let terrain = new Room.Terrain(room_name);
            for (let i = 0; i < 50; i++) {
                for (let j = 0; j < 50; j++) {
                    if (terrain.get(i, j) == 0) {
                        costmatrix.set(i, j, 2);
                    } else if (terrain.get(i, j) == 1) {
                        costmatrix.set(i, j, 255);
                    } else if (terrain.get(i, j) == 2) {
                        costmatrix.set(i, j, 10);
                    }
                }
            }
            if (Game.rooms[room_name] !== undefined) {
                let room = Game.rooms[room_name];
                let structures = room.find(FIND_STRUCTURES);
                let sites = room.find(FIND_MY_CONSTRUCTION_SITES);
                structures.filter((e) => e.structureType == 'road').forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 1));
                structures.filter((e) => !(['road', 'container', 'rampart'].includes(e.structureType))).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
                sites.filter((e) => !(['road', 'container', 'rampart'].includes(e.structureType))).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
                structures.filter((e) => e.structureType == 'rampart' && e.owner.username !== config.username).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
            }
            global.basic_costmatrices[room_name] = costmatrix.clone();
        }
        let costmatrix = global.basic_costmatrices[room_name].clone();
        if (Game.rooms[room_name] !== undefined) {
            let room = Game.rooms[room_name];
            let mycreeps = room.find(FIND_MY_CREEPS);
            mycreeps.filter((e) => !e.memory.movable).forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
            let hostilecreeps = room.find(FIND_HOSTILE_CREEPS);
            hostilecreeps.forEach((e) => costmatrix.set(e.pos.x, e.pos.y, 255));
            Game.costmatrices[room_name] = costmatrix.clone();
        } else {
            Game.costmatrices[room_name] = costmatrix.clone();
        }
    }
    Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
    return Game.costmatrices[room_name];
}
export function analyze_component(creep: Creep): type_creep_components {
    var bodynames = creep.body.map((e) => e.type);
    var n_work = mymath.where(bodynames.map((e) => e == WORK)).length;
    var n_move = mymath.where(bodynames.map((e) => e == MOVE)).length;
    var n_carry = mymath.where(bodynames.map((e) => e == CARRY)).length;
    var n_attack = mymath.where(bodynames.map((e) => e == ATTACK)).length;
    var n_rangedattack = mymath.where(bodynames.map((e) => e == RANGED_ATTACK)).length;
    var n_heal = mymath.where(bodynames.map((e) => e == HEAL)).length;
    return {
        n_work: n_work,
        n_move: n_move,
        n_carry: n_carry,
        n_attack: n_attack,
        n_rangedattack: n_rangedattack,
        n_heal: n_heal
    };
}

global.visualize_cost = function(room_name: string) {
    let cost = get_costmatrix_road(room_name);
    for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
            Game.rooms[room_name].visual.text(cost.get(x, y).toString(), x, y);
        }
    }
    return 0;
}

global.set_reaction_request = function(room_name: string, compound: MineralCompoundConstant): number {
    let room = Game.rooms[room_name];
    if (config.allowed_reactions[compound] == undefined) {
        return 1;
    } else {
        let reactants = config.allowed_reactions[compound];
        room.memory.reaction_request = {
            "reactant1": reactants[0],
            "reactant2": reactants[1],
            "product": compound
        };
        return 0;
    }
}

global.summarize_terminal = function(): type_resource_number {
    let result: type_resource_number = {}
    for (let room_name of config.controlled_rooms) {
        let terminal = Game.rooms[room_name].terminal
        if (terminal) {
            let keys = < Array < ResourceConstant >> Object.keys(terminal.store)
            for (let resource of keys) {
                if (result[resource] == undefined) {
                    result[resource] = 0
                }
                result[resource] += terminal.store.getUsedCapacity(resource);
            }
        }
    }
    return result
}

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
			scores = mymath.array_ele_divide(prices, costs.map((e) => 1+e)).map((e) => -e);
		} else {
			scores = mymath.array_ele_minus(costs.map((e) => e*energy_price), prices);
		}
    } else {
		scores = mymath.array_ele_plus(prices, costs.map((e) => e*energy_price));
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

