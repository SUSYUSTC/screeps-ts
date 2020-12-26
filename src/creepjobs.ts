var role_init = require('./role_init');
var basic_job = require('./basic_job');
var defence = require('./defence');
var external_room = require('./external_room');
//var myfunc = require('myfunc');
function creepjob(creep: Creep) {
    if (creep.spawning || creep.ticksToLive == undefined) {
        return;
    }
    if (!('role' in creep.memory)) {
        return;
    }
    if ("home_room_name" in creep.memory) {
        var conf = Memory.rooms_conf[creep.memory.home_room_name];
    } else {
        var conf = Memory.rooms_conf[creep.room.name];
    }
    if (creep.memory.role == 'init') {
        role_init.init_work(creep);
    } else if (creep.memory.role == 'defender') {
        creep.say("D");
        defence.defend(creep);
    } else if (creep.memory.role == 'external_init') {
        creep.say("E");
        var output = external_room.movethroughrooms(creep, creep.memory.rooms_forwardpath, creep.memory.names_forwardpath);
        if (output == 2) {
            creep.memory.role = 'init';
        }
    } else {
        var rolename = creep.memory.role;
        var link_mode = creep.room.memory.link_mode;
        var conf_linkcontainers = (link_mode ? conf.links : conf.containers);
        if ((rolename == 'carrier') && (creep.memory.source_name == 'storage')) {
            var source_name = creep.memory.source_name;
			var linkcontainer_source = <AnyStorageStructure> creep.room.storage;
        } else if (['harvester', 'carrier'].includes(rolename)) {
            var source_name = creep.memory.source_name;
            var source_id = conf.sources[source_name].id;
            var source = Game.getObjectById(source_id);
            var conf_linkcontainer_source = conf_linkcontainers[source_name];
            var conf_linkcontainer_controller = conf_linkcontainers.CT;
            if (!(conf_linkcontainer_source.finished && conf_linkcontainer_controller.finished)) {
                return;
            }
            var linkcontainer_source = < AnyStorageStructure > Game.getObjectById(conf_linkcontainer_source.id);
        }
        if (['carrier', 'upgrader', 'builder', 'transferer'].includes(rolename)) {
            var linkcontainer_controller = Game.getObjectById(conf_linkcontainers.CT.id)
        }
        if (creep.memory.role == 'harvester') {
            creep.say("H")
            if (!link_mode && basic_job.movetoposexceptoccupied(creep, [linkcontainer_source.pos]) == 0) {
                return;
            }
            if (creep.ticksToLive < 5) {
                basic_job.transfer_energy(creep, linkcontainer_source);
                return;
            }
            basic_job.harvest_source(creep, source);
            if (creep.store.getFreeCapacity() == 0) {
                basic_job.transfer_energy(creep, linkcontainer_source);
            }
        } else if (creep.memory.role == 'mineharvester') {
            if (!creep.room.memory.mine_harvestable) {
                return;
            }
            creep.say("M")
            var mine = Game.getObjectById(conf.mine.id);
            var mine_container = Game.getObjectById(conf.containers.MINE.id);
            basic_job.harvest_source(creep, mine);
        } else if (creep.memory.role == 'externalharvester') {
            creep.say("EH")
            var conf_external = conf.external_rooms[creep.memory.external_room_name].sources[creep.memory.source_name]
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
            if (!("waiting" in creep.memory)) {
                creep.memory.waiting = false;
            }
            if (creep.store.getFreeCapacity("energy") == 0) {
                creep.memory.waiting = false;
            }
            var conf_external = conf.external_rooms[creep.memory.external_room_name].sources[creep.memory.source_name]
            if (creep.store["energy"] > 0 && !creep.memory.waiting) {
                if (creep.room.name !== creep.memory.home_room_name) {
					external_room.movethroughrooms(creep, creep.memory.rooms_backwardpath, creep.memory.names_backwardpath);
                } else {
                    let transfer_target = Game.getObjectById(conf_external.transfer_target_id);
                    basic_job.transfer_energy(creep, transfer_target);
                }
            } else {
                if (creep.ticksToLive < conf_external.single_distance * 2) {
                    creep.suicide();
                    return;
                }
                if (creep.room.name !== creep.memory.external_room_name) {
					external_room.movethroughrooms(creep, creep.memory.rooms_forwardpath, creep.memory.names_forwardpath);
                    return;
                }
                if (conf_external.harvester_name == null) {
					external_room.movethroughrooms(creep, creep.memory.rooms_forwardpath, creep.memory.names_forwardpath);
                    return;
                }
                var withdraw_target = Game.creeps[conf_external.harvester_name];
                if (creep.pos.isNearTo(withdraw_target)) {
                    creep.memory.waiting = true;
                    withdraw_target.memory.transfer_target = creep.name;
                    var resources = withdraw_target.pos.lookFor(LOOK_RESOURCES);
                    if (resources.length > 0) {
                        creep.pickup(resources[0]);
                    }
                } else if (withdraw_target.room.name == creep.memory.external_room_name) {
                    creep.moveTo(withdraw_target);
                    return;
                } else {
                    var source = Game.getObjectById(conf_external.id);
                    creep.moveTo(source);
                }
            }
        } else if (creep.memory.role == 'reserver') {
            creep.say("R")
            if (creep.room.name !== creep.memory.external_room_name) {
				external_room.movethroughrooms(creep, creep.memory.rooms_forwardpath, creep.memory.names_forwardpath);
            } else {
                if (creep.reserveController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller);
                }
            }
        } else if (creep.memory.role == 'upgrader') {
            creep.say("U")
            var locations = conf.upgraders.locations.map((e) => creep.room.getPositionAt(e[0], e[1]));
            if (basic_job.movetoposexceptoccupied(creep, locations) == 0) {
                return;
            }
            if (creep.store["energy"] == 0 && creep.ticksToLive >= 10) {
                if (!creep.room.memory.danger_mode) {
                    var lower_limit = (link_mode ? 100 : 800);
                    basic_job.withdraw_energy(creep, linkcontainer_controller, lower_limit);
                }
            } else {
                basic_job.upgrade_controller(creep, creep.room.controller);
            }
        } else if (creep.memory.role == 'builder') {
            creep.say("B")
            //console.log("life:", creep.ticksToLive, creep.ticksToLive == undefined);
            if (creep.store["energy"] == 0) {
                if (creep.ticksToLive >= 50) {
                    var freecapacity = creep.store.getFreeCapacity("energy");
                    var lower_limit = (link_mode ? freecapacity : freecapacity + 300);
                    var selected_linkcontainer = basic_job.select_linkcontainer(creep, lower_limit);
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
                    creep.moveTo(conf.stay_pos[0], conf.stay_pos[1]);
                } else {
                    //return energy before dying
                    var selected_linkcontainer = basic_job.select_linkcontainer(creep, 0);
                    if (selected_linkcontainer == null) {
                        return;
                    }
                    basic_job.transfer_energy(creep, selected_linkcontainer);
                }
            }
        } else if (creep.memory.role == 'transferer') {
            creep.say("T")
            if (creep.store.getUsedCapacity() == 0) {
                if (creep.ticksToLive >= 30) {
                    if (basic_job.charge_all(creep, false) == 0) {
                        var selected_linkcontainer = basic_job.select_linkcontainer(creep, creep.store.getFreeCapacity("energy"));
                        if (selected_linkcontainer == null) {
                            return;
                        }
                        basic_job.withdraw_energy(creep, selected_linkcontainer);
                    } else if (creep.room.memory.mine_harvestable && Game.getObjectById(conf.containers.MINE.id).store.getUsedCapacity() > 200) {
                        var mine_container = Game.getObjectById(conf.containers.MINE.id);
                        basic_job.withdraw_energy(creep, mine_container, 0, conf.mine.type);
                    } else {
                        creep.moveTo(conf.stay_pos[0], conf.stay_pos[1]);
                    }
                } else {
                    creep.suicide();
                }
            } else {
                if (creep.ticksToLive >= 30) {
                    if (creep.store["energy"] > 0) {
                        if (basic_job.charge_all(creep) == 0) {
                            return;
                        }
                    } else {
                        basic_job.transfer_energy(creep, creep.room.terminal, conf.mine.type);
                    }
                } else {
                    //return energy before dying
                    var selected_linkcontainer = basic_job.select_linkcontainer(creep, 0);
                    if (selected_linkcontainer == null) {
                        return;
                    }
                    basic_job.transfer_energy(creep, selected_linkcontainer);
                }
            }
        } else if (creep.memory.role == 'carrier') {
            creep.say("C")
            if (link_mode) {
                return;
            }
            if (creep.store["energy"] == 0) {
                if (creep.ticksToLive >= 30) {
                    basic_job.withdraw_energy(creep, linkcontainer_source, 300);
                } else {
                    console.log(creep.name, "suicide")
                    creep.suicide();
                }
            } else {
                var prefered_container = basic_job.preferred_container(creep, conf_linkcontainers, conf.carriers[source_name].preferences);
                basic_job.transfer_energy(creep, prefered_container);
            }
        }
    }
}
module.exports.creepjob = creepjob;
