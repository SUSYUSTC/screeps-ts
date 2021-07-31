import * as mymath from "./mymath"
import * as functions from "./functions"
import * as config from "./config"
//import * as basic_job from "./basic_job"
//import * as external_room from "./external_room"
//import * as invade from "./invade"
function is_pos_accessable(pos: RoomPosition): boolean {
    let room = Game.rooms[pos.roomName];
    let xmin = Math.min(25, pos.x);
    let xmax = Math.max(25, pos.x);
    let ymin = Math.min(25, pos.y);
    let ymax = Math.max(25, pos.y);
    let n_walls = room.lookForAtArea("structure", ymin, xmin, ymax, xmax, true).filter((e) => e.structure.structureType == 'constructedWall').length;
    return n_walls == 0;
}
global.is_pos_accessable = is_pos_accessable;

var detection_period = global.is_main_server ? 300 : 200;

function highway_resources_cost(room_name: string): CostMatrix {
	let costMatrix = new PathFinder.CostMatrix;
	let coor = functions.room2coor(room_name);
	let is_highway = false;
	for (let value of coor) {
		if (value > 0) {
			if (value % 10 == 1) {
				is_highway = true;
			}
		} else {
			if (-value % 10 == 0) {
				is_highway = true;
			}
		}
	}
	if (!(is_highway || config.controlled_rooms.includes(room_name) || config.allowed_passing_rooms.includes(room_name))) {
		for (let i = 0; i < 50; i++) {
			costMatrix.set(1, i, 255);
			costMatrix.set(48, i, 255);
			costMatrix.set(i, 48, 255);
			costMatrix.set(i, 1, 255);
		}
	}
	if (Memory.external_room_walls[room_name] !== undefined) {
		for (let xy of Memory.external_room_walls[room_name]) {
			costMatrix.set(xy[0], xy[1], 255);
		}
	}
	return costMatrix;
}


function update_rooms_walls(external_room_name: string) {
	let external_room = Game.rooms[external_room_name];
	if (external_room == undefined) {
		console.log(`Warning: Fail to observe room ${external_room_name} at time ${Game.time}`);
		return -1;
	}
	if (Memory.external_room_walls == undefined) {
		Memory.external_room_walls = {};
	}
	let walls = <Array<StructureWall>> external_room.find(FIND_STRUCTURES).filter((e) => e.structureType == 'constructedWall');
	Memory.external_room_walls[external_room_name] = walls.map((e) => [e.pos.x, e.pos.y]);
}

function detect_pb(room_name: string, external_room_name: string) {
	// 1: already found, 0: pb found, -1: cannot observe, -2: cannot find pb, -3: boost resources not enough
	let room = Game.rooms[room_name];
	let external_room = Game.rooms[external_room_name];
	if (external_room == undefined) {
		console.log(`Warning: Fail to observe room ${external_room_name} from ${room_name} at time ${Game.time}`);
		return -1;
	}
	if (room.memory.external_resources.pb[external_room_name] !== undefined) {
		return 1;
	}
	let pb = < StructurePowerBank > external_room.find(FIND_STRUCTURES).filter((e) => e.structureType == "powerBank")[0];
	if (!(pb !== undefined && pb.power >= config.pb_power_min && pb.ticksToDecay >= 2000)) {
		return -2;
	}
	let accessable = is_pos_accessable(pb.pos);
	if (!accessable) {
		return -2;
	}
	let ok_attacker = functions.is_boost_resource_enough(room_name, config.pb_attacker_body);
	let ok_healer = functions.is_boost_resource_enough(room_name, config.pb_healer_body);
	let ok = ok_attacker && ok_healer;
	if (!ok) {
		console.log(`Warning: Boost resource not enough when detecting pb at room ${external_room_name} from room ${room_name} at time ${Game.time}`)
		return -3;
	}
	let name = "pb_" + external_room_name + '_' + Game.time.toString();
	let pb_attacker_name = "pb_attacker" + external_room_name + '_' + Game.time.toString()
	let pb_healer_name = "pb_healer" + external_room_name + '_' + Game.time.toString()
	let pb_carrier_names: string[] = [];
	let pb_carrier_sizes: number[] = [];
	let path = PathFinder.search(Game.getObjectById(global.memory[room_name].spawn_list[0]).pos, {
		"pos": pb.pos,
		"range": 1
	}, {
		maxOps: 6000,
		roomCallback: highway_resources_cost,
	})
	if (path.incomplete) {
		console.log(`Warning: Cannot find path when detecting pb at room ${external_room_name} from room ${room_name} at time ${Game.time}`)
		return -2;
	}
	if (path.path.length > 320) {
		return -2;
	}
	let exits_path = functions.get_exits_from_path(path.path);
	let n_moves = Math.ceil(pb.power / 100);
	while (true) {
		if (n_moves > 16) {
			n_moves -= 16;
			pb_carrier_sizes.push(16);
		} else {
			pb_carrier_sizes.push(n_moves);
			break;
		}
	}
	for (let i = 0; i < pb_carrier_sizes.length; i++) {
		let pb_carrier_name = "pb_carrier" + external_room_name + '_' + Game.time.toString() + i.toString();
		pb_carrier_names.push(pb_carrier_name);
	}
	room.memory.external_resources.pb[external_room_name] = {
		"name": name,
		"xy": [pb.pos.x, pb.pos.y],
		"id": pb.id,
		"hits": undefined,
		"status": 0,
		"time_last": 0,
		"rooms_path": exits_path.rooms_path,
		"poses_path": exits_path.poses_path,
		"distance": path.cost,
		"amount": pb.power,
		"amount_received": 0,
		"pb_attacker_name": pb_attacker_name,
		"pb_healer_name": pb_healer_name,
		"pb_carrier_names": pb_carrier_names,
		"pb_carrier_sizes": pb_carrier_sizes,
		"n_pb_carrier_finished": 0,
	}
	return 0;
}

function detect_depo(room_name: string, external_room_name: string) {
	let room = Game.rooms[room_name];
	let external_room = Game.rooms[external_room_name];
	if (external_room == undefined) {
		console.log(`Warning: Fail to observe room ${external_room_name} from ${room_name} at time ${Game.time}`);
		return -1;
	}
	if (room.memory.external_resources.depo[external_room_name] !== undefined) {
		return 1;
	}
	if (_.filter(room.memory.external_resources.depo, (e) => e.last_cooldown <= 80).length > 0) {
		return 1;
	}
	let depos = <Array<Deposit>> external_room.find(FIND_DEPOSITS);
	if (depos.length == 0) {
		return -2;
	}
	let cds = depos.map((e) => e.lastCooldown);
	let argmin = mymath.argmin(cds);
	let depo = depos[argmin]
	if (!(depo !== undefined && depo.lastCooldown <= config.depo_start_max_cd && depo.ticksToDecay >= 3000 && (!global.is_main_server || depo.depositType !== 'mist'))) {
		return -2;
	}
	let path = PathFinder.search(room.terminal.pos, {
		"pos": depo.pos,
		"range": 1
	}, {
		maxOps: 6000,
		roomCallback: highway_resources_cost,
	})
	if (path.incomplete) {
		console.log(`Warning: deposit at ${external_room_name} is too far from ${room_name}`);
		return -2;
	}
	let name = `depo_${external_room_name}_${depo.depositType}_${Game.time}`;
	let depo_container_builder_name = "depo_container_builder" + external_room_name + '_' + Game.time.toString()
	let depo_energy_carrier_name = "depo_energy_carrier" + external_room_name + '_' + Game.time.toString()
	let depo_harvester_name = "depo_harvester" + external_room_name + '_' + Game.time.toString()
	let depo_carrier_name = "depo_carrier" + external_room_name + '_' + Game.time.toString()
	let exits_path = functions.get_exits_from_path(path.path);
	room.memory.external_resources.depo[external_room_name] = {
		"name": name,
		"xy": [depo.pos.x, depo.pos.y],
		"deposit_type": depo.depositType,
		"container_xy": [path.path.slice(-1)[0].x, path.path.slice(-1)[0].y],
		"container_hits": 250000,
		"id": depo.id,
		"status": 0,
		"rooms_path": exits_path.rooms_path,
		"poses_path": exits_path.poses_path,
		"distance": path.cost,
		"last_active_time": Game.time,
		"last_cooldown": depo.lastCooldown,
		"amount_received": 0,
		"expected_additional_amount": 0,
		"time_update_amount": Game.time,
		"depo_container_builder_names": [],
		"depo_energy_carrier_names": [],
		"depo_harvester_names": [],
		"depo_carrier_names": [],
	}
	return 0;
}

export function detect_resources(room_name: string) {
    let cpu_used = Game.cpu.getUsed();

    let room = Game.rooms[room_name];
    if (room.controller.level < 8) {
        return;
    }
    let game_memory = Game.memory[room_name];
    let external_rooms = config.highway_resources[room_name];
    if (external_rooms == undefined || !global.memory[room_name].unique_structures_status.observer.finished) {
        return;
    }
    if (room.memory.external_resources == undefined) {
        room.memory.external_resources = {
            "pb": {},
            "depo": {},
        };
    }
    if (room.memory.external_resources.pb == undefined) {
        room.memory.external_resources.pb = {};
    }
    if (room.memory.external_resources.depo == undefined) {
        room.memory.external_resources.depo = {};
    }
    for (let i = 0; i < external_rooms.length; i++) {
        if (Game.time % detection_period == i) {
            let observer_status = global.memory[room_name].unique_structures_status.observer
            let observer = Game.getObjectById(observer_status.id);
            if (observer == undefined) {
                continue;
            }
            let external_room_name = external_rooms[i];
            observer.observeRoom(external_room_name);
        }
    }
    for (let i = 0; i < external_rooms.length; i++) {
        if (Game.time % detection_period == i + 1) {
            let external_room_name = external_rooms[i];
			update_rooms_walls(external_room_name);
			detect_pb(room_name, external_room_name);
			detect_depo(room_name, external_room_name);
        }
    }
}

function update_pb(room_name: string, external_room_name: string) {
	let room = Game.rooms[room_name];
	let pb_status = room.memory.external_resources.pb[external_room_name];
	if (pb_status.status == 0) {
		// pb detected
		let pb_attacker_body = global.get_body(functions.conf_body_to_body_components(config.pb_attacker_body));
		let pb_healer_body = global.get_body(functions.conf_body_to_body_components(config.pb_healer_body));
		let pb_attacker_memory = {
			"home_room_name": room_name,
			"role": "pb_attacker",
			"external_room_name": external_room_name,
		}
		let pb_healer_memory = {
			"home_room_name": room_name,
			"role": "pb_healer",
			"external_room_name": external_room_name,
		}
		global.spawn_in_queue(room_name, pb_attacker_body, pb_status.pb_attacker_name, pb_attacker_memory, false);
		global.spawn_in_queue(room_name, pb_healer_body, pb_status.pb_healer_name, pb_healer_memory, false);
		pb_status.status = 1;
	} else if (pb_status.status == 1) {
		// attacker and healer spawned
		pb_status.time_last += 1;
		if (pb_status.time_last >= 800) {
			let pb_carrier_memory = {
				"home_room_name": room_name,
				"role": "pb_carrier",
				"external_room_name": external_room_name,
			};
			for (let i = 0; i < pb_status.pb_carrier_sizes.length; i++) {
				let pb_carrier_body: BodyPartConstant[] = [];
				let pb_carrier_size = pb_status.pb_carrier_sizes[i];
				let pb_carrier_name = pb_status.pb_carrier_names[i];
				mymath.range(pb_carrier_size * 2).forEach((e) => pb_carrier_body.push(CARRY));
				mymath.range(pb_carrier_size).forEach((e) => pb_carrier_body.push(MOVE));
				global.spawn_in_queue(room_name, pb_carrier_body, pb_carrier_name, pb_carrier_memory, false);
				pb_status.status = 2;
				pb_status.time_last = 0;
			}
		}
	} else if (pb_status.status == 2) {
		// carrier spawned
		pb_status.time_last += 1;
		if (pb_status.time_last >= 2000 || pb_status.n_pb_carrier_finished == pb_status.pb_carrier_names.length) {
			if (Memory.pb_log == undefined) {
				Memory.pb_log = [];
			}
			let pb_item: type_pb_log = {
				name: pb_status.name,
				home_room_name: room_name,
				external_room_name: external_room_name,
				amount: pb_status.amount,
				amount_received: pb_status.amount_received,
			};
			Memory.pb_log.push(pb_item);
			if (Memory.pb_log.length > 10) {
				Memory.pb_log = Memory.pb_log.slice(-10);
			}
			if (pb_status.amount - pb_status.amount_received >= 100) {
				console.log(`Warning: unexpected pb mining ${pb_status.name}`);
			}
			delete room.memory.external_resources.pb[external_room_name];
		}
	}
}

function update_depo(room_name: string, external_room_name: string) {
	let room = Game.rooms[room_name];
	let depo_status = room.memory.external_resources.depo[external_room_name];
	let external_room = Game.rooms[external_room_name];
	let container: StructureContainer;
	let depo = Game.getObjectById(depo_status.id);
	if (depo != null) {
		depo_status.last_cooldown = depo.lastCooldown;
	}
	if (external_room !== undefined) {
		let container_pos = external_room.getPositionAt(depo_status.container_xy[0], depo_status.container_xy[1]);
		container = <StructureContainer> container_pos.lookFor("structure").filter((e) => e.structureType == 'container')[0];
		if (container !== undefined) {
			depo_status.container_hits = container.hits;
		}
		if (depo == null) {
			delete room.memory.external_resources.depo[external_room_name];
			return;
		}
	}
	if (depo_status.status == 0) {
		// build container
		if (container !== undefined) {
			depo_status.status = 1;
			return;
		}
		depo_status.depo_container_builder_names = depo_status.depo_container_builder_names.filter((e) => functions.creep_exists(e, room_name))
		if (depo_status.depo_container_builder_names.length == 0) {
			let ok_container_builder = functions.is_boost_resource_enough(room_name, config.depo_container_builder_body);
			if (!ok_container_builder) {
				return;
			}
			let depo_container_builder_body = global.get_body(functions.conf_body_to_body_components(config.depo_container_builder_body));
			let depo_container_builder_memory: CreepMemory = {
				"home_room_name": room_name,
				"role": "depo_container_builder",
				"external_room_name": external_room_name,
			}
			let depo_container_builder_name = "depo_container_builder" + external_room_name + '_' + Game.time.toString()
			global.spawn_in_queue(room_name, depo_container_builder_body, depo_container_builder_name, depo_container_builder_memory, false);
			depo_status.depo_container_builder_names.push(depo_container_builder_name);
		}
		depo_status.depo_energy_carrier_names = depo_status.depo_energy_carrier_names.filter((e) => functions.creep_exists(e, room_name))
		if (depo_status.depo_energy_carrier_names.length == 0) {
			let depo_energy_carrier_body = global.get_body(functions.conf_body_to_body_components(config.depo_energy_carrier_body));
			let depo_energy_carrier_memory: CreepMemory = {
				"home_room_name": room_name,
				"role": "depo_energy_carrier",
				"external_room_name": external_room_name,
			}
			let depo_energy_carrier_name = "depo_energy_carrier" + external_room_name + '_' + Game.time.toString()
			global.spawn_in_queue(room_name, depo_energy_carrier_body, depo_energy_carrier_name, depo_energy_carrier_memory, false);
			depo_status.depo_energy_carrier_names.push(depo_energy_carrier_name);
		}
	} else if (depo_status.status == 1) {
		if (external_room !== undefined) {
			let depo = Game.getObjectById(depo_status.id);
			if (depo.ticksToDecay < 200 || depo.lastCooldown >= config.depo_stop_min_cd) {
				depo_status.status = 2;
				return;
			}
		}
		depo_status.depo_harvester_names = depo_status.depo_harvester_names.filter((e) => functions.creep_exists(e, room_name, {filter: (e) => e.ticksToLive >= depo_status.distance + 150}));
		if (depo_status.depo_harvester_names.length == 0) {
			let request_boost = depo_status.last_cooldown >= config.depo_cd_to_boost;
			let conf_body = request_boost ? config.powered_depo_harvester_body : config.depo_harvester_body;
			let ok_depo_harvester = functions.is_boost_resource_enough(room_name, conf_body);
			if (!ok_depo_harvester) {
				return;
			}
			let depo_harvester_body =  global.get_body(functions.conf_body_to_body_components(conf_body))
			let depo_harvester_memory: CreepMemory = {
				"home_room_name": room_name,
				"role": "depo_harvester",
				"external_room_name": external_room_name,
				"request_boost": request_boost,
			}
			let depo_harvester_name = "depo_harvester" + external_room_name + '_' + Game.time.toString()
			global.spawn_in_queue(room_name, depo_harvester_body, depo_harvester_name, depo_harvester_memory, false);
			depo_status.depo_harvester_names.push(depo_harvester_name);
		}
		depo_status.depo_carrier_names = depo_status.depo_carrier_names.filter((e) => functions.creep_exists(e, room_name, {filter: (e) => !e.memory.ready}));
		if (container !== undefined && container.store.getUsedCapacity() + depo_status.expected_additional_amount >= config.depo_carrier_body.carry.number * 50 * (1+depo_status.depo_carrier_names.length)) {
			let depo_carrier_body = global.get_body(functions.conf_body_to_body_components(config.depo_carrier_body));
			let depo_carrier_memory: CreepMemory = {
				"home_room_name": room_name,
				"role": "depo_carrier",
				"external_room_name": external_room_name,
			}
			let depo_carrier_name = "depo_carrier" + external_room_name + '_' + Game.time.toString()
			global.spawn_in_queue(room_name, depo_carrier_body, depo_carrier_name, depo_carrier_memory, false);
			depo_status.depo_carrier_names.push(depo_carrier_name);
		}
	} else if (depo_status.status == 2) {
		let n_existing_depo_carriers = depo_status.depo_carrier_names.filter((e) => functions.creep_exists(e, room_name, {filter: (e) => !e.memory.ready})).length;
		if (container !== undefined && container.store.getUsedCapacity() + depo_status.expected_additional_amount >= config.depo_carrier_body.carry.number * 50 * (1+n_existing_depo_carriers)) {
			let depo_carrier_body = global.get_body(functions.conf_body_to_body_components(config.depo_carrier_body));
			let depo_carrier_memory: CreepMemory = {
				"home_room_name": room_name,
				"role": "depo_carrier",
				"external_room_name": external_room_name,
			}
			let depo_carrier_name = "depo_carrier" + external_room_name + '_' + Game.time.toString()
			global.spawn_in_queue(room_name, depo_carrier_body, depo_carrier_name, depo_carrier_memory, false);
			depo_status.depo_carrier_names.push(depo_carrier_name);
		}
		if (depo_status.time_to_delete == undefined) {
			depo_status.time_to_delete = Game.time + 2000;
		}
		if (Game.time >= depo_status.time_to_delete) {
			if (Memory.depo_log == undefined) {
				Memory.depo_log = [];
			}
			let depo_item: type_depo_log = {
				name: depo_status.name,
				home_room_name: room_name,
				external_room_name: external_room_name,
				type: depo_status.deposit_type,
				amount_received: depo_status.amount_received,
			};
			Memory.depo_log.push(depo_item);
			if (Memory.depo_log.length > 10) {
				Memory.depo_log = Memory.depo_log.slice(-10);
			}
			delete room.memory.external_resources.depo[external_room_name];
		}
	}
}

export function update_resources(room_name: string) {
    let room = Game.rooms[room_name];
    if (room.controller.level < 8) {
        return;
    }
    if (room.memory.external_resources == undefined) {
        room.memory.external_resources = {
            "pb": {},
            "depo": {},
        };
    }
    if (room.memory.external_resources.pb == undefined) {
        room.memory.external_resources.pb = {};
    }
    if (room.memory.external_resources.depo == undefined) {
        room.memory.external_resources.depo = {};
    }
    for (let external_room_name in room.memory.external_resources.pb) {
		update_pb(room_name, external_room_name);
    }
    for (let external_room_name in room.memory.external_resources.depo) {
		update_depo(room_name, external_room_name);
    }
}

/*
function pb_group_combat(attacker: Creep, healer: Creep) {
	if (attacker == undefined) {
		return 0;
	}
	let out: number;
	if (healer == undefined) {
		out = invade.single_combat_melee(attacker);
	} else {
		out = invade.group2_combat_melee(attacker, healer, 5);
	}
	return out;

}

export function run_pb_miner_group(pb_status: type_pb_status) {
	if (pb_status.working_status == undefined) {
		pb_status.working_status = 'spawning';
	}
	let attacker = Game.creeps[pb_status.pb_attacker_name];
	let healer = Game.creeps[pb_status.pb_healer_name];
	switch(pb_status.working_status) {
		case 'spawning': {
			if (functions.waiting_for_spawn([pb_status.pb_attacker_name, pb_status.pb_healer_name]) == 0) {
				break;
			}
			pb_status.working_status = 'boost';
			break;
		}
		case 'boost': {
			let attacker_request = functions.conf_body_to_boost_request(config.pb_attacker_body);
			let out_attacker = basic_job.boost_request(attacker, attacker_request, true);
			let healer_request = functions.conf_body_to_boost_request(config.pb_healer_body);
			let out_healer = basic_job.boost_request(healer, healer_request, true);
			attacker.say("PAb");
			healer.say("PHb");
			if (out_attacker == 1 || out_healer == 1) {
				break;
			}
			pb_status.working_status = 'external_move';
			break;
		}
		case 'external_move': {
			if (external_room.moveawayexit(attacker) == 0 || external_room.moveawayexit(healer) == 0) {
				break;
			}
			if (pb_group_combat(attacker, healer) == 0) {
				break;
			}
			let rooms_path = pb_status.rooms_path;
			let poses_path = pb_status.poses_path;
			let target_room = rooms_path[rooms_path.length - 1];
			if (!external_room.is_moving_target_defined(attacker, 'forward')) {
				external_room.save_external_moving_targets(attacker, rooms_path, poses_path, 'forward');
			}
			if (external_room.movethroughrooms_group_x2(attacker, healer, 'forward', target_room, {reusePath: 10}) !== 1) {
				attacker.say("PAe");
				healer.say("PHe");
				break;
			}
			pb_status.working_status = 'move';
			break;
		}
		case 'move': {
			if (pb_group_combat(attacker, healer) == 0) {
				break;
			}
			let pb_xy = pb_status.xy;
			let pb_pos = attacker.room.getPositionAt(pb_xy[0], pb_xy[1]);
			let pb = < StructurePowerBank > (pb_pos.lookFor("structure").filter((e) => e.structureType == 'powerBank')[0]);
			if (pb == undefined) {
				pb_status.working_status = 'guard';
				break;
			}
			attacker.say("PHm");
			if (attacker.pos.isNearTo(pb)) {
				if (healer.pos.isNearTo(attacker)) {
					pb_status.working_status = 'attack';
				} else {
					healer.moveTo(attacker.pos, {range: 1, costCallback: functions.avoid_exits});
				}
			} else {
				attacker.moveTo(pb, {
					range: 1,
					maxRooms: 1,
					costCallback: function(room_name: string, costmatrix: CostMatrix) {
						functions.avoid_exits(room_name, costmatrix);
						costmatrix.set(healer.pos.x, healer.pos.y, 0)
					}
				});
				attacker.say("PAm");
				if (healer.pos.isNearTo(attacker)) {
					healer.move(healer.pos.getDirectionTo(attacker));
				} else {
					healer.moveTo(attacker.pos, {range: 1, costCallback: functions.avoid_exits});
				}
			}
			break;
		}
		case 'attack': {
			if (pb_group_combat(attacker, healer) == 0) {
				pb_status.working_status = 'move';
				break;
			}
			let pb = Game.getObjectById(pb_status.id);
			if (pb == undefined) {
				pb_status.working_status = 'guard';
				break;
			}
			pb_status.hits = pb.hits;
			if (attacker.hits == attacker.hitsMax) {
				if (pb.hits > 1800) {
					attacker.memory.ready = true;
					attacker.attack(pb);
					healer.heal(attacker);
					attacker.say("PAa1");
					healer.say("PHh1");
				} else if (attacker.ticksToLive <= 3 || healer.ticksToLive <= 3 || mymath.all(pb_status.pb_carrier_names.map((e) => Game.creeps[e].memory.ready))) {
					attacker.attack(pb);
					healer.heal(attacker);
					attacker.say("PAa2");
					healer.say("PHh2");
				}
			} else {
				healer.heal(attacker);
				healer.say("PHh3");
			}
			break;
		}
		case 'guard': {
			let pb_xy = pb_status.xy;
			let pb_pos = attacker.room.getPositionAt(pb_xy[0], pb_xy[1]);
			if (invade.group2_combat_melee(attacker, healer) !== 0) {
				if (attacker.pos.getRangeTo(pb_pos) < 5) {
					let poses_flee_to = functions.get_poses_with_fixed_range(pb_pos, 5);
					let pos_flee_to = attacker.pos.findClosestByPath(poses_flee_to, {algorithm: 'dijkstra'});
					attacker.moveTo(pos_flee_to, {
						range: 0,
						maxRooms: 1,
						costCallback: function(room_name: string, costmatrix: CostMatrix) {
							functions.avoid_exits(room_name, costmatrix);
							costmatrix.set(healer.pos.x, healer.pos.y, 0)
						}
					});
					healer.move(healer.pos.getDirectionTo(attacker));
				} else if (healer.pos.getRangeTo(attacker) > 1) {
					healer.move(healer.pos.getDirectionTo(attacker));
				}
			}
			break;
		}
	}
}
*/
