function getside(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {
    return ((x - x1) * (y2 - y1) - (y - y1) * (x2 - x1) > 0)
}

Memory.controlled_rooms = ['W7N3']

var room_W7N3_towers: conf_towers = {
    "T1": {
        "pos": [33, 6],
        "RCL": 3
    },
    "T2": {
        "pos": [43, 17],
        "RCL": 5
    }
};
var room_W7N3_sources: conf_sources = {
    "S1": {
        "id": < Id < Source >> "9263077296e02bb"
    },
    "S2": {
        "id": < Id < Source >> "c12d077296e6ac9"
    }
};
var room_W7N3_mine: conf_mine = {
    "id": < Id < Mineral >> "47af6164d20e3a3"
};
var room_W7N3_containers: conf_containers = {
    "S1": {
        "pos": [37, 7],
        "RCL": 2
    },
    "S2": {
        "pos": [42, 4],
        "RCL": 2
    },
    "CT": {
        "pos": [35, 19],
        "RCL": 2
    },
    "MINE": {
        "pos": [25, 29],
        "RCL": 6
    }
}

//room_W7N3.init_charge
var room_W7N3_link_transfer_gap: number = 400;
var room_W7N3_link_transfer_amount: number = 240;
var room_W7N3_links: conf_links = {
    /*
        "S1": {
            "pos": [15, 18]
        },
        "S2": {
            "pos": [36, 32]
        },
        "CT": {
            "pos": [17, 26]
        }
    */
}

var room_W7N3_carrier_preference_S1: conf_preference[] = [{
    "container": "CT",
    "points": 0,
}]

var room_W7N3_carrier_preference_S2: conf_preference[] = [{
    "container": "CT",
    "points": 0
}]

var room_W7N3_carrier_preference_storage: conf_preference[] = [{
    "container": "CT",
    "points": 0
}]

var room_W7N3_init: conf_init = {
    "S1": {
        "number": 2
    },
    "S2": {
        "number": 3
    },
}

var room_W7N3_carriers: conf_carriers = {
    "S1": {
        "preferences": room_W7N3_carrier_preference_S1,
        "number": 5
    },
    "S2": {
        "preferences": room_W7N3_carrier_preference_S2,
        "number": 6
    },
    "storage": {
        "preferences": room_W7N3_carrier_preference_storage,
        "number": 4
    },
}

var room_W7N3_upgraders: conf_upgraders = {
    "locations": [
        [36, 20],
        [35, 20],
        [34, 20],
        [35, 19],
        [34, 19]
    ],
    "commuting_time": 30
}

var room_W7N3_harvesters: conf_harvesters = {
    "S1": {
        "commuting_time": 10
    },
    "S2": {
        "commuting_time": 10
    }
}


var room_W7N3_max_transfer: number = 4
var room_W7N3_stay_pos: number[] = [48, 4];
var room_W7N3_wall_strength = 0;

var room_W7N3_external_rooms: conf_external_rooms = {
    "W7N4": {
        "controller": {
            "reserve": true,
            "path_time": 53,
            "rooms_forwardpath": ['W7N3', 'W7N4'],
            "names_forwardpath": ['right'],
            "rooms_backwardpath": ['W7N4', 'W7N3'],
            "names_backwardpath": ['right'],
        },
        "sources": {
            "S1": {
                "id": < Id < Source >> "c44207728e621fc",
                "harvest_pos": [13, 31],
                "reserve": true,
                "single_distance": 29,
                "n_carry": 6,
                "n_carrier": 2,
                "carry_end": {
                    "type": "storage",
                    "name": ""
                },
                "rooms_forwardpath": ['W7N3', 'W7N4'],
                "names_forwardpath": ['left'],
                "rooms_backwardpath": ['W7N4', 'W7N3'],
                "names_backwardpath": ['left'],
            },
            "S2": {
                "id": < Id < Source >> "80d207728e6597b",
                "harvest_pos": [40, 45],
                "reserve": true,
                "single_distance": 15,
                "n_carry": 6,
                "n_carrier": 1,
                "carry_end": {
                    "type": "storage",
                    "name": ""
                },
                "rooms_forwardpath": ['W7N3', 'W7N4'],
                "names_forwardpath": ['right'],
                "rooms_backwardpath": ['W7N4', 'W7N3'],
                "names_backwardpath": ['right'],
            }
        }
    }
};

var room_W7N3: room_conf = {
    towers: room_W7N3_towers,
    sources: room_W7N3_sources,
    mine: room_W7N3_mine,
    containers: room_W7N3_containers,
    links: room_W7N3_links,
    link_transfer_gap: room_W7N3_link_transfer_gap,
    link_transfer_amount: room_W7N3_link_transfer_amount,
    init: room_W7N3_init,
    carriers: room_W7N3_carriers,
    upgraders: room_W7N3_upgraders,
    harvesters: room_W7N3_harvesters,
    max_transfer: room_W7N3_max_transfer,
    stay_pos: room_W7N3_stay_pos,
    external_rooms: room_W7N3_external_rooms,
	wall_strength: room_W7N3_wall_strength
};

/*
var room_W7N9: any = {}
room_W7N9["towers"] = {
    "T1": {
        "pos": [11, 7],
        "RCL": 3
    },
    "T2": {
        "pos": [16, 30],
        "RCL": 5
    }
};
room_W7N9["sources"] = {
    "S1": {
        "id": "80fe077261d9126"
    },
    "S2": {
        "id": "fdc5077261d8ab4"
    }
};
room_W7N9["mine"] = {
    "id": "36f16164d0e3e49"
};
room_W7N9["containers"] = {
    "S1": {
        "pos": [19, 15],
        "RCL": 2
    },
    "S2": {
        "pos": [17, 29],
        "RCL": 2
    },
    "CT": {
        "pos": [10, 16],
        "RCL": 2
    },
    "MINE": {
        "pos": [42, 27],
        "RCL": 6
    }
}

//room_W7N9.init_charge
room_W7N9["link_transfer_gap"] = 400;
room_W7N9["link_transfer_amount"] = 240;
room_W7N9["links"] = {
        "S1": {
            "pos": [15, 18]
        },
        "S2": {
            "pos": [36, 32]
        },
        "CT": {
            "pos": [17, 26]
        }
}

var room_W7N9_carrier_preference_S1 = [{
    "container": "CT",
    "points": 0,
}]

var room_W7N9_carrier_preference_S2 = [{
    "container": "CT",
    "points": 0
}]

room_W7N9["init"] = {
    "S1": {
        "number": 3
    },
    "S2": {
        "number": 3
    },
}

room_W7N9["carrier"] = {
    "S1": {
        "preferences": room_W7N9_carrier_preference_S1,
        "number": 4
    },
    "S2": {
        "preferences": room_W7N9_carrier_preference_S2,
        "number": 12
    },
}

room_W7N9["upgrader"] = {
    "locations": [
        [9, 15],
        [9, 16],
        [9, 17],
        [10, 15],
        [10, 17]
    ],
    "commuting_time": 30
}

room_W7N9["harvester"] = {
    "S1": {
        "commuting_time": 10
    },
    "S2": {
        "commuting_time": 50
    }
}

room_W7N9["max_transfer"] = 4
room_W7N9["stay_pos"] = [19, 10];
//room_W7N9.wall_strength = 200000;

room_W7N9.external_rooms = {
    "E17N58": {
        "controller": {
            "reserve": true,
			"path_time": 70,
            "rooms_forwardpath": ['W7N9', 'E17N58'],
            "rooms_backwardpath": ['E17N58', 'W7N9']
        },
        "sources": {
            "S1": {
                "id": "5bbcade89099fc012e6381d0",
                "reserve": true,
                "single_distance": 28,
                "n_carry": 6,
                "n_carrier": 2,
                "carry_end": {
                    "type": "storage"
                },
                "kill_time": 20,
                "rooms_forwardpath": ['W7N9', 'E17N58'],
                "rooms_backwardpath": ['E17N58', 'W7N9']
            }
        }
    }
};
*/

export function distance_metric(room_name: string, pos1: RoomPosition, pos2: RoomPosition): number {
    if (room_name == 'W7N3') {
        return pos1.getRangeTo(pos2);
    } else if (room_name == 'W7N9') {
        var side1 = getside(pos1.x, pos1.y, 25, 18, 29, 17);
        var side2 = getside(pos2.x, pos2.y, 25, 18, 29, 17);
        if (side1 == side2) {
            return pos1.getRangeTo(pos2);
        } else {
            return pos1.getRangeTo(27, 18) + pos2.getRangeTo(27, 18);
        }
    }
}

Memory.rooms_conf = {
    "W7N3": room_W7N3
};
Memory.help_list = {};
Memory.username = 'SUSYUSTC';
