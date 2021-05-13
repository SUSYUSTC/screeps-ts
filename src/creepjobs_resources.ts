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

function modify_poses_path(creep: Creep) {
}

export function creepjob(creep: Creep): number {
    var conf = config.conf_rooms[creep.memory.home_room_name];
    var game_memory = Game.memory[creep.memory.home_room_name];
    if (creep.memory.role == 'pb_attacker') {
        creep.say("PA");
		creep.memory.movable = false;
		creep.memory.crossable = true;
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
        let pb_status = Game.rooms[creep.memory.home_room_name].memory.external_resources.pb[creep.memory.external_room_name];
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
                let healer = Game.creeps[pb_status.pb_healer_name];
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
        let pb_status = Game.rooms[creep.memory.home_room_name].memory.external_resources.pb[creep.memory.external_room_name];
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
                let attacker = Game.creeps[pb_status.pb_attacker_name];
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
		creep.say("DH");
	} else if (creep.memory.role == 'depo_harvester') {
		creep.say("DH");
	} else if (creep.memory.role == 'depo_carrier') {
		creep.say("DC");
	}
    return 1;
}
