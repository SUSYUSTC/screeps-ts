import * as _ from "lodash"
import * as basic_job from "./basic_job";
import * as functions from "./functions"
import * as external_room from "./external_room";
import * as config from "./config";
import * as mymath from "./mymath"
var moveoptions = {
    reusePath: 5,
    //visualizePathStyle: {},
    maxRooms: 1,
    costCallback: functions.avoid_exits,
};

export function creepjob(creep: Creep): number {
    var conf = config.conf_rooms[creep.memory.home_room_name];
    var game_memory = Game.memory[creep.memory.home_room_name];
    if (creep.memory.role == 'pb_attacker') {
        creep.say("PA");
		creep.memory.movable = false;
		creep.memory.crossable = true;
        let pb_status = Game.rooms[creep.memory.home_room_name].memory.external_resources.pb[creep.memory.external_room_name];
		let healer = Game.creeps[pb_status.pb_healer_name];
		if (creep.room.name == creep.memory.home_room_name && (healer == undefined || healer.spawning) && creep.memory.working_status == undefined) {
			if (creep.ticksToLive < 1500 - Math.floor(600/creep.body.length)) {
				basic_job.ask_for_renew(creep);
			}
			return 0;
		}
		creep.memory.working_status = "begin";
        let request: type_creep_boost_request = {};
        for (let part in config.pb_attacker_body) {
            let boost_mineral = config.pb_attacker_body[ < BodyPartConstant > part].boost;
            if (boost_mineral !== undefined) {
                request[ < BodyPartConstant > part] = boost_mineral
            }
        }
        if (creep.room.name == creep.memory.home_room_name && basic_job.boost_request(creep, request, true) == 1) {
			creep.say("PAb");
			return 0;
		}
        let rooms_path = pb_status.rooms_path;
        let poses_path = pb_status.poses_path;
        let target_room = rooms_path[rooms_path.length - 1];
        if (creep.room.name !== target_room) {
            external_room.movethroughrooms(creep, rooms_path, poses_path, {reusePath: 10}, {replace_pos: true});
			creep.memory.movable = true;
			creep.say("PAe");
            return 0;
        } else {
            let pb_xy = pb_status.xy;
            let pb_pos = creep.room.getPositionAt(pb_xy[0], pb_xy[1]);
            let pb = < StructurePowerBank > (pb_pos.lookFor("structure").filter((e) => e.structureType == 'powerBank')[0]);
            if (pb == undefined) {
                creep.suicide();
				creep.say("PAd");
                return 0;
            }
            if (creep.pos.getRangeTo(pb) > 1) {
                creep.moveTo(pb, {
                    range: 1,
                    maxRooms: 1,
                    costCallback: functions.avoid_exits
                });
				creep.memory.movable = true;
				creep.say("PAm");
            } else {
                if (healer == undefined || healer.room.name !== creep.room.name) {
					creep.say("PAw");
                    return 0;
                }
                if (creep.pos.getRangeTo(healer) == 1 && creep.hits == creep.hitsMax) {
                    if (pb.hits > 1800) {
                        creep.memory.ready = true;
                        creep.attack(pb);
						creep.say("PAa1");
                    } else if (creep.ticksToLive < 3 || healer.ticksToLive < 3 || mymath.all(pb_status.pb_carrier_names.map((e) => Game.creeps[e].memory.ready))) {
                        creep.attack(pb);
						creep.say("PAa2");
                    }
                }
                return 0;
            }
        }
        return 0;
    } else if (creep.memory.role == 'pb_healer') {
        // 20 heal, 20 move
        creep.say("PH");
		creep.memory.movable = false;
		creep.memory.crossable = true;
        let pb_status = Game.rooms[creep.memory.home_room_name].memory.external_resources.pb[creep.memory.external_room_name];
		let attacker = Game.creeps[pb_status.pb_attacker_name];
		if (creep.room.name == creep.memory.home_room_name && (attacker == undefined || attacker.spawning) && creep.memory.working_status == undefined) {
			if (creep.ticksToLive < 1500 - Math.floor(600/creep.body.length)) {
				basic_job.ask_for_renew(creep);
			}
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
        let rooms_path = pb_status.rooms_path;
        let poses_path = pb_status.poses_path;
        let target_room = rooms_path[rooms_path.length - 1];
        if (creep.room.name !== target_room) {
            external_room.movethroughrooms(creep, rooms_path, poses_path, {reusePath: 10}, {replace_pos: true});
			creep.memory.movable = true;
			creep.say("PHe");
            return 0;
        } else {
            let pb_xy = pb_status.xy;
            let pb_pos = creep.room.getPositionAt(pb_xy[0], pb_xy[1]);
            let pb = < StructurePowerBank > (pb_pos.lookFor("structure").filter((e) => e.structureType == 'powerBank')[0]);
            if (pb == undefined) {
                creep.suicide();
				creep.say("PHd");
                return 0;
            }
            if (creep.pos.x > 1 && creep.pos.x < 48 && creep.pos.y > 1 && creep.pos.y < 48) {
                if (attacker.room.name !== creep.room.name) {
					creep.say("PHw");
                    return 0;
                }
                if (creep.pos.getRangeTo(attacker) > 1) {
                    creep.moveTo(attacker, {
                        range: 1,
                        maxRooms: 1
                    });
					creep.memory.movable = true;
					creep.say("PHm1");
                    return 0;
                } else {
                    creep.memory.ready = true;
                    creep.heal(attacker);
					creep.say("PHh");
                    return 0;
                }
            } else {
                creep.moveTo(pb, {
                    range: 1,
                    maxRooms: 1
                });
				creep.memory.movable = true;
				creep.say("PHm2");
                return 0;
            }
        }
        return 0;
    } else if (creep.memory.role == 'pb_carrier') {
        // 40 carry, 10 move
        creep.say("PC");
        creep.memory.movable = false;
        creep.memory.crossable = true;
        let pb_status = Game.rooms[creep.memory.home_room_name].memory.external_resources.pb[creep.memory.external_room_name];
        let rooms_path = pb_status.rooms_path;
        let poses_path = pb_status.poses_path;
        let target_room = rooms_path[rooms_path.length - 1];
        if (creep.store.getUsedCapacity("power") > 0) {
            if (creep.room.name !== creep.memory.home_room_name) {
                let rooms_path_reverse = _.clone(rooms_path);
                let poses_path_reverse = _.clone(poses_path);
                rooms_path_reverse.reverse();
                poses_path_reverse.reverse();
                let add_options = {};
                if (creep.room.name == target_room) {
                    add_options = {
                        ignoreCreeps: true,
						reusePath: 10,
                    };
                }
                external_room.movethroughrooms(creep, rooms_path_reverse, poses_path_reverse, add_options, {replace_pos: true});
				creep.memory.movable = true;
				creep.say("PCe1");
            } else {
				let out = basic_job.transfer(creep, creep.room.terminal, {sourcetype: "power"});
				if (out == 0) {
					pb_status.amount_received += creep.store.getUsedCapacity("power");
				}
				creep.say("PCt");
            }
            return 0;
        }
        if (creep.memory.ready && creep.room.name == creep.memory.home_room_name) {
			creep.say("PCd");
			pb_status.n_pb_carrier_finished += 1;
            creep.suicide();
        }
        if (creep.room.name !== target_room) {
            external_room.movethroughrooms(creep, rooms_path, poses_path, {reusePath: 10}, {replace_pos: true});
			creep.memory.movable = true;
			creep.say("PCe2");
            return 0;
        } else {
            let pb_xy = pb_status.xy;
            let pb_pos = creep.room.getPositionAt(pb_xy[0], pb_xy[1]);
            let ruin = pb_pos.lookFor("ruin")[0];
            if (ruin !== undefined) {
                if (creep.withdraw(ruin, "power") == ERR_NOT_IN_RANGE) {
                    creep.moveTo(pb_xy[0], pb_xy[1], {
                        range: 1,
                        maxRooms: 1,
                        costCallback: functions.avoid_exits,
                        ignoreCreeps: true
                    });
					creep.memory.movable = true;
					creep.say("PCm1");
                    return 0;
                }
				creep.say("PCr1");
            }
            let resource = pb_pos.lookFor("resource")[0];
            if (resource !== undefined) {
                if (creep.pickup(resource) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(pb_xy[0], pb_xy[1], {
                        range: 1,
                        maxRooms: 1,
                        costCallback: functions.avoid_exits,
                        ignoreCreeps: true
                    });
					creep.memory.movable = true;
					creep.say("PCm2");
                    return 0;
                }
				creep.say("PCr2");
            }
            if (creep.pos.getRangeTo(pb_xy[0], pb_xy[1]) > 3) {
                creep.moveTo(pb_xy[0], pb_xy[1], {
                    range: 3,
                    maxRooms: 1,
                    costCallback: functions.avoid_exits
                });
				creep.memory.movable = true;
				creep.say("PCm3");
                return 0;
            }
            creep.memory.ready = true;
			creep.say("PCw");
            return 0;
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
            external_room.movethroughrooms(creep, rooms_path, poses_path, {reusePath: 10}, {replace_pos: true});
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
            external_room.movethroughrooms(creep, rooms_path, poses_path, {reusePath: 10}, {replace_pos: true});
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
		let container_builder = Game.creeps[depo_status.depo_container_builder_name];
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
		let boost_request = functions.conf_body_to_boost_request(config.powered_depo_harvester_body);
		if (creep.memory.request_boost && basic_job.boost_request(creep, boost_request, true) == 1) {
			creep.say("DHb");
			return 0;
		}
        let depo_status = Game.rooms[creep.memory.home_room_name].memory.external_resources.depo[creep.memory.external_room_name];
		if (depo_status.container_hits <= 180000 && creep.room.name == creep.memory.home_room_name && creep.store.getFreeCapacity("energy") !== 0) {
			basic_job.get_energy(creep);
			return 0;
		}
        let rooms_path = depo_status.rooms_path;
        let poses_path = depo_status.poses_path;
        let target_room = rooms_path[rooms_path.length - 1];
        if (creep.room.name !== target_room) {
            external_room.movethroughrooms(creep, rooms_path, poses_path, {reusePath: 10}, {replace_pos: true});
			creep.memory.movable = true;
			creep.say("DHe");
            return 0;
		}
		let container_pos = creep.room.getPositionAt(depo_status.container_xy[0], depo_status.container_xy[1]);
		let container = <StructureContainer> container_pos.lookFor("structure").filter((e) => e.structureType == 'container')[0];
		if (container == undefined) {
			depo_status.status = 0;
			creep.suicide();
			creep.say("DHd");
			return 0;
		}
		if (!creep.pos.isEqualTo(container_pos)) {
			creep.moveTo(container_pos, {reusePath: 10, costCallback: functions.avoid_exits, maxRooms: 1, range: 0});
			creep.say("DHm");
			return 0;
		}
		if (creep.store.getUsedCapacity("energy") > 0) {
			creep.repair(container);
			return 0;
		}
		let creep_amount = creep.store.getUsedCapacity(depo_status.deposit_type);
		let container_amount = container.store.getUsedCapacity(depo_status.deposit_type);
		if (creep_amount + container_amount >= 1600 && container_amount < 1600) {
			creep.transfer(container, depo_status.deposit_type, 1600 - container_amount);
			return 0;
		}
		if (container.store.getFreeCapacity() >= creep.getActiveBodyparts(WORK) * (creep.memory.request_boost ? 5 : 1)) {
			let depo = Game.getObjectById(depo_status.id);
			creep.harvest(depo);
			creep.say("DHh");
			return 0;
		}
	} else if (creep.memory.role == 'depo_carrier') {
		creep.say("DC");
		creep.memory.movable = false;
		creep.memory.crossable = true;
        let depo_status = Game.rooms[creep.memory.home_room_name].memory.external_resources.depo[creep.memory.external_room_name];
        let rooms_path = depo_status.rooms_path;
        let poses_path = depo_status.poses_path;
        let target_room = rooms_path[rooms_path.length - 1];
        if (creep.store.getUsedCapacity(depo_status.deposit_type) > 0) {
            if (creep.room.name !== creep.memory.home_room_name) {
                let rooms_path_reverse = _.clone(rooms_path);
                let poses_path_reverse = _.clone(poses_path);
                rooms_path_reverse.reverse();
                poses_path_reverse.reverse();
                external_room.movethroughrooms(creep, rooms_path_reverse, poses_path_reverse, {reusePath: 10}, {replace_pos: true});
				creep.memory.movable = true;
				creep.say("DCe1");
            } else {
				let out = basic_job.transfer(creep, creep.room.terminal, {sourcetype: depo_status.deposit_type});
				if (out == 0) {
					depo_status.amount_received += creep.store.getUsedCapacity(depo_status.deposit_type);
				}
				creep.say("DCt");
            }
            return 0;
        }
        if (creep.memory.ready && creep.room.name == creep.memory.home_room_name) {
			creep.say("DCd");
            creep.suicide();
			return 0;
        }
        if (creep.room.name !== target_room) {
            external_room.movethroughrooms(creep, rooms_path, poses_path, {reusePath: 10}, {replace_pos: true});
			creep.memory.movable = true;
			creep.say("DCe2");
            return 0;
        } else {
			creep.memory.ready = true;
			let container_pos = creep.room.getPositionAt(depo_status.container_xy[0], depo_status.container_xy[1]);
			if (!creep.pos.isNearTo(container_pos)) {
				creep.moveTo(container_pos, {reusePath: 10, costCallback: functions.avoid_exits, maxRooms: 1, range: 1});
				return 0;
			}
			let container = <StructureContainer> container_pos.lookFor("structure").filter((e) => e.structureType == 'container')[0];
			if (container == undefined) {
				depo_status.status = 0;
				creep.suicide();
				return 0;
			}
			if (container.store.getUsedCapacity(depo_status.deposit_type) >= creep.store.getFreeCapacity() && creep.ticksToLive > depo_status.distance * 2) {
				creep.withdraw(container, depo_status.deposit_type);
			}
		}
	}
    return 1;
}
