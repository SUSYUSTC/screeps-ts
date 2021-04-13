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

conf_E14N59.external_rooms.E15N59.container = true;
conf_E14N59.external_rooms.E15N59.active = true;
conf_E19N55.external_rooms.E19N56.container = true;
conf_E19N55.external_rooms.E19N56.active = true;

type type_conf_rooms = {
    [key: string]: type_conf_room;
}
type type_hunting = {
    [key: string]: type_conf_hunting;
}
type type_body_conf = {
    [key in BodyPartConstant] ? : {
        number: number;
        boost ? : MineralBoostConstant;
    }
}
interface type_pc_conf {
    [key: string]: {
        room_name: string;
        source: boolean;
		external_room ?: string;
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
export var controlled_rooms: string[] = ["E16N58", "E15N58", "E14N51", "E19N53", "E19N51", "E21N49", "E19N55", "E14N59", "E9N54"];
export function distance_metric(room_name: string, pos1: RoomPosition, pos2: RoomPosition): number {
    return pos1.getRangeTo(pos2);
}

export var pc_conf: type_pc_conf = {
    "PC_A": {
        "room_name": "E14N59",
        "source": true,
		"external_room": "E15N59",
    },
    "PC_B": {
        "room_name": "E19N55",
        "source": true,
		"external_room": "E19N56",
    },
}
export var hunting: type_hunting = {};
export var link_transfer_to_main_gap: number = 800;
export var link_transfer_from_main_gap: number = 600;
export var main_link_amount_source: number = 800;
export var main_link_amount_sink: number = 0;
export var wall_strength: number = 5000;
export var maincarrier_ncarry: number = 6;
export var upgrader_boost_request: MineralBoostConstant = "GH2O";
export var defense_compounds_storage_room = 'E19N55';
export var external_resources_compounds_storage_room = 'E19N55';
export var allowed_passing_rooms = ['E17N58', 'E17N59', 'E15N59', 'E14N59'];
export var preclaiming_rooms: string[] = [];
type type_acceptable_prices = {
	buy: {
		[key in MarketResourceConstant] ?: {
			price: number;
			interval: number;
		}
	},
	sell: {
		[key in MarketResourceConstant] ?: {
			price: number;
			interval: number;
		}
	},
}
export var acceptable_prices: type_acceptable_prices = {
	"buy": {
		"U": {
			price: 0.4,
			interval: 1000,
		},
		"L": {
			price: 0.4,
			interval: 1000,
		},
		"Z": {
			price: 0.4,
			interval: 1000,
		},
		"K": {
			price: 0.4,
			interval: 1000,
		},
		"X": {
			price: 0.8,
			interval: 1000,
		},
		"H": {
			price: 0.6,
			interval: 1000,
		},
		"O": {
			price: 0.3,
			interval: 1000,
		},
		"energy": {
			price: 0.3,
			interval: -1,
		},
		"battery": {
			price: 3.0,
			interval: 1000,
		}
	},
	"sell": {
		"XGH2O": {
			price: 8.8,
			interval: -1,
		}
	}
}
type type_resources_balance = {
	[key in ResourceConstant] ?: {
		gap: number;
		min: number;
		amount: number;
	}
}
type type_resource_gathering_pos = {
	[key in ResourceConstant] ? : string;
}
export var resources_balance: type_resources_balance = {
	"battery": {
		gap: 10000,
		min: 10000,
		amount: 2000,
	},
	"GH2O": {
		gap: 2000,
		min: 2000,
		amount: 1000,
	},
	"UH2O": {
		gap: 600,
		min: 600,
		amount: 600,
	},
	"LO": {
		gap: 600,
		min: 600,
		amount: 600,
	},
	"GHO2": {
		gap: 150,
		min: 150,
		amount: 150,
	},
	"ZO": {
		gap: 600,
		min: 600,
		amount: 600,
	},
}
export var resource_gathering_pos: type_resource_gathering_pos = {
	"LH2O": "E14N59",
	"XKH2O": "E21N49",
	"XKHO2": "E21N49",
	"XUH2O": "E15N58",
	"XUHO2": "E15N58",
	"XGH2O": "E16N58",
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
export var boost_rcl8: {
    [key: string]: boolean
} = {
    "E16N58": true,
    "E15N58": true,
    "E14N51": true,
    "E19N53": true,
    "E19N51": true,
    "E21N49": true,
    "E19N55": true,
    "E14N59": true,
    "E9N54": true,
}
export var highway_resources: {
    [key: string]: string[]
} = {
    "E16N58": ['E17N60', 'E18N60', 'E19N60', 'E20N60'],
    "E19N51": ['E17N50', 'E18N50', 'E19N50', 'E20N50', 'E20N51'],
    "E19N55": ['E20N53', 'E20N54', 'E20N55', 'E20N56', 'E20N57', 'E20N58', 'E20N59'],
    "E14N51": ['E10N50', 'E11N50', 'E12N50', 'E13N50', 'E14N50', 'E15N50', 'E16N50'],
    "E21N49": ['E20N47', 'E20N48', 'E20N49', 'E21N50', 'E22N50', 'E23N50', 'E24N50', 'E25N50'],
    "E14N59": ['E10N60', 'E11N60', 'E12N60', 'E13N60', 'E14N60', 'E15N60', 'E16N60'],
}
export var storage_bars: number[] = [60000, 120000, 180000, 240000];
export var storage_gap: number = 60000;
export var storage_full: number = 300000;
export var wall_rates: {[key: string]: number} = {
    "E14N51": 0,
    "E19N51": 0,
    "E19N53": 0,
    "E15N58": 0,
    "E16N58": 0,
    "E21N49": 0,
    "E19N55": 0,
    "E14N59": 0,
    "E9N54": 0,
}
let t3_compounds: GeneralMineralConstant[] = ['XGH2O', 'XGHO2', 'XUH2O', 'XUHO2', 'XLH2O', 'XLHO2', 'XZH2O', 'XZHO2', 'XKH2O', 'XKHO2'];
let t2_compounds: GeneralMineralConstant[] = ['GH2O', 'GHO2', 'UH2O', 'UHO2', 'LH2O', 'LHO2', 'ZH2O', 'ZHO2', 'KH2O', 'KHO2'];
export var mineral_storage_room: type_mineral_storage_room = {
    "E15N58": t3_compounds.concat(t2_compounds).concat(["U", "UH", "UO", "L", "LH", "LO", "UL", "G"]),
    "E14N51": t3_compounds.concat(t2_compounds).concat(["Z", "ZH", "ZO", "K", "KH", "KO", "ZK", "G"]),
    "E21N49": t3_compounds.concat(t2_compounds).concat(["Z", "ZH", "ZO", "K", "KH", "KO", "ZK", "G"]),
    "E16N58": t3_compounds.concat(t2_compounds).concat(["H", "GH", "OH"]),
    "E19N51": t3_compounds.concat(t2_compounds).concat(["O", "GO", "OH"]),
    "E19N53": t3_compounds.concat(t2_compounds).concat(["X", "GO", "GH", "OH"]),
    "E19N55": t3_compounds.concat(t2_compounds).concat(["H", "GH", "OH"]),
    "E14N59": t3_compounds.concat(t2_compounds).concat(["U", "UH", "UO", "L", "LH", "LO", "UL", "G", "O", "GO", "OH"]),
	//"E9N54": ["L"],
};
export var reserved_resources: {[key in ResourceConstant] ?: number} = {
	"UH2O": 20000,
	"LO": 20000,
	"GHO2": 5000,
	"LH2O": 20000,
	"GH2O": 40000,
}

export var help_list: type_help_list = {
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
        number: 20,
        boost: "LO",
    },
    "move": {
        number: 20,
    }
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
        n_move: 2,
    },
    3: {
        n_harvest: 10,
        n_carry: 4,
        n_move: 2,
    },
    4: {
        n_harvest: 12,
        n_carry: 5,
        n_move: 2,
    },
    5: {
        n_harvest: 14,
        n_carry: 6,
        n_move: 2,
    },
}
export var powered_external_harvester: type_powered_harvester = {
    1: {
        n_harvest: 7,
        n_carry: 1,
        n_move: 4,
    },
    2: {
        n_harvest: 9,
        n_carry: 1,
        n_move: 5,
    },
    3: {
        n_harvest: 11,
        n_carry: 2,
        n_move: 6,
    },
    4: {
        n_harvest: 12,
        n_carry: 2,
        n_move: 7,
    },
    5: {
        n_harvest: 14,
        n_carry: 2,
        n_move: 2,
    },
}

export var creep_roles_home = ["init", "harvester", "carrier", "builder", "upgrader", "transferer", "mineharvester", "specialcarrier", "wall_repairer"]
export var creep_roles_maincarrier = ["maincarrier"]
export var creep_roles_combat = ["defender", "invader_core_attacker", "hunter", "home_defender"]
export var creep_roles_external = ["externalharvester", "externalcarrier", "external_init", "externalbuilder", "reserver", "claimer", "help_harvester", "help_carrier", "help_builder", "newroom_claimer"]
export var creep_roles_resources = ["pb_attacker", "pb_healer", "pb_carrier", "depo_container_builder", "depo_energy_carrier", "depo_harvester", "depo_carrier"]
