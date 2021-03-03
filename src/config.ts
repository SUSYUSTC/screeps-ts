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

function getside(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {
    return ((x - x1) * (y2 - y1) - (y - y1) * (x2 - x1) > 0)
}

type type_conf_rooms = {
    [key: string]: type_conf_room;
}
export var conf_rooms: type_conf_rooms = {
    "E16N58": conf_E16N58,
    "E15N58": conf_E15N58,
    "E14N51": conf_E14N51,
    "E19N53": conf_E19N53,
    "E19N51": conf_E19N51,
    "E21N49": conf_E21N49,
}
export var controlled_rooms: string[] = ['E16N58', 'E15N58', 'E14N51', 'E19N53', 'E19N51', 'E21N49'];
export function distance_metric(room_name: string, pos1: RoomPosition, pos2: RoomPosition): number {
    return pos1.getRangeTo(pos2);
}

type type_hunting = {
    [key: string]: type_conf_hunting;
}
export var hunting: type_hunting = {};
export var link_transfer_gap: number = 400;
export var main_link_amount_source: number = 600;
export var main_link_amount_sink: number = 400;
export var wall_strength: number = 5000;
export var maincarrier_ncarry: number = 6;
export var upgrader_boost_request: MineralBoostConstant = "GH2O";
type type_storage_bars = {
    [key: string]: number[];
}
export var storage_bars: type_storage_bars = {
    "E16N58": [100000],
    "E15N58": [100000],
    "E14N51": [100000],
    "E19N53": [100000],
    "E19N51": [100000],
    "E21N49": [100000],
}
type type_wall_rates = {
    [key: string]: number;
}
export var wall_rates: type_wall_rates = {
    "E14N51": 0,
    "E19N51": 0,
    "E19N53": 0,
    "E15N58": 0,
    "E16N58": 0,
    "E21N49": 0,
}
export var reaction_priority: type_reaction_priority = {
    "E16N58": {
        "GH": 1,
        "XGH2O": 0,
    },
    "E15N58": {
        "UL": 2,
        "G": 1,
        "XGH2O": 0,
    },
    "E14N51": {
        "ZK": 1,
        "XGH2O": 0,
    },
    "E19N53": {
        "GH2O": 1,
        "XGH2O": 0,
    },
    "E19N51": {
        "OH": 1,
        "XGH2O": 0,
    },
}
export var mineral_storage_room: type_mineral_storage_room = {
    "U": "E15N58",
    "L": "E15N58",
    "Z": "E14N51",
    "K": "E14N51",
    "O": "E19N51",
    "H": "E16N58",
    "X": "E19N53",
    "UL": "E15N58",
    "ZK": "E14N51",
    "G": "E15N58",
    "GH": "E16N58",
    "OH": "E19N51",
    "GH2O": "E19N53",
}
export var mineral_minimum_amount: type_mineral_minimum_amount = {
    "U": 1960,
    "L": 1960,
    "Z": 1960,
    "K": 1960,
    "O": 1960,
    "H": 1960,
    "X": 840,
    "UL": 1960,
    "ZK": 1960,
    "G": 1960,
    "GH": 1960,
    "OH": 840,
    "GH2O": 840,
    "XGH2O": 0,
}
export var help_list: type_help_list = {
    "E19N51": {
        "E21N49": {
            "rooms_forwardpath": ['E19N51', 'E19N50', 'E20N50', 'E20N49', 'E21N49'],
            "poses_forwardpath": [35, 14, 35, 15],
            "commuting_distance": 125,
            "n_carrys": {
                "S1": 6,
                "S2": 6,
            }
        }
    }
};
export var username: string = 'SUSYUSTC';
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

export var creep_roles_home = ["init", "harvester", "carrier", "builder", "upgrader", "transferer", "mineharvester", "specialcarrier", "wall_repairer"]
export var creep_roles_maincarrier = ["maincarrier"]
export var creep_roles_combat = ["defender", "invader_core_attacker", "hunter"]
export var creep_roles_external = ["externalharvester", "externalcarrier", "external_init", "reserver", "help_harvester", "help_carrier", "help_builder"]
