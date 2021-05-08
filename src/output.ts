import * as mymath from "./mymath"
import * as config from "./config"
interface type_log_market {
	resourceType: MarketResourceConstant;
	amount: number;
	price: number;
	room_name: string;
}
interface type_level {
	level: number;
	progress: number;
	progressTotal: number;
}
type type_store_log = {
	[key in ResourceConstant] ?: number;
}
interface type_wall_strength_log {
	min_strength: number;
	number: number;
	expected_number: number;
}
interface type_mine_log {
	type: MineralConstant;
	amount: number;
	density: number;
	regeneration_time: number;
}
interface type_pb_log {
	status: number;
	time_last: number;
	amount: number;
}
interface type_room_log {
	RCL: type_level;
	room_energy: number;
	room_total_energy: number;
	storage: type_store_log;
	terminal: type_store_log;
	nuker: type_store_log;
	factory: type_store_log;
	powerSpawn: type_store_log;
	wall: type_wall_strength_log;
	main_rampart: type_wall_strength_log;
	secondary_rampart: type_wall_strength_log;
	mine: type_mine_log;
	reaction: GeneralMineralConstant;
	boosting: MineralBoostConstant;
	construction_sites_progressleft: number;
	objects_to_buy: {
		[key: string]: type_object_to_trade;
	};
	objects_to_sell: {
		[key: string]: type_object_to_trade;
	};
	pb_status: {
		[key: string]: type_pb_log;
	}
	statistics: {
		[key in type_creep_role] ?: number;
	}
}
interface type_log {
	time: number;
	GCL : type_level;
	GPL: type_level;
	credits: number;
	pixel: number;
	bucket: number;
	Averaged_CPU: number;
	market: {
		sell: {
			[key: string]: type_log_market
		};
		buy: {
			[key: string]: type_log_market
		};
	};
	rooms: {
		[key: string]: type_room_log;
	};
}
export function log() {
	if (!Memory.output_mode) {
		return 0;
	}
	let log: type_log = {
		time: null,
		GCL: null,
		GPL: null,
		credits: null,
		pixel: null,
		bucket: null,
		Averaged_CPU: null,
		market: {
			sell: {},
			buy: {},
		},
		rooms: {},
	}
	log.time = Game.time;
	log.GCL = {
		"level": Game.gcl.level,
		"progress": Game.gcl.progress,
		"progressTotal": Game.gcl.progressTotal,
	}
	log.GPL = {
		"level": Game.gpl.level,
		"progress": Game.gpl.progress,
		"progressTotal": Game.gpl.progressTotal,
	}
	log.pixel = Game.resources.pixel;
	log.credits = Game.market.credits;
	log.Averaged_CPU = mymath.array_mean(Memory.history_cpus);
	log.bucket = Game.cpu.bucket;
	for (let order_type of ['sell', 'buy']) {
		for (let id in Game.market.orders) {
			let order = Game.market.orders[id];
			if (order.type == order_type) {
				let log_market: type_log_market = {
					"resourceType": order.resourceType,
					"amount": order.amount,
					"price": order.price,
					"room_name": order.roomName,
				}
				log.market[<keyof (typeof log.market)>order_type][id] = log_market;
			}
		}
	}
	for (let room_name of config.controlled_rooms) {
		let room_log: type_room_log = {
			RCL: null,
			room_energy: null,
			room_total_energy: null,
			storage: null,
			terminal: null,
			nuker: null,
			factory: null,
			powerSpawn: null,
			wall: null,
			main_rampart: null,
			secondary_rampart: null,
			objects_to_buy: {},
			objects_to_sell: {},
			mine: null,
			reaction: null,
			boosting: null,
			construction_sites_progressleft: null,
			pb_status: {},
			statistics: {},
		};
		let room = Game.rooms[room_name];
		let game_memory = Game.memory[room_name];
		let conf = config.conf_rooms[room_name];
		if (room.controller.level == 8) {
			room_log.RCL = {
				"level": room.controller.level,
				"progress": null,
				"progressTotal": null,
			}
		}
		else {
			room_log.RCL = {
				"level": room.controller.level,
				"progress": room.controller.progress,
				"progressTotal": room.controller.progressTotal,
			}
		}
		room_log.room_energy = room.energyAvailable;
		room_log.room_total_energy = room.energyCapacityAvailable;
		room_log.wall = {
			"min_strength": room.memory.min_wall_strength,
			"number": room.memory.n_walls,
			"expected_number": conf.walls.length,
		};
		room_log.main_rampart = {
			"min_strength": room.memory.min_main_rampart_strength,
			"number": room.memory.n_main_ramparts,
			"expected_number": conf.main_ramparts.length,
		};
		room_log.secondary_rampart = {
			"min_strength": room.memory.min_secondary_rampart_strength,
			"number": room.memory.n_secondary_ramparts,
			"expected_number": conf.secondary_ramparts.length,
		};
		let log_special = '';
		if (global.memory[room_name].unique_structures_status.factory.finished) {
			room_log.factory = Game.getObjectById(global.memory[room_name].unique_structures_status.factory.id).store;
		}
		if (global.memory[room_name].unique_structures_status.nuker.finished) {
			room_log.nuker = Game.getObjectById(global.memory[room_name].unique_structures_status.nuker.id).store;
		}
		if (global.memory[room_name].unique_structures_status.powerSpawn.finished) {
			room_log.powerSpawn = Game.getObjectById(global.memory[room_name].unique_structures_status.powerSpawn.id).store;
		}
		if (room.storage !== undefined) {
			room_log.storage = room.storage.store;
		}
		if (room.terminal !== undefined) {
			room_log.terminal = room.terminal.store;
		}
		if (room.memory.objects_to_buy !== undefined && Object.keys(room.memory.objects_to_buy).length > 0) {
			room_log.objects_to_buy = room.memory.objects_to_buy;
		}
		if (room.memory.objects_to_sell !== undefined && Object.keys(room.memory.objects_to_sell).length > 0) {
			room_log.objects_to_sell = room.memory.objects_to_sell;
		}
		let mine = Game.getObjectById(conf.mine);
		let amount_total;
		room_log.mine = {
			"type": mine.mineralType,
			"amount": mine.mineralAmount,
			"density": MINERAL_DENSITY[mine.density],
			"regeneration_time": mine.ticksToRegeneration,
		}
		if (room.memory.reaction_request !== undefined) {
			room_log.reaction = room.memory.reaction_request.product;
		}
		if (room.memory.current_boost_request !== undefined) {
			room_log.boosting = room.memory.current_boost_request.compound;
		}
		if (room.memory.sites_total_progressleft) {
			room_log.construction_sites_progressleft = room.memory.sites_total_progressleft;
		}
		for (let external_room_name in room.memory.external_resources.pb) {
			room_log.pb_status[external_room_name] = {
				"status": room.memory.external_resources.pb[external_room_name].status,
				"time_last": room.memory.external_resources.pb[external_room_name].time_last,
				"amount": room.memory.external_resources.pb[external_room_name].amount,
			}
		}
		room_log.statistics = room.memory.creep_statistics;
		log.rooms[room_name] = room_log;
	}
	console.log("Stringified log");
	console.log(JSON.stringify(log));
}
