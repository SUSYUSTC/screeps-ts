import * as _ from "lodash"
import * as role_init from "./role_init";
import * as basic_job from "./basic_job";
import * as defense from "./defense";
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
    } else if (creep.memory.role == 'invader_core_attacker') {
        creep.say("A");
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
                creep.moveTo(conf.safe_pos[0], conf.safe_pos[1], moveoptions);
            }
            return;
        }
        let conf_controller = conf.external_rooms[creep.memory.defending_room].controller;
        // Going to the defending room
        if (creep.room.name !== creep.memory.defending_room) {
            external_room.movethroughrooms(creep, conf_controller.rooms_forwardpath, conf_controller.names_forwardpath);
            return;
        }
        let structures = creep.room.find(FIND_STRUCTURES);
        let invader_cores = structures.filter((e) => e.structureType == "invaderCore");
        let invader_core;
        // Going back if current room does not have invader core
        if (invader_cores.length == 0) {
            if (!rooms_with_invader_core.includes(creep.memory.defending_room)) {
                external_room.movethroughrooms(creep, conf_controller.rooms_backwardpath, conf_controller.names_backwardpath);
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
                        external_room.movethroughrooms(creep, conf_controller.rooms_forwardpath, conf_controller.names_forwardpath);
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
                        external_room.movethroughrooms(creep, conf_controller.rooms_backwardpath, conf_controller.names_backwardpath);
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
    } else if (creep.memory.role == 'external_init') {
        creep.say("E");
        let output = external_room.movethroughrooms(creep, creep.memory.rooms_forwardpath, creep.memory.names_forwardpath);
        if (output == 2) {
            creep.memory.role = 'init';
        }
    } else {
        var rolename = creep.memory.role;
        var link_modes = creep.room.memory.link_modes;
        if (creep.memory.role == 'harvester') {
            creep.say("H")
            let source;
            let linkcontainer_source;
            if (true) {
                let source_name = creep.memory.source_name;
                let source_id = conf.sources[source_name].id;
                let link_mode = link_modes.includes(source_name);
                let conf_linkcontainers: conf_structures < StructureLink | StructureContainer > = < conf_structures < StructureLink | StructureContainer >> (link_mode ? conf.links : conf.containers);
                let conf_linkcontainer_source = conf_linkcontainers[source_name];
                if (!conf_linkcontainer_source.finished) {
                    return;
                }
                let xy = conf.containers[source_name].pos;
                let pos = creep.room.getPositionAt(xy[0], xy[1]);
                if (basic_job.movetoposexceptoccupied(creep, [pos]) == 0) {
                    return;
                }
                source = Game.getObjectById(source_id);
                linkcontainer_source = < AnyStorageStructure > Game.getObjectById(conf_linkcontainer_source.id);
            }
            if (creep.ticksToLive < 5) {
                basic_job.transfer_energy(creep, linkcontainer_source);
                return;
            }
            basic_job.harvest_source(creep, source);
            if (creep.store.getFreeCapacity() == 0) {
                basic_job.transfer_energy(creep, linkcontainer_source);
            }
        } else if (creep.memory.role == 'carrier') {
            creep.say("C")
            let source_name = creep.memory.source_name;
            let container_source;
            if (creep.memory.source_name == 'storage') {
                let link_mode = link_modes.includes('CT') && link_modes.includes("MAIN");
                if (link_mode) {
                    return;
                }
                container_source = creep.room.storage;
            } else {
                let link_mode = link_modes.includes('CT') && link_modes.includes(source_name);
                if (link_mode) {
                    return;
                }
                let conf_container_source = conf.containers[source_name];
                let conf_container_controller = conf.containers.CT;
                if (!(conf_container_source.finished && conf_container_controller.finished)) {
                    return;
                }
                container_source = Game.getObjectById(conf_container_source.id);
            }
            if (creep.store["energy"] == 0) {
                if (creep.ticksToLive >= 30) {
                    basic_job.withdraw_energy(creep, container_source, 300);
                } else {
                    console.log(creep.name, "suicide")
                    creep.suicide();
                }
            } else {
                let prefered_container = basic_job.preferred_container(creep, conf.containers, conf.carriers[source_name].preferences);
                basic_job.transfer_energy(creep, prefered_container);
            }
        } else if (creep.memory.role == 'mineharvester') {
            if (!creep.room.memory.mine_harvestable) {
                return;
            }
            creep.say("M")
            let mine = Game.getObjectById(conf.mine.id);
            let mine_container = Game.getObjectById(conf.containers.MINE.id);
            basic_job.harvest_source(creep, mine);
        } else if (creep.memory.role == 'externalharvester') {
            creep.say("EH")
            if (Game.rooms[creep.memory.home_room_name].memory.external_room_status[creep.memory.external_room_name].defense_type != '') {
                basic_job.external_flee(creep, conf.safe_pos);
                return;
            }
            if (creep.hits < creep.hitsMax) {
                external_room.movethroughrooms(creep, creep.memory.rooms_backwardpath, creep.memory.names_backwardpath);
                return;
            }
            let conf_external = conf.external_rooms[creep.memory.external_room_name].sources[creep.memory.source_name]
            if (creep.room.name !== creep.memory.external_room_name) {
                external_room.movethroughrooms(creep, creep.memory.rooms_forwardpath, creep.memory.names_forwardpath);
            } else {
                if (basic_job.movetoposexceptoccupied(creep, [creep.room.getPositionAt(conf_external.harvest_pos[0], conf_external.harvest_pos[1])]) == 0) {
                    return;
                }
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
            creep.say("EC")
            if (Game.rooms[creep.memory.home_room_name].memory.external_room_status[creep.memory.external_room_name].defense_type !== '') {
                basic_job.external_flee(creep, conf.safe_pos);
                return;
            }
            let conf_external = conf.external_rooms[creep.memory.external_room_name].sources[creep.memory.source_name]
            // Using creep.room.name !== creep.memory.home_room_name here considering the possibility that the creep need to put energy into link several times
            if (creep.store.getFreeCapacity("energy") == 0 || (creep.room.name == creep.memory.home_room_name && creep.store.getUsedCapacity("energy") > 0)) {
                if (creep.room.name !== creep.memory.home_room_name) {
                    external_room.movethroughrooms(creep, creep.memory.rooms_backwardpath, creep.memory.names_backwardpath);
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
                    external_room.movethroughrooms(creep, creep.memory.rooms_forwardpath, creep.memory.names_forwardpath);
                    return;
                }
                // Pickup the resources if exists
                let xy = conf_external.harvest_pos;
                let pos = creep.room.getPositionAt(xy[0], xy[1]);
                let resources = pos.lookFor(LOOK_RESOURCES);
                let tombstones = pos.lookFor(LOOK_TOMBSTONES);
                if (resources.length > 0 && resources[0].amount >= 20) {
                    if (creep.pickup(resources[0]) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(resources[0], moveoptions);
                    }
                    return;
                }
                if (tombstones.length > 0) {
                    if (creep.withdraw(tombstones[0], "energy") == ERR_NOT_IN_RANGE) {
                        creep.moveTo(tombstones[0], moveoptions);
                    }
                    return;
                }
                // Go to the position if the harvester is absent (not spawned or not in the same room
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
            creep.say("R")
            if (Game.rooms[creep.memory.home_room_name].memory.external_room_status[creep.memory.external_room_name].defense_type !== '') {
                basic_job.external_flee(creep, conf.safe_pos);
                return;
            }
            if (creep.room.name !== creep.memory.external_room_name) {
                external_room.movethroughrooms(creep, creep.memory.rooms_forwardpath, creep.memory.names_forwardpath);
            } else {
                if (creep.pos.getRangeTo(creep.room.controller) > 1) {
                    creep.moveTo(creep.room.controller, moveoptions);
                    return;
                }
                if ((creep.room.controller.reservation !== undefined) && creep.room.controller.reservation.username !== Memory.username) {
                    creep.attackController(creep.room.controller);
                } else {
                    creep.reserveController(creep.room.controller);
                }
            }
        } else if (creep.memory.role == 'upgrader') {
            creep.say("U")
            if (true) {
                let conf_locations = conf.upgraders.locations;
                let locations = conf_locations.map((e) => creep.room.getPositionAt(e[0], e[1]));
                if (basic_job.movetoposexceptoccupied(creep, locations) == 0) {
                    return;
                }
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
            if (creep.store["energy"] == 0 && creep.ticksToLive >= 10) {
                if (!creep.room.memory.danger_mode) {
                    var lower_limit = (link_mode ? 100 : 800);
                    if (use_link) {
                        basic_job.withdraw_energy(creep, link, lower_limit);
                    } else {
                        basic_job.withdraw_energy(creep, container, lower_limit);
                    }
                }
            } else {
                basic_job.upgrade_controller(creep, creep.room.controller);
            }
        } else if (creep.memory.role == 'builder') {
            creep.say("B")
            let link_mode = link_modes.includes('CT');
            if (creep.store["energy"] == 0) {
                if (creep.ticksToLive >= 50) {
                    let freecapacity = creep.store.getFreeCapacity("energy");
                    let lower_limit = (link_mode ? freecapacity : freecapacity + 300);
                    let selected_linkcontainer = basic_job.select_linkcontainer(creep, lower_limit);
                    if (selected_linkcontainer == null) {
                        return;
                    }
                    if (!creep.room.memory.danger_mode) {
                        basic_job.withdraw_energy(creep, selected_linkcontainer, lower_limit);
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
                    creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
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
            if (creep.store.getUsedCapacity("energy") == 0) {
                if (creep.ticksToLive >= 30) {
                    if (basic_job.charge_all(creep, false) == 0) {
                        let selected_linkcontainer = basic_job.select_linkcontainer(creep, creep.store.getFreeCapacity("energy"));
                        if (selected_linkcontainer == null) {
                            return;
                        }
                        basic_job.withdraw_energy(creep, selected_linkcontainer);
                    } else {
                        creep.moveTo(conf.stay_pos[0], conf.stay_pos[1], moveoptions);
                    }
                } else {
                    creep.suicide();
                }
            } else {
                if (creep.ticksToLive >= 30) {
                    if (basic_job.charge_all(creep) == 0) {
                        return;
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
        } else if (creep.memory.role == 'specialcarrier') {
            creep.say("SC")
            if (!creep.room.memory.mine_harvestable) {
                return;
            }
            let container_capacity = Game.getObjectById(conf.containers.MINE.id).store.getUsedCapacity();
            if (creep.ticksToLive < 50 && creep.store.getUsedCapacity() == 0) {
                creep.suicide();
            }
            /*
            if (container_capacity > 1200 && creep.store.getUsedCapacity() == 0) {
            	creep.memory.carrying_mineral = true;
            }
            if (container_capacity < 400 && creep.store.getUsedCapacity() == 0) {
            	creep.memory.carrying_mineral = false;
            }
             */
            creep.memory.carrying_mineral = true;
            if (("carrying_mineral" in creep.memory) && creep.memory.carrying_mineral) {
                if (creep.store.getUsedCapacity() == 0) {
                    let mine_container = Game.getObjectById(conf.containers.MINE.id);
                    basic_job.withdraw_energy(creep, mine_container, 0, conf.mine.type);
                } else {
                    basic_job.transfer_energy(creep, creep.room.terminal, conf.mine.type);
                }
                return;
            }
        } else if (creep.memory.role == 'maincarrier') {
            creep.say("MC");
            if (creep.memory.maincarrier_type == 'MAIN') {
                let conf_maincarrier = conf.maincarriers.MAIN;
                let pos = conf_maincarrier.pos;
                if (creep.pos.x !== pos[0] || creep.pos.y !== pos[1]) {
                    creep.moveTo(pos[0], pos[1], moveoptions);
                    return;
                }
                let link_id = conf.links[conf_maincarrier.link_name].id;
                let link = Game.getObjectById(link_id);
                let link_energy = link.store.getUsedCapacity("energy")
                let creep_energy = creep.store.getUsedCapacity("energy")
                let storage_energy = creep.room.storage.store.getUsedCapacity("energy");
                if (link_energy < conf_maincarrier.link_amount && storage_energy > 5000) {
                    creep.withdraw(creep.room.storage, "energy");
                    creep.transfer(link, "energy", Math.min(conf_maincarrier.link_amount - link_energy, creep_energy));
                    return;
                }
            }
        }
    }
}
