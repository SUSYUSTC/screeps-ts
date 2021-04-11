type type_external_room_status = {
    [key: string]: { // room_name
        defense_type: string;
        reserver: string;
        invader_core_existance: boolean;
        safe: boolean;
        time_last: number;
    }
}
type type_creep_role = "init" | "harvester" | "carrier" | "builder" | "upgrader" | "transferer" | "mineharvester" | "maincarrier" | "specialcarrier" | "wall_repairer" | "externalharvester" | "externalcarrier" | "externalbuilder" | "external_init" | "reserver" | "claimer" | "defender" | "invader_core_attacker" | "hunter" | "home_defender" | "help_harvester" | "help_carrier" | "help_builder" | "newroom_claimer" | "pb_attacker" | "pb_healer" | "pb_carrier" | "depo_container_builder" | "depo_energy_carrier" | "depo_harvester" | "depo_carrier";
type type_stored_path = {
    path: number[][];
    target: number[];
    time_left: number;
}
interface RoomMemory {
    energy_filling_list ? : Id < AnyStoreStructure > [];
    energy_storage_list ? : Id < AnyStoreStructure > [];
    storage_level ? : number;
    external_room_status ? : type_external_room_status;
    n_needed_wallrepair ? : number;
    n_sites ? : number;
    n_structures ? : number;
    ticks_to_spawn_builder ? : number;
    objects_updated ? : boolean;
    has_wall_to_repair ? : boolean;
    has_structures_to_repair ? : boolean;
    current_boost_request ? : type_current_boost_request;
    reaction_ready ? : boolean;
    reaction_request ? : type_reaction_request;
    objects_to_buy ? : {
        [key: string]: type_object_to_trade;
    }
    objects_to_sell ? : {
        [key: string]: type_object_to_trade;
    }
    market_cooldown ? : boolean;
    named_structures_status ? : type_all_named_structures_status
    unique_structures_status ? : type_all_unique_structures_status
    maincarrier_link_amount ? : number;
    is_mainlink_source ? : boolean;
    current_boost_creep ? : string;
    additional_spawn_queue ? : {
        first: type_additional_spawn[];
        last: type_additional_spawn[];
    }
    mean_wall_strength ? : number;
    mean_rampart_strength ? : number;
    n_walls ? : number;
    n_ramparts ? : number;
    external_resources ? : type_external_resources;
    sites_total_progressleft ? : number;
	powered_external_sites_total_progressleft ?: number;
    tower_list ? : Id < StructureTower > [];
    spawn_list ? : Id < StructureSpawn > [];
	resource_sending_request ?: type_resource_sending_request[];
	kept_resources ?: {
		[key: string] : {
			[key in ResourceConstant] ?: number;
		}
	}
	external_harvester ? : {
		[key: string]: {
			[key: string]: string;
		}
	}
}
interface type_all_named_structures_status {
    container: type_named_structures_status < StructureContainer > ;
    link: type_named_structures_status < StructureLink > ;
    lab: type_named_structures_status < StructureLab > ;
    spawn: type_named_structures_status < StructureSpawn > ;
};
interface type_all_unique_structures_status {
    terminal: type_unique_structures_status < StructureTerminal > ;
    storage: type_unique_structures_status < StructureStorage > ;
    factory: type_unique_structures_status < StructureFactory > ;
    nuker: type_unique_structures_status < StructureNuker > ;
    powerSpawn: type_unique_structures_status < StructurePowerSpawn > ;
    observer: type_unique_structures_status < StructureObserver > ;
    extractor: type_unique_structures_status < StructureExtractor > ;
};
interface type_resource_sending_request {
	room_to: string;
	resource: ResourceConstant;
	amount: number;
}
interface CreepMemory {
    role: type_creep_role;
    source_name ? : string;
    harvesting ? : boolean;
    home_room_name ? : string;
    external_room_name ? : string;
    transfer_target ? : string;
    movable: boolean;
	crossable: boolean;
    cost ? : number;
    defender_type ? : string;
    defending_room ? : string;
    carrying_mineral ? : boolean;
    lab_carrying_target_id ? : Id < StructureLab > ;
    lab_carrying_resource ? : ResourceConstant;
    lab_carrying_forward ? : boolean;
    stored_path ? : type_stored_path;
    wall_to_repair ? : Id < Structure_Wall_Rampart > ;
    boost_status ? : type_boost_status;
    resource_type ? : ResourceConstant;
    ready ? : boolean;
	pc_level ?: number;
	powered ?: boolean;
}
interface PowerCreepMemory {
    movable: boolean;
	crossable: boolean;
    stored_path ? : type_stored_path;
	previous_room: string;
	n_finished: number;
}
interface SpawnMemory {
    spawning_time ? : number;
    can_suicide ? : boolean;
}
interface conf_sources {
    [key: string]: Id < Source > ;
}
interface type_additional_spawn {
    name: string;
    body: BodyPartConstant[];
    memory: any;
}
type type_named_structures = "container" | "link" | "lab" | "spawn";
type type_unique_structures = "factory" | "nuker" | "storage" | "terminal" | "observer" | "powerSpawn" | "extractor";
type type_multiple_structures = "road" | "extension" | "tower";
interface type_named_structures_status < T > {
    [key: string]: {
        exists ? : boolean;
        finished ? : boolean;
        id ? : Id < T > ;
    }
}
interface type_unique_structures_status < T > {
    exists ? : boolean;
    finished ? : boolean;
    id ? : Id < T > ;
}
interface conf_named_structures {
    [key: string]: {
        pos: number[];
        RCL: number;
    }
}
interface conf_unique_structures {
    pos: number[];
    RCL: number;
}
interface conf_multiple_structures {
    [key: string]: number[][];
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
}
interface conf_harvesters {
    [key: string]: {
        commuting_time: number;
    }
}
interface conf_maincarrier {
    main_pos: number[];
    working_zone: number[][];
    waiting_pos: number[];
}
interface conf_external_rooms {
    [key: string]: {
        active: boolean;
		container: boolean;
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
                harvester_pos: number[];
                single_distance: number;
                n_carry_tot: number;
                carry_end: {
                    "type": string;
                    "name": string;
                };
                rooms_forwardpath: string[];
                poses_forwardpath: number[];
                rooms_backwardpath: string[];
                poses_backwardpath: number[];
            }
        };
		powered_source ?: {
			source_name: string;
			carrier_distance: number;
			carry_end: {
				type: string;
				name: string;
			};
			roads: number[][];
			id: Id<Source>;
			harvester_pos: number[];
			single_distance: number;
			rooms_forwardpath: string[];
			rooms_backwardpath: string[];
			poses_forwardpath: number[];
			poses_backwardpath: number[];
		}
    }
}
interface type_pb_status {
	name: string;
    id: Id < StructurePowerBank > ;
    xy: number[];
    status: number;
    time_last: number;
    rooms_path: string[];
    poses_path: number[];
    distance: number;
    pb_attacker_name: string;
    pb_healer_name: string;
	pb_carrier_names: string[];
	pb_carrier_sizes: number[];
    amount: number;
}
interface type_depo_status {
	name: string;
    id: Id < Deposit > ;
    xy: number[];
    status: number;
    time_last: number;
    rooms_path: string[];
    poses_path: number[];
    distance: number;
	last_cooldown: number;
	container_progress: number;
	depo_container_builder_name ?: string;
	depo_harvester_name ?: string;
	depo_energy_carrier_name ?: string;
	depo_carrier_name ?: string;
}
interface type_external_resources {
    pb: {
        [key: string]: type_pb_status;
    }
	depo: {
		[key: string]: type_depo_status;
	}
}
interface type_conf_hunting {
    room_name: string;
    number: number;
    rooms_forwardpath: string[];
    poses_forwardpath: number[];
    rooms_backwardpath: string[];
    poses_backwardpath: number[];
    body: type_body_components;
    stay_pos: number[];
}
interface type_conf_room {
    readonly sources: conf_sources;
    readonly mine: Id < Mineral > ;
    readonly spawns: conf_named_structures;
    readonly containers: conf_named_structures;
    readonly links: conf_named_structures;
    readonly labs: conf_named_structures;
    readonly towers: conf_multiple_structures;
    readonly roads: conf_multiple_structures;
    readonly extensions: conf_multiple_structures;
    readonly storage: conf_unique_structures;
    readonly terminal: conf_unique_structures;
    readonly factory: conf_unique_structures;
    readonly nuker: conf_unique_structures;
    readonly powerspawn: conf_unique_structures;
    readonly observer: conf_unique_structures;
    readonly extractor: conf_unique_structures;
    readonly carriers: conf_carriers;
    readonly upgraders: conf_upgraders;
    readonly harvesters: conf_harvesters;
    readonly maincarrier: conf_maincarrier;
    readonly transferer_stay_pos: number[];
    readonly mineral_stay_pos: number[];
    readonly safe_pos: number[];
    readonly external_rooms: conf_external_rooms;
    readonly defense_boundary: number[][];
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
    debug_mode ? : boolean;
    output_mode ? : boolean;
    rerunning ? : boolean;
    history_cpus ? : number[];
	pb_cooldown_time ?: number;
	product_request ?: type_product_request;
	final_product_request ?: type_product_request;
}
type Structure_Wall_Rampart = StructureWall | StructureRampart;
interface invader_type {
    level: number;
    name: string;
    boost: boolean;
}
interface type_spawn_json {
    rolename: string;
    creepname: string;
    body: BodyPartConstant[];
    cost: number;
    memory: any;
    affordable: boolean;
    [key: string]: any;
};
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
type GeneralMineralConstant = MineralConstant | MineralCompoundConstant;
type type_mineral_storage_room = {
    [key in string]: GeneralMineralConstant[];
}
type type_mineral_storage_amount = {
    [key in string]: {
        [key in GeneralMineralConstant] ? : number;
    }
}
type type_reaction_request = {
    reactant1: GeneralMineralConstant;
    reactant2: GeneralMineralConstant;
    product: MineralCompoundConstant;
}

type type_current_boost_request = {
    compound: MineralBoostConstant;
    amount: number;
}

type type_boost_status = {
    boosting: boolean;
    boost_finished: boolean;
}

type type_creep_boost_request = {
    [key in BodyPartConstant] ? : MineralBoostConstant;
}

type type_mine_status = {
    density: number;
    type: MineralConstant;
    amount: number;
    harvestable: boolean;
}
interface Game {
    costmatrices: {
        [key: string]: CostMatrix
    }
    tick_cpu ? : {
        [key: string]: number;
    }
    tick_cpu_main ? : {
        [key: string]: number;
    }
    mineral_storage_amount ? : type_mineral_storage_amount;
    memory: {
        [key: string]: {
            danger_mode ? : boolean;
            link_modes ? : string[];
            container_modes_all ? : boolean;
            lack_energy ? : boolean;
            mine_status ? : type_mine_status;
            are_links_source ? : {
                [key: string]: boolean;
            }
			pc_source_level ? : number;
        }
    }
}

type type_order_result = {
    id: string;
    price: number;
    transaction_cost: number;
    energy_price: number;
    score: number;
    amount: number;
};
type type_object_to_trade = {
    max_score: number;
    resource: MarketResourceConstant;
    amount: number;
    energy_price: number;
};
declare var Game: Game;

type GeneralStore = Store < ResourceConstant, boolean > ;

type type_resource_number = {
    [key in ResourceConstant] ? : number
};
type type_reaction_priority = {
    [key: string]: {
        [key in MineralCompoundConstant] ? : number;
    }
}
type type_product_request = {
	[key in GeneralMineralConstant] ? : number;
}
declare module NodeJS {
    interface Global {
        basic_costmatrices: {
            [key: string]: CostMatrix;
        }
        test_var: boolean;
        visualize_cost(room_name: string, x_center: number, y_center: number, range: number): number;
        set_reaction_request(room_name: string, compound: MineralCompoundConstant): number;
        get_best_order(room_name: string, typ: "buy" | "sell", resource: MarketResourceConstant, num: number, energy_price: number): type_order_result[];
        summarize_terminal(): type_resource_number;
        auto_buy(room_name: string, resource: MarketResourceConstant, max_score: number, amount: number, energy_price: number): number;
        auto_sell(room_name: string, resource: MarketResourceConstant, max_score: number, amount: number, energy_price: number): number;
        spawn_in_queue(room_name: string, body: BodyPartConstant[], name: string, memory: any, first: boolean): number;
        spawn_dismantler_group_x2(room_name: string, suffix: string): number;
        do_dismantler_group_x2(suffix: string, flagname: string): number;
		request_resource_sending(room_from: string, room_to: string, resource: ResourceConstant, amount: number): number;
		restrict_passing_rooms(room_name: string): CostMatrix;
		reaction_priority: type_reaction_priority
		set_product_request(resource: MineralCompoundConstant, number: number): number;
		init_product_request(): number;
		reset_product_request(): number;
		refresh_product_request(): number;
		regulate_order_price(id: Id<Order>): number;
		update_layout(room_name: string, check_all: boolean): any;
    }
}
