interface RoomMemory {
    storage_list ? : Id < AnyStorageStructure > [];
    tower_list ? : Id < StructureTower > [];
    spawn_list ? : Id < StructureSpawn > [];
    total_energy ? : number;
    total_maxenergy ? : number;
    container_mode ? : boolean;
    mine_harvestable ? : boolean;
    sites_total_progressleft ? : number;
    danger_mode ? : boolean;
    link_modes ? : string[];
    invaded_external_rooms ? : {
        [key: string]: string
    };
}
interface CreepMemory {
    role: string;
    source_name ? : string;
    harvesting ? : boolean;
    home_room_name ? : string;
    external_room_name ? : string;
    rooms_forwardpath ? : string[];
    names_forwardpath ? : string[];
    rooms_backwardpath ? : string[];
    names_backwardpath ? : string[];
    transfer_target ? : string;
    waiting ? : boolean;
    cost ? : number;
    defender_type ? : string;
    defending_room ? : string;
    maincarrier_type ? : string;
}
interface SpawnMemory {
    spawning_time ? : number;
    can_suicide ? : boolean;
}
interface conf_towers {
    [key: string]: {
        pos: number[];
        finished ? : boolean;
        id ? : Id < StructureTower > ;
        RCL ? : number;
    }
}
interface conf_sources {
    [key: string]: {
        id: Id < Source > ;
    }
}
interface conf_structures < T > {
    [key: string]: {
        pos: number[];
        id ? : Id < T > ;
        RCL ? : number;
        finished ? : boolean;
        source ? : boolean;
        amount ? : number;
    }
}
/*
interface conf_links {
    [key: string]: {
        pos: number[];
        id: Id < StructureLink > ;
        RCL ? : number;
        finished ? : boolean;
    }
}
interface conf_containers {
    [key: string]: {
        pos: number[];
        id: Id < StructureContainer > ;
        RCL ? : number;
        finished ? : boolean;
    }
}
 */
type conf_links = conf_structures < StructureLink > ;
type conf_containers = conf_structures < StructureContainer > ;
interface conf_mine {
    id: Id < Mineral > ;
    type ? : ResourceConstant;
    density ? : number;
}
interface conf_init {
    [key: string]: {
        number: number;
    }
}
interface conf_preference {
    container: string;
    points: number;
}
interface conf_carriers {
    [key: string]: {
        number: number;
        preferences: conf_preference[];
    }
}
interface conf_upgraders {
    locations: {
        "link": number[][],
        "container": number[][]
    };
    commuting_time: number;
}
interface conf_harvesters {
    [key: string]: {
        commuting_time: number;
    }
}
interface conf_maincarriers {
    "MAIN": {
        pos: number[];
        n_carry: number;
        link_name: string;
		link_amount: number;
        storage : boolean;
        terminal : boolean;
    }
}
interface conf_external_rooms {
    [key: string]: {
        controller: {
            reserve: boolean;
            path_time: number;
            rooms_forwardpath: string[];
            names_forwardpath: string[];
            rooms_backwardpath: string[];
            names_backwardpath: string[];
        }
        sources: {
            [key: string]: {
                id: Id < Source > ;
                harvest_pos: number[];
                reserve: boolean;
                single_distance: number;
                n_carry: number;
                n_carrier: number;
                carry_end: {
                    "type": string;
                    "name": string;
                };
                rooms_forwardpath: string[];
                names_forwardpath: string[];
                rooms_backwardpath: string[];
                names_backwardpath: string[];
                harvester_name ? : string;
                transfer_target_id ? : Id < AnyStorageStructure > ;
            }
        }
    }
}
interface room_conf {
    towers: conf_towers;
    sources: conf_sources;
    mine: conf_mine;
    containers: conf_containers;
    links: conf_links;
    link_transfer_gap: number;
    link_transfer_amount: number;
    init: conf_init;
    carriers: conf_carriers;
    upgraders: conf_upgraders;
    harvesters: conf_harvesters;
    maincarriers: conf_maincarriers;
    max_transfer: number;
    stay_pos: number[];
    external_rooms: conf_external_rooms;
    wall_strength: number;
}
interface Memory {
    creeps: {
        [name: string]: CreepMemory
    };
    powerCreeps: {
        [name: string]: PowerCreepMemory
    };
    flags: {
        [name: string]: FlagMemory
    };
    rooms: {
        [name: string]: RoomMemory
    };
    spawns: {
        [name: string]: SpawnMemory
    };
    rooms_conf: {
        [key: string]: room_conf
    };
    controlled_rooms ? : string[];
    help_list ? : any;
    username ? : any
    performance_mode ? : boolean;
    advanced_mode ? : boolean;
    debug_mode ? : boolean;
    rerunning ? : boolean;
}
type Structure_Wall_Rampart = StructureWall | StructureRampart;
interface invader_type {
    level: number;
    name: string;
    boost: boolean;
}
interface type_room_list_bridge {
    type: string;
    rooms: string[];
    coor_same: number;
    name: string;
};
interface type_room_list_graph {
    [key: string]: {
        [key: string]: number;
    }
};
interface type_room_list_room {
    room_name: string;
    connected_rooms: {
        [key: string]: { // room_name
            [key: string]: { // bridge_name
                exit: number[];
                standpoint: number[];
                index: number;
            };
        };
    };
};
interface type_room_list_rooms {
    [key: string]: type_room_list_room;
};
interface type_spawn_json {
    rolename: string;
    creepname: string;
    body: BodyPartConstant[];
    cost: number;
    memory: any;
    affordable: boolean;
    [key: string]: any;
};
type AnyStorageStructure = StructureLink | StructureTower | StructureSpawn | StructureContainer | StructureExtension | StructureStorage | StructureTerminal;
interface type_creep_components {
    n_move: number;
    n_work: number;
    n_carry: number;
    n_attack: number;
    n_rangedattack: number;
    n_heal: number;
};
