import * as _ from "lodash"
import * as defense from "./defense";
import * as mymath from "./mymath";
import * as hunting from "./hunting"
import * as functions from "./functions"
import * as external_room from "./external_room";
import * as config from "./config";
import * as basic_job from "./basic_job";
var moveoptions = {
    reusePath: 5,
    //visualizePathStyle: {},
    maxRooms: 0,
    costCallback: functions.avoid_exits,
};
export function creepjob(creep: Creep): number {
	let conf = config.conf_rooms[creep.memory.home_room_name];
	if (conf == undefined) {
		conf = config.conf_rooms[creep.room.name];
	}
    if (creep.memory.role == 'hunter') {
        creep.say("HT")
        creep.memory.movable = false;
        hunting.hunt(creep, config.hunting[creep.memory.home_room_name]);
		return 0;
    } else if (creep.memory.role == 'invader_core_attacker') {
        creep.say("A");
        creep.memory.movable = false;
        let external_room_status = Game.rooms[creep.memory.home_room_name].memory.external_room_status;
        let rooms_with_invader_core = Object.keys(external_room_status).filter((e) => external_room_status[e].invader_core_existance)
        // Add defending_room if not existing
        if (!("defending_room" in creep.memory)) {
            if (rooms_with_invader_core.length > 0) {
                creep.memory.defending_room = rooms_with_invader_core[0];
            }
        }
        // Deleting defending_room if the invader core is defeated and the creep is already back home
        if (("defending_room" in creep.memory) && (creep.room.name == creep.memory.home_room_name) && !rooms_with_invader_core.includes(creep.memory.defending_room)) {
            delete creep.memory.defending_room;
        }
        // No invader core found
        if (!("defending_room" in creep.memory)) {
            //The creep should in the home room or stand at the exit
            if (creep.room.name == creep.memory.home_room_name) {
                if (creep.pos.x !== conf.safe_pos[0] || creep.pos.y !== conf.safe_pos[1]) {
                    creep.moveTo(conf.safe_pos[0], conf.safe_pos[1], moveoptions);
                }
            }
            return 0;
        }
        let conf_controller = conf.external_rooms[creep.memory.defending_room].controller;
        // Going to the defending room
        if (creep.room.name !== creep.memory.defending_room) {
            external_room.movethroughrooms(creep, conf_controller.rooms_forwardpath, conf_controller.poses_forwardpath);
            return 0;
        }
        let structures = creep.room.find(FIND_STRUCTURES);
        let invader_cores = structures.filter((e) => e.structureType == "invaderCore");
        let invader_core;
        // Going back if current room does not have invader core
        if (invader_cores.length == 0) {
            if (!rooms_with_invader_core.includes(creep.memory.defending_room)) {
                external_room.movethroughrooms(creep, conf_controller.rooms_backwardpath, conf_controller.poses_backwardpath);
            }
            return 0;
        }
        // Fight
        invader_core = invader_cores[0];
        if (creep.attack(invader_core) == ERR_NOT_IN_RANGE) {
            creep.moveTo(invader_core, moveoptions)
        }
		return 0;
    } else if (creep.memory.role == 'defender') {
        creep.say("D");
        creep.memory.movable = false;
        let external_room_status = Game.rooms[creep.memory.home_room_name].memory.external_room_status;
        if ("defending_room" in creep.memory) {
            let defense_type_of_defending_room = external_room_status[creep.memory.defending_room].defense_type;
            if (defense_type_of_defending_room !== '') {
                // Move and fight
                if (creep.room.name == creep.memory.defending_room) {
                    defense.defend(creep);
                } else {
                    let conf_controller = conf.external_rooms[creep.memory.defending_room].controller;
                    try {
                        external_room.movethroughrooms(creep, conf_controller.rooms_forwardpath, conf_controller.poses_forwardpath);
                    } catch (error) {
                        console.log("Seems that the creep is moving on exits");
                    }
                }
            } else {
                // Move back and delete defending_room
                if (creep.room.name == creep.memory.home_room_name) {
                    delete creep.memory.defending_room;
                } else {
                    let conf_controller = conf.external_rooms[creep.memory.defending_room].controller;
                    try {
                        external_room.movethroughrooms(creep, conf_controller.rooms_backwardpath, conf_controller.poses_backwardpath);
                    } catch (error) {
                        console.log("Seems that the creep is moving on exits");
                    }
                }
            }
        } else {
            // Set defending_room
            if (creep.room.name !== creep.memory.home_room_name) {
                console.log("Seems that the creep is moving on exits");
				return 0;
            }
            let fightable_types = config.defender_responsible_types[creep.memory.defender_type].list;
            let responsible_rooms = Object.keys(external_room_status).filter((e) => fightable_types.includes(external_room_status[e].defense_type));
            if (responsible_rooms.length > 0) {
                creep.memory.defending_room = responsible_rooms[0];
            } else {
                creep.moveTo(conf.safe_pos[0], conf.safe_pos[1], moveoptions);
            }
        }
		return 0;
	} else if (creep.memory.role == 'home_defender') {
		if (creep.room.terminal.store.getUsedCapacity("UH2O") < 1200) {
			Game.rooms[config.defense_compounds_storage_room].terminal.send("UH2O", 1200, creep.room.name);
			return 0;
		}
		if (creep.room.terminal.store.getUsedCapacity("ZO") < 300) {
			Game.rooms[config.defense_compounds_storage_room].terminal.send("ZO", 300, creep.room.name);
			return 0;
		}
		let output = basic_job.boost_request(creep, {"attack": "UH2O", "move": "ZO"});
		if (output > 0) {
			return 0;
		}
		let hostile_creeps = creep.room.find(FIND_HOSTILE_CREEPS);
		if (hostile_creeps.length == 0) {
			return 0;
		}
		let ramparts = creep.room.find(FIND_STRUCTURES).filter((e) => e.structureType == 'rampart')
		if (ramparts.length == 0) {
			return 0;
		}
		let distances_ramparts_to_hostile = ramparts.map((r) => mymath.min(hostile_creeps.map((hc) => r.pos.getRangeTo(hc))));
		let argmin_ramparts_to_hostile = mymath.argmin(distances_ramparts_to_hostile);
		let target = ramparts[argmin_ramparts_to_hostile];
		let avoid_boundary = function avoid_exits(room_name: string, costMatrix: CostMatrix) {
			for (let xy of conf.defense_boundary) {
				costMatrix.set(xy[0], xy[1], 255);
			}
		}
		creep.moveTo(target, {maxRooms: 1, reusePath: 0, costCallback: avoid_boundary});
		let distances_hostile = hostile_creeps.map((hc) => creep.pos.getRangeTo(hc));
		let argmin_hostile = mymath.argmin(distances_hostile);
		creep.attack(hostile_creeps[argmin_hostile]);
	}
	return 1;
}
