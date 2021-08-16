type type_xy = [number, number];
type type_external_room_status = {
    [key: string]: { // room_name
        defense_type: string;
        reserver: string;
        invader_core_existance: boolean;
        safe: boolean;
        time_last: number;
    }
}
type type_creep_role = "init" | "harvester" | "carrier" | "builder" | "upgrader" | "transferer" | "mineharvester" | "maincarrier" | "minecarrier" | "wall_repairer" | "externalharvester" | "externalcarrier" | "externalbuilder" | "external_init" | "reserver" | "preclaimer" | "energy_carrier" | "defender" | "invader_core_attacker" | "home_defender" | "help_harvester" | "help_carrier" | "help_builder" | "guard" | "pb_attacker" | "pb_healer" | "pb_carrier" | "depo_container_builder" | "depo_energy_carrier" | "depo_harvester" | "depo_carrier" | "enemy";
interface RoomMemory {
    storage_level ? : number;
    external_room_status ? : type_external_room_status;
    n_needed_wallrepair ? : number;
    n_sites ? : number;
    n_structures ? : number;
    ticks_to_spawn_builder ? : number;
    objects_updated ? : boolean;
    current_boost_request ? : type_current_boost_request;
    reaction_request ? : type_reaction_request;
    objects_to_buy ? : {
        [key: string]: type_object_to_trade;
    }
    objects_to_sell ? : {
        [key: string]: type_object_to_trade;
    }
    market_cooldown ? : boolean;
    maincarrier_link_amount ? : number;
    is_mainlink_source ? : boolean;
    current_boost_creep ? : string;
    additional_spawn_queue ? : {
        first: type_additional_spawn[];
        last: type_additional_spawn[];
    }
    min_wall_strength ? : number;
    min_main_rampart_strength ? : number;
    min_secondary_rampart_strength ? : number;
    n_walls ? : number;
    n_main_ramparts ? : number;
    n_secondary_ramparts ? : number;
    external_resources ? : type_external_resources;
    sites_total_progressleft ? : number;
    external_sites_total_progressleft ? : {
        [key: string]: number;
    };
    resource_sending_request ? : type_resource_sending_request[];
    next_time ? : any;
	military_exercise ? : boolean;
    creep_statistics: {
		[key in type_creep_role] ? : number;
    }
	unboost_withdraw_request ? : boolean;
	next_preclaim_time ?: {
		[key: string]: number;
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
	onetime_max: number;
}
interface type_creep_move {
    dest: {
        x: number;
        y: number;
        room: string;
    };
    time: number;
    path: string;
    room: string;
}
interface type_resource_status {
    source: string;
    sink: string;
    withdraw_amount: number;
    transfer_amount: number;
}
type type_body_conf = {
    [key in BodyPartConstant] ? : {
        number: number;
        boost ? : MineralBoostConstant;
    }
}
type type_external_moving_targets = {
	[key: string]: {
		xy: [number, number];
		findconstant: ExitConstant;
		room_name: string;
	}
}
type type_main_structure_names = "storage" | "terminal" | "link" | "factory" | "powerspawn" | "nuker"
type type_main_structure_amounts = {
    [key in type_main_structure_names] ? : number;
}
type type_transport_job = {
	resource_type: ResourceConstant;
    from: type_main_structure_names;
    to: type_main_structure_names;
    amount: number;
}
interface CreepMemory {
    _move ? : type_creep_move;
    movable ? : boolean;
    crossable ? : boolean;
    role ? : type_creep_role;
	subrole ? : string;
	working_status ? : string;
    source_name ? : string;
    harvesting ? : boolean;
    home_room_name ? : string;
    external_room_name ? : string;
    cost ? : number;
    defender_type ? : string;
    defending_room ? : string;
    withdraw_target ? : Id < AnyStoreStructure > ;
    rooms_forwardpath ? : string[];
    poses_forwardpath ? : number[];
    rooms_backwardpath ? : string[];
    poses_backwardpath ? : number[];
    wall_to_repair ? : Id < Structure_Wall_Rampart > ;
	wall_min_hits ? : number;
    boost_status ? : type_boost_status;
    resource_type ? : ResourceConstant;
    maincarrier_transfer_job ? : {
        resource_type: ResourceConstant;
        resource_status: type_resource_status;
    }
    ready ? : boolean;
    pc_level ? : number;
    powered ? : boolean;
    request_boost ? : boolean;
    do_boost ? : boolean; // boost depending on whether resources are enough
    next_time ? : any;
    advanced ? : boolean;
    half_time ? : boolean;
	tough_conf ? : type_tough_conf;
	heal_ability ? : number;
	flagname ? : string;
	mineral_type ? : GeneralMineralConstant;
	external_dict ?: {
		[key: string]: type_external_moving_targets;
	}
	current_filling_target ?: Id<AnyStoreStructure>;
	current_building_target ?: Id<ConstructionSite>;

	shard_move ?: type_shard_move;
	last_present_time ?: number;
	last_present_shard ?: string;
	jobs_levels ?: {
		level0: type_transport_job[];
		level1: type_transport_job[];
		level2: type_transport_job[];
	}
}
interface PowerCreepMemory {
    movable ? : boolean;
    crossable ? : boolean;
    _move ? : type_creep_move;
    current_source_target ? : string;
    home_room_name ? : string;
    next_time ? : any;
	external_dict ?: {
		[key: string]: type_external_moving_targets;
	}
	working_status ?: string;
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
	effect_time ? : number;
}
interface conf_named_structures {
    [key: string]: {
        pos: number[];
        RCL: number;
		RCL_to_remove ?: number;
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
    [key: string]: number;
}
interface conf_carriers {
    [key: string]: {
        number: number;
        preferences: conf_preference;
    }
}
interface conf_upgraders {
    locations: type_xy[];
    distance: number;
}
interface conf_harvesters {
    [key: string]: {
        commuting_distance: number;
    }
}
interface conf_maincarrier {
    main_pos: number[];
    working_zone: type_xy[];
    waiting_pos: number[];
}
interface type_external_half_map {
    rooms_forwardpath: string[];
    poses_forwardpath: number[];
}
interface type_external_shard_map {
    rooms_forwardpath ?: string[];
    poses_forwardpath ?: number[];
	shard_path ?: type_shard_exit_point[];
}
interface type_external_map {
    rooms_forwardpath: string[];
    poses_forwardpath: number[];
    rooms_backwardpath: string[];
    poses_backwardpath: number[];
}
interface type_external_controller extends type_external_map {
    reserve: boolean;
    path_time: number;
    rooms_forwardpath: string[];
    poses_forwardpath: number[];
    rooms_backwardpath: string[];
    poses_backwardpath: number[];
}
interface type_external_source extends type_external_map {
    id: Id < Source > ;
    harvester_pos: number[];
    single_distance: number;
    carrier_distance: number;
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
interface type_external_powered_source extends type_external_map {
    source_name: string;
    carrier_distance: number;
    carry_end: {
        type: string;
        name: string;
    };
    roads: number[][];
    id: Id < Source > ;
    harvester_pos: number[];
    single_distance: number;
    rooms_forwardpath: string[];
    rooms_backwardpath: string[];
    poses_forwardpath: number[];
    poses_backwardpath: number[];
}
interface conf_external_rooms {
    [key: string]: {
        active: boolean;
        //container: boolean;
        controller: type_external_controller;
        sources: {
            [key: string]: type_external_source;
        }
        powered_source ? : type_external_powered_source;
    }
}
interface type_pb_log {
	name: string;
	home_room_name: string;
	external_room_name: string;
    amount: number;
	amount_received: number;
}
interface type_depo_log {
	name: string;
	home_room_name: string;
	external_room_name: string;
	type: DepositConstant;
	amount_received: number;
}
interface type_pb_status {
    name: string;
    id: Id < StructurePowerBank > ;
    xy: number[];
    status: number;
	hits: number;
    time_last: number;
    rooms_path: string[];
    poses_path: number[];
    distance: number;
    pb_attacker_name: string;
    pb_healer_name: string;
    pb_carrier_names: string[];
    pb_carrier_sizes: number[];
    n_pb_carrier_finished: number;
    amount: number;
	amount_received: number;
	working_status ?: string;
}
interface type_depo_status {
    name: string;
    id: Id < Deposit > ;
    xy: [number, number];
	container_xy: [number, number];
	container_hits: number;
	deposit_type: DepositConstant;
    status: number;
    rooms_path: string[];
    poses_path: number[];
    distance: number;
    last_cooldown: number;
	amount_received: number;
	expected_additional_amount: number;
	last_active_time: number;
	time_update_amount: number;
    time_last ?: number;
	time_to_delete ?: number
    depo_container_builder_names ? : string[];
    depo_energy_carrier_names ? : string[];
    depo_harvester_names ? : string[];
    depo_carrier_names ? : string[];
}
type type_zone = "U" | "L" | "Z" | "K";
interface type_external_resources {
    pb: {
        [key: string]: type_pb_status;
    }
    depo: {
        [key: string]: type_depo_status;
    }
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
    readonly walls: type_xy[];
    readonly main_ramparts: type_xy[];
    readonly secondary_ramparts: type_xy[];
    readonly defense_boundary: type_xy[];
    readonly safe_boundary: type_xy[];
	readonly minecarrier_distance: number;
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
type type_invade_assign = {
	attack ?: number;
	ranged_attack ?: number;
	work ?: number;
}
interface type_invade_group_x2 {
    healer_name: string;
	invader_name: string;
	protection_level: number;
	assign: type_invade_assign;
	home_room_name: string;
	time: number;
	target_room_name ?: string;
	shard_path: type_shard_exit_point[];
	working_status ?: string;
	target_structure_id ?: Id<Structure>;
	costmatrix ?: number[];
	ref_hits ?: number;
	visual_costs ?: {
		[key: number]: {
			x: number;
			y: number;
			cost: number;
		}
	}
	visual_path ?: [number, number][];
}

type type_order_total_amount = {
	buy: {
		[key in MarketResourceConstant] ?: number;
	};
	sell: {
		[key in MarketResourceConstant] ?: number;
	};
}
type type_market_stat = {
	buy: {
		[key in MarketResourceConstant] ?: {
			tot_number: number,
			tot_price: number,
		}
	};
	sell: {
		[key in MarketResourceConstant] ?: {
			tot_number: number,
			tot_price: number,
		}
	};
}
interface Memory {
	stop_running ?: boolean;
	showdirection ?: boolean;
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
    history_cpus ? : number[];
	look_broken_ramparts ? : boolean;
	reaction_log ? : {
		[key in MineralCompoundConstant] ?: number;
	}
	pb_log ? : type_pb_log[];
	depo_log ? : type_depo_log[];
	invade_groups_x2 ?: {
		[key: string]: type_invade_group_x2;
	};
	market_accumulation_stat: type_market_stat;
	stat_reset_time: number;
	stat_reset_realtime: number;
	tot_transaction_cost: number;
	power_processed_stat: number;
	op_power_processed_stat: number;
	produce_battery_stat: number;
	external_room_walls: {
		[key: string]: type_xy[];
	}
}
type type_movethroughrooms_options = {
	ignore_creep_xys ?: [number, number][],
}

type type_shard_exit_point = {
	shard: string,
	roomName: string,
	x: number,
	y: number,
	rooms_path ?: string[],
	poses_path ?: string[],
}
type type_shard_move = {
	shard ?: string,
	shard_path: type_shard_exit_point[];
	rooms_path ?: string[],
	poses_path ?: number[],
}
interface type_intershardmemory {
	last_modify_time ? : number;
	cleared_shards ? : string[];
	all_creeps ?: {
		[key: string]: {
			role ?: type_creep_role;
			home_room_name ?: string;
			external_room_name ?: string;
			source_name ?: string;
			ticksToLive ?: number;
		}
	}
	creeps ? : {
		[key: string]: CreepMemory;
	}
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
    memory: CreepMemory;
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
    [key: string]: type_xy[];
};
type type_help_list = {
    [key: string]: {
        [key: string]: {
            rooms_forwardpath ?: string[];
            poses_forwardpath ?: number[];
			shard_path ?: type_shard_exit_point[];
            commuting_distance: number;
            commuting_time: number;
            n_carrys ?: {
                [key: string]: number;
            }
			n_energy_carriers: number;
			mine_source: boolean;
			guard ?: number;
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
	status: "fill" | "running" | "clear";
	amount: number;
    reactant1: GeneralMineralConstant;
    reactant2: GeneralMineralConstant;
    product: MineralCompoundConstant;
}

type type_current_boost_request = {
    compound: MineralBoostConstant;
    amount: number;
	finished: boolean;
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

type type_creep_jobtypes = "home" | "external" | "maincarrier" | "combat" | "resource";
interface Game {
    costmatrices: type_costmatrices;
    costmatrices_safe: type_costmatrices;
    costmatrices_defense: type_costmatrices;
    tick_cpu ? : {
        [key: string]: number;
    }
    tick_cpu_main ? : {
        [key: string]: number;
    }
    actions_count: number;
    function_actions_count: {
        [key: string]: number;
    }
    powered_rooms ? : {
        [key: string]: string;
    };
    source_powered_rooms ? : {
        [key: string]: string;
    };
    memory ? : {
        [key: string]: {
            danger_mode ? : boolean;
            n_defenders_needed ? : number;
            lack_energy ? : boolean;
            mine_status ? : type_mine_status;
            are_links_source ? : {
                [key: string]: boolean;
            }
            pc_source_level ? : number;
            terminal_send_requested ? : boolean;
			exact_boost ? : boolean;
        }
    }
    creep_statistics_done: boolean;
    creep_statistics: {
        [key: string]: {
            [key in type_creep_role] ? : Creep[];
        }
    }
	creep_jobtypes : {
		[key in type_creep_jobtypes]: Creep[];
	}
	InterShardMemory: {
		[key: string]: type_intershardmemory;
	}
	require_update_intershardmemory: boolean;
	require_update_intershardmemory_modify_time: boolean;
	controlled_rooms_with_terminal: string[];
	independent_rooms: string[];
	market_orders_cache: {
		sell : {
			[key in MarketResourceConstant] ?: Order[];
		},
		buy : {
			[key in MarketResourceConstant] ?: Order[];
		},
	}
	my_orders: {
		sell : {
			[key: string]: {
				[key in MarketResourceConstant] ?: Order[];
			}
		},
		buy : {
			[key: string]: {
				[key in MarketResourceConstant] ?: Order[];
			}
		},
	}
	commodity_orders ?: {
		[key in MarketResourceConstant] ?: Order;
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
type type_history_order = {
	time: number;
    price: number;
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
interface type_movetopos_options {
    costmatrix ? : CostMatrix;
    setmovable ? : boolean;
	safe_level ? : 0 | 1 | 2;
}
interface type_tough_conf {
	ratio: number;
	hits: number;
}
interface type_costmatrices {
	[key: string]: CostMatrix;
}
type type_format_options = {
	json ?: boolean;
	sort ?: boolean;
	skipkeys ?: string[];
}
type type_resource_balance = {
	gap: number;
	min ?: number;
	amount: number;
	rooms ?: string[]
}
type type_product_request = {
	product ?: MineralCompoundConstant;
	amount ?: number;
	status: "ok" | "fail" | "enough"
}
declare module NodeJS {
    interface Global {
		is_main_server: boolean;
		main_shards: string[];
		sub_shards: string[];
		all_shards: string[];
		my_shard_paths: {
			[key: string]: type_shard_exit_point[];
		}
		controlled_rooms: string[];
        basic_costmatrices: type_costmatrices,
        basic_costmatrices_safe: type_costmatrices,
        basic_costmatrices_defense: type_costmatrices,
        memory ? : {
            [key: string]: {
                named_structures_status ? : type_all_named_structures_status
                unique_structures_status ? : type_all_unique_structures_status
                tower_list ? : Id < StructureTower > [];
                spawn_list ? : Id < StructureSpawn > [];
                energy_filling_list ? : Id < AnyStoreStructure > [];
                energy_storage_list ? : Id < AnyStoreStructure > [];
                energy_storage_list_safe ? : Id < AnyStoreStructure > [];
                repair_list ? : Id < Structure > [];
                ramparts_to_repair ? : Id < StructureRampart > [];
				walls_id ? : Id < StructureWall > [];
				main_ramparts_id ? : Id < StructureRampart > [];
				secondary_ramparts_id ? : Id < StructureRampart > [];
            }
        }
        creep_number: {
            [key: string]: {
                [key in type_creep_role] ? : number;
            }
        }
        test_var ? : boolean;
        visualize_cost(room_name: string, x_center: number, y_center: number, range: number, costmatrix: CostMatrix): number;
        cancel_reaction(room_name: string): number;
        set_reaction_request(room_name: string, compound: MineralCompoundConstant, amount: number): number;
        get_best_order(room_name: string, typ: "buy" | "sell", resource: MarketResourceConstant, num: number, energy_price: number): type_order_result[];
        history_orders(resource: MarketResourceConstant): type_history_order[];
		my_orders(): Order[];
        format_objs(objs: any[], json: boolean): string;
        format_json(obj: any, options: type_format_options): string;
        format_json2(obj: any, options: type_format_options): string;
        summarize_terminal(rooms: string[]): type_resource_number;
        auto_buy(room_name: string, resource: MarketResourceConstant, max_score: number, amount: number, energy_price: number): number;
        auto_sell(room_name: string, resource: MarketResourceConstant, max_score: number, amount: number, energy_price: number): number;
        spawn_in_queue(room_name: string, body: BodyPartConstant[], name: string, memory: any, first: boolean): number;
        send_resource(room_from: string, room_to: string, resource: ResourceConstant, amount: number, onetime_max: number): number;
        get_product_request(room_name: string, resource: GeneralMineralConstant, is_final: boolean): type_product_request;
        regulate_order_price(id: Id < Order > ): number;
        set_resource_price(type: "buy" | "sell", resource: MarketResourceConstant, price: number): number;
        update_layout(room_name: string, check_all: boolean): any;
		remove_unregistered_structures(room_name: string): number;
		get_body(components: type_body_components): BodyPartConstant[];
		spawn_invader_group_x2(home_room_name: string, groupname: string, protection_level: number, assign: type_invade_assign, shard_path: type_shard_exit_point[]): number;
		get_market_stat(): type_order_total_amount;
		init_stat(): number;
		display_stat(): string;
		display_store(): string;
		display_terminal_store(): string;
		spawn_PC(name: string): number;
		set_shardmemory(keys: string[], value: any): number;
		clear_shardmemory(shards: string[]): number;
		create_room_walls(room_name: string): number;
		send_gift_pack(room_name: string): number;
    }
}
