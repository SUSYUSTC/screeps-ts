//screeps
function getside(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {
    return ((x - x1) * (y2 - y1) - (y - y1) * (x2 - x1) > 0)
}


Memory.controlled_rooms = ['E16N58', 'E15N58', 'E14N51']
var room_E16N58_towers: conf_towers = {
    "T1": {
        "pos": [37, 30],
        "RCL": 3,
    },
    "T2": {
        "pos": [30, 41],
        "RCL": 5,
    }
};
var room_E16N58_sources: conf_sources = {
    "S1": {
        "id": < Id < Source >> "5bbcadda9099fc012e637f8a"
    },
    "S2": {
        "id": < Id < Source >> "5bbcadda9099fc012e637f8c"
    }
};
var room_E16N58_mine: conf_mine = {
    "id": < Id < Mineral >> "5bbcb35b40062e4259e94318"
};
var room_E16N58_containers: conf_containers = {
    "S1": {
        "pos": [15, 19],
        "RCL": 2,
    },
    "S2": {
        "pos": [37, 31],
        "RCL": 2,
    },
    "CT": {
        "pos": [18, 26],
        "RCL": 2,
    },
    "MD": {
        "pos": [31, 25],
        "RCL": 3,
    },
    "MINE": {
        "pos": [23, 40],
        "RCL": 6,
    }
}
var room_E16N58_link_transfer_gap: number = 400;
var room_E16N58_link_transfer_amount: number = 400;
var room_E16N58_links: conf_links = {
    "S1": {
        "pos": [15, 18],
        "source": true,
    },
    "S2": {
        "pos": [36, 32],
        "source": true,
    },
    "CT": {
        "pos": [17, 26],
        "source": false,
    },
    "MAIN": {
        "pos": [27, 33],
        "source": true,
    },
}
var room_E16N58_labs: conf_lab = {
    'L1': {
        "pos": [27, 22],
        "object": "GH2O",
        "body": WORK,
        "effect": "upgrade",
    },
};

var room_E16N58_carrier_preference_S1: conf_preference[] = [{
    "container": "CT",
    "points": 0,
}, {
    "container": "MD",
    "points": 500,
}]

var room_E16N58_carrier_preference_S2: conf_preference[] = [{
    "container": "MD",
    "points": 0,
}, {
    "container": "CT",
    "points": 1000,
}]

var room_E16N58_carrier_preference_storage: conf_preference[] = [{
    "container": "MD",
    "points": 0,
}, {
    "container": "CT",
    "points": 1000,
}]

var room_E16N58_init: conf_init = {
    "S1": {
        "number": 3,
    },
    "S2": {
        "number": 4,
    },
}

var room_E16N58_carriers: conf_carriers = {
    "S1": {
        "preferences": room_E16N58_carrier_preference_S1,
        "number": 4,
    },
    "S2": {
        "preferences": room_E16N58_carrier_preference_S2,
        "number": 8,
    },
    "storage": {
        "preferences": room_E16N58_carrier_preference_storage,
        "number": 8,
    },
}

var room_E16N58_upgraders: conf_upgraders = {
    "locations": [
        [17, 27],
        [18, 27],
        [18, 25],
        [17, 25],
        [18, 26],
    ],
    "commuting_time": 21,
    "boost_request": {
        "body": WORK,
        "effect": "upgrade"
    },
}
var room_E16N58_harvesters: conf_harvesters = {
    "S1": {
        "commuting_time": 30,
    },
    "S2": {
        "commuting_time": 36,
    },
}
var room_E16N58_maincarriers: conf_maincarriers = {
    "MAIN": {
        "pos": [27, 34],
        "n_carry": 4,
        "link_name": "MAIN",
        "link_amount": 550,
        "storage": true,
        "terminal": true
    }
}

var room_E16N58_max_transfer: number = 8
var room_E16N58_stay_pos: number[] = [32, 29];
var room_E16N58_safe_pos: number[] = [36, 34];
var room_E16N58_storage_bar: number[] = [200000];
var room_E16N58_wall_strength = 200000;
var room_E16N58_wall_rate = 1;

var room_E16N58_external_rooms: conf_external_rooms = {
    "E17N59": {
        "active": false,
        "controller": {
            "reserve": true,
            "path_time": 82,
            "rooms_forwardpath": ['E16N58', 'E17N58', 'E17N59'],
            "names_forwardpath": ['default', 'default'],
            "rooms_backwardpath": ['E17N59', 'E17N58', 'E16N58'],
            "names_backwardpath": ['default', 'default'],
        },
        "sources": {
            "S1": {
                "id": < Id < Source >> "5bbcade89099fc012e6381cd",
                "harvest_pos": [7, 44],
                "reserve": true,
                "single_distance": 74,
                "n_carry": 18,
                "n_carrier": 2,
                "carry_end": {
                    "type": "storage",
                    "name": "",
                },
                "rooms_forwardpath": ['E16N58', 'E17N58', 'E17N59'],
                "names_forwardpath": ['default', 'default'],
                "rooms_backwardpath": ['E17N59', 'E17N58', 'E16N58'],
                "names_backwardpath": ['default', 'default'],
            },
        },
    },
    "E17N58": {
        "active": true,
        "controller": {
            "reserve": true,
            "path_time": 70,
            "rooms_forwardpath": ['E16N58', 'E17N58'],
            "names_forwardpath": ['default'],
            "rooms_backwardpath": ['E17N58', 'E16N58'],
            "names_backwardpath": ['default'],
        },
        "sources": {
            "S1": {
                "id": < Id < Source >> "5bbcade89099fc012e6381d0",
                "harvest_pos": [4, 21],
                "reserve": true,
                "single_distance": 28,
                "n_carry": 6,
                "n_carrier": 2,
                "carry_end": {
                    "type": "storage",
                    "name": "",
                },
                "rooms_forwardpath": ['E16N58', 'E17N58'],
                "names_forwardpath": ['default'],
                "rooms_backwardpath": ['E17N58', 'E16N58'],
                "names_backwardpath": ['default'],
            },
        },
    },
    "E16N57": {
        "active": false,
        "controller": {
            "reserve": true,
            "path_time": 58,
            "rooms_forwardpath": ['E16N58', 'E16N57'],
            "names_forwardpath": ['default'],
            "rooms_backwardpath": ['E16N57', 'E16N58'],
            "names_backwardpath": ['default'],
        },
        "sources": {
            "S1": {
                "id": < Id < Source >> "5bbcadda9099fc012e637f8f",
                "harvest_pos": [40, 24],
                "reserve": true,
                "single_distance": 60,
                "n_carry": 14,
                "n_carrier": 2,
                "carry_end": {
                    "type": "storage",
                    "name": "",
                },
                "rooms_forwardpath": ['E16N58', 'E16N57'],
                "names_forwardpath": ['default'],
                "rooms_backwardpath": ['E16N57', 'E16N58'],
                "names_backwardpath": ['default'],
            },
        },
    },
};

var room_E16N58: room_conf = {
    towers: room_E16N58_towers,
    sources: room_E16N58_sources,
    mine: room_E16N58_mine,
    containers: room_E16N58_containers,
    links: room_E16N58_links,
    link_transfer_gap: room_E16N58_link_transfer_gap,
    link_transfer_amount: room_E16N58_link_transfer_amount,
    labs: room_E16N58_labs,
    init: room_E16N58_init,
    carriers: room_E16N58_carriers,
    upgraders: room_E16N58_upgraders,
    harvesters: room_E16N58_harvesters,
    maincarriers: room_E16N58_maincarriers,
    max_transfer: room_E16N58_max_transfer,
    stay_pos: room_E16N58_stay_pos,
    safe_pos: room_E16N58_safe_pos,
    storage_bar: room_E16N58_storage_bar,
    external_rooms: room_E16N58_external_rooms,
    wall_strength: room_E16N58_wall_strength,
    wall_rate: room_E16N58_wall_rate,
};


var room_E15N58_towers: conf_towers = {
    "T1": {
        "pos": [24, 13],
        "RCL": 3,
    },
    "T2": {
        "pos": [22, 29],
        "RCL": 5,
    },
};
var room_E15N58_sources: conf_sources = {
    "S1": {
        "id": < Id < Source >> "5bbcadc79099fc012e637d70",
    },
    "S2": {
        "id": < Id < Source >> "5bbcadc79099fc012e637d6f",
    },
};
var room_E15N58_mine: conf_mine = {
    "id": < Id < Mineral >> "5bbcb35340062e4259e942d0",
};
var room_E15N58_containers: conf_containers = {
    "S1": {
        "pos": [18, 26],
        "RCL": 2,
    },
    "S2": {
        "pos": [36, 19],
        "RCL": 2,
    },
    "CT": {
        "pos": [35, 6],
        "RCL": 2,
    },
    "MD": {
        "pos": [30, 20],
        "RCL": 2,
    },
    "MINE": {
        "pos": [6, 18],
        "RCL": 6,
    },
}

var room_E15N58_link_transfer_gap: number = 400;
var room_E15N58_link_transfer_amount: number = 400;
var room_E15N58_links: conf_links = {
    "S1": {
        "pos": [19, 26],
        "source": true,
    },
    "S2": {
        "pos": [35, 19],
        "source": true,
    },
    "CT": {
        "pos": [34, 6],
        "source": false,
    },
    "MAIN": {
        "pos": [20, 16],
        "source": true,
    },
}

var room_E15N58_labs: conf_lab = {
    'L1': {
        "pos": [23, 18],
        "object": "XLHO2",
        "body": HEAL,
    },
    'L2': {
        "pos": [23, 19],
        "object": "XGHO2",
        "body": TOUGH,
    },
    'L3': {
        "pos": [24, 19],
        "object": "XUH2O",
        "body": ATTACK,
    },
    'L4': {
        "pos": [24, 20],
        "object": "XZHO2",
        "body": MOVE,
    },
    'L5': {
        "pos": [25, 20],
        "object": "XKHO2",
        "body": RANGED_ATTACK,
    },
    'L6': {
        "pos": [25, 18],
        "object": "GH2O",
        "body": WORK,
        "effect": "upgrade",
    }
};
var room_E15N58_carrier_preference_S1: conf_preference[] = [{
    "container": "MD",
    "points": 0,
}, {
    "container": "CT",
    "points": 1000
}]

var room_E15N58_carrier_preference_S2: conf_preference[] = [{
    "container": "MD",
    "points": 0,
}, {
    "container": "CT",
    "points": 300,
}]

var room_E15N58_carrier_preference_storage: conf_preference[] = [{
    "container": "CT",
    "points": 0,
}]

var room_E15N58_init: conf_init = {
    "S1": {
        "number": 3
    },
    "S2": {
        "number": 3
    },
}

var room_E15N58_carriers: conf_carriers = {
    "S1": {
        "preferences": room_E15N58_carrier_preference_S1,
        "number": 10,
    },
    "S2": {
        "preferences": room_E15N58_carrier_preference_S2,
        "number": 6,
    },
    "storage": {
        "preferences": room_E15N58_carrier_preference_storage,
        "number": 10,
    },
}

var room_E15N58_upgraders: conf_upgraders = {
    "locations": [
        [34, 5],
        [35, 5],
        [35, 6],
        [34, 7],
        [35, 7],
    ],
    "commuting_time": 40,
    "boost_request": {
        "body": WORK,
        "effect": "upgrade"
    },
}
var room_E15N58_harvesters: conf_harvesters = {
    "S1": {
        "commuting_time": 36,
    },
    "S2": {
        "commuting_time": 21,
    },
}
var room_E15N58_maincarriers: conf_maincarriers = {
    "MAIN": {
        "pos": [19, 17],
        "n_carry": 4,
        "link_name": "MAIN",
        "link_amount": 550,
        "storage": true,
        "terminal": true
    }
}

var room_E15N58_max_transfer: number = 12;
var room_E15N58_stay_pos: number[] = [25, 16];
var room_E15N58_safe_pos: number[] = [20, 21];
var room_E15N58_storage_bar: number[] = [200000];
var room_E15N58_wall_strength = 20000;
var room_E15N58_wall_rate = 1;
var room_E15N58_external_rooms: conf_external_rooms = {
    "E15N59": {
        "active": true,
        "controller": {
            "reserve": true,
            "path_time": 50,
            "rooms_forwardpath": ['E15N58', 'E15N59'],
            "names_forwardpath": ['default'],
            "rooms_backwardpath": ['E15N59', 'E15N58'],
            "names_backwardpath": ['default'],
        },
        "sources": {
            "S1": {
                "id": < Id < Source >> "5bbcadc79099fc012e637d6c",
                "harvest_pos": [17, 23],
                "reserve": true,
                "single_distance": 46,
                "n_carry": 11,
                "n_carrier": 2,
                "carry_end": {
                    "type": "storage",
                    "name": ""
                },
                "rooms_forwardpath": ['E15N58', 'E15N59'],
                "names_forwardpath": ['default'],
                "rooms_backwardpath": ['E15N59', 'E15N58'],
                "names_backwardpath": ['default'],
            },
            "S2": {
                "id": < Id < Source >> "5bbcadc79099fc012e637d6a",
                "harvest_pos": [32, 12],
                "reserve": true,
                "single_distance": 60,
                "n_carry": 14,
                "n_carrier": 2,
                "carry_end": {
                    "type": "storage",
                    "name": "",
                },
                "rooms_forwardpath": ['E15N58', 'E15N59'],
                "names_forwardpath": ['default'],
                "rooms_backwardpath": ['E15N59', 'E15N58'],
                "names_backwardpath": ['default'],
            },
        },
    },
    "E14N59": {
        "active": true,
        "controller": {
            "reserve": true,
            "path_time": 52,
            "rooms_forwardpath": ['E15N58', 'E15N59', 'E14N59'],
            "names_forwardpath": ['default', 'default'],
            "rooms_backwardpath": ['E14N59', 'E15N59', 'E15N58'],
            "names_backwardpath": ['default', 'default'],
        },
        "sources": {
            "S1": {
                "id": < Id < Source >> "5bbcadb89099fc012e637b19",
                "harvest_pos": [34, 43],
                "reserve": true,
                "single_distance": 70,
                "n_carry": 16,
                "n_carrier": 2,
                "carry_end": {
                    "type": "storage",
                    "name": ""
                },
                "rooms_forwardpath": ['E15N58', 'E15N59', 'E14N59'],
                "names_forwardpath": ['default', 'default'],
                "rooms_backwardpath": ['E14N59', 'E15N59', 'E15N58'],
                "names_backwardpath": ['default', 'default'],
            },
            "S2": {
                "id": < Id < Source >> "5bbcadb89099fc012e637b18",
                "harvest_pos": [12, 34],
                "reserve": true,
                "single_distance": 70,
                "n_carry": 16,
                "n_carrier": 2,
                "carry_end": {
                    "type": "storage",
                    "name": "",
                },
                "rooms_forwardpath": ['E15N58', 'E15N59', 'E14N59'],
                "names_forwardpath": ['default', 'default'],
                "rooms_backwardpath": ['E14N59', 'E15N59', 'E15N58'],
                "names_backwardpath": ['default', 'default'],
            },
        },
    },
};
var room_E15N58: room_conf = {
    towers: room_E15N58_towers,
    sources: room_E15N58_sources,
    mine: room_E15N58_mine,
    containers: room_E15N58_containers,
    links: room_E15N58_links,
    link_transfer_gap: room_E15N58_link_transfer_gap,
    link_transfer_amount: room_E15N58_link_transfer_amount,
    labs: room_E15N58_labs,
    init: room_E15N58_init,
    carriers: room_E15N58_carriers,
    upgraders: room_E15N58_upgraders,
    harvesters: room_E15N58_harvesters,
    maincarriers: room_E15N58_maincarriers,
    max_transfer: room_E15N58_max_transfer,
    stay_pos: room_E15N58_stay_pos,
    safe_pos: room_E15N58_safe_pos,
    storage_bar: room_E15N58_storage_bar,
    external_rooms: room_E15N58_external_rooms,
    wall_strength: room_E15N58_wall_strength,
    wall_rate: room_E15N58_wall_rate,
};

var room_E14N51_towers: conf_towers = {
    "T1": {
        "pos": [29, 7],
        "RCL": 3,
    },
    "T2": {
        "pos": [19, 34],
        "RCL": 5,
    },
};
var room_E14N51_sources: conf_sources = {
    "S1": {
        "id": < Id < Source >> "5bbcadb99099fc012e637b47",
    },
    "S2": {
        "id": < Id < Source >> "5bbcadb99099fc012e637b45",
    },
};
var room_E14N51_mine: conf_mine = {
    "id": < Id < Mineral >> "5bbcb34b40062e4259e9428c",
};
var room_E14N51_containers: conf_containers = {
    "S1": {
        "pos": [43, 39],
        "RCL": 2,
    },
    "S2": {
        "pos": [33, 11],
        "RCL": 2,
    },
    "CT": {
        "pos": [13, 32],
        "RCL": 2,
    },
    /*
    "MD": {
        "pos": [30, 20],
        "RCL": 2,
    },
    "MINE": {
        "pos": [6, 18],
        "RCL": 6,
    },
	 */
}

var room_E14N51_link_transfer_gap: number = 400;
var room_E14N51_link_transfer_amount: number = 400;
var room_E14N51_links: conf_links = {
    "S1": {
        "pos": [44, 39],
        "source": true,
    },
    "S2": {
        "pos": [33, 12],
        "source": true,
    },
    "CT": {
        "pos": [12, 32],
        "source": false
    },
}

/*
var room_E14N51_labs: conf_lab[] = [{
    "pos": [23, 18],
    "object": "XLHO2",
	"body": HEAL,
}, {
    "pos": [23, 19],
    "object": "XGHO2",
	"body": TOUGH,
}, {
    "pos": [24, 19],
    "object": "XUH2O",
	"body": ATTACK,
}, {
    "pos": [24, 20],
    "object": "XZHO2",
	"body": MOVE,
}, {
    "pos": [25, 20],
    "object": "XKHO2",
	"body": RANGED_ATTACK,
}, {
    "pos": [25, 18],
    "object": "GH2O",
	"body": WORK,
}];
*/
var room_E14N51_carrier_preference_S1: conf_preference[] = [{
    "container": "CT",
    "points": 0,
}]

var room_E14N51_carrier_preference_S2: conf_preference[] = [{
    "container": "CT",
    "points": 0,
}]

var room_E14N51_carrier_preference_storage: conf_preference[] = [{
    "container": "CT",
    "points": 0,
}]

var room_E14N51_init: conf_init = {
    "S1": {
        "number": 3
    },
    "S2": {
        "number": 2
    },
}

var room_E14N51_carriers: conf_carriers = {
    "S1": {
        "preferences": room_E14N51_carrier_preference_S1,
        "number": 12,
    },
    "S2": {
        "preferences": room_E14N51_carrier_preference_S2,
        "number": 10,
    },
    "storage": {
        "preferences": room_E14N51_carrier_preference_storage,
        "number": 6,
    },
}

var room_E14N51_upgraders: conf_upgraders = {
    "locations": [
        [12, 31],
        [12, 33],
        [13, 31],
        [13, 33],
        [13, 32],
    ],
    "commuting_time": 84,
}
var room_E14N51_harvesters: conf_harvesters = {
    "S1": {
        "commuting_time": 9,
    },
    "S2": {
        "commuting_time": 75,
    },
}
var room_E14N51_maincarriers: conf_maincarriers = {
    "MAIN": {
        "pos": [19, 17],
        "n_carry": 4,
        "link_name": "MAIN",
        "link_amount": 550,
        "storage": true,
        "terminal": true
    }
}

var room_E14N51_max_transfer: number = 4
var room_E14N51_stay_pos: number[] = [37, 30];
var room_E14N51_safe_pos: number[] = [22, 4];
var room_E14N51_storage_bar: number[] = [200000];
var room_E14N51_wall_strength = 2000;
var room_E14N51_wall_rate = 1;
var room_E14N51_external_rooms: conf_external_rooms = {
    "E14N52": {
        "active": true,
        "controller": {
            "reserve": true,
            "path_time": 65,
            "rooms_forwardpath": ['E14N51', 'E14N52'],
            "names_forwardpath": ['right'],
            "rooms_backwardpath": ['E14N52', 'E14N51'],
            "names_backwardpath": ['right'],
        },
        "sources": {
            "S1": {
                "id": < Id < Source >> "5bbcadb99099fc012e637b42",
                "harvest_pos": [22, 24],
                "reserve": true,
                "single_distance": 53,
                "n_carry": 12,
                "n_carrier": 2,
                "carry_end": {
                    "type": "storage",
                    "name": ""
                },
                "rooms_forwardpath": ['E14N51', 'E14N52'],
                "names_forwardpath": ['left'],
                "rooms_backwardpath": ['E14N52', 'E14N51'],
                "names_backwardpath": ['left'],
            },
            "S2": {
                "id": < Id < Source >> "5bbcadb99099fc012e637b43",
                "harvest_pos": [41, 27],
                "reserve": true,
                "single_distance": 55,
                "n_carry": 12,
                "n_carrier": 2,
                "carry_end": {
                    "type": "storage",
                    "name": "",
                },
                "rooms_forwardpath": ['E14N51', 'E14N52'],
                "names_forwardpath": ['right'],
                "rooms_backwardpath": ['E14N52', 'E14N51'],
                "names_backwardpath": ['right'],
            },
        },
    },
}
var room_E14N51: room_conf = {
    towers: room_E14N51_towers,
    sources: room_E14N51_sources,
    mine: room_E14N51_mine,
    containers: room_E14N51_containers,
    links: room_E14N51_links,
    link_transfer_gap: room_E14N51_link_transfer_gap,
    link_transfer_amount: room_E14N51_link_transfer_amount,
    //labs: room_E14N51_labs,
    init: room_E14N51_init,
    carriers: room_E14N51_carriers,
    upgraders: room_E14N51_upgraders,
    harvesters: room_E14N51_harvesters,
    maincarriers: room_E14N51_maincarriers,
    max_transfer: room_E14N51_max_transfer,
    stay_pos: room_E14N51_stay_pos,
    safe_pos: room_E14N51_safe_pos,
    storage_bar: room_E14N51_storage_bar,
    external_rooms: room_E14N51_external_rooms,
    wall_strength: room_E14N51_wall_strength,
    wall_rate: room_E14N51_wall_rate,
};

export function distance_metric(room_name: string, pos1: RoomPosition, pos2: RoomPosition): number {
    return pos1.getRangeTo(pos2);
}

Memory.rooms_conf = {
    "E15N58": room_E15N58,
    "E16N58": room_E16N58,
    "E14N51": room_E14N51,
};
Memory.help_list = {
    "E15N58": {
        "external_room_name": "E14N51",
        "rooms_forwardpath": ['E15N58', 'E14N58', 'E14N57', 'E14N56', 'E13N56', 'E13N55', 'E13N54', 'E14N54', 'E14N53', 'E14N52', 'E14N51'],
        "names_forwardpath": ['default', 'default', 'default', 'default', 'default', 'default', 'default', 'default', 'default', 'left'],
        "sources": {
            "S1": 1,
            "S2": 1,
        },
        "commuting_time": 400,
        "body": {
            "work": 6,
            "carry": 2,
            "move": 8
        },
    },
};
Memory.username = 'SUSYUSTC';
Memory.defender_responsible_types = {
    'small_close': {
        "list": ['small_close'],
        "body": {
            "tough": 3,
            "move": 6,
            "attack": 3
        },
        "cost": -1
    },
    'big_close': {
        "list": ['small_close', 'big_close'],
        "body": {
            "tough": 4,
            "move": 9,
            "attack": 5
        },
        "cost": -1
    },
    'small_far': {
        "list": ['small_far'],
        "body": {
            "tough": 2,
            "move": 6,
            "ranged_attack": 4
        },
        "cost": -1
    },
    'big_far': {
        "list": ['small_far', 'big_far', 'small_close', 'big_close'],
        "body": {
            "tough": 10,
            "move": 10,
            "attack": 6,
            "ranged_attack": 4
        },
        "cost": -1
    },
};
import * as spawning_func from "./spawning_func"
for (var name in Memory.defender_responsible_types) {
    Memory.defender_responsible_types[name].cost = spawning_func.get_cost(spawning_func.fullreturnbody(Memory.defender_responsible_types[name].body));
}
