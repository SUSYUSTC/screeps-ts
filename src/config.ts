//screeps

import {
    conf_E16N58
} from "./config_E16N58"
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
    conf_E19N51
} from "./config_E19N51"
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
    config_gcl
} from "./config_gcl"
import * as _ from "lodash"
import * as constants from "./constants"

conf_E14N59.external_rooms.E15N59.active = true;
conf_E19N55.external_rooms.E19N56.active = true;
conf_E16N58.external_rooms.E17N58.active = true;
conf_E9N54.external_rooms.E9N55.active = true;
conf_E19N53.external_rooms.E19N54.active = true;

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
config_gcl.queue1_orient = direction2orient(config_gcl.queue1_direction);
config_gcl.queue2_orient = direction2orient(config_gcl.queue2_direction);
config_gcl.positive_orient = direction2orient(config_gcl.direction);
config_gcl.negative_orient = direction2orient([-config_gcl.direction[0], -config_gcl.direction[1]]);

type type_conf_rooms = {
    [key: string]: type_conf_room;
}
type type_hunting = {
    [key: string]: type_conf_hunting;
}
interface type_pc_conf {
    [key: string]: {
        room_name: string;
        normal_ordered: boolean;
        external_room ? : string;
    }
}
interface type_powered_harvester {
    [key: number]: {
        n_harvest: number;
        n_carry: number;
        n_move: number;
    }
}
export var conf_rooms: type_conf_rooms = {
    "E16N58": conf_E16N58,
    "E15N58": conf_E15N58,
    "E14N51": conf_E14N51,
    "E19N53": conf_E19N53,
    "E19N51": conf_E19N51,
    "E21N49": conf_E21N49,
    "E19N55": conf_E19N55,
    "E14N59": conf_E14N59,
    "E9N54": conf_E9N54,
}
interface type_conf_gcl {
    conf: type_config_gcl;
    conf_map: {
        energy_supply_rooms: string[];
        supporting_room: string;
        gcl_room: string;
        rooms_forwardpath: string[];
        poses_forwardpath: number[];
        rooms_backwardpath: string[];
        poses_backwardpath: number[];
        single_distance: number;
        carrier_distance: number;
    }
}
export var conf_gcl: type_conf_gcl = {
    conf: config_gcl,
    conf_map: {
        energy_supply_rooms: ['E15N58', 'E16N58', 'E14N59'],
        supporting_room: 'E16N58',
        gcl_room: 'E16N57',
        rooms_forwardpath: ['E16N58', 'E16N57'],
        poses_forwardpath: [28],
        rooms_backwardpath: ['E16N57', 'E16N58'],
        poses_backwardpath: [28],
        single_distance: 41,
        carrier_distance: 39,
    }
}
export var controlled_rooms: string[] = ["E16N58", "E15N58", "E14N51", "E19N53", "E19N51", "E21N49", "E19N55", "E14N59", "E9N54"];
global.controlled_rooms = controlled_rooms;
export var occupied_rooms: string[] = _.clone(controlled_rooms);
occupied_rooms.push(conf_gcl.conf_map.gcl_room);
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
export function distance_metric(room_name: string, pos1: RoomPosition, pos2: RoomPosition): number {
    return pos1.getRangeTo(pos2);
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
        "room_name": "E16N58",
        "normal_ordered": false,
        "external_room": "E17N58",
    },
    "PC_D": {
        "room_name": "E9N54",
        "normal_ordered": false,
        "external_room": "E9N55",
    },
    "PC_E": {
        "room_name": "E19N53",
        "normal_ordered": false,
        "external_room": "E19N54",
    },
}
export var double_powered_harvester = true;
export var hunting: type_hunting = {};
export var source_container_upper_limit: number = 1200;
export var source_container_lower_limit: number = 800;
export var link_transfer_to_main_gap: number = 800;
export var link_transfer_from_main_gap: number = 600;
export var main_link_amount_source: number = 800;
export var main_link_amount_sink: number = 0;
export var wall_strength: number = 5000;
export var maincarrier_ncarry_no_power: number = 8;
export var maincarrier_ncarry_powered: number = 16;
export var energy_bar_to_spawn_upgrader: number = 1.0e6;
//export var energy_bars_to_spawn_gcl_upgraders: number[] = [1.0e6, 1.1e6, 1.2e6, 1.3e6, 1.4e6, 1.5e6, 1.8e6, 2.0e6].map((e) => e * controlled_rooms.length);
export var energy_bars_to_spawn_gcl_upgraders: number[] = [];
export var upgrader_boost_compound: MineralBoostConstant = "GH2O";
export var builder_boost_compound: MineralBoostConstant = "LH2O";
export var defense_compounds_storage_room = 'E19N55';
export var external_resources_compounds_storage_room = 'E19N55';
export var allowed_passing_rooms = ['E17N58', 'E17N59', 'E15N59', 'E14N59'];
interface type_preclaiming_rooms {
    [key: string]: {
        [key: string]: type_external_half_map
    }
}
export var preclaiming_rooms: type_preclaiming_rooms = {
    'E16N58': {
        'E16N57': {
            "rooms_forwardpath": ['E16N58', 'E16N57'],
            "poses_forwardpath": [28],
        }
    },
    'E14N51': {
        'E11N47': {
            "rooms_forwardpath": ['E14N51', 'E14N50', 'E13N50', 'E12N50', 'E11N50', 'E10N50', 'E10N49', 'E10N48', 'E10N47', 'E11N47'],
            "poses_forwardpath": [5, 25, 25, 25, 40, 35, 35, 30, 15],
        }
    }
}
export var final_product_request: {[key in GeneralMineralConstant] ?: number} = {
    "UH2O": 36000,
    "GH2O": 80000,
    "GHO2": 10000,
	"UHO2": 40000,
    "LH2O": 20000,
    "LHO2": 20000,
    "KH": 30000,
    "ZO": 20000,
    "XUH2O": 30000,
    "XLH2O": 30000,
    "XLHO2": 30000,
    "XZH2O": 30000,
    "XZHO2": 30000,
    "XKHO2": 30000,
    "XKH2O": 30000,
    "XGHO2": 30000,
    "XGH2O": 30000,
};
export var react_init_amount: number = 1200;
let condition1 = (constants.amount_mapping[0] >= react_init_amount);
let condition2 = (constants.amount_mapping[1] >= react_init_amount);
let condition3 = (constants.amount_mapping[2] >= react_init_amount);
if (!(condition1 && condition2 && condition3)) {
    throw Error("react_init_amount too small");
}
export var react_min_amount: number = 50;
type type_acceptable_prices = {
    buy: {
        [key in MarketResourceConstant] ? : {
            price: number;
            interval: number;
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
            price: 1.6,
            interval: 1000,
        },
        "L": {
            price: 0.6,
            interval: 1000,
        },
        "Z": {
            price: 0.6,
            interval: 1000,
        },
        "K": {
            price: 0.6,
            interval: 1000,
        },
        "X": {
            price: 5.0,
            interval: 1000,
        },
        "H": {
            price: 0.8,
            interval: 1000,
        },
        "O": {
            price: 0.6,
            interval: 1000,
        },
        "energy": {
            price: 0.4,
            interval: 3000,
        },
        "battery": {
            price: 4.0,
            interval: 3000,
        },
		"ops": {
			price: 1.5,
			interval: 1000,
		}
    },
    "sell": {}
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
        price: 20,
        amount: 30000,
    },
    "XLH2O": {
        room: "E16N58",
        price: 20,
        amount: 30000,
    },
    "XLHO2": {
        room: "E9N54",
        price: 20,
        amount: 30000,
    },
    "XZH2O": {
        room: "E14N51",
        price: 25,
        amount: 30000,
    },
    "XZHO2": {
        room: "E14N59",
        price: 20,
        amount: 30000,
    },
    "XKH2O": {
        room: "E19N55",
        price: 20,
        amount: 30000,
    },
    "XKHO2": {
        room: "E21N49",
        price: 20,
        amount: 30000,
    },
    "XGHO2": {
        room: "E19N51",
        price: 30,
        amount: 30000,
    },
    "XGH2O": {
        room: "E19N53",
        price: 25,
        amount: 30000,
    },
}
type type_resource_gathering_pos = {
    [key in ResourceConstant] ? : string;
}
export var resources_balance: {[key in ResourceConstant] ?: type_resource_balance} = {
    "battery": {
        gap: 20000,
        amount: 2000,
    },
    "GH2O": {
        gap: 1200,
        min: 1200,
        amount: 600,
    },
    "LH2O": {
        gap: 600,
        min: 600,
        amount: 300,
    },
    "UH2O": {
        gap: 1200,
        min: 1200,
        amount: 600,
    },
    "LHO2": {
        gap: 600,
        min: 600,
        amount: 300,
    },
    "GHO2": {
        gap: 300,
        min: 300,
        amount: 150,
    },
    "UHO2": {
        gap: 1200,
        min: 1200,
        amount: 600,
    },
    "KH": {
        gap: 960,
        min: 960,
        amount: 480,
    },
    "ZO": {
        gap: 480,
        min: 480,
        amount: 240,
    },
}
export var resource_gathering_pos: type_resource_gathering_pos = {
    "XUH2O": "E15N58",
    "XUHO2": "E16N58",
    "XLH2O": "E16N58",
    "XLHO2": "E9N54",
    "XZH2O": "E14N51",
    "XZHO2": "E14N59",
    "XKH2O": "E19N55",
    "XKHO2": "E21N49",
    "XGHO2": "E19N51",
    "XGH2O": "E19N53",
}
export var protected_sources: {
    [key: string]: string[]
} = {
    "E16N58": ['S1', 'S2'],
    "E15N58": [],
    "E14N51": [],
    "E19N53": ['S1', 'S2'],
    "E19N51": ['S1'],
    "E21N49": [],
    "E19N55": ['S1'],
    "E14N59": ['S1', 'S2'],
    "E9N54": ['S2'],
}
export var highway_resources: {
    [key: string]: string[]
} = {
    "E19N51": ['E17N50', 'E18N50', 'E19N50', 'E20N50', 'E20N51'],
    "E19N55": ['E20N53', 'E20N54', 'E20N55', 'E20N56', 'E20N57', 'E20N58', 'E20N59', 'E20N60'],
    "E14N51": ['E10N48', 'E10N49', 'E10N50', 'E11N50', 'E12N50', 'E13N50', 'E14N50', 'E15N50', 'E16N50'],
    "E21N49": ['E20N47', 'E20N48', 'E20N49', 'E21N50', 'E22N50', 'E23N50', 'E24N50', 'E25N50', 'E26N50', 'E27N50'],
    "E14N59": ['E9N60', 'E10N60', 'E11N60', 'E12N60', 'E13N60', 'E14N60', 'E15N60', 'E16N60', 'E17N60', 'E18N60', 'E19N60'],
    "E9N54": ['E8N50', 'E9N50', 'E10N51', 'E10N52', 'E10N53', 'E10N54', 'E10N55', 'E10N56', 'E10N57', 'E10N58'],
}
export var storage_bars: number[] = [60000, 120000, 180000, 240000];
export var storage_gap: number = 60000;
export var storage_full: number = 300000;
let t3_compounds: GeneralMineralConstant[] = ['XGH2O', 'XGHO2', 'XUH2O', 'XUHO2', 'XLH2O', 'XLHO2', 'XZH2O', 'XZHO2', 'XKH2O', 'XKHO2'];
let t2_compounds: GeneralMineralConstant[] = ['GH2O', 'GHO2', 'UH2O', 'UHO2', 'LH2O', 'LHO2', 'ZH2O', 'ZHO2', 'KH2O', 'KHO2'];
export var mineral_storage_room: type_mineral_storage_room = {
    "E9N54": t3_compounds.concat(t2_compounds).concat(["U", "UH", "UO", "L", "LH", "LO", "UL", "G"]),
    "E15N58": t3_compounds.concat(t2_compounds).concat(["U", "UH", "UO", "L", "LH", "LO", "UL", "G"]),
    "E14N51": t3_compounds.concat(t2_compounds).concat(["Z", "ZH", "ZO", "K", "KH", "KO", "ZK", "G"]),
    "E21N49": t3_compounds.concat(t2_compounds).concat(["Z", "ZH", "ZO", "K", "KH", "KO", "ZK", "G"]),
    "E16N58": t3_compounds.concat(t2_compounds).concat(["H", "GH", "OH"]),
    "E19N55": t3_compounds.concat(t2_compounds).concat(["H", "GH", "OH"]),
    "E19N51": t3_compounds.concat(t2_compounds).concat(["O", "GO", "OH"]),
    "E14N59": t3_compounds.concat(t2_compounds).concat(["O", "GO", "OH"]),
    "E19N53": t3_compounds.concat(t2_compounds).concat(["X", "GO", "GH", "OH"]),
};
export var help_list: type_help_list = {
    /*
    "E14N51": {
        "E9N54": {
            "rooms_forwardpath": ['E14N51', 'E14N50', 'E13N50', 'E12N50', 'E11N50', 'E10N50', 'E10N51', 'E10N52', 'E10N53', 'E10N54', 'E9N54'],
            "poses_forwardpath": [5, 7, 45, 26, 10, 32, 9, 20, 14, 27],
            "commuting_distance": 392,
            "n_carrys": {
                "S1": 10,
                "S2": 6,
            }
        }
    }
	*/
};
export var username: string = 'SUSYUSTC';
export var sign: string = '黑暗森林';
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
    "attack": {
        number: 20,
        boost: "UH2O",
    },
    "move": {
        number: 25,
    }
}
export var pb_healer_body: type_body_conf = {
    "heal": {
        number: 13,
        boost: "LHO2",
    },
    "move": {
        number: 13,
    }
}
export var gcl_upgrader_body_boosted: type_body_conf = {
    "work": {
        number: 40,
        boost: "GH2O",
    },
    "carry": {
        number: 5,
        boost: "KH"
    },
    "move": {
        number: 5,
        boost: "ZO",
    },
}
export var gcl_upgrader_body_no_boosted: type_body_conf = {
    "work": {
        number: 32,
    },
    "carry": {
        number: 10,
    },
    "move": {
        number: 8,
    },
}
export var depo_last_cooldown = 20000;
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
export var creep_roles_combat: type_creep_role[] = ["defender", "invader_core_attacker", "hunter", "home_defender", "enemy"]
export var creep_roles_external: type_creep_role[] = ["externalharvester", "externalcarrier", "external_init", "externalbuilder", "reserver", "preclaimer", "help_harvester", "help_carrier", "help_builder", "newroom_claimer", "gcl_upgrader", "gcl_carrier"]
export var creep_roles_resources: type_creep_role[] = ["pb_attacker", "pb_healer", "pb_carrier", "depo_container_builder", "depo_energy_carrier", "depo_harvester", "depo_carrier"]
export var creep_roles_all = creep_roles_home.concat(creep_roles_external).concat(creep_roles_maincarrier).concat(creep_roles_resources).concat(creep_roles_combat);
