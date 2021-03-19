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

function getside(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {
    return ((x - x1) * (y2 - y1) - (y - y1) * (x2 - x1) > 0)
}

//conf_E21N49.external_rooms.E22N49.active = true;
conf_E19N55.external_rooms.E19N56.active = true;
conf_E19N53.external_rooms.E19N54.active = true;

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
    "E19N55": conf_E19N55,
}
export var controlled_rooms: string[] = ['E16N58', 'E15N58', 'E14N51', 'E19N53', 'E19N51', 'E21N49', 'E19N55'];
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
export var defense_compounds_storage_room = 'E19N51';
export var boost_rcl8: {[key: string]: boolean} = {
    "E16N58": false,
    "E15N58": false,
    "E14N51": false,
    "E19N53": false,
    "E19N51": false,
    "E21N49": false,
    "E19N55": false,
}
export var fill_nuker: {[key: string]: boolean} = {
    "E16N58": true,
    "E15N58": true,
    "E14N51": true,
    "E19N53": true,
    "E19N51": true,
    "E21N49": true,
    "E19N55": false,
}
export var highway_resources: {[key: string]: string[]} = {
	"E19N51": ['E19N50', 'E18N50', 'E17N50', 'E20N50']
}
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
    "E19N55": [100000, 20000, 300000],
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
    "E19N55": 0,
}
export var reaction_products: MineralCompoundConstant[] = ['XGH2O', 'LH2O', 'UH2O', 'LO', 'ZO', 'GHO2'];
export var reaction_priority: type_reaction_priority = {};
let t3_compounds: GeneralMineralConstant[] = ['XGH2O', 'XGHO2', 'XUH2O', 'XUHO2', 'XLH2O', 'XLHO2', 'XZH2O', 'XZHO2', 'XKH2O', 'XKHO2'];
let t2_compounds: GeneralMineralConstant[] = ['GH2O', 'GHO2', 'UH2O', 'UHO2', 'LH2O', 'LHO2', 'ZH2O', 'ZHO2', 'KH2O', 'KHO2'];
export var mineral_storage_room: type_mineral_storage_room = {
    "E15N58": t3_compounds.concat(t2_compounds).concat(["U", "UH", "UO", "L", "LH", "LO", "UL", "G"]),
    "E14N51": t3_compounds.concat(t2_compounds).concat(["Z", "ZH", "ZO", "ZK", "G"]),
    "E21N49": t3_compounds.concat(t2_compounds).concat(["K", "KH", "KO", "ZK", "G"]),
    "E16N58": t3_compounds.concat(t2_compounds).concat(["H", "GH", "OH"]),
    "E19N51": t3_compounds.concat(t2_compounds).concat(["O", "GO", "OH"]),
    "E19N53": t3_compounds.concat(t2_compounds).concat(["X", "GO", "GH", "OH"]),
    "E19N55": ['H'],
};

export var allowed_reactions: type_allowed_reactions = {
    "ZK": ["Z", "K"],
    "UL": ["U", "L"],
    "OH": ["O", "H"],
    "G": ["ZK", "UL"],
    "GH": ["G", "H"],
    "GO": ["G", "O"],
    "UH": ["U", "H"],
    "UO": ["U", "O"],
    "LH": ["L", "H"],
    "LO": ["L", "O"],
    "ZH": ["Z", "H"],
    "ZO": ["Z", "O"],
    "KH": ["K", "H"],
    "KO": ["K", "O"],
    "GH2O": ["GH", "OH"],
    "GHO2": ["GO", "OH"],
    "UH2O": ["UH", "OH"],
    "UHO2": ["UO", "OH"],
    "LH2O": ["LH", "OH"],
    "LHO2": ["LO", "OH"],
    "ZH2O": ["ZH", "OH"],
    "ZHO2": ["ZO", "OH"],
    "KH2O": ["KH", "OH"],
    "KHO2": ["KO", "OH"],
    "XGH2O": ["X", "GH2O"],
    "XGHO2": ["X", "GHO2"],
    "XUH2O": ["X", "UH2O"],
    "XUHO2": ["X", "UHO2"],
    "XLH2O": ["X", "LH2O"],
    "XLHO2": ["X", "LHO2"],
    "XZH2O": ["X", "ZH2O"],
    "XZHO2": ["X", "ZHO2"],
    "XKH2O": ["X", "KH2O"],
    "XKHO2": ["X", "KHO2"],
}
export var mineral_level: type_mineral_level = {
    "U": 0,
    "L": 0,
    "Z": 0,
    "K": 0,
    "O": 0,
    "H": 0,
    "X": 1,
    "UL": 0,
    "ZK": 0,
    "OH": 1,
    "G": 0,
    "GH": 0,
    "GO": 0,
    "UH": 0,
    "UO": 0,
    "LH": 0,
    "LO": 0,
    "ZH": 0,
    "ZO": 0,
    "KH": 0,
    "KO": 0,
    "GH2O": 1,
    "GHO2": 1,
    "UH2O": 1,
    "UHO2": 1,
    "LH2O": 1,
    "LHO2": 1,
    "ZH2O": 1,
    "ZHO2": 1,
    "KH2O": 1,
    "KHO2": 1,
    "XGH2O": 2,
    "XGHO2": 2,
    "XUH2O": 2,
    "XUHO2": 2,
    "XLH2O": 2,
    "XLHO2": 2,
    "XZH2O": 2,
    "XZHO2": 2,
    "XKH2O": 2,
    "XKHO2": 2,
};
let amount_mapping = [1960, 840, 0];
var temp_mineral_minimum_amount: any = {};
for (let key in mineral_level) {
    temp_mineral_minimum_amount[key] = amount_mapping[mineral_level[ < GeneralMineralConstant > key]];
}
export var mineral_minimum_amount = < type_mineral_minimum_amount > temp_mineral_minimum_amount;
export function get_all_reactants(obj: GeneralMineralConstant): GeneralMineralConstant[] {
    if (['Z', 'K', 'U', 'L', 'X', 'O', 'H'].includes(obj)) {
        return [];
    } else {
        let reactant1 = allowed_reactions[ < MineralCompoundConstant > obj][0];
        let reactant2 = allowed_reactions[ < MineralCompoundConstant > obj][1];
        let s1 = get_all_reactants(reactant1);
        let s2 = get_all_reactants(reactant2);
        let reactants_set = new Set(s1.concat(s2));
        if (!(['Z', 'K', 'U', 'L', 'X', 'O', 'H'].includes(obj))) {
            reactants_set.add(obj);
        }
        return Array.from(reactants_set);
    }
}
let temp_all_reactants: {[key in MineralCompoundConstant] ?: number} = {};
for (let i = 0; i < reaction_products.length; i++) {
    let product = reaction_products[i];
    let reactants = get_all_reactants(product);
    for (let r of reactants) {
		if (temp_all_reactants[<MineralCompoundConstant> r] == undefined) {
			temp_all_reactants[<MineralCompoundConstant> r] = mineral_level[<GeneralMineralConstant> r] - i*5;
        }
    }
}
for (let room_name in mineral_storage_room) {
    reaction_priority[room_name] = {};
	for (let r in temp_all_reactants) {
		if (mineral_storage_room[room_name].includes(<MineralCompoundConstant> r)) {
			reaction_priority[room_name][<MineralCompoundConstant> r] = temp_all_reactants[<MineralBoostConstant> r];
		}
	}
}
export var help_list: type_help_list = {
	/*
    "E19N53": {
        "E19N55": {
			"rooms_forwardpath": ['E19N53', 'E19N54', 'E20N54', 'E20N55', 'E19N55'],
            "poses_forwardpath": [25, 25, 9, 28],
            "commuting_distance": 114,
            "n_carrys": {
                "S1": 2,
                "S2": 8,
            }
        }
    }
	 */
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
export var creep_roles_combat = ["defender", "invader_core_attacker", "hunter", "home_defender"]
export var creep_roles_external = ["externalharvester", "externalcarrier", "external_init", "reserver", "help_harvester", "help_carrier", "help_builder"]
export var creep_roles_resources = ["pb_attacker", "pb_healer", "pb_carrier"]
