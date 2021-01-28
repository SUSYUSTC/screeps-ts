import * as _ from "lodash"
import * as role_init from "./role_init";
import * as mymath from "./mymath";
import * as basic_job from "./basic_job";
import * as defense from "./defense";
import * as hunting from "./hunting"
import * as functions from "./functions"
import * as external_room from "./external_room";
var moveoptions = {
    reusePath: 5,
    //visualizePathStyle: {},
    maxRooms: 0,
    costCallback: functions.avoid_exits,
};
export function creepjob(creep: Creep) {
    if (creep.spawning || creep.ticksToLive == undefined) {
        return;
    }
    if (!("role" in creep.memory)) {
        return;
    }
    if ("home_room_name" in creep.memory) {
        var conf = Memory.rooms_conf[creep.memory.home_room_name];
    } else {
        var conf = Memory.rooms_conf[creep.room.name];
    }
    if (creep.memory.role == 'init') {
        role_init.init_work(creep);
        creep.memory.movable = false;
    } else if (creep.memory.role == 'hunter') {
        creep.say("HT")
        creep.memory.movable = false;
        hunting.hunt(creep);
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
            return;
        }
        let conf_controller = conf.external_rooms[creep.memory.defending_room].controller;
        // Going to the defending room
        if (creep.room.name !== creep.memory.defending_room) {
            external_room.movethroughrooms(creep, conf_controller.rooms_forwardpath, conf_controller.poses_forwardpath);
            return;
        }
        let structures = creep.room.find(FIND_STRUCTURES);
        let invader_cores = structures.filter((e) => e.structureType == "invaderCore");
        let invader_core;
        // Going back if current room does not have invader core
        if (invader_cores.length == 0) {
            if (!rooms_with_invader_core.includes(creep.memory.defending_room)) {
                external_room.movethroughrooms(creep, conf_controller.rooms_backwardpath, conf_controller.poses_backwardpath);
            }
            return;
        }
        // Fight
        invader_core = invader_cores[0];
        if (creep.attack(invader_core) == ERR_NOT_IN_RANGE) {
            creep.moveTo(invader_core, moveoptions)
        }
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
                return;
            }
            let fightable_types = Memory.defender_responsible_types[creep.memory.defender_type].list;
            let responsible_rooms = Object.keys(external_room_status).filter((e) => fightable_types.includes(external_room_status[e].defense_type));
            if (responsible_rooms.length > 0) {
                creep.memory.defending_room = responsible_rooms[0];
            } else {
                creep.moveTo(conf.safe_pos[0], conf.safe_pos[1], moveoptions);
            }
        }
    } else {
        var rolename = creep.memory.role;
        var link_modes = creep.room.memory.link_modes;
        if (creep.memory.role == 'harvester') {
            creep.say("H")
            creep.memory.movable = false;
            let source_name = creep.memory.source_name;
            let source_id = conf.sources[source_name].id;
            let source = Game.getObjectById(source_id);
            let link_mode = false;
            let link_source: null | StructureLink = null;
            let container_source: null | StructureContainer = null;
            if (true) {
                link_mode = link_modes.includes(source_name);
                if (link_mode) {
                    let conf_link_source = conf.links[source_name];
                    if (!conf_link_source.finished) {
                        return
                    }
                    link_source = Game.getObjectById(conf_link_source.id);
                } else {
                    let conf_container_source = conf.containers[source_name];
                    if (!conf_container_source.finished) {
                        return
                    }
                    container_source = Game.getObjectById(conf_container_source.id);
                }
                let xy = conf.containers[source_name].pos;
                let pos = creep.room.getPositionAt(xy[0], xy[1]);
                let output = basic_job.movetoposexceptoccupied(creep, [pos]);
                if (output == 0) {
                    return;
                } else if (output == 1) {
                    creep.moveTo(pos.x, pos.y);
                    return;
                }
            }
            if (creep.ticksToLive < 5) {
                if (link_mode) {
                    basic_job.transfer_energy(creep, link_source);
                } else {
                    basic_job.transfer_energy(creep, container_source);
                }
                return;
            }
            let this_container = Game.getObjectById(conf.containers[creep.memory.source_name].id);
            if (creep.store.getUsedCapacity("energy") >= 10 && this_container.hitsMax - this_container.hits >= 1000) {
                creep.repair(this_container);
                return;
            }
            basic_job.harvest_source(creep, source);
            if (link_mode && creep.store.getFreeCapacity() == 0) {
                basic_job.transfer_energy(creep, link_source);
            }
        } else if (creep.memory.role == 'carrier') {
            creep.say("C")
            creep.memory.movable = true;
            let source_name = creep.memory.source_name;
            let container_source;
            if (creep.memory.source_name == 'storage') {
                container_source = creep.room.storage;
            } else {
                let conf_container_source = conf.containers[source_name];
                let conf_container_controller = conf.containers.CT;
                if (!(conf_container_source.finished && conf_container_controller.finished)) {
                    creep.memory.movable = false;
                    return;
                }
                container_source = Game.getObjectById(conf_container_source.id);
            }
            if (creep.store["energy"] == 0) {
                if (creep.ticksToLive >= 30) {
                    if (basic_job.withdraw_energy(creep, container_source, 300) == 1) {
                        creep.memory.movable = false;
                    }
                } else {
                    console.log(creep.name, "suicide")
                    creep.suicide();
                }
            } else {
                let prefered_container = basic_job.preferred_container(creep, conf.containers, conf.carriers[source_name].preferences);
                if (prefered_container !== null) {
                    basic_job.transfer_energy(creep, prefered_container);
                } else {
                    creep.memory.movable = false;
                }
            }
        } else if (creep.memory.role == 'mineharvester') {
            creep.say("M")
            creep.memory.movable = false;
            if (!creep.room.memory.mine_harvestable) {
                return;
            }
            let xy = conf.containers.MINE.pos;
            let pos = creep.room.getPositionAt(xy[0], xy[1]);
            let output = basic_job.movetoposexceptoccupied(creep, [pos]);
            if (output == 0) {
                return;
            } else if (output == 1) {
                creep.moveTo(pos.x, pos.y);
                return;
            }
            let mine = Game.getObjectById(conf.mine.id);
            let mine_container = Game.getObjectById(conf.containers.MINE.id);
            basic_job.harvest_source(creep, mine);
        } else if (creep.memory.role == 'help_harvester') {
            creep.say("HH")
            creep.memory.movable = false;
            let conf_help = Memory.help_list[creep.memory.home_room_name][creep.memory.external_room_name];
            let conf_external = Memory.rooms_conf[creep.memory.external_room_name];
            let conf_container = conf_external.containers[creep.memory.source_name];
            let container_xy = conf_container.pos;
            let container_pos = Game.rooms[creep.memory.external_room_name].getPositionAt(container_xy[0], container_xy[1])
            let container_finished = conf_container.finished;
            if (creep.room.name !== creep.memory.external_room_name) {
                external_room.movethroughrooms(creep, conf_help.rooms_forwardpath, conf_help.poses_forwardpath);
                return;
            }
            let output = basic_job.movetoposexceptoccupied(creep, [container_pos]);
            if (output == 0) {
                return;
            } else if (output == 1) {
                creep.moveTo(container_pos.x, container_pos.y);
                return;
            }
            if (container_finished) {
                let container = Game.getObjectById(conf_container.id);
                if (container.hitsMax - container.hits > 10000 && creep.store.getUsedCapacity("energy") >= 25) {
                    creep.repair(container);
                    return;
                }
            } else {
                let site = container_pos.lookFor("constructionSite")[0]
                if (creep.store.getUsedCapacity("energy") >= 25) {
                    creep.build(site);
                    return;
                }
            }
            let source = Game.getObjectById(conf_external.sources[creep.memory.source_name].id);
            creep.harvest(source);
        } else if (creep.memory.role == 'help_carrier') {
            creep.say("HC")
            creep.memory.movable = true;
            let conf_help = Memory.help_list[creep.memory.home_room_name][creep.memory.external_room_name];
            if (creep.room.name !== creep.memory.external_room_name) {
                external_room.movethroughrooms(creep, conf_help.rooms_forwardpath, conf_help.poses_forwardpath);
                return;
            }
            let conf_external = Memory.rooms_conf[creep.memory.external_room_name];
            let container_source_finished = conf_external.containers[creep.memory.source_name].finished;
            let container_source = Game.getObjectById(conf_external.containers[creep.memory.source_name].id);
            if (!container_source_finished) {
                creep.memory.movable = false;
				if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
					creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
				}
                return;
            }
            let container_MD_finished = conf_external.containers.MD.finished;
            let help_builders = creep.room.find(FIND_MY_CREEPS).filter((e) => e.memory.role == 'help_builder');
            if (!container_MD_finished && help_builders.length == 0) {
                creep.memory.movable = false;
				if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
					creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
				}
                return;
            }
            if (creep.store.getUsedCapacity("energy") == 0) {
                if (creep.ticksToLive >= 30) {
                    if (basic_job.withdraw_energy(creep, container_source, 300) == 1) {
                        creep.memory.movable = false;
                    }
                } else {
                    console.log(creep.name, "suicide")
                    creep.suicide();
                }
                return;
            }
            if (container_MD_finished) {
                let container_MD = Game.getObjectById(conf_external.containers.MD.id);
                if (container_MD.store.getUsedCapacity("energy") >= 1500 && help_builders.length > 0) {
                    let help_builder = help_builders[0];
                    if (creep.transfer(help_builder, "energy") == ERR_NOT_IN_RANGE) {
                        creep.moveTo(help_builder);
                    }
                } else {
                    basic_job.transfer_energy(creep, container_MD);
                }
            } else {
                let help_builder = help_builders[0];
                if (creep.transfer(help_builder, "energy") == ERR_NOT_IN_RANGE) {
                    creep.moveTo(help_builder);
                }
            }
        } else if (creep.memory.role == 'help_builder') {
            creep.say("HB")
            creep.memory.movable = false;
            let conf_help = Memory.help_list[creep.memory.home_room_name][creep.memory.external_room_name];
            let conf_external = Memory.rooms_conf[creep.memory.external_room_name];
            if (creep.room.name !== creep.memory.external_room_name) {
                external_room.movethroughrooms(creep, conf_help.rooms_forwardpath, conf_help.poses_forwardpath);
                return;
            }
            if (creep.store.getUsedCapacity("energy") == 0) {
                if (creep.ticksToLive >= 50) {
                    let freecapacity = creep.store.getFreeCapacity("energy");
                    let lower_limit = freecapacity + 100;
                    let selected_linkcontainer = basic_job.select_linkcontainer(creep, lower_limit);
                    if (selected_linkcontainer == null) {
						if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
							creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
						}
                        return;
                    } else {
                        basic_job.withdraw_energy(creep, selected_linkcontainer);
                    }
                } else {
                    //console.log("suicide here")
                    creep.suicide();
                }
            } else {
                if (creep.ticksToLive >= 50) {
                    if (basic_job.build_structure(creep) == 0) {
                        return;
                    }
                    if (basic_job.charge_all(creep) == 0) {
                        return;
                    }
                    basic_job.upgrade_controller(creep, creep.room.controller);
                } else {
                    //return energy before dying
                    let selected_linkcontainer = basic_job.select_linkcontainer(creep, 0);
                    if (selected_linkcontainer == null) {
						if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
							creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
						}
                        return;
                    }
                    basic_job.transfer_energy(creep, selected_linkcontainer);
                }
            }
        } else if (creep.memory.role == 'externalharvester') {
            creep.say("EH")
            creep.memory.movable = true;
            let conf_external = conf.external_rooms[creep.memory.external_room_name].sources[creep.memory.source_name];
            if (Game.rooms[creep.memory.home_room_name].memory.external_room_status[creep.memory.external_room_name].defense_type !== '') {
                creep.drop("energy");
                basic_job.external_flee(creep, conf.safe_pos, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
                return;
            }
            if (creep.hits < creep.hitsMax) {
                //external_room.movethroughrooms(creep, creep.memory.rooms_backwardpath, creep.memory.poses_backwardpath);
                external_room.movethroughrooms(creep, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
                return;
            }
            if (creep.room.name !== creep.memory.external_room_name) {
                external_room.movethroughrooms(creep, conf_external.rooms_forwardpath, conf_external.poses_forwardpath);
            } else {
                let pos = creep.room.getPositionAt(conf_external.harvest_pos[0], conf_external.harvest_pos[1]);
                let output = basic_job.movetoposexceptoccupied(creep, [pos]);
                if (output == 0) {
                    return;
                } else if (output == 1) {
                    creep.moveTo(pos.x, pos.y);
                }
                creep.memory.movable = true;
                var source = Game.getObjectById(conf_external.id);
                basic_job.harvest_source(creep, source);
                if ("transfer_target" in creep.memory) {
                    let transfer_target = Game.creeps[creep.memory.transfer_target];
                    creep.transfer(transfer_target, "energy");
                    delete creep.memory.transfer_target;
                }
                return;
            }
        } else if (creep.memory.role == 'externalcarrier') {
            creep.say("EC");
            creep.memory.movable = true;
            let conf_external = conf.external_rooms[creep.memory.external_room_name].sources[creep.memory.source_name]
            if (Game.rooms[creep.memory.home_room_name].memory.external_room_status[creep.memory.external_room_name].defense_type !== '') {
                basic_job.external_flee(creep, conf.safe_pos, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
                return;
            }
            // Using creep.room.name !== creep.memory.home_room_name here considering the possibility that the creep need to put energy into link several times
            if (creep.store.getFreeCapacity("energy") == 0 || (creep.room.name == creep.memory.home_room_name && creep.store.getUsedCapacity("energy") > 0)) {
                if (creep.room.name !== creep.memory.home_room_name) {
                    external_room.movethroughrooms(creep, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
                } else {
                    let transfer_target = Game.getObjectById(conf_external.transfer_target_id);
                    let output = basic_job.transfer_energy(creep, transfer_target);
                }
            } else {
                if (creep.store.getUsedCapacity("energy") == 0 && creep.ticksToLive < conf_external.single_distance + 30) {
                    creep.suicide();
                    return;
                }
                // The creep has no energy so heading toward the source or is waiting to get enough energy
                if (creep.room.name !== creep.memory.external_room_name) {
                    external_room.movethroughrooms(creep, conf_external.rooms_forwardpath, conf_external.poses_forwardpath);
                    return;
                }
                // Pickup the resources if exists
                let xy = conf_external.harvest_pos;
                let pos = creep.room.getPositionAt(xy[0], xy[1]);
                let resources = pos.lookFor(LOOK_RESOURCES);
                let tombstones = pos.lookFor(LOOK_TOMBSTONES);
                if (resources.length > 0 && resources[0].resourceType == "energy" && resources[0].amount >= 20) {
                    if (creep.pickup(resources[0]) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(resources[0], moveoptions);
                    }
                    return;
                }
                if (tombstones.length > 0 && tombstones[0].store.getUsedCapacity("energy")) {
                    if (creep.withdraw(tombstones[0], "energy") == ERR_NOT_IN_RANGE) {
                        creep.moveTo(tombstones[0], moveoptions);
                    }
                    return;
                }
                // Go to the position if the harvester is absent (not spawned or not in the same room
                if (creep.pos.x == pos.x && creep.pos.y == pos.y) {
                    creep.memory.movable = false;
                }
                if (conf_external.harvester_name == "") {
                    creep.moveTo(pos.x, pos.y, moveoptions);
                    return;
                }
                let withdraw_target = Game.creeps[conf_external.harvester_name];
                if (withdraw_target.room.name !== creep.memory.external_room_name) {
                    creep.moveTo(pos.x, pos.y, moveoptions);
                    return;
                }
                // Go to the harvester if any of the creeps is not in its position
                let ready = (creep.pos.isNearTo(withdraw_target) && withdraw_target.pos.x == pos.x && withdraw_target.pos.y == pos.y);
                if (!ready) {
                    creep.moveTo(withdraw_target, moveoptions);
                    return;
                }
                withdraw_target.memory.transfer_target = creep.name;
            }
        } else if (creep.memory.role == 'reserver') {
            creep.say("R");
            creep.memory.movable = true;
            let conf_external = conf.external_rooms[creep.memory.external_room_name].controller;
            if (Game.rooms[creep.memory.home_room_name].memory.external_room_status[creep.memory.external_room_name].defense_type !== '') {
                basic_job.external_flee(creep, conf.safe_pos, conf_external.rooms_backwardpath, conf_external.poses_backwardpath);
                return;
            }
            if (creep.room.name !== creep.memory.external_room_name) {
                external_room.movethroughrooms(creep, conf_external.rooms_forwardpath, conf_external.poses_forwardpath);
            } else {
                if (creep.pos.getRangeTo(creep.room.controller) > 1) {
                    creep.moveTo(creep.room.controller, moveoptions);
                    return;
                }
                creep.memory.movable = false;
                if ((creep.room.controller.reservation !== undefined) && creep.room.controller.reservation.username !== Memory.username) {
                    creep.attackController(creep.room.controller);
                } else {
                    creep.reserveController(creep.room.controller);
                }
            }
        } else if (creep.memory.role == 'upgrader') {
            creep.say("U")
            creep.memory.movable = false;
            if (conf.upgraders.boost_request) {
				let boost_result = basic_job.boost_request(creep, {"work": "GH2O"});
				if (boost_result == 1) {
					return;
				}
            }
            if (true) {
                let conf_locations = conf.upgraders.locations;
                let locations = conf_locations.map((e) => creep.room.getPositionAt(e[0], e[1]));
                let output = basic_job.movetoposexceptoccupied(creep, locations);
                if (output == 0) {
                    return;
                } else if (output == 1) {
					basic_job.movetopos(creep, creep.room.controller.pos, 1);
                }
            }
            let this_container = Game.getObjectById(conf.containers.CT.id);
            if (creep.store.getUsedCapacity("energy") >= 10 && this_container.hitsMax - this_container.hits >= 10000) {
                creep.repair(this_container);
                return;
            }
            let link_mode = link_modes.includes('CT');
            let container = Game.getObjectById(conf.containers.CT.id);
            let container_energy = container.store.getUsedCapacity("energy")
            let use_link = false;
            let link;
            if (link_mode) {
                link = Game.getObjectById(conf.links.CT.id);
                let link_energy = link.store.getUsedCapacity("energy");
                if (link_energy > container_energy) {
                    use_link = true;
                }
            }
            if (creep.store.getUsedCapacity("energy") < creep.store.getFreeCapacity("energy") * 0.2 && creep.ticksToLive >= 10) {
                if (!creep.room.memory.danger_mode) {
                    var lower_limit = (link_mode ? 100 : 800);
                    if (use_link) {
                        basic_job.withdraw_energy(creep, link, lower_limit);
                    } else {
                        basic_job.withdraw_energy(creep, container, lower_limit);
                    }
                }
            }
            basic_job.upgrade_controller(creep, creep.room.controller);
        } else if (creep.memory.role == 'builder') {
            creep.say("B")
            creep.memory.movable = false;
            let link_mode = link_modes.includes('CT');
            if (creep.store["energy"] == 0) {
                if (creep.ticksToLive >= 50) {
                    let freecapacity = creep.store.getFreeCapacity("energy");
                    let lower_limit = (link_mode ? freecapacity : freecapacity + 100);
                    let selected_linkcontainer = basic_job.select_linkcontainer(creep, lower_limit);
                    if (selected_linkcontainer == null) {
                        return;
                    }
                    if (!creep.room.memory.danger_mode) {
                        basic_job.withdraw_energy(creep, selected_linkcontainer);
                    }
                } else {
                    //console.log("suicide here")
                    creep.suicide();
                }
            } else {
                if (creep.ticksToLive >= 50) {
                    if (basic_job.build_structure(creep) == 0) {
                        return;
                    }
                    if (basic_job.charge_all(creep) == 0) {
                        return;
                    }
					if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
						creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
					}
                } else {
                    //return energy before dying
                    let selected_linkcontainer = basic_job.select_linkcontainer(creep, 0);
                    if (selected_linkcontainer == null) {
                        return;
                    }
                    basic_job.transfer_energy(creep, selected_linkcontainer);
                }
            }
        } else if (creep.memory.role == 'transferer') {
            creep.say("T")
            creep.memory.movable = true;
            if (creep.store.getUsedCapacity("energy") == 0) {
                if (creep.ticksToLive >= 30) {
                    if (basic_job.charge_all(creep, false) == 0) {
                        let min_energy = creep.store.getFreeCapacity("energy") / 2;
                        let selected_linkcontainer = basic_job.select_linkcontainer(creep, min_energy);
                        if (selected_linkcontainer == null) {
                            creep.memory.movable = false;
							if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
								creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
							}
                            return;
                        }
                        basic_job.withdraw_energy(creep, selected_linkcontainer);
                    } else {
                        creep.memory.movable = false;
						if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
							creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
						}
                        return;
                    }
                } else {
                    creep.suicide();
                }
            } else {
                if (creep.ticksToLive >= 30) {
                    if (basic_job.charge_all(creep) == 0) {
                        return;
                    } else {
                        creep.memory.movable = false;
						if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
							creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
						}
                        return;
                    }
                } else {
                    //return energy before dying
                    let selected_linkcontainer = basic_job.select_linkcontainer(creep, 0);
                    if (selected_linkcontainer == null) {
                        creep.memory.movable = false;
						if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
							creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
						}
                        return;
                    }
                    basic_job.transfer_energy(creep, selected_linkcontainer);
                }
            }
        } else if (creep.memory.role == 'specialcarrier') {
            creep.say("SC")
			creep.memory.movable = true;
			let mineral_type = conf.mine.type;
			if (creep.room.memory.mine_harvestable) {
                let container = Game.getObjectById(conf.containers.MINE.id);
				if (creep.store.getUsedCapacity(conf.mine.type) == 0) {
					if (creep.pos.isNearTo(container) && container.store.getUsedCapacity(mineral_type) > creep.store.getCapacity()) {
						creep.withdraw(container, mineral_type);
					}
					else {
						basic_job.moveto_stayxy(creep, conf.mineral_stay_pos);
					}
				}
				else {
					if (creep.room.terminal && creep.room.terminal.store.getFreeCapacity() >= creep.store.getCapacity()) {
						if (creep.pos.isNearTo(creep.room.terminal)) {
							creep.transfer(creep.room.terminal, mineral_type);
						}
						else {
							basic_job.movetopos(creep, creep.room.terminal.pos, 1);
						}
					}
					else {
						basic_job.moveto_stayxy(creep, conf.mineral_stay_pos);
					}
				}
			}
			else {
				basic_job.moveto_stayxy(creep, conf.mineral_stay_pos);
			}
			/*
            creep.memory.movable = true;
            if (creep.room.memory.mine_harvestable && creep.memory.lab_carrying_resource == undefined) {
                let container_capacity = Game.getObjectById(conf.containers.MINE.id).store.getUsedCapacity();
                if (creep.ticksToLive < 150 && creep.store.getUsedCapacity() == 0) {
                    creep.suicide();
                }
                if (container_capacity > 1200 && creep.store.getUsedCapacity() == 0) {
                    creep.memory.carrying_mineral = true;
                }
                if (container_capacity < 400 && creep.store.getUsedCapacity() == 0) {
                    creep.memory.carrying_mineral = false;
                }
                if (("carrying_mineral" in creep.memory) && creep.memory.carrying_mineral) {
                    if (creep.store.getUsedCapacity() == 0) {
                        let mine_container = Game.getObjectById(conf.containers.MINE.id);
                        basic_job.withdraw_energy(creep, mine_container, 0, conf.mine.type);
                    } else {
                        basic_job.transfer_energy(creep, creep.room.terminal, conf.mine.type);
                    }
                    return;
                }
            }
            if (!("labs" in conf)) {
                creep.memory.movable = false;
				if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
					creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
				}
                return;
            }
            if (creep.room.terminal == undefined) {
                creep.memory.movable = false;
				if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
					creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
				}
                return;
            }
            if ("lab_carrying_target_id" in creep.memory) {
                let lab = Game.getObjectById(creep.memory.lab_carrying_target_id);
                if (!creep.memory.lab_carrying_forward) {
                    if (creep.store.getUsedCapacity() == 0) {
                        if (creep.withdraw(lab, creep.memory.lab_carrying_resource) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(lab, moveoptions);
                        }
                    } else {
                        if (creep.transfer(creep.room.terminal, creep.memory.lab_carrying_resource) == ERR_NOT_IN_RANGE) {
							basic_job.movetopos(creep, creep.room.terminal.pos, 1);
                        } else {
                            delete creep.memory.lab_carrying_resource;
                            delete creep.memory.lab_carrying_target_id;
                            delete creep.memory.lab_carrying_forward;
                        }
                    }
                    return;
                }
                if (creep.store.getUsedCapacity(creep.memory.lab_carrying_resource) == 0) {
                    if (creep.withdraw(creep.room.terminal, creep.memory.lab_carrying_resource) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.terminal, moveoptions);
						basic_job.movetopos(creep, creep.room.terminal.pos, 1);
                        return;
                    }
                } else {
                    if (creep.transfer(lab, creep.memory.lab_carrying_resource) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(lab, moveoptions);
						basic_job.movetopos(creep, lab.pos, 1);
                        return;
                    } else {
                        delete creep.memory.lab_carrying_resource;
                        delete creep.memory.lab_carrying_target_id;
                        delete creep.memory.lab_carrying_forward;
                    }
                }
            } else {
                for (let lab_name in conf.labs) {
                    let conflab = conf.labs[lab_name];
                    let lab = < StructureLab > creep.room.lookForAt("structure", conflab.pos[0], conflab.pos[1])[0];
                    let current_mineral_type = lab.mineralType;
                    if (current_mineral_type == undefined && !conflab.active) {
                        continue;
                    }
                    if (current_mineral_type !== undefined && (!conflab.active || current_mineral_type !== conflab.object)) {
                        creep.memory.lab_carrying_resource = current_mineral_type;
                        creep.memory.lab_carrying_target_id = lab.id;
                        creep.memory.lab_carrying_forward = false;
                        return;
                    }
                    let mineral_amount = lab.store.getUsedCapacity(conflab.object);
                    let energy_amount = lab.store.getUsedCapacity("energy");
                    if (mineral_amount < 1000) {
                        let terminal_amount = creep.room.terminal.store.getUsedCapacity(conflab.object);
                        if (terminal_amount >= 200) {
                            creep.memory.lab_carrying_target_id = lab.id;
                            creep.memory.lab_carrying_resource = conflab.object;
                            creep.memory.lab_carrying_forward = true;
                            return;
                        }
                    }
                    if (energy_amount < 1000) {
                        let terminal_amount = creep.room.terminal.store.getUsedCapacity("energy");
                        if (terminal_amount >= 200) {
                            creep.memory.lab_carrying_target_id = lab.id;
                            creep.memory.lab_carrying_resource = "energy";
                            creep.memory.lab_carrying_forward = true;
                            return;
                        }
                    }
                }
                creep.memory.movable = false;
				if (!creep.pos.isEqualTo(conf.stay_pos[0], conf.stay_pos[1])) {
					creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
				}
            }
			*/
        } else if (creep.memory.role == 'wall_repairer') {
            creep.say("WR");
            creep.memory.movable = false;
            if (creep.store.getUsedCapacity("energy") == 0) {
                let selected_linkcontainer = basic_job.select_linkcontainer(creep, 200, true);
                basic_job.withdraw_energy(creep, selected_linkcontainer);
            } else {
                let wall_ramparts = creep.room.find(FIND_STRUCTURES).filter((e) => (e.structureType == 'constructedWall' && e.hits) || e.structureType == 'rampart');
                let hits = wall_ramparts.map((e) => e.hits);
                let hits_max = Math.max(...hits);
                let hits_min = Math.min(...hits);
                let wall;
                if (creep.memory.wall_to_repair) {
                    wall = Game.getObjectById(creep.memory.wall_to_repair);
                    if (wall.hits - hits_min > 200000) {
                        delete creep.memory.wall_to_repair;
                        return;
                    }
                } else {
					let wall_ramparts_left = mymath.range(wall_ramparts.length).filter((i) => hits[i] < hits_min + 20000).map((i) => wall_ramparts[i]);
                    let closest_id = mymath.argmin(wall_ramparts_left.map((e) => creep.pos.getRangeTo(e)));
                    wall = wall_ramparts_left[closest_id];
                    creep.memory.wall_to_repair = < Id < Structure_Wall_Rampart >> wall.id;
                }
                if (creep.repair(wall) == ERR_NOT_IN_RANGE) {
                    basic_job.movetopos(creep, wall.pos, 3);
                }
            }
        } else if (creep.memory.role == 'maincarrier') {
            creep.say("MC");
            creep.memory.movable = false;
            if (creep.ticksToLive < 20 && creep.store.getUsedCapacity() == 0) {
                creep.suicide();
                return;
            }
			let conf_maincarrier = conf.maincarriers.MAIN;
			let main_pos = creep.room.getPositionAt(conf_maincarrier.main_pos[0], conf_maincarrier.main_pos[1]);
			let arrived = false;
			let occupied = false;
			for (let pos of conf_maincarrier.working_zone) {
				if (creep.pos.isEqualTo(pos[0], pos[1])) {
					arrived = true;
					break;
				}
				if (creep.room.lookForAt("creep", pos[0], pos[1]).length > 0) {
					occupied = true;
					break;
				}
			}
			if (!arrived) {
				if (occupied) {
					basic_job.movetopos(creep, creep.room.getPositionAt(conf_maincarrier.waiting_pos[0], conf_maincarrier.waiting_pos[1]), 0);
				}
				else {
					basic_job.movetopos(creep, main_pos, 0);
				}
				return;
			}
			if (creep.store.getUsedCapacity() == 0) {
				delete creep.memory.resource_type;
			} else {
				creep.memory.resource_type = <ResourceConstant> Object.keys(creep.store)[0]
			}
			if_boost: if (creep.room.memory.current_boost_request !== undefined) {
				let request = creep.room.memory.current_boost_request;
				let conf_labs = Memory.rooms_conf[creep.room.name].labs;
				let lab_id = Object.values(conf_labs).filter((e) => e.state == 'boost')[0].id;
				let lab = Game.getObjectById(lab_id);
				if (lab.store.getUsedCapacity("energy") < request.amount * 20) {
					// energy is not enough
					if (creep.memory.resource_type == undefined) {
						basic_job.withdraw_energy(creep, creep.room.terminal, 0, "energy");
						return;
					}
					else if (creep.memory.resource_type == "energy"){
						basic_job.transfer_energy(creep, lab, "energy");
						return;
					}
					else {
						basic_job.transfer_energy(creep, creep.room.terminal, creep.memory.resource_type);
						return;
					}
				}
				else if (lab.mineralType !== undefined && lab.mineralType !== request.compound) {
					// mineral in lab does not match request
					if (creep.store.getUsedCapacity() !== 0) {
						basic_job.transfer_energy(creep, creep.room.terminal, creep.memory.resource_type);
						return;
					}
					else {
						basic_job.withdraw_energy(creep, lab, 0, lab.mineralType);
						return;
					}
				}
				else if (lab.mineralType == undefined || lab.mineralAmount < request.amount * 30) {
					// mineral is not enough
					if (creep.memory.resource_type == undefined) {
						basic_job.withdraw_energy(creep, creep.room.terminal, 0, request.compound);
						return;
					}
					else if (creep.memory.resource_type == request.compound){
						basic_job.transfer_energy(creep, lab, request.compound);
						return;
					}
					else {
						basic_job.transfer_energy(creep, creep.room.terminal, creep.memory.resource_type);
						return;
					}
				}
				return;
			}
			if_reaction: if(creep.room.memory.reaction_request !== undefined) {
				let request = creep.room.memory.reaction_request;
				let conf_labs = Memory.rooms_conf[creep.room.name].labs;
				let source1_ids = _.filter(conf_labs, (e) => e.state=='source1' && e.finished);
				let source2_ids = _.filter(conf_labs, (e) => e.state=='source2' && e.finished);
				let react_ids = _.filter(conf_labs, (e) => e.state=='react' && e.finished);
				if (source1_ids.length == 1 && source2_ids.length == 1 && react_ids.length == 7) {
					let source1_lab = Game.getObjectById(source1_ids[0].id);
					let source2_lab = Game.getObjectById(source2_ids[0].id);
					let react_labs = react_ids.map((e) => Game.getObjectById(e.id));
					if (creep.room.memory.reaction_ready) {
						if (source1_lab.mineralType == undefined && source2_lab.mineralType == undefined) {
							creep.room.memory.reaction_ready = false;
						}
					}
					else {
						if (source1_lab.store.getUsedCapacity(source1_lab.mineralType) == 280 && source2_lab.store.getUsedCapacity(source2_lab.mineralType) == 280) {
							creep.room.memory.reaction_ready = true;
						}
					}
					if (!creep.room.memory.reaction_ready) {
						for (let lab of react_labs) {
							if (lab.mineralType !== undefined && (lab.mineralType !== request.product || lab.store.getUsedCapacity(lab.mineralType) >= 280)) {
								if (creep.store.getUsedCapacity() !== 0) {
									basic_job.transfer_energy(creep, creep.room.terminal, creep.memory.resource_type);
									return;
								}
								else {
									basic_job.withdraw_energy(creep, lab, 0, lab.mineralType);
									return;
								}
							}
						}
						let source_labs = [source1_lab, source2_lab];
						let reactants = [request.reactant1, request.reactant2];
						for (let i of [0,1]) {
							let lab = source_labs[i];
							let reactant = reactants[i];
							if (lab.mineralType == undefined) {
								if (creep.memory.resource_type == reactant) {
									basic_job.transfer_energy(creep, lab, reactant);
									return;
								}
								else if (creep.memory.resource_type == undefined) {
									let output = creep.withdraw(creep.room.terminal, reactant, 280);
									if (output == ERR_NOT_IN_RANGE) {
										basic_job.movetopos(creep, creep.room.terminal.pos, 1);
									}
									else if (output == ERR_NOT_ENOUGH_RESOURCES) {
										delete creep.room.memory.reaction_request;
									}
									return;
								}
								else {
									basic_job.transfer_energy(creep, creep.room.terminal, creep.memory.resource_type);
									return;
								}
							}
						}
					}
				}
			}
			if (!creep.pos.isEqualTo(main_pos.x, main_pos.y)) {
				basic_job.movetopos(creep, main_pos, 0);
			}
			let link_id = conf.links[conf_maincarrier.link_name].id;
			let link = Game.getObjectById(link_id);
			let link_energy = link.store.getUsedCapacity("energy")
			let creep_energy = creep.store.getUsedCapacity("energy")
			let terminal_energy;
			let storage_energy = creep.room.storage.store.getUsedCapacity("energy");
			let storage_leftenergy = creep.room.storage.store.getFreeCapacity("energy");
			if (conf_maincarrier.terminal) {
				terminal_energy = creep.room.terminal.store.getUsedCapacity("energy");
			}
			if (link_energy < conf_maincarrier.link_amount && (storage_energy > 5000 || creep_energy !== 0)) {
				if (creep_energy == 0) {
					creep.withdraw(creep.room.storage, "energy");
				} else {
					creep.transfer(link, "energy", Math.min(conf_maincarrier.link_amount - link_energy, creep_energy));
				}
				return;
			} else if (link_energy > conf_maincarrier.link_amount) {
				if (creep_energy == 0) {
					creep.withdraw(link, "energy", Math.min(link_energy - conf_maincarrier.link_amount, creep_energy));
				} else {
					if (creep.transfer(creep.room.storage, "energy") !== 0) {
						creep.transfer(creep.room.terminal, "energy");
					}
				}
			} else if (conf_maincarrier.terminal && terminal_energy < 50000 && storage_energy > 50000) {
				if (creep_energy == 0) {
					creep.withdraw(creep.room.storage, "energy");
				} else {
					creep.transfer(creep.room.terminal, "energy");
				}
			} else if (conf_maincarrier.terminal && terminal_energy > 60000 && storage_leftenergy > 60000) {
				if (creep_energy == 0) {
					creep.withdraw(creep.room.terminal, "energy");
				} else {
					creep.transfer(creep.room.storage, "energy");
				}
			}
        }
    }
}
