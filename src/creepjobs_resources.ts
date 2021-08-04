import * as _ from "lodash"
import * as basic_job from "./basic_job";
import * as functions from "./functions"
import * as external_room from "./external_room";
import * as config from "./config";
import * as mymath from "./mymath";
import * as invade from "./invade";
import * as constants from "./constants";
var moveoptions = {
    reusePath: 5,
    //visualizePathStyle: {},
    maxRooms: 1,
    costCallback: functions.avoid_exits,
};

export function get_expected_addition_amount(cd: number, last_cd: number, t: number, rate: number) {
	if (cd == undefined) {
		cd = 0;
	}
	if (last_cd == undefined) {
		last_cd = 0;
	}
	let accumulated_time = cd;
	let init_amount = Math.ceil((last_cd * 1000) ** (1/1.2));
	let additional_amount = rate;
	while (true) {
		let delta_t = Math.ceil((init_amount + additional_amount) ** 1.2 * 0.001);
		if (accumulated_time + delta_t > t) {
			return additional_amount;
		} else {
			accumulated_time += delta_t;
			additional_amount += rate;
		}
	}
}

export function creepjob(creep: Creep): number {
    var conf = config.conf_rooms[creep.memory.home_room_name];
    var game_memory = Game.memory[creep.memory.home_room_name];
	/*
    if (creep.memory.role == 'pb_attacker') {
		let attacker = creep;
        attacker.say("PA");
		attacker.memory.movable = false;
		attacker.memory.crossable = true;
        let pb_status = Game.rooms[attacker.memory.home_room_name].memory.external_resources.pb[attacker.memory.external_room_name];
		if (pb_status == undefined) {
			creep.suicide();
			return 0;
		}
		let healer = Game.creeps[pb_status.pb_healer_name];
		if (attacker.room.name == attacker.memory.home_room_name && (healer == undefined || healer.spawning) && attacker.memory.working_status == undefined) {
			basic_job.ask_for_renew(attacker);
			return 0;
		}
		attacker.memory.working_status = "begin";
        let request: type_creep_boost_request = {};
        for (let part in config.pb_attacker_body) {
            let boost_mineral = config.pb_attacker_body[ < BodyPartConstant > part].boost;
            if (boost_mineral !== undefined) {
                request[ < BodyPartConstant > part] = boost_mineral
            }
        }
        if (attacker.room.name == attacker.memory.home_room_name && basic_job.boost_request(attacker, request, true) == 1) {
			attacker.say("PAb");
			return 0;
		}
		if (healer == undefined) {
			invade.single_combat_melee(attacker);
			return 0;
		}
		if (!(healer.memory.boost_status !== undefined && healer.memory.boost_status.boost_finished)) {
			attacker.say("PAw");
			return 0;
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
			return 0;
		}
		if (invade.group2_combat_melee(attacker, healer, 4) == 0) {
			return 0;
		}
		let pb_xy = pb_status.xy;
		let pb_pos = attacker.room.getPositionAt(pb_xy[0], pb_xy[1]);
		let pb = < StructurePowerBank > (pb_pos.lookFor("structure").filter((e) => e.structureType == 'powerBank')[0]);
		if (pb == undefined) {
			pb_status.hits = 0;
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
			return 0;
		}
		if (healer.pos.getRangeTo(attacker) == 1) {
			healer.move(healer.pos.getDirectionTo(attacker));
		} else if (healer.pos.getRangeTo(attacker) > 1) {
			healer.moveTo(attacker.pos, {range: 1, costCallback: functions.avoid_exits});
		}
		if (attacker.pos.getRangeTo(pb) > 1) {
			attacker.moveTo(pb, {
				range: 1,
				maxRooms: 1,
				costCallback: function(room_name: string, costmatrix: CostMatrix) {
					functions.avoid_exits(room_name, costmatrix);
					costmatrix.set(healer.pos.x, healer.pos.y, 0)
				}
			});
			attacker.memory.movable = true;
			attacker.say("PAm");
		} else {
			pb_status.hits = pb.hits;
			if (attacker.pos.getRangeTo(healer) == 1 && attacker.hits == attacker.hitsMax) {
				if (pb.hits > 1800) {
					attacker.memory.ready = true;
					attacker.attack(pb);
					healer.heal(attacker);
					attacker.say("PAa1");
					healer.say("PAh1");
				} else if (attacker.ticksToLive <= 3 || healer.ticksToLive <= 3 || mymath.all(pb_status.pb_carrier_names.map((e) => Game.creeps[e].memory.ready))) {
					attacker.attack(pb);
					healer.heal(attacker);
					attacker.say("PAa2");
					healer.say("PAh2");
				}
			}
			return 0;
		}
        return 0;
    } else if (creep.memory.role == 'pb_healer') {
        // 20 heal, 20 move
        creep.say("PH");
		creep.memory.movable = false;
		creep.memory.crossable = true;
        let pb_status = Game.rooms[creep.memory.home_room_name].memory.external_resources.pb[creep.memory.external_room_name];
		if (pb_status == undefined) {
			creep.suicide();
			return 0;
		}
		let attacker = Game.creeps[pb_status.pb_attacker_name];
		if (creep.room.name == creep.memory.home_room_name && (attacker == undefined || attacker.spawning) && creep.memory.working_status == undefined) {
			basic_job.ask_for_renew(creep);
			return 0;
		}
		creep.memory.working_status = "begin";
        let request: type_creep_boost_request = {};
        for (let part in config.pb_healer_body) {
            let boost_mineral = config.pb_healer_body[ < BodyPartConstant > part].boost;
            if (boost_mineral !== undefined) {
                request[ < BodyPartConstant > part] = boost_mineral
            }
        }
        if (creep.room.name == creep.memory.home_room_name && basic_job.boost_request(creep, request, true) == 1) {
			creep.say("PHb");
			return 0;
		}
        return 0;
    } else if (creep.memory.role == 'pb_carrier') {
	*/
    if (creep.memory.role == 'pb_carrier') {
        // 40 carry, 10 move
        creep.say("PC");
        creep.memory.movable = false;
        creep.memory.crossable = true;
		if (creep.fatigue > 0) {
			return 0;
		}
        let pb_status = Game.rooms[creep.memory.home_room_name].memory.external_resources.pb[creep.memory.external_room_name];
		if (creep.memory.working_status == undefined) {
			creep.memory.working_status = 'move_forward';
		}
		switch(creep.memory.working_status) {
			case 'move_forward': {
				let rooms_path = pb_status.rooms_path;
				let poses_path = pb_status.poses_path;
				let target_room = rooms_path[rooms_path.length - 1];
				if (creep.room.name !== target_room) {
					if (!external_room.is_moving_target_defined(creep, 'forward')) {
						external_room.save_external_moving_targets(creep, rooms_path, poses_path, 'forward');
					}
					external_room.external_move(creep, 'forward', {reusePath: 10});
					creep.memory.movable = true;
					creep.say("PCe2");
					break;
				} else if (external_room.moveawayexit(creep) == 0) {
					break;
				}
				creep.memory.working_status = 'withdraw';
				break;
			}
			case 'withdraw': {
				if (creep.store.getUsedCapacity("power") > 0) {
					creep.memory.working_status = 'move_backward';
					break;
				}
				let pb_xy = pb_status.xy;
				let pb_pos = creep.room.getPositionAt(pb_xy[0], pb_xy[1]);
				let pb = < StructurePowerBank > (pb_pos.lookFor("structure").filter((e) => e.structureType == 'powerBank')[0]);
				if (pb == undefined) {
					if (!creep.pos.isNearTo(pb_pos)) {
						creep.moveTo(pb_xy[0], pb_xy[1], {
							range: 1,
							maxRooms: 1,
							costCallback: function (roomName: string, costMatrix: CostMatrix) {
								functions.avoid_exits(roomName, costMatrix);
								functions.ignore_objects(costMatrix, creep.room.find(FIND_MY_CREEPS).map((e) => e.pos));
							}
						});
						creep.memory.movable = true;
						creep.say("PCm1");
					} else {
						let ruin = pb_pos.lookFor("ruin")[0];
						if (ruin !== undefined) {
							creep.withdraw(ruin, "power");
							creep.say("PCr1");
							break;
						}
						let resource = pb_pos.lookFor("resource")[0];
						if (resource !== undefined) {
							creep.pickup(resource);
							creep.say("PCr2");
							break;
						}
					}
					break;
				} else if (creep.pos.getRangeTo(pb_pos) > 3) {
					creep.moveTo(pb_xy[0], pb_xy[1], {
						range: 3,
						maxRooms: 1,
						costCallback: functions.avoid_exits
					});
					creep.memory.movable = true;
					creep.say("PCm3");
					break;
				}
				creep.say("PCw");
				break;
			}
			case 'move_backward': {
				if (creep.room.name !== creep.memory.home_room_name) {
					let rooms_path = pb_status.rooms_path;
					let poses_path = pb_status.poses_path;
					let target_room = rooms_path[rooms_path.length - 1];
					let movethroughrooms_options: type_movethroughrooms_options = {
						ignore_creep_xys: creep.room.find(FIND_MY_CREEPS).map((e) => [e.pos.x, e.pos.y]),
					}
					if (!external_room.is_moving_target_defined(creep, 'backward')) {
						let rooms_path_reverse = _.clone(rooms_path);
						let poses_path_reverse = _.clone(poses_path);
						rooms_path_reverse.reverse();
						poses_path_reverse.reverse();
						external_room.save_external_moving_targets(creep, rooms_path_reverse, poses_path_reverse, 'backward');
					}
					external_room.external_move(creep, 'backward', {reusePath: 10}, movethroughrooms_options);
					creep.memory.movable = true;
					creep.say("PCe1");
					break;
				} else if (external_room.moveawayexit(creep) == 0) {
					break;
				}
				creep.memory.working_status = 'transfer_power';
				break;
			}
			case 'transfer_power': {
				if (creep.store.getUsedCapacity("power") == 0) {
					creep.memory.working_status = 'recycle';
					break;
				}
				let out = basic_job.transfer(creep, creep.room.terminal, {sourcetype: "power"});
				if (out == 0) {
					pb_status.amount_received += creep.store.getUsedCapacity("power");
					pb_status.n_pb_carrier_finished += 1;
				}
				creep.say("PCt");
				break;
			}
			case 'recycle': {
				creep.say("PCd");
				if (basic_job.ask_for_recycle_full(creep) == -1) {
					creep.suicide();
				}
				break;
			}
		}
	} else if (creep.memory.role == 'depo_container_builder') {
		creep.say("DB");
		creep.memory.movable = false;
		creep.memory.crossable = true;
		if (basic_job.boost_request(creep, {"work": "LH2O"}, true) == 1) {
			creep.say("DBb");
			return 0;
		}
		if (creep.room.name == creep.memory.home_room_name && creep.store.getFreeCapacity() > 0) {
			basic_job.get_energy(creep);
			creep.say("DBg");
			return 0;
		}
        let depo_status = Game.rooms[creep.memory.home_room_name].memory.external_resources.depo[creep.memory.external_room_name];
        let rooms_path = depo_status.rooms_path;
        let poses_path = depo_status.poses_path;
        let target_room = rooms_path[rooms_path.length - 1];
        if (creep.room.name !== target_room) {
			if (!external_room.is_moving_target_defined(creep, 'forward')) {
				external_room.save_external_moving_targets(creep, rooms_path, poses_path, 'forward');
			}
			external_room.external_move(creep, 'forward', {reusePath: 10});
			creep.memory.movable = true;
			creep.say("DBe");
            return 0;
		}
		let container_pos = creep.room.getPositionAt(depo_status.container_xy[0], depo_status.container_xy[1]);
		let container = <StructureContainer> container_pos.lookFor("structure").filter((e) => e.structureType == 'container')[0];
		if (container !== undefined) {
			depo_status.status = 1;
			if (creep.pos.isEqualTo(container)) {
				let path = PathFinder.search(creep.pos, {pos: container_pos, range: 1}, {flee: true});
				creep.moveByPath(path.path);
			} else {
				creep.suicide();
			}
			creep.say("DBd");
			return 0;
		}
		if (!creep.pos.isEqualTo(container_pos)) {
			creep.moveTo(container_pos, {reusePath: 10, costCallback: functions.avoid_exits, maxRooms: 1, range: 0});
			creep.say("DBm");
			return 0;
		}
		let container_site = container_pos.lookFor("constructionSite").filter((e) => e.structureType == 'container')[0];
		if (container_site == undefined) {
			container_pos.createConstructionSite("container");
			creep.say("DBc");
			return 0;
		}
		creep.build(container_site);
		creep.say("DBb");
		return 0;
	} else if (creep.memory.role == 'depo_energy_carrier') {
		creep.say("DE");
		creep.memory.movable = false;
		creep.memory.crossable = true;
		if (creep.room.name == creep.memory.home_room_name && creep.store.getFreeCapacity() > 0) {
			basic_job.get_energy(creep);
			creep.say("DEg");
			return 0;
		}
        let depo_status = Game.rooms[creep.memory.home_room_name].memory.external_resources.depo[creep.memory.external_room_name];
        let rooms_path = depo_status.rooms_path;
        let poses_path = depo_status.poses_path;
        let target_room = rooms_path[rooms_path.length - 1];
        if (creep.room.name !== target_room) {
			if (!external_room.is_moving_target_defined(creep, 'forward')) {
				external_room.save_external_moving_targets(creep, rooms_path, poses_path, 'forward');
			}
			external_room.external_move(creep, 'forward', {reusePath: 10});
			creep.memory.movable = true;
			creep.say("DEe");
            return 0;
		}
		if (depo_status.status == 1) {
			creep.suicide();
			creep.say("DEd");
			return 0;
		}
		let container_pos = creep.room.getPositionAt(depo_status.container_xy[0], depo_status.container_xy[1]);
		if (creep.pos.getRangeTo(container_pos) > 3) {
			creep.moveTo(container_pos, {reusePath: 10, costCallback: functions.avoid_exits, maxRooms: 1, range: 3});
			creep.say("DEm");
			return 0;
		}
		let container_builder = creep.room.find(FIND_MY_CREEPS).filter((e) => e.memory.role == 'depo_container_builder')[0];
		if (container_builder == undefined) {
			creep.say("DEw");
			return 0;
		}
		if (container_builder.store.getUsedCapacity("energy") > 0) {
			creep.say("DEw");
			return 0;
		}
		if (creep.pos.isNearTo(container_builder)) {
			creep.transfer(container_builder, "energy");
			creep.say("DEt");
		} else {
			creep.moveTo(container_builder.pos, {reusePath: 10, costCallback: functions.avoid_exits, maxRooms: 1, range: 1});
			creep.say("DEm");
			return 0;
		}
	} else if (creep.memory.role == 'depo_harvester') {
		creep.say("DH");
		creep.memory.movable = false;
		creep.memory.crossable = true;
		if (creep.memory.working_status == undefined) {
			creep.memory.working_status = 'boost';
		}
		let depo_status = Game.rooms[creep.memory.home_room_name].memory.external_resources.depo[creep.memory.external_room_name];
		let do_attack = false;
		switch(creep.memory.working_status) {
			case 'boost': {
				let boost_request = functions.conf_body_to_boost_request(config.powered_depo_harvester_body);
				if (creep.memory.request_boost && basic_job.boost_request(creep, boost_request, true) == 1) {
					creep.say("DHb");
					break;
				}
				creep.memory.working_status = 'external_move';
				break;
			}
			case 'external_move': {
				let rooms_path = depo_status.rooms_path;
				let poses_path = depo_status.poses_path;
				let target_room = rooms_path[rooms_path.length - 1];
				if (creep.room.name !== target_room) {
					if (!external_room.is_moving_target_defined(creep, 'forward')) {
						external_room.save_external_moving_targets(creep, rooms_path, poses_path, 'forward');
					}
					external_room.external_move(creep, 'forward', {reusePath: 10});
					creep.memory.movable = true;
					creep.say("DHe");
					break;
				} else if (external_room.moveawayexit(creep) == 0) {
					break;
				}
				creep.memory.working_status = 'move';
				break;
			}
			case 'fight': {
				console.log(`Warning: creep ${creep.name} fighting in room ${creep.room.name} at tick ${Game.time}`);
				let hostile = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 2)[0];
				if (hostile == undefined) {
					if (creep.hits == creep.hitsMax) {
						creep.memory.working_status = 'move';
					} else {
						creep.heal(creep);
					}
				} else {
					if (creep.pos.isNearTo(hostile)) {
						creep.attack(hostile);
					} else {
						creep.moveTo(hostile, {range: 1, costCallback: functions.avoid_exits});
						creep.heal(creep);
					}
				}
				break;
			}
			case 'move': {
				let hostile = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 2)[0];
				if (hostile !== undefined) {
					creep.memory.working_status = 'fight';
					break;
				}
				let container_pos = creep.room.getPositionAt(depo_status.container_xy[0], depo_status.container_xy[1]);
				if (!creep.pos.isEqualTo(container_pos)) {
					let creep_on_container = container_pos.lookFor("creep")[0];
					let range = 0;
					if (creep_on_container !== undefined) {
						range = 2;
					}
					if (creep.pos.getRangeTo(container_pos) > range) {
						creep.moveTo(container_pos, {reusePath: 10, costCallback: functions.avoid_exits, maxRooms: 1, range: range});
					}
					creep.say("DHm");
					break;
				}
			}
			case 'work': {
				let hostile = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 2)[0];
				if (hostile !== undefined) {
					creep.memory.working_status = 'fight';
					break;
				}
				let container_pos = creep.room.getPositionAt(depo_status.container_xy[0], depo_status.container_xy[1]);
				let container = <StructureContainer> container_pos.lookFor("structure").filter((e) => e.structureType == 'container')[0];
				if (container == undefined) {
					depo_status.status = 0;
					creep.suicide();
					creep.say("DHd");
					break;
				}
				if (creep.store.getUsedCapacity("energy") > 0) {
					creep.repair(container);
					break;
				}
				let depo = Game.getObjectById(depo_status.id);
				if (depo.cooldown > 0) { 
					if (creep.store.getUsedCapacity(depo_status.deposit_type) > 0 && container.store.getFreeCapacity(depo_status.deposit_type) > 0) {
						creep.transfer(container, depo_status.deposit_type);
					}
				} else {
					let container_freecapacity = container.store.getFreeCapacity(depo_status.deposit_type);
					let rate = creep.getActiveBodyparts(WORK) * (creep.memory.request_boost ? 5 : 1);
					if (container_freecapacity >= rate) {
						depo_status.last_active_time = Game.time;
						creep.harvest(depo);
						creep.say("DHh");
					}
				}
				if (Game.time >= depo_status.time_update_amount) {
					let rate = creep.getActiveBodyparts(WORK) * (creep.memory.request_boost ? 5 : 1);
					depo_status.expected_additional_amount = get_expected_addition_amount(depo.cooldown, depo.lastCooldown, depo_status.distance + 150, rate);
					depo_status.time_update_amount += 20;
				}
				creep.say(depo_status.expected_additional_amount.toString());
			}
		}
	} else if (creep.memory.role == 'depo_carrier') {
		creep.say("DC");
		creep.memory.movable = false;
		creep.memory.crossable = true;
		if (creep.fatigue > 0) {
			return 0;
		}
		if (creep.memory.working_status == undefined) {
			creep.memory.working_status = 'get';
		}
        let depo_status = Game.rooms[creep.memory.home_room_name].memory.external_resources.depo[creep.memory.external_room_name];
		switch(creep.memory.working_status) {
			case 'get': {
				if (depo_status.container_hits <= 170000 && depo_status.depo_carrier_names.length == 1 && creep.store.getUsedCapacity("energy") < 800 && creep.room.name == creep.memory.home_room_name) {
					basic_job.get_energy(creep, {max_amount: 800 - creep.store.getUsedCapacity("energy")});
					creep.say("DCg");
					break;
				}
				creep.memory.working_status = 'move_forward';
			}
			case 'move_forward': {
				let rooms_path = depo_status.rooms_path;
				let poses_path = depo_status.poses_path;
				let target_room = rooms_path[rooms_path.length - 1];
				if (creep.room.name !== target_room) {
					if (!external_room.is_moving_target_defined(creep, 'forward')) {
						external_room.save_external_moving_targets(creep, rooms_path, poses_path, 'forward');
					}
					external_room.external_move(creep, 'forward', {reusePath: 10});
					creep.memory.movable = true;
					creep.say("DCe2");
					break;
				} else {
					let container_pos = creep.room.getPositionAt(depo_status.container_xy[0], depo_status.container_xy[1]);
					if (!creep.pos.isNearTo(container_pos)) {
						creep.moveTo(container_pos, {reusePath: 10, costCallback: functions.avoid_exits, maxRooms: 1, range: 1});
						break;
					}
				}
				creep.memory.working_status = 'transfer_energy';
				break;
			}
			case 'transfer_energy': {
				let container_pos = creep.room.getPositionAt(depo_status.container_xy[0], depo_status.container_xy[1]);
				let container = <StructureContainer> container_pos.lookFor("structure").filter((e) => e.structureType == 'container')[0];
				if (container == undefined) {
					depo_status.status = 0;
					creep.suicide();
					break;
				}
				if (creep.store.getUsedCapacity("energy") > 0) {
					let depo_harvester = container.pos.lookFor("creep")[0]
					if (depo_harvester !== undefined) {
						creep.transfer(depo_harvester, "energy");
					}
					break;
				}
				creep.memory.working_status = 'withdraw';
				break;
			}
			case 'withdraw': {
				if (creep.store.getFreeCapacity(depo_status.deposit_type) == 0) {
					creep.memory.working_status = 'move_backward';
					break;
				}
				let container_pos = creep.room.getPositionAt(depo_status.container_xy[0], depo_status.container_xy[1]);
				let container = <StructureContainer> container_pos.lookFor("structure").filter((e) => e.structureType == 'container')[0];
				if (container.store.getUsedCapacity(depo_status.deposit_type) >= creep.store.getFreeCapacity() && creep.ticksToLive > depo_status.distance * 2) {
					creep.withdraw(container, depo_status.deposit_type);
					break;
				}
				break;
			}
			case 'move_backward': {
				let rooms_path = depo_status.rooms_path;
				let poses_path = depo_status.poses_path;
				let target_room = rooms_path[rooms_path.length - 1];
				if (creep.room.name !== creep.memory.home_room_name) {
					if (!external_room.is_moving_target_defined(creep, 'backward')) {
						let rooms_path_reverse = _.clone(rooms_path);
						let poses_path_reverse = _.clone(poses_path);
						rooms_path_reverse.reverse();
						poses_path_reverse.reverse();
						external_room.save_external_moving_targets(creep, rooms_path_reverse, poses_path_reverse, 'backward');
					}
					external_room.external_move(creep, 'backward', {reusePath: 10});
					creep.memory.movable = true;
					creep.say("DCe1");
					break;
				} else if (external_room.moveawayexit(creep) == 0) {
					break;
				}
				creep.memory.working_status = 'transfer_depo';
				break;
			}
			case 'transfer_depo': {
				let rooms_path = depo_status.rooms_path;
				let poses_path = depo_status.poses_path;
				let target_room = rooms_path[rooms_path.length - 1];
				if (creep.store.getUsedCapacity(depo_status.deposit_type) > 0) {
					let out = basic_job.transfer(creep, creep.room.terminal, {sourcetype: depo_status.deposit_type});
					if (out == 0) {
						depo_status.amount_received += creep.store.getUsedCapacity(depo_status.deposit_type);
					}
					creep.say("DCt");
					break;
				}
				creep.memory.working_status = 'recycle';
				break;
			}
			case 'recycle': {
				if (basic_job.ask_for_recycle_full(creep) == -1) {
					creep.suicide();
				}
				break;
			}
		}
	}
    return 1;
}
