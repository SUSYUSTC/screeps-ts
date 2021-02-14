//screeps
function getside(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {
    return ((x - x1) * (y2 - y1) - (y - y1) * (x2 - x1) > 0)
}


Memory.controlled_rooms = ['E16N58', 'E15N58', 'E14N51', 'E19N53', 'E19N51']
var room_E16N58_towers: conf_towers = {
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
        "pos": [37, 32],
        "RCL": 2,
    },
    "CT": {
        "pos": [18, 26],
        "RCL": 2,
    },
	/*
    "MD": {
        "pos": [31, 25],
        "RCL": 3,
    },
	 */
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
        "pos": [36, 31],
        "source": true,
    },
    "CT": {
        "pos": [17, 26],
        "source": false,
    },
    "MAIN": {
        "pos": [37, 27],
        "source": true,
    },
	"L1": {
        "pos": [29, 32],
        "source": false,
	},
	"L2": {
        "pos": [43, 15],
        "source": false,
	},
}
var room_E16N58_labs: conf_lab = {
    'L1': {
        "pos": [34, 26],
        "state": "boost",
    },
    'L2': {
        "pos": [36, 24],
        "state": "source1",
    },
    'L3': {
        "pos": [36, 25],
        "state": "source2",
    },
    'L4': {
        "pos": [34, 25],
        "state": "react",
    },
    'L5': {
        "pos": [34, 24],
        "state": "react",
    },
    'L6': {
        "pos": [35, 24],
        "state": "react",
    },
    'L7': {
        "pos": [37, 24],
        "state": "react",
    },
    'L8': {
        "pos": [38, 24],
        "state": "react",
    },
    'L9': {
        "pos": [38, 25],
        "state": "react",
    },
    'L10': {
        "pos": [38, 26],
        "state": "react",
    },
};

var room_E16N58_carrier_preference_S1: conf_preference[] = [{
    "container": "CT",
    "points": 0,
	/*
}, {
    "container": "MD",
    "points": 500,
	*/
}]

var room_E16N58_carrier_preference_S2: conf_preference[] = [{
	/*
    "container": "MD",
    "points": 0,
}, {
	*/
    "container": "CT",
    "points": 1000,
}]

var room_E16N58_carrier_preference_storage: conf_preference[] = [{
	/*
    "container": "MD",
    "points": 0,
}, {
	*/
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
        "number": 16,
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
	//"boost_request": "GH",
}
var room_E16N58_harvesters: conf_harvesters = {
    "S1": {
        "commuting_time": 60,
    },
    "S2": {
        "commuting_time": 3,
    },
}
var room_E16N58_main_link_amount_source = 600;
var room_E16N58_main_link_amount_sink = 400;
var room_E16N58_maincarriers: conf_maincarriers = {
    "MAIN": {
        "main_pos": [36, 27],
        "working_zone": [
            [36, 27],
            [36, 26],
            [35, 26],
            [35, 25],
            [37, 26],
            [37, 25],
        ],
        "waiting_pos": [34, 26],
        "n_carry": 6,
        "link_name": "MAIN",
        "link_amount": room_E16N58_main_link_amount_source,
        "storage": true,
        "terminal": true,
    }
}

var room_E16N58_max_transfer: number = 8
var room_E16N58_stay_pos: number[] = [38, 27];
var room_E16N58_mineral_stay_pos: number[] = [23, 39];
var room_E16N58_safe_pos: number[] = [37, 33];
var room_E16N58_storage_bar: number[] = [200000];
var room_E16N58_wall_strength = 10000;
var room_E16N58_wall_rate = 0;

var room_E16N58_external_rooms: conf_external_rooms = {
    "E17N59": {
        "active": false,
        "controller": {
            "reserve": true,
            "path_time": 82,
            "rooms_forwardpath": ['E16N58', 'E17N58', 'E17N59'],
            "poses_forwardpath": [25, 23],
            "rooms_backwardpath": ['E17N59', 'E17N58', 'E16N58'],
            "poses_backwardpath": [23, 25],
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
                "poses_forwardpath": [25, 23],
                "rooms_backwardpath": ['E17N59', 'E17N58', 'E16N58'],
                "poses_backwardpath": [23, 25],
            },
        },
    },
    "E17N58": {
        "active": false,
        "controller": {
            "reserve": true,
            "path_time": 70,
            "rooms_forwardpath": ['E16N58', 'E17N58'],
            "poses_forwardpath": [25],
            "rooms_backwardpath": ['E17N58', 'E16N58'],
            "poses_backwardpath": [25],
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
                "poses_forwardpath": [25],
                "rooms_backwardpath": ['E17N58', 'E16N58'],
                "poses_backwardpath": [25],
            },
        },
    },
    "E16N57": {
        "active": false,
        "controller": {
            "reserve": true,
            "path_time": 58,
            "rooms_forwardpath": ['E16N58', 'E17N58'],
            "poses_forwardpath": [25],
            "rooms_backwardpath": ['E17N58', 'E16N58'],
            "poses_backwardpath": [25],
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
                "rooms_forwardpath": ['E16N58', 'E17N58'],
                "poses_forwardpath": [25],
                "rooms_backwardpath": ['E17N58', 'E16N58'],
                "poses_backwardpath": [25],
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
    main_link_amount_source: room_E16N58_main_link_amount_source,
    main_link_amount_sink: room_E16N58_main_link_amount_sink,
    maincarriers: room_E16N58_maincarriers,
    max_transfer: room_E16N58_max_transfer,
    stay_pos: room_E16N58_stay_pos,
    mineral_stay_pos: room_E16N58_mineral_stay_pos,
    safe_pos: room_E16N58_safe_pos,
    storage_bar: room_E16N58_storage_bar,
    external_rooms: room_E16N58_external_rooms,
    wall_strength: room_E16N58_wall_strength,
    wall_rate: room_E16N58_wall_rate,
};


var room_E15N58_towers: conf_towers = {};
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
        "pos": [37, 18],
        "source": true,
    },
    "CT": {
        "pos": [34, 6],
        "source": false,
    },
    "MAIN": {
        "pos": [42, 2],
        "source": true,
    },
    "L1": {
        "pos": [43, 10],
        "source": false,
    },
    "L2": {
        "pos": [33, 12],
        "source": false,
    },
}

var room_E15N58_labs: conf_lab = {
    'L1': {
        "pos": [41, 4],
        "state": "boost",
    },
    'L2': {
        "pos": [43, 5],
        "state": "source1",
    },
    'L3': {
        "pos": [43, 6],
        "state": "source2",
    },
    'L4': {
        "pos": [41, 5],
        "state": "react",
    },
    'L5': {
        "pos": [41, 6],
        "state": "react",
    },
    'L6': {
        "pos": [42, 6],
        "state": "react",
    },
    'L7': {
        "pos": [44, 6],
        "state": "react",
    },
    'L8': {
        "pos": [45, 6],
        "state": "react",
    },
    'L9': {
        "pos": [45, 5],
        "state": "react",
    },
    'L10': {
        "pos": [45, 4],
        "state": "react",
    },
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
        "number": 20,
    },
}

var room_E15N58_upgraders: conf_upgraders = {
    "locations": [
        //[34, 5],
        //[35, 5],
        [35, 6],
        //[34, 7],
        //[35, 7],
    ],
    "commuting_time": 40,
}
var room_E15N58_harvesters: conf_harvesters = {
    "S1": {
        "commuting_time": 75,
    },
    "S2": {
        "commuting_time": 48,
    },
}
var room_E15N58_main_link_amount_source = 600;
var room_E15N58_main_link_amount_sink = 400;
var room_E15N58_maincarriers: conf_maincarriers = {
    "MAIN": {
        "main_pos": [43, 3],
        "working_zone": [
            [43, 3],
            [43, 4],
            [42, 5],
            [44, 5]
        ],
        "waiting_pos": [43, 2],
        "n_carry": 6,
        "link_name": "MAIN",
        "link_amount": room_E15N58_main_link_amount_source,
        "storage": true,
        "terminal": true
    }
}

var room_E15N58_max_transfer: number = 8;
var room_E15N58_stay_pos: number[] = [42, 15];
var room_E15N58_mineral_stay_pos: number[] = [7, 18];
var room_E15N58_safe_pos: number[] = [33, 4];
var room_E15N58_storage_bar: number[] = [200000];
var room_E15N58_wall_strength = 20000;
var room_E15N58_wall_rate = 0;

var room_E15N58_external_rooms: conf_external_rooms = {
    "E15N59": {
        "active": false,
        "controller": {
            "reserve": true,
            "path_time": 50,
            "rooms_forwardpath": ['E15N58', 'E15N59'],
            "poses_forwardpath": [12],
            "rooms_backwardpath": ['E15N59', 'E15N58'],
            "poses_backwardpath": [12],
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
                "poses_forwardpath": [12],
                "rooms_backwardpath": ['E15N59', 'E15N58'],
                "poses_backwardpath": [12],
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
                "poses_forwardpath": [12],
                "rooms_backwardpath": ['E15N59', 'E15N58'],
                "poses_backwardpath": [12],
            },
        },
    },
    "E14N59": {
        "active": false,
        "controller": {
            "reserve": true,
            "path_time": 52,
            "rooms_forwardpath": ['E15N58', 'E15N59', 'E14N59'],
            "poses_forwardpath": [12, 33],
            "rooms_backwardpath": ['E14N59', 'E15N59', 'E15N58'],
            "poses_backwardpath": [33, 12],
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
                "poses_forwardpath": [12, 33],
                "rooms_backwardpath": ['E14N59', 'E15N59', 'E15N58'],
                "poses_backwardpath": [33, 12],
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
                "poses_forwardpath": [12, 33],
                "rooms_backwardpath": ['E14N59', 'E15N59', 'E15N58'],
                "poses_backwardpath": [33, 12],
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
    main_link_amount_source: room_E15N58_main_link_amount_source,
    main_link_amount_sink: room_E15N58_main_link_amount_sink,
    maincarriers: room_E15N58_maincarriers,
    max_transfer: room_E15N58_max_transfer,
    stay_pos: room_E15N58_stay_pos,
    mineral_stay_pos: room_E15N58_mineral_stay_pos,
    safe_pos: room_E15N58_safe_pos,
    storage_bar: room_E15N58_storage_bar,
    external_rooms: room_E15N58_external_rooms,
    wall_strength: room_E15N58_wall_strength,
    wall_rate: room_E15N58_wall_rate,
};

var room_E14N51_towers: conf_towers = {};
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
    "MINE": {
        "pos": [16, 17],
        "RCL": 6,
    },
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
        "source": false,
    },
    "MAIN": {
        "pos": [17, 29],
        "source": true,
    },
    "T1": {
        "pos": [25, 29],
        "source": false,
    },
    "T2": {
        "pos": [22, 35],
        "source": false,
    },
}
var room_E14N51_labs: conf_lab = {
    'L1': {
        "pos": [14, 31],
        "state": "boost",
    },
    'L2': {
        "pos": [12, 29],
        "state": "source1",
    },
    'L3': {
        "pos": [13, 29],
        "state": "source2",
    },
    'L4': {
        "pos": [14, 28],
        "state": "react",
    },
    'L5': {
        "pos": [14, 27],
        "state": "react",
    },
    'L6': {
        "pos": [13, 27],
        "state": "react",
    },
    'L7': {
        "pos": [12, 27],
        "state": "react",
    },
    'L8': {
        "pos": [12, 28],
        "state": "react",
    },
    'L9': {
        "pos": [12, 30],
        "state": "react",
    },
    'L10': {
        "pos": [13, 31],
        "state": "react",
    },
};
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
        "number": 12,
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
    "commuting_time": 21,
}
var room_E14N51_harvesters: conf_harvesters = {
    "S1": {
        "commuting_time": 72,
    },
    "S2": {
        "commuting_time": 66,
    },
}
var room_E14N51_main_link_amount_source = 600;
var room_E14N51_main_link_amount_sink = 400;
var room_E14N51_maincarriers: conf_maincarriers = {
    "MAIN": {
        "main_pos": [16, 29],
        "working_zone": [
            [16, 29],
            [15, 29],
            [14, 29],
            [13, 28],
            [13, 30],
            [14, 30],
        ],
        "waiting_pos": [17, 28],
        "n_carry": 6,
        "link_name": "MAIN",
        "link_amount": room_E14N51_main_link_amount_source,
        "storage": true,
        "terminal": true
    }
}

var room_E14N51_max_transfer: number = 8;
var room_E14N51_stay_pos: number[] = [12, 34];
var room_E14N51_mineral_stay_pos: number[] = [17, 16];
var room_E14N51_safe_pos: number[] = [22, 4];
var room_E14N51_storage_bar: number[] = [100000, 300000, 500000];
var room_E14N51_wall_strength = 2000;
var room_E14N51_wall_rate = 0;

var room_E14N51_external_rooms: conf_external_rooms = {
    "E14N52": {
        "active": false,
        "controller": {
            "reserve": true,
            "path_time": 65,
            "rooms_forwardpath": ['E14N51', 'E14N52'],
            "poses_forwardpath": [31],
            "rooms_backwardpath": ['E14N52', 'E14N51'],
            "poses_backwardpath": [31],
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
                "poses_forwardpath": [26],
                "rooms_backwardpath": ['E14N52', 'E14N51'],
                "poses_backwardpath": [26],
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
                "poses_forwardpath": [31],
                "rooms_backwardpath": ['E14N52', 'E14N51'],
                "poses_backwardpath": [31],
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
    labs: room_E14N51_labs,
    init: room_E14N51_init,
    carriers: room_E14N51_carriers,
    upgraders: room_E14N51_upgraders,
    harvesters: room_E14N51_harvesters,
    main_link_amount_source: room_E14N51_main_link_amount_source,
    main_link_amount_sink: room_E14N51_main_link_amount_sink,
    maincarriers: room_E14N51_maincarriers,
    max_transfer: room_E14N51_max_transfer,
    stay_pos: room_E14N51_stay_pos,
    mineral_stay_pos: room_E14N51_mineral_stay_pos,
    safe_pos: room_E14N51_safe_pos,
    storage_bar: room_E14N51_storage_bar,
    external_rooms: room_E14N51_external_rooms,
    wall_strength: room_E14N51_wall_strength,
    wall_rate: room_E14N51_wall_rate,
};

var room_E19N53_towers: conf_towers = {
    "T1": {
        "pos": [18, 11],
        "RCL": 3,
    },
};
var room_E19N53_sources: conf_sources = {
    "S1": {
        "id": < Id < Source >> "5bbcae049099fc012e6384f2",
    },
    "S2": {
        "id": < Id < Source >> "5bbcae049099fc012e6384f0",
    },
};
var room_E19N53_mine: conf_mine = {
    "id": < Id < Mineral >> "5bbcb37c40062e4259e9443d",
};
var room_E19N53_containers: conf_containers = {
    "S1": {
        "pos": [9, 26],
        "RCL": 1,
    },
    "S2": {
        "pos": [5, 6],
        "RCL": 1,
    },
    "CT": {
        "pos": [38, 16],
        "RCL": 1,
    },
    "MD": {
        "pos": [18, 13],
        "RCL": 1,
    },
    "MINE": {
        "pos": [33, 6],
        "RCL": 6,
    },
}
var room_E19N53_link_transfer_gap: number = 400;
var room_E19N53_link_transfer_amount: number = 400;
var room_E19N53_links: conf_links = {
    "S1": {
        "pos": [8, 25],
        "source": true,
    },
    "S2": {
        "pos": [6, 5],
        "source": true,
    },
    "CT": {
        "pos": [38, 17],
        "source": false,
    },
    "MAIN": {
        "pos": [25, 11],
        "source": true,
    },
    "L1": {
        "pos": [17, 16],
        "source": false,
    },
    "L2": {
        "pos": [29, 5],
        "source": false,
    },
}
var room_E19N53_labs: conf_lab = {
    "L1": {
        "pos": [22, 12],
        "state": "boost",
    },
    "L2": {
        "pos": [24, 12],
        "state": "source1",
    },
    "L3": {
        "pos": [24, 13],
        "state": "source2",
    },
    "L4": {
        "pos": [23, 13],
        "state": "react",
    },
    "L5": {
        "pos": [22, 11],
        "state": "react",
    },
    "L6": {
        "pos": [22, 13],
        "state": "react",
    },
    "L7": {
        "pos": [25, 13],
        "state": "react",
    },
    "L8": {
        "pos": [26, 13],
        "state": "react",
    },
    "L9": {
        "pos": [26, 12],
        "state": "react",
    },
    "L10": {
        "pos": [26, 11],
        "state": "react",
    },
};
var room_E19N53_carrier_preference_S1: conf_preference[] = [{
    "container": "MD",
    "points": 0,
}, {
    "container": "CT",
    "points": 300,
}]

var room_E19N53_carrier_preference_S2: conf_preference[] = [{
    "container": "MD",
    "points": 0,
}, {
    "container": "CT",
    "points": 300,
}]

var room_E19N53_carrier_preference_storage: conf_preference[] = [{
    "container": "CT",
    "points": 0,
}]

var room_E19N53_init: conf_init = {
    "S1": {
        "number": 0,
    },
    "S2": {
        "number": 0,
    },
}

var room_E19N53_carriers: conf_carriers = {
    "S1": {
        "preferences": room_E19N53_carrier_preference_S1,
        "number": 14,
    },
    "S2": {
        "preferences": room_E19N53_carrier_preference_S2,
        "number": 14,
    },
    "storage": {
        "preferences": room_E19N53_carrier_preference_storage,
        "number": 12,
    },
}

var room_E19N53_upgraders: conf_upgraders = {
    "locations": [
        [39, 16],
        [39, 17],
        [38, 16],
        [37, 17],
        [38, 17],
    ],
    "commuting_time": 57,
    "boost_request": "GH",
}
var room_E19N53_harvesters: conf_harvesters = {
    "S1": {
        "commuting_time": 42,
    },
    "S2": {
        "commuting_time": 42,
    },
}
var room_E19N53_main_link_amount_source = 600;
var room_E19N53_main_link_amount_sink = 400;
var room_E19N53_maincarriers: conf_maincarriers = {
    "MAIN": {
        "main_pos": [24, 10],
        "working_zone": [
			[24, 10],
            [24, 11],
			[23, 12],
			[25, 12],
        ],
        "waiting_pos": [22, 9],
        "n_carry": 6,
        "link_name": "MAIN",
        "link_amount": room_E19N53_main_link_amount_source,
        "storage": true,
        "terminal": true,
    }
}

var room_E19N53_max_transfer: number = 8
var room_E19N53_stay_pos: number[] = [21, 8];
var room_E19N53_mineral_stay_pos: number[] = [33, 7];
var room_E19N53_safe_pos: number[] = [27, 4];
var room_E19N53_storage_bar: number[] = [100000, 300000];
var room_E19N53_wall_strength = 2000;
var room_E19N53_wall_rate = 0;

var room_E19N53_external_rooms: conf_external_rooms = {
    "E19N54": {
        "active": true,
        "controller": {
            "reserve": true,
            "path_time": 56,
            "rooms_forwardpath": ['E19N53', 'E19N54'],
            "poses_forwardpath": [33],
            "rooms_backwardpath": ['E19N54', 'E19N53'],
            "poses_backwardpath": [33],
        },
        "sources": {
            "S1": {
                "id": < Id < Source >> "5bbcae049099fc012e6384ed",
                "harvest_pos": [34, 21],
                "reserve": true,
                "single_distance": 45,
                "n_carry": 10,
                "n_carrier": 2,
                "carry_end": {
                    "type": "storage",
                    "name": ""
                },
                "rooms_forwardpath": ['E19N53', 'E19N54'],
                "poses_forwardpath": [33],
                "rooms_backwardpath": ['E19N54', 'E19N53'],
                "poses_backwardpath": [33],
            },
            "S2": {
                "id": < Id < Source >> "5bbcae049099fc012e6384ec",
                "harvest_pos": [21, 12],
                "reserve": true,
                "single_distance": 53,
                "n_carry": 12,
                "n_carrier": 2,
                "carry_end": {
                    "type": "storage",
                    "name": "",
                },
                "rooms_forwardpath": ['E19N53', 'E19N54'],
                "poses_forwardpath": [33],
                "rooms_backwardpath": ['E19N54', 'E19N53'],
                "poses_backwardpath": [33],
            },
        },
    },
}
var room_E19N53: room_conf = {
    towers: room_E19N53_towers,
    sources: room_E19N53_sources,
    mine: room_E19N53_mine,
    containers: room_E19N53_containers,
    links: room_E19N53_links,
    link_transfer_gap: room_E19N53_link_transfer_gap,
    link_transfer_amount: room_E19N53_link_transfer_amount,
    labs: room_E19N53_labs,
    init: room_E19N53_init,
    carriers: room_E19N53_carriers,
    upgraders: room_E19N53_upgraders,
    harvesters: room_E19N53_harvesters,
    main_link_amount_source: room_E19N53_main_link_amount_source,
    main_link_amount_sink: room_E19N53_main_link_amount_sink,
    maincarriers: room_E19N53_maincarriers,
    max_transfer: room_E19N53_max_transfer,
    stay_pos: room_E19N53_stay_pos,
    mineral_stay_pos: room_E19N53_mineral_stay_pos,
    safe_pos: room_E19N53_safe_pos,
    storage_bar: room_E19N53_storage_bar,
    external_rooms: room_E19N53_external_rooms,
    wall_strength: room_E19N53_wall_strength,
    wall_rate: room_E19N53_wall_rate,
};

var room_E19N51_towers: conf_towers = {
    /*
    "T1": {
        "pos": [18, 11],
        "RCL": 3,
    },
	 */
};
var room_E19N51_sources: conf_sources = {
    "S1": {
        "id": < Id < Source >> "5bbcae059099fc012e6384f9",
    },
    "S2": {
        "id": < Id < Source >> "5bbcae059099fc012e6384f8",
    },
};
var room_E19N51_mine: conf_mine = {
    "id": < Id < Mineral >> "5bbcb37c40062e4259e9443f",
};
var room_E19N51_containers: conf_containers = {
    "S1": {
        "pos": [23, 17],
        "RCL": 1,
    },
    "S2": {
        "pos": [24, 10],
        "RCL": 1,
    },
    "MD": {
        "pos": [18, 16],
        "RCL": 1,
    },
    "CT": {
        "pos": [17, 21],
        "RCL": 1,
    },
    "MINE": {
        "pos": [39, 6],
        "RCL": 6,
    },
}
var room_E19N51_link_transfer_gap: number = 400;
var room_E19N51_link_transfer_amount: number = 400;
var room_E19N51_links: conf_links = {
    "S1": {
        "pos": [22, 16],
        "source": true,
        "RCL": 7,
    },
    "S2": {
        "pos": [25, 10],
        "source": true,
        "RCL": 6,
    },
    "CT": {
        "pos": [17, 22],
        "source": false,
        "RCL": 5,
    },
    "MAIN": {
        "pos": [25, 21],
        "source": true,
        "RCL": 5,
    },
}
var room_E19N51_labs: conf_lab = {
	"B1": {
		"pos": [22, 20],
		"state": "boost",
	},
	"S1": {
		"pos": [24, 18],
		"state": "source1",
	},
	"S2": {
		"pos": [24, 19],
		"state": "source2",
	},
	"R1": {
		"pos": [22, 19],
		"state": "react",
	},
	"R2": {
		"pos": [22, 18],
		"state": "react",
	},
	"R3": {
		"pos": [23, 18],
		"state": "react",
	},
	"R4": {
		"pos": [25, 18],
		"state": "react",
	},
	"R5": {
		"pos": [26, 18],
		"state": "react",
	},
	"R6": {
		"pos": [26, 19],
		"state": "react",
	},
	"R7": {
		"pos": [26, 20],
		"state": "react",
	},
};
var room_E19N51_carrier_preference_S1: conf_preference[] = [{
    "container": "MD",
    "points": 300,
}, {
    "container": "CT",
    "points": 0,
}]

var room_E19N51_carrier_preference_S2: conf_preference[] = [{
    "container": "MD",
    "points": 0,
}, {
    "container": "CT",
    "points": 300,
}]

var room_E19N51_carrier_preference_storage: conf_preference[] = [{
    "container": "CT",
    "points": 0,
}]

var room_E19N51_init: conf_init = {
    "S1": {
        "number": 0,
    },
    "S2": {
        "number": 0,
    },
}

var room_E19N51_carriers: conf_carriers = {
    "S1": {
        "preferences": room_E19N51_carrier_preference_S1,
        "number": 4,
    },
    "S2": {
        "preferences": room_E19N51_carrier_preference_S2,
        "number": 6,
    },
    "storage": {
        "preferences": room_E19N51_carrier_preference_storage,
        "number": 12,
    },
}

var room_E19N51_upgraders: conf_upgraders = {
    "locations": [
        [16, 22],
        [16, 21],
        [17, 21],
        [18, 22],
        [17, 22],
    ],
    "commuting_time": 12,
    "boost_request": "GH",
}
var room_E19N51_harvesters: conf_harvesters = {
    "S1": {
        "commuting_time": 15,
    },
    "S2": {
        "commuting_time": 24,
    },
}
var room_E19N51_main_link_amount_source = 600;
var room_E19N51_main_link_amount_sink = 400;
var room_E19N51_maincarriers: conf_maincarriers = {
    "MAIN": {
        "main_pos": [24, 21],
        "working_zone": [
			[24, 21],
			[24, 20],
			[23, 20],
			[23, 19],
			[25, 19],
        ],
        "waiting_pos": [22, 21],
        "n_carry": 6,
        "link_name": "MAIN",
        "link_amount": room_E19N51_main_link_amount_source,
        "storage": true,
        "terminal": true,
    }
}

var room_E19N51_max_transfer: number = 8
var room_E19N51_stay_pos: number[] = [20, 23];
var room_E19N51_mineral_stay_pos: number[] = [39, 7];
var room_E19N51_safe_pos: number[] = [27, 23];
var room_E19N51_storage_bar: number[] = [100000, 300000, 500000];
var room_E19N51_wall_strength = 2000;
var room_E19N51_wall_rate = 0;

var room_E19N51_external_rooms: conf_external_rooms = {
    "E19N52": {
        "active": false,
        "controller": {
            "reserve": true,
            "path_time": 60,
            "rooms_forwardpath": ['E19N51', 'E19N52'],
            "poses_forwardpath": [13],
            "rooms_backwardpath": ['E19N52', 'E19N51'],
            "poses_backwardpath": [13],
        },
        "sources": {
            "S1": {
                "id": < Id < Source >> "5bbcae049099fc012e6384f5",
                "harvest_pos": [36, 27],
                "reserve": true,
                "single_distance": 48,
                "n_carry": 10,
                "n_carrier": 2,
                "carry_end": {
                    "type": "storage",
                    "name": ""
                },
                "rooms_forwardpath": ['E19N51', 'E19N52'],
                "poses_forwardpath": [29],
                "rooms_backwardpath": ['E19N52', 'E19N51'],
                "poses_backwardpath": [29],
            },
            "S2": {
                "id": < Id < Source >> "5bbcae049099fc012e6384f6",
                "harvest_pos": [46, 43],
                "reserve": true,
                "single_distance": 74,
                "n_carry": 16,
                "n_carrier": 2,
                "carry_end": {
                    "type": "storage",
                    "name": "",
                },
                "rooms_forwardpath": ['E19N51', 'E19N52'],
                "poses_forwardpath": [29],
                "rooms_backwardpath": ['E19N52', 'E19N51'],
                "poses_backwardpath": [29],
            },
        },
    },
}
var room_E19N51: room_conf = {
    towers: room_E19N51_towers,
    sources: room_E19N51_sources,
    mine: room_E19N51_mine,
    containers: room_E19N51_containers,
    links: room_E19N51_links,
    link_transfer_gap: room_E19N51_link_transfer_gap,
    link_transfer_amount: room_E19N51_link_transfer_amount,
    labs: room_E19N51_labs,
    init: room_E19N51_init,
    carriers: room_E19N51_carriers,
    upgraders: room_E19N51_upgraders,
    harvesters: room_E19N51_harvesters,
    main_link_amount_source: room_E19N51_main_link_amount_source,
    main_link_amount_sink: room_E19N51_main_link_amount_sink,
    maincarriers: room_E19N51_maincarriers,
    max_transfer: room_E19N51_max_transfer,
    stay_pos: room_E19N51_stay_pos,
    mineral_stay_pos: room_E19N51_mineral_stay_pos,
    safe_pos: room_E19N51_safe_pos,
    storage_bar: room_E19N51_storage_bar,
    external_rooms: room_E19N51_external_rooms,
    wall_strength: room_E19N51_wall_strength,
    wall_rate: room_E19N51_wall_rate,
};

export function distance_metric(room_name: string, pos1: RoomPosition, pos2: RoomPosition): number {
    return pos1.getRangeTo(pos2);
}

Memory.rooms_conf = {
    "E15N58": room_E15N58,
    "E16N58": room_E16N58,
    "E14N51": room_E14N51,
    "E19N53": room_E19N53,
    "E19N51": room_E19N51,
};
global.reaction_priority={
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
global.mineral_storage_room = {
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
global.mineral_minimum_amount = {
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
Memory.help_list = {
    /*
    "E14N51": {
        "E19N51": {
			"rooms_forwardpath": ['E14N51', 'E14N50',  'E15N50', 'E16N50', 'E17N50', 'E18N50', 'E19N50', 'E19N51'],
			"poses_forwardpath": [22, 16, 16, 16, 16, 16, 11],
            "commuting_distance": 300,
			"n_carrys": {
				"S1": 2,
				"S2": 4,
			}
        }
    }
	*/
};
Memory.username = 'SUSYUSTC';
Memory.defender_responsible_types = {
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
import * as spawning_func from "./spawning_func"
for (var name in Memory.defender_responsible_types) {
    Memory.defender_responsible_types[name].cost = spawning_func.get_cost(spawning_func.fullreturnbody(Memory.defender_responsible_types[name].body));
}
