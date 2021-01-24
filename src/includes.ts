type type_external_room_status = {
    [key: string]: { // room_name
        "defense_type": string;
        "reserver": string;
        "invader_core_existance": boolean;
        "safe": boolean;
    }
}
type type_creep_role = "init" | "harvester" | "carrier" | "builder" | "upgrader" | "transferer" | "mineharvester" | "maincarrier" | "specialcarrier" | "externalharvester" | "externalcarrier" | "external_init" | "reserver" | "defender" | "invader_core_attacker" | "hunter" | "help_harvester" | "help_carrier" | "help_builder" | "wall_repairer"
type type_stored_path = {
    path: number[][];
    target: number[];
    time_left: number;
}
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
    lack_energy ? : boolean;
    storage_level ? : number;
    external_room_status ? : type_external_room_status;
    n_needed_wallrepair ? : number;
    n_sites ? : number;
    ticks_to_spawn_builder ? : number;
    list_of_structures_id ? : string [];
    list_of_sites_id ? : string [];
    objects_updated ? : boolean;
}
interface CreepMemory {
    role: type_creep_role;
    source_name ? : string;
    harvesting ? : boolean;
    home_room_name ? : string;
    external_room_name ? : string;
    transfer_target ? : string;
    movable: boolean;
    cost ? : number;
    defender_type ? : string;
    defending_room ? : string;
    maincarrier_type ? : string;
    carrying_mineral ? : boolean;
    lab_carrying_target_id ? : Id < StructureLab > ;
    lab_carrying_resource ? : ResourceConstant;
    lab_carrying_forward ? : boolean;
    boost_request ? : type_boost_request;
    stored_path ? : type_stored_path;
    wall_to_repair ? : Id < Structure_Wall_Rampart > ;
}
interface SpawnMemory {
    spawning_time ? : number;
    can_suicide ? : boolean;
}
interface conf_sources {
    [key: string]: {
        id: Id < Source > ;
        RCL ? : number;
        finished ? : boolean;
    }
}
interface conf_mine {
    id: Id < Mineral > ;
    type ? : ResourceConstant;
    density ? : number;
    amount ? : number;
}
interface conf_structures {
    [key: string]: {
        pos: number[];
        id ? : Id < Structure > ;
        exists ? : boolean;
        finished ? : boolean;
        RCL ? : number;
    }
}
interface conf_towers extends conf_structures {
    [key: string]: {
        pos: number[];
        id ? : Id < StructureTower > ;
        exists ? : boolean;
        finished ? : boolean;
        RCL ? : number;
    }
}
interface conf_links extends conf_structures {
    [key: string]: {
        pos: number[];
        source: boolean;
        id ? : Id < StructureLink > ;
        exists ? : boolean;
        finished ? : boolean;
        RCL ? : number;
    }
}
interface conf_containers extends conf_structures {
    [key: string]: {
        pos: number[];
        id ? : Id < StructureContainer > ;
        exists ? : boolean;
        finished ? : boolean;
        RCL ? : number;
    }
}
interface conf_lab extends conf_structures {
    [key: string]: {
        pos: number[];
        object: MineralBoostConstant;
        body: BodyPartConstant;
        id ? : Id < StructureLab > ;
        exists ? : boolean;
        finished ? : boolean;
        effect ? : string;
        active ? : boolean;
    }
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
    locations: number[][];
    commuting_time: number;
    boost_request ? : type_boost_request;
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
        storage: boolean;
        terminal: boolean;
    }
}
interface conf_external_rooms {
    [key: string]: {
        active: boolean;
        controller: {
            reserve: boolean;
            path_time: number;
            rooms_forwardpath: string[];
            poses_forwardpath: number[];
            rooms_backwardpath: string[];
            poses_backwardpath: number[];
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
                poses_forwardpath: number[];
                rooms_backwardpath: string[];
                poses_backwardpath: number[];
                harvester_name ? : string;
                transfer_target_id ? : Id < AnyStorageStructure > ;
            }
        }
    }
}
interface conf_hunting {
    room_name: string;
    number: number;
    rooms_forwardpath: string[];
    poses_forwardpath: number[];
    rooms_backwardpath: string[];
    poses_backwardpath: number[];
    body: type_body_components;
    stay_pos: number[];
}
interface room_conf {
    towers: conf_towers;
    sources: conf_sources;
    mine: conf_mine;
    containers: conf_containers;
    extensions ? : number[][];
    links: conf_links;
    link_transfer_gap: number;
    link_transfer_amount: number;
    init: conf_init;
    carriers: conf_carriers;
    upgraders: conf_upgraders;
    harvesters: conf_harvesters;
    main_link_amount_source: number;
    main_link_amount_sink: number;
    maincarriers: conf_maincarriers;
    max_transfer: number;
    stay_pos: number[];
    safe_pos: number[];
    storage_bar: number[];
    external_rooms: conf_external_rooms;
    wall_strength: number;
    wall_rate: number;
    max_builder_size: number;
    max_build_parts: number;
    labs ? : conf_lab;
    hunting ? : conf_hunting;
}
type type_body_components = {
    [key in BodyPartConstant] ? : number
};
//type type_body_components= Record<BodyPartConstant, number>;
interface type_defender_responsible_types {
    [key: string]: {
        list: string[];
        body: type_body_components;
        cost: number;
    };
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
    username ? : any
    performance_mode ? : boolean;
    advanced_mode ? : boolean;
    debug_mode ? : boolean;
    rerunning ? : boolean;
    defender_responsible_types ? : type_defender_responsible_types;
    help_list ? : type_help_list;
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
type AnyStorageStructure = StructureLink | StructureTower | StructureSpawn | StructureContainer | StructureExtension | StructureStorage | StructureTerminal | StructureLab;
interface type_creep_components {
    n_move: number;
    n_work: number;
    n_carry: number;
    n_attack: number;
    n_rangedattack: number;
    n_heal: number;
};
type type_rooms_ignore_pos = {
    [key: string]: number[][];
};
type type_help_list = {
    [key: string]: {
        [key: string]: {
            rooms_forwardpath: string[];
            poses_forwardpath: number[];
            commuting_distance: number;
            n_carrys: {
                [key: string]: number;
            }
        }
    }
}
type type_boost_request = {
    object ? : MineralBoostConstant;
    body ? : BodyPartConstant;
    effect ? : string;
}

interface Game {
    costmatrices: {
        [key: string]: CostMatrix
    }
	tick_cpu ?: {
		[key: string]: number;
	}
}

declare var Game: Game;

declare module NodeJS {
	interface Global {
		basic_costmatrices: {
			[key: string]: CostMatrix;
		}
	}
}
