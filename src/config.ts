//screeps

import {
    conf_E15N58
} from "./config_E15N58"
import {
    conf_E14N51
} from "./config_E14N51"
import {
    conf_E19N53
} from "./config_E19N53"
import {
    conf_E21N49
} from "./config_E21N49"
import {
    conf_E19N55
} from "./config_E19N55"
import {
    conf_E14N59
} from "./config_E14N59"
import {
    conf_E9N54
} from "./config_E9N54"
import {
    conf_W9N39
} from "./config_W9N39"
import {
    conf_W9N1
} from "./config_W9N1"
import {
    conf_E11S39
} from "./config_E11S39"
import * as _ from "lodash"
import * as constants from "./constants"

conf_E14N59.external_rooms.E15N59.active = true;
conf_E19N55.external_rooms.E19N56.active = true;
//conf_E9N54.external_rooms.E9N55.active = true;
//conf_E19N53.external_rooms.E19N54.active = true;

/*
function direction2orient(pos: number[]) {
    if (pos[0] == 0 && pos[1] == 1) {
        return BOTTOM;
    }
    if (pos[0] == 0 && pos[1] == -1) {
        return TOP;
    }
    if (pos[0] == 1 && pos[1] == 0) {
        return RIGHT;
    }
    if (pos[0] == -1 && pos[1] == 0) {
        return LEFT;
    }
}
*/

var path_E29S21: type_shard_exit_point[] = [
	{ shard: 'shard3', roomName: 'E10S40', x: 12, y: 17 },
	{ shard: 'shard2', roomName: 'E10S40', x: 21, y: 45 },
	{ shard: 'shard1', roomName: 'E10S40', x: 9, y: 35 },
	{ shard: 'shard0', roomName: 'E20S69', x: 46, y: 48 },
	{ shard: 'shard0', roomName: 'E40S70', x: 18, y: 13 },
	{ shard: 'shard1', roomName: 'E20S40', x: 9, y: 21 },
	{ shard: 'shard0', roomName: 'E31S70', x: 1, y: 2 },
	{ shard: 'shard0', roomName: 'E31S50', x: 1, y: 5 },
	{ shard: 'shard0', roomName: 'E30S40', x: 26, y: 23 },
	{ shard: 'shard1', roomName: 'E20S20', x: 39, y: 9 },
	{ shard: 'shard0', roomName: 'E39S30', x: 48, y: 3 },
	{ shard: 'shard0', roomName: 'E40S19', x: 29, y: 48 },
	{ shard: 'shard0', roomName: 'E61S20', x: 1, y: 31 },
	{ shard: 'shard0', roomName: 'E60S30', x: 15, y: 43 },
	{ shard: 'shard1', roomName: 'E30S20', x: 20, y: 31 },
	{ shard: 'shard2', roomName: 'E30S20', x: 23, y: 5 } 
];

var path_W41S41: type_shard_exit_point[] = [
	 { shard: 'shard3', roomName: 'E10S40', x: 12, y: 17 },
     { shard: 'shard2', roomName: 'E10S40', x: 21, y: 45 },
     { shard: 'shard1', roomName: 'E10S40', x: 9, y: 35 },
     { shard: 'shard0', roomName: 'E20S69', x: 46, y: 48 },
     { shard: 'shard0', roomName: 'E40S71', x: 7, y: 1 },
     { shard: 'shard0', roomName: 'W10S70', x: 6, y: 23 },
     { shard: 'shard1', roomName: 'W10S40', x: 21, y: 41 },
     { shard: 'shard0', roomName: 'W20S79', x: 19, y: 48 },
     { shard: 'shard0', roomName: 'W30S80', x: 42, y: 18 },
     { shard: 'shard1', roomName: 'W20S40', x: 35, y: 35 },
     { shard: 'shard0', roomName: 'W40S71', x: 2, y: 1 },
     { shard: 'shard0', roomName: 'W70S70', x: 41, y: 14 },
     { shard: 'shard1', roomName: 'W40S40', x: 26, y: 6 },
     { shard: 'shard2', roomName: 'W40S40', x: 9, y: 40 } 
];
 
global.my_shard_paths = {
	"E29S21": path_E29S21,
	"W41S41": path_W41S41,
}

type type_conf_rooms = {
    [key: string]: type_conf_room;
}
interface type_pc_conf {
    [key: string]: {
        room_name: string;
        normal_ordered: boolean;
        external_room ? : string;
    }
}
export var conf_rooms: type_conf_rooms = {
    "E15N58": conf_E15N58,
    "E14N51": conf_E14N51,
    "E19N53": conf_E19N53,
    "E21N49": conf_E21N49,
    "E19N55": conf_E19N55,
    "E14N59": conf_E14N59,
    "E9N54": conf_E9N54,
    "W9N39": conf_W9N39,
    "W9N1": conf_W9N1,
    "E11S39": conf_E11S39,
}
export var controlled_rooms: string[] = ["E15N58", "E14N51", "E19N53", "E21N49", "E19N55", "E14N59", "E9N54", "W9N39", "W9N1", "E11S39"];
export var obselete_rooms: string[] = [];
global.controlled_rooms = controlled_rooms;
export var occupied_rooms: string[] = _.clone(controlled_rooms);
for (let room_name of controlled_rooms) {
    let conf_external = conf_rooms[room_name].external_rooms;
    for (let external_room_name in conf_external) {
        if (conf_external[external_room_name].active) {
            for (let added_room_name of conf_external[external_room_name].controller.rooms_forwardpath) {
                if (!occupied_rooms.includes(added_room_name)) {
                    occupied_rooms.push(added_room_name);
                }
            }
        }
    }
}

export var pc_conf: type_pc_conf = {
    "PC_A": {
        "room_name": "E14N59",
        "normal_ordered": true,
        "external_room": "E15N59",
    },
    "PC_B": {
        "room_name": "E19N55",
        "normal_ordered": true,
        "external_room": "E19N56",
    },
    "PC_C": {
        "room_name": "E11S39",
        "normal_ordered": false,
    },
    "PC_D": {
        "room_name": "E9N54",
        "normal_ordered": false,
    },
    "PC_E": {
        "room_name": "W9N1",
        "normal_ordered": false,
    },
    "PC_F": {
        "room_name": "E21N49",
        "normal_ordered": false,
    },
    "PC_G": {
        "room_name": "E14N51",
        "normal_ordered": false,
    },
    "PC_H": {
        "room_name": "W9N39",
        "normal_ordered": true,
    },
    "PC_I": {
        "room_name": "E19N53",
        "normal_ordered": true,
    },
}

export var obselete_rooms_resources: ResourceConstant[] = (<ResourceConstant[]>constants.t3_minerals).concat(['power', 'battery', 'ops']).concat(constants.t2_minerals).concat(constants.t1_minerals).concat(constants.basic_minerals).concat("energy");
export var double_powered_harvester = true;
export var source_container_upper_limit: number = 1200;
export var source_container_lower_limit: number = 800;
export var link_transfer_to_main_gap: number = 800;
export var link_transfer_from_main_gap: number = 600;
export var main_link_amount_source: number = 800;
export var main_link_amount_sink: number = 0;
export var min_wall_strength: number = 5000;
export var max_wall_strength = 2.0e7;
export var secondary_rampart_factor = 4.0;
export var maincarrier_ncarry_no_power: number = 16;
export var maincarrier_ncarry_powered: number = 16;
export var allowed_passing_rooms = ['E17N58', 'E17N59', 'E15N59', 'E14N59'];
export var newroom_energy_buying_price = {
    price: 0.8,
    interval: 200,
	always_increase: true,
}
export var pb_power_min = 3000;
export var tower_filling_energy = 600;

export var storage_gap = 50000;
export var storage_bars: number[] = [1, 2, 3].map((e) => e * storage_gap);
export var energy_bar_to_process_operated_power: number = 0.6e6;
export var energy_bar_of_market_supply: number = 0.8e6;
export var energy_bar_to_process_not_operated_power: number = 1.0e6;
export var energy_bar_to_spawn_upgrader: number = 1.2e6;
export var min_power_with_op = 3000;
export var min_power_without_op = 5000;
export var max_power = 10000;
export var storage_min_energy = 200000; // battery -> energy
export var storage_ok_energy = 300000; // process power
export var storage_good_energy = 400000; // process power
export var storage_max_energy = 500000; // energy -> battery
export var terminal_min_energy = 20000;
export var terminal_max_energy = 80000;
export var terminal_min_battery = 2000;
export var terminal_max_battery = 5000;
export var terminal_min_mineral = 3000;
export var terminal_max_mineral = 6000;
export var terminal_min_store_mineral = 20000;
export var terminal_max_store_mineral = 24000;
export var factory_min_energy = 5000;
export var factory_max_energy = 10000;
export var factory_min_battery = 2000;
export var factory_max_battery = 5000;
export var powerspawn_min_energy = 2000;
export var nuker_full_energy = 300000;
export var nuker_full_G = 5000;
export var powerspawn_full_power = 100;
export var react_serve_sleep_time = 10;
export var react_stop_amount = 20;
export var react_min_amount = 2800;
export var react_max_amount = 3000;
export var mineral_store_additional_amount = 20000;
export var ops_store_amount = 15000;
export var ops_buy_onetime_amount = 5000;
export var mineral_buy_onetime_amount = 10000;
export var energy_buy_onetime_amount = 60000;
export var battery_buy_onetime_amount = 15000;
export var bar_store_amount = 6000;
export var bar_buy_onetime_amount = 3000;
export var buy_power_room = "E19N53";
export var power_store_amount = 20000;
export var power_buy_onetime_amount = 3000;
export var onetime_min_commodity_amount_to_transfer: number[] = [100, 20];
export var onetime_max_commodity_amount_to_transfer: number[] = [200, 100];
export var min_commodity_amount_to_keep_in_factory_by_level: number[] = [50];
export var max_commodity_amount_to_keep_in_factory_by_level: number[] = [500];
export var commodity_amount_to_start_selling_by_level: number[] = [2000, 0];
export var commodity_amount_to_stop_production_by_level: number[] = [Infinity, 1200];
export var deposit_sending_amount: number = 5000;
export var bar_sending_amount: number = 500;
export var commodity_sending_amount: number[] = [2000, 50];
export var max_commodity_level = 1;
export var credit_line = 2.5e7;

interface type_preclaiming_rooms {
    [key: string]: {
        [key: string]: type_external_shard_map
    }
}
export var preclaiming_rooms: type_preclaiming_rooms = {
	/*
	"E11S39": {
		"E29S21": {
			shard_path: path_E29S21.concat([{ shard: 'shard3', roomName: 'E29S21', x: 15, y: 2 }]),
		}
	}
	*/
}
export var help_list: type_help_list = {
	/*
    "W9N1": {
        "E11S39": {
            shard_path: path_E11S39,
            commuting_distance: 550,
            commuting_time: 800,
			mine_source: false,
            n_energy_carriers: 1,
            guard: 5,
        }
    }
	*/
};
export var protected_sources: {
    [key: string]: string[]
} = {
    "E15N58": [],
    "E14N51": [],
    "E19N53": ['S1', 'S2'],
    "E21N49": [],
    "E19N55": ['S1'],
    "E14N59": ['S1', 'S2'],
    "E9N54": ['S2'],
	"W9N1": ["S1"],
	"W9N39": ["S1"],
	"E11S39": ["S1"],

}
export var highway_resources: {
    [key: string]: string[]
} = {
    "E19N55": ['E20N51', 'E20N52', 'E20N53', 'E20N54', 'E20N55', 'E20N56', 'E20N57', 'E20N58', 'E20N59', 'E20N60'],
    "E14N51": ['E10N48', 'E10N49', 'E10N50', 'E11N50', 'E12N50', 'E13N50', 'E14N50', 'E15N50', 'E16N50', 'E17N50'],
    "E21N49": ['E20N47', 'E20N48', 'E20N49', 'E18N50', 'E19N50', 'E20N50', 'E21N50', 'E22N50', 'E23N50', 'E24N50', 'E25N50', 'E26N50', 'E27N50'],
    "E14N59": ['E9N60', 'E10N60', 'E11N60', 'E12N60', 'E13N60', 'E14N60', 'E15N60', 'E16N60', 'E17N60', 'E18N60', 'E19N60'],
    "E9N54": ['E8N50', 'E9N50', 'E10N51', 'E10N52', 'E10N53', 'E10N54', 'E10N55', 'E10N56', 'E10N57', 'E10N58'],
	"W9N39": ['W14N40', 'W13N40', 'W12N40', 'W11N40', 'W10N40', 'W9N40', 'W8N40', 'W7N40', 'W6N40', 'W5N40', 'W10N33', 'W10N34', 'W10N35', 'W10N36', 'W10N37', 'W10N38', 'W10N39', 'W10N41', 'W10N42', 'W10N43', 'W10N44'],
	"W9N1": ['W10N6', 'W10N5', 'W10N4', 'W10N3', 'W10N2', 'W10N1', 'W10N0', 'W10S0', 'W10S1', 'W10S2', 'W10S3', 'W10S4', 'W7N0', 'W7S0', 'W8N0', 'W8S0', 'W9N0', 'W9S0', 'W11N0', 'W11S0', 'W12N0', 'W12S0', 'W13N0', 'W13S0', 'W14N0', 'W14S0', 'W15N0', 'W15S0'],
	"E11S39": ['E10S40', 'E10S39', 'E10S38', 'E10S37', 'E10S36', 'E10S35', 'E10S34', 'E11S40', 'E12S40', 'E13S40', 'E14S40', 'E15S40', 'E16S40', 'E9S40', 'E8S40', 'E7S40', 'E6S40', 'E5S40', 'E10S41', 'E10S42', 'E10S43'],
}
for (let room_name in highway_resources) {
	highway_resources[room_name] = highway_resources[room_name].sort((a, b) => Game.map.getRoomLinearDistance(room_name, a) - Game.map.getRoomLinearDistance(room_name, b));
}
export var commodity_room_conf: {[key: string]: type_zone[]} = {
	"W9N39": ["U"],
	"W9N1": ["U", "Z"],
	"E11S39": ["L"],
	"E21N49": ["L"],
}
export var all_zones = Array.from(new Set((<type_zone[][]> Object.values(commodity_room_conf)).reduce((a, b) => a.concat(b), [])));
export var commodity_selling_rooms: string[] = Object.keys(commodity_room_conf);
export var depo_stop_min_cd = 150;
export var depo_start_max_cd = 60;
export var depo_cd_to_boost = 15;
export var username: string = 'SUSYUSTC';
export var sign: string = '黑暗森林';

// Start of reaction, terminal and market session
export var t3_store_room: {
    [key in GeneralMineralConstant] ? : string
} = {
    "XUH2O": "E15N58",
	"XUHO2": "W9N1",
    "XLH2O": "E11S39",
    "XLHO2": "E9N54",
    "XZH2O": "E14N51",
    "XZHO2": "E14N59",
    "XKH2O": "W9N39",
    "XKHO2": "E21N49",
    "XGH2O": "E19N53",
    "XGHO2": "E19N55",
}
export var t3_room_store: {[key: string]: GeneralMineralConstant} = {};
for (let resource of <Array<GeneralMineralConstant>> Object.keys(t3_store_room)) {
	let room_name = t3_store_room[resource];
	t3_room_store[room_name] = resource;
}
type type_acceptable_prices = {
    buy: {
        [key in MarketResourceConstant] ? : {
            price: number;
			lowest_price ?: number;
            interval: number;
			always_increase : boolean;
        }
    },
    sell: {
        [key in MarketResourceConstant] ? : {
            price: number;
            interval: number;
        }
    },
}
export var acceptable_prices: type_acceptable_prices = {
    "buy": {
        "U": {
            price: 1.2,
            interval: 1000,
			always_increase: true,
        },
        "L": {
            price: 0.6,
            interval: 1000,
			always_increase: true,
        },
        "Z": {
            price: 0.6,
            interval: 1000,
			always_increase: true,
        },
        "K": {
            price: 0.6,
            interval: 1000,
			always_increase: true,
        },
        "X": {
            price: 1.0,
            interval: 1000,
			always_increase: true,
        },
        "H": {
            price: 1.0,
            interval: 1000,
			always_increase: true,
        },
        "O": {
            price: 0.6,
            interval: 1000,
			always_increase: true,
        },
        "energy": {
            price: 0.735,
			lowest_price: 0.4,
            interval: 1000,
			always_increase: true,
        },
        "battery": {
            price: 6.0,
			lowest_price: 4.0,
            interval: 1000,
			always_increase: true,
        },
        "power": {
            price: 25,
            interval: 3000,
			always_increase: true,
        },
        "ops": {
            price: 8.0,
            interval: 2000,
			always_increase: true,
        },
		'utrium_bar': {
			price: 5.0,
			lowest_price: 3.0,
			interval: 500,
			always_increase: true,
		},
		'lemergium_bar': {
			price: 3.0,
			lowest_price: 1.5,
			interval: 500,
			always_increase: true,
		},
		'zynthium_bar': {
			price: 3.0,
			lowest_price: 1.5,
			interval: 500,
			always_increase: true,
		},
		'keanium_bar': {
			price: 3.0,
			lowest_price: 1.5,
			always_increase: true,
			interval: 500,
		},
		'oxidant': {
			price: 5.0,
			lowest_price: 3.0,
			always_increase: true,
			interval: 500,
		},
		'reductant': {
			price: 5.0,
			lowest_price: 3.0,
			always_increase: true,
			interval: 500,
		},
    },
    "sell": {
        "wire": {
            price: 500,
			interval: -1,
        },
		"switch": {
			price: 5200,
			interval: -1,
		},
        "alloy": {
            price: 750,
			interval: -1,
        },
		"tube": {
			price: 16000,
			interval: -1,
		},
        "cell": {
            price: 600,
			interval: -1,
        },
		"phlegm": {
			price: 8600,
			interval: -1,
		}
	}
}
type type_auto_sell_list = {
    [key in MarketResourceConstant] ? : {
        room: string;
        price: number;
        amount: number;
    }
}
export var auto_sell_list: type_auto_sell_list = {
    "XUH2O": {
        room: "E15N58",
        price: 18,
        amount: 30000,
    },
    "XUHO2": {
        room: "W9N1",
        price: 17,
        amount: 30000,
    },
    "XLH2O": {
        room: "E11S39",
        price: 16,
        amount: 30000,
    },
    "XLHO2": {
        room: "E9N54",
        price: 15,
        amount: 30000,
    },
    "XZH2O": {
        room: "E14N51",
        price: 20,
        amount: 30000,
    },
    "XZHO2": {
        room: "E14N59",
        price: 15,
        amount: 30000,
    },
    "XKH2O": {
        room: "W9N39",
        price: 16,
        amount: 30000,
    },
    "XKHO2": {
        room: "E21N49",
        price: 15,
        amount: 30000,
    },
    "XGH2O": {
        room: "E19N53",
        price: 22,
        amount: 30000,
    },
    "XGHO2": {
        room: "E19N55",
        price: 25,
        amount: 30000,
    },
}
for (let key of < Array < GeneralMineralConstant >> Object.keys(t3_store_room)) {
    if (t3_store_room[key] !== auto_sell_list[key].room) {
        throw Error("t3 room does not match for " + key);
    }
}
export var resources_balance: {
    [key in ResourceConstant] ? : type_resource_balance
} = {
    "battery": {
        gap: 20000,
        amount: 2000,
    },
    "ops": {
        gap: 2000,
        min: 3000,
        amount: 1000,
    },
}
{
	for (let zone of constants.zones) {
		let deposit_processing_rooms = Object.keys(commodity_room_conf).filter((e) => commodity_room_conf[e].includes(zone));
		let production = constants.commodities_related_requirements[zone];
		resources_balance[production.depo] = {
			gap: deposit_sending_amount * 2,
			amount: deposit_sending_amount,
			rooms: deposit_processing_rooms,
		}
		resources_balance[production.bars[0]] = {
			gap: bar_sending_amount * 2,
			amount: bar_sending_amount,
			rooms: deposit_processing_rooms,
		}
		for (let i=0;i<=max_commodity_level;i++) {
			resources_balance[production.products[i]] = {
				gap: commodity_sending_amount[i],
				amount: commodity_sending_amount[i],
				rooms: commodity_selling_rooms,
				min: commodity_sending_amount[i],
			}
		}
	}
	resources_balance['oxidant'] = {
		gap: bar_sending_amount * 2,
		amount: bar_sending_amount,
		rooms: commodity_selling_rooms,
		min: bar_sending_amount,
	}
}
type type_final_product_requrest = {
    [key in GeneralMineralConstant] ? : {
        min_amount: number;
        expect_amount: number;
        store_room ? : string;
        store_good_amount ? : number;
        store_expect_amount ? : number;
    }
}
export var final_product_request: type_final_product_requrest = {
    "UH2O": {
        min_amount: 1200,
        expect_amount: 4000,
    },
    "GH2O": {
        min_amount: 1200,
        expect_amount: 6000,
    },
    "GHO2": {
        min_amount: 600,
        expect_amount: 2000,
    },
    "UHO2": {
        min_amount: 1200,
        expect_amount: 4000,
    },
    "LH2O": {
        min_amount: 1200,
        expect_amount: 4000,
    },
    "LHO2": {
        min_amount: 1200,
        expect_amount: 4000,
    },
    "KH": {
        min_amount: 1200,
        expect_amount: 4000,
    },
    "ZO": {
        min_amount: 1200,
        expect_amount: 4000,
    },
    "XUH2O": {
        min_amount: 1200,
        expect_amount: 2400,
        store_room: "E15N58",
        store_good_amount: 1800,
        store_expect_amount: 30000,
    },
    "XUHO2": {
        min_amount: 1200,
        expect_amount: 2400,
        store_room: "W9N1",
        store_good_amount: 1800,
        store_expect_amount: 30000,
    },
    "XLH2O": {
        min_amount: 0,
        expect_amount: 1200,
        store_room: "E11S39",
        store_good_amount: 600,
        store_expect_amount: 30000,
    },
    "XLHO2": {
        min_amount: 1200,
        expect_amount: 2400,
        store_room: "E9N54",
        store_good_amount: 1800,
        store_expect_amount: 30000,
    },
    "XZH2O": {
        min_amount: 1200,
        expect_amount: 2400,
        store_room: "E14N51",
        store_good_amount: 1800,
        store_expect_amount: 30000,
    },
    "XZHO2": {
        min_amount: 1200,
        expect_amount: 2400,
        store_room: "E14N59",
        store_good_amount: 1800,
        store_expect_amount: 30000,
    },
    "XKH2O": {
        min_amount: 0,
        expect_amount: 1200,
        store_room: "W9N39",
        store_good_amount: 600,
        store_expect_amount: 30000,
    },
    "XKHO2": {
        min_amount: 1200,
        expect_amount: 2400,
        store_room: "E21N49",
        store_good_amount: 1800,
        store_expect_amount: 30000,
    },
    "XGH2O": {
        min_amount: 0,
        expect_amount: 1200,
        store_room: "E19N53",
        store_good_amount: 600,
        store_expect_amount: 30000,
    },
    "XGHO2": {
        min_amount: 1200,
        expect_amount: 2400,
        store_room: "E19N55",
        store_good_amount: 1800,
        store_expect_amount: 30000,
    },
};
for (let key of < Array < GeneralMineralConstant >> Object.keys(t3_store_room)) {
    if (t3_store_room[key] !== final_product_request[key].store_room) {
        throw Error("t3 room does not match for " + key);
    }
}
type type_mineral_store_amount = {
    [key in GeneralMineralConstant] ? : {
        min_amount: number;
        expect_amount: number;
        store_max_amount: number;
    }
}
export var mineral_store_amount: type_mineral_store_amount = {
    "U": {
        min_amount: 10000,
        expect_amount: 30000,
        store_max_amount: 100000,
    },
    "L": {
        min_amount: 10000,
        expect_amount: 30000,
        store_max_amount: 100000,
    },
    "Z": {
        min_amount: 10000,
        expect_amount: 30000,
        store_max_amount: 100000,
    },
    "K": {
        min_amount: 10000,
        expect_amount: 30000,
        store_max_amount: 100000,
    },
    "X": {
        min_amount: 10000,
        expect_amount: 30000,
        store_max_amount: 100000,
    },
    "O": {
        min_amount: 15000,
        expect_amount: 45000,
        store_max_amount: 120000,
    },
    "H": {
        min_amount: 15000,
        expect_amount: 45000,
        store_max_amount: 120000,
    },
}

// Body type session
export var defender_responsible_types: type_defender_responsible_types = {
    'small_close': {
        "list": ['small_close'],
        "body": {
            "tough": 3,
            "move": 6,
            "attack": 3,
        },
        "cost": -1
    },
    'big_close': {
        "list": ['small_close', 'big_close'],
        "body": {
            "tough": 4,
            "move": 9,
            "attack": 5,
        },
        "cost": -1
    },
    'small_far': {
        "list": ['small_far'],
        "body": {
            "tough": 2,
            "move": 6,
            "ranged_attack": 4,
        },
        "cost": -1
    },
    'big_far': {
        "list": ['small_far', 'big_far', 'small_close', 'big_close'],
        "body": {
            "tough": 10,
            "move": 10,
            "attack": 6,
            "ranged_attack": 4,
        },
        "cost": -1
    },
    'two_far': {
        "list": ['small_far', 'two_far', 'small_close', 'big_close'],
        "body": {
            "tough": 15,
            "move": 11,
            "ranged_attack": 7,
        },
        "cost": -1
    },
};
export var pb_attacker_body: type_body_conf = {
    "tough": {
        number: 5,
        boost: "GHO2",
    },
    "move": {
        number: 25,
    },
    "attack": {
        number: 20,
        boost: "UH2O",
    },
}
export var pb_healer_body: type_body_conf = {
    "move": {
        number: 13,
    },
    "heal": {
        number: 13,
        boost: "LHO2",
    },
}
export var depo_container_builder_body: type_body_conf = {
    "work": {
        number: 8,
        boost: "LH2O",
    },
    "carry": {
        number: 24,
    },
    "move": {
        number: 16,
    },
}
export var depo_energy_carrier_body: type_body_conf = {
    "carry": {
        number: 32,
    },
    "move": {
        number: 16,
    },
}
export var depo_harvester_body: type_body_conf = {
    "work": {
        number: 20,
    },
	"attack": {
		number: 2,
	},
	"heal": {
		number: 2,
	},
	"carry": {
		number: 2,
	},
    "move": {
        number: 24,
    },
}
export var powered_depo_harvester_body: type_body_conf = {
    "work": {
        number: 30,
		boost: "UHO2",
    },
	"attack": {
		number: 1,
		boost: "UH2O",
	},
	"heal": {
		number: 1,
		boost: "LHO2",
	},
	"carry": {
		number: 2,
	},
    "move": {
        number: 16,
		boost: "ZO",
    },
}
export var depo_carrier_body: type_body_conf = {
    "carry": {
        number: 32,
    },
    "move": {
        number: 16,
    },
}
interface type_powered_harvester {
    [key: number]: {
        n_harvest: number;
        n_carry: number;
        n_move: number;
    }
}
export var powered_harvester: type_powered_harvester = {
    1: {
        n_harvest: 7,
        n_carry: 3,
        n_move: 2,
    },
    2: {
        n_harvest: 9,
        n_carry: 3,
        n_move: 3,
    },
    3: {
        n_harvest: 10,
        n_carry: 4,
        n_move: 3,
    },
    4: {
        n_harvest: 12,
        n_carry: 5,
        n_move: 3,
    },
    5: {
        n_harvest: 14,
        n_carry: 6,
        n_move: 4,
    },
}
export var powered_external_harvester: type_powered_harvester = {
    1: {
        n_harvest: 7,
        n_carry: 3,
        n_move: 5,
    },
    2: {
        n_harvest: 9,
        n_carry: 3,
        n_move: 6,
    },
    3: {
        n_harvest: 11,
        n_carry: 3,
        n_move: 7,
    },
    4: {
        n_harvest: 12,
        n_carry: 4,
        n_move: 8,
    },
    5: {
        n_harvest: 14,
        n_carry: 4,
        n_move: 9,
    },
}

export var doubled_powered_external_harvester: type_powered_harvester = {
    1: {
        n_harvest: 14,
        n_carry: 4,
        n_move: 9,
    },
    2: {
        n_harvest: 18,
        n_carry: 4,
        n_move: 11,
    },
    3: {
        n_harvest: 22,
        n_carry: 4,
        n_move: 13,
    },
    4: {
        n_harvest: 24,
        n_carry: 4,
        n_move: 14,
    },
    5: {
        n_harvest: 28,
        n_carry: 4,
        n_move: 16,
    },
}

export var creep_roles_home: type_creep_role[] = ["init", "harvester", "carrier", "builder", "upgrader", "transferer", "mineharvester", "minecarrier", "wall_repairer"]
export var creep_roles_maincarrier: type_creep_role[] = ["maincarrier"]
export var creep_roles_combat: type_creep_role[] = ["defender", "invader_core_attacker", "home_defender", "enemy"]
export var creep_roles_external: type_creep_role[] = ["externalharvester", "externalcarrier", "external_init", "externalbuilder", "reserver", "preclaimer", "help_harvester", "help_carrier", "help_builder", "energy_carrier", "guard"]
export var creep_roles_resources: type_creep_role[] = ["pb_attacker", "pb_healer", "pb_carrier", "depo_container_builder", "depo_energy_carrier", "depo_harvester", "depo_carrier"]
export var creep_roles_all = creep_roles_home.concat(creep_roles_external).concat(creep_roles_maincarrier).concat(creep_roles_resources).concat(creep_roles_combat);
