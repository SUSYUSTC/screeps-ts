import * as _ from "lodash";
import * as role_init from "./role_init";
import * as mymath from "./mymath";
import * as basic_job from "./basic_job";
import * as defense from "./defense";
import * as functions from "./functions"
import * as external_room from "./external_room";
import * as config from "./config";
var moveoptions_noset: type_movetopos_options = {
	setmovable: false,
};
var moveoptions_safe: type_movetopos_options = {
	safe_level: 1,
};
export function creepjob(creep: Creep): number {
    var conf = config.conf_rooms[creep.room.name];
    var game_memory = Game.memory[creep.room.name];
    if (creep.memory.role == 'init') {
        role_init.init_work(creep);
        creep.memory.movable = false;
        return 0;
    } else if (creep.memory.role == 'harvester') {
        creep.say("H")
        creep.memory.movable = false;
        creep.memory.crossable = false;
		if (creep.memory.half_time && Game.time % 2 == 1) {
			return 0;
		}
        let source_name = creep.memory.source_name;
        let source_id = conf.sources[source_name];
        let source = Game.getObjectById(source_id);
        let link_source = creep.room.link[source_name];
        let container_source = creep.room.container[source_name];
		if (container_source == undefined) {
			creep.say("Hf2")
			return 0;
		}
		if (creep.memory.working_status == undefined) {
			creep.memory.working_status = 'move';
		}
		switch(creep.memory.working_status) {
			case 'move': {
				if (basic_job.discard_useless_from_container(creep, container_source, "energy") == 0) {
					creep.say("Hd")
					break;
				}
				if (basic_job.trymovetopos(creep, container_source.pos, moveoptions_noset) !== 2) {
					creep.say("Hm")
					break;
				}
				creep.memory.working_status = 'work';
				break;
			}
			case 'work': {
				if (basic_job.repair_container(creep, container_source) == 0) {
					creep.say("Hr")
					break;
				}
				creep.harvest(source);
				creep.say("Hh")
				let harvest_rate = creep.getActiveBodyparts(WORK) * 2;
				if (link_source !== undefined) {
					let container_amount = container_source.store.getUsedCapacity("energy");
					let creep_amount = creep.store.getUsedCapacity("energy");
					if (container_amount == 2000) {
						console.log(`Warning: Source ${creep.memory.source_name} at room ${creep.room.name} overflows at time ${Game.time}`);
					}
					if (container_amount >= config.source_container_upper_limit && creep_amount <= harvest_rate) {
						creep.withdraw(container_source, "energy");
						creep.say("Hw")
					} else if (creep.store.getFreeCapacity() < harvest_rate && container_amount >= config.source_container_lower_limit) {
						creep.transfer(link_source, "energy");
						creep.say("Ht")
					}
				}
				break;
			}
		}
        return 0;
    } else if (creep.memory.role == 'transferer') {
        creep.say("T")
        creep.memory.movable = false;
        creep.memory.crossable = true;
        let min_fill_energy = creep.room.controller.level >= 7 ? 100 : 50;
		if (creep.ticksToLive < 20) {
			basic_job.return_energy_before_die(creep);
			creep.say("Td");
			return 0;
		}
		if (creep.memory.working_status == 'RC') {
			let RC = creep.room.container.RC;
			if (creep.store.getUsedCapacity() > 0) {
				basic_job.transfer(creep, creep.room.terminal, functions.get_first_resource_type(creep.store));
			} else {
				if (RC.store.getUsedCapacity() == 0) {
					creep.memory.working_status = 'normal';
					return 0;
				}
				basic_job.withdraw(creep, RC, functions.get_first_resource_type(RC.store));
			}
			return 0;
		}
        if (creep.store.getUsedCapacity("energy") < min_fill_energy) {
			basic_job.get_energy(creep, {min_energy: Math.ceil(creep.store.getCapacity() / 2), moveoptions: moveoptions_safe, require_safe: true});
			delete creep.memory.current_filling_target;
			creep.say("Tg");
			return 0;
		} else if (basic_job.charge_all(creep, moveoptions_safe) == 0) {
			creep.say("Tc");
			return 0;
		}
		if (Game.time % 50 == 0 && creep.room.container.RC !== undefined && creep.room.container.RC.store.getUsedCapacity() > 0 && creep.ticksToLive >= 50) {
			creep.memory.working_status = 'RC';
		}
        return 0;
    } else if (creep.memory.role == 'upgrader') {
        creep.say("U")
        creep.memory.movable = false;
        creep.memory.crossable = false;
		if (creep.memory.working_status == undefined) {
			creep.memory.working_status = 'boost';
		}
		switch(creep.memory.working_status) {
			case 'boost': {
				if (basic_job.boost_request(creep, {"work": "GH2O"}, false, moveoptions_noset) == 1) {
					creep.say("Ub");
					break;
				}
				creep.memory.working_status = 'move';
				break;
			}
			case 'move': {
				let conf_locations = conf.upgraders.locations;
				let locations = conf_locations.map((e) => creep.room.getPositionAt(e[0], e[1]));
				let output = basic_job.movetoposexceptoccupied(creep, locations);
				if (output == 0) {
					creep.say("Um");
					break;
				} else if (output == 1) {
					basic_job.movetopos(creep, creep.room.controller.pos, 1);
					break;
				}
				creep.memory.working_status = 'work';
				break;
			}
			case 'work': {
				let stop_withdrawing = (creep.ticksToLive < conf.upgraders.distance + 30) && (creep.room.controller.level == 8) && creep.memory.boost_status !== undefined && creep.memory.boost_status.boost_finished;
				if (stop_withdrawing && creep.store.getUsedCapacity("energy") == 0) {
					creep.memory.working_status = 'unboost';
					break;
				}
				let container = creep.room.container.CT;
				let link = creep.room.link.CT;
				if (container !== undefined && basic_job.repair_container(creep, container) == 0) {
					creep.say("Ur");
					break;
				}
				if (!stop_withdrawing && creep.store.getUsedCapacity("energy") < creep.getActiveBodyparts(WORK) * 2 && creep.ticksToLive >= 10) {
					let use_link = (container == undefined) || (link !== undefined && link.store.getUsedCapacity("energy") > container.store.getUsedCapacity("energy"));
					var lower_limit = (link !== undefined ? 0 : 800);
					if (use_link) {
						basic_job.withdraw(creep, link, "energy", {left: lower_limit});
					} else {
						basic_job.withdraw(creep, container, "energy", {left: lower_limit});
					}
					creep.say("Uw");
				}
				basic_job.upgrade_controller(creep, creep.room.controller);
				creep.say("Uu");
				break;
			}
			case 'unboost': {
				basic_job.unboost(creep);
				creep.say("Uub");
				break;
			}
		}
        return 0;
    } else if (creep.memory.role == 'carrier') {
        creep.say("C")
        creep.memory.movable = false;
        creep.memory.crossable = true;
        let source_name = creep.memory.source_name;
		let container_source = <StructureContainer | StructureStorage> creep.room.container[source_name];
		let container_controller = creep.room.container.CT;
        if (creep.memory.source_name == 'storage') {
            container_source = creep.room.storage;
        }
		if (container_source == undefined || container_controller == undefined) {
			creep.say("Cf");
			return 0;
		}
		if (creep.ticksToLive < 20) {
			basic_job.return_energy_before_die(creep);
			creep.say("Cd")
			return 0;
		}
		if (creep.store.getUsedCapacity("energy") == 0) {
			basic_job.withdraw(creep, container_source, "energy", {exact: true});
			creep.say("Cw")
		} else {
            let prefered_container = basic_job.preferred_container(creep, conf.carriers[source_name].preferences);
            if (prefered_container !== null) {
                basic_job.transfer(creep, prefered_container, "energy");
				creep.say("Ct")
			}
			creep.say("Cn")
		}
        return 0;
    } else if (creep.memory.role == 'mineharvester') {
        creep.say("MH")
        creep.memory.movable = false;
        creep.memory.crossable = false;
        if (!game_memory.mine_status.harvestable) {
			creep.say("MHf");
            return 0;
        }
		if (creep.memory.working_status == undefined) {
			creep.memory.working_status = 'boost';
		}
		switch(creep.memory.working_status) {
			case 'boost': {
				if (basic_job.boost_request(creep, {"work": "UHO2"}, true) !== 0) {
					creep.say("MHb");
					break;
				}
				creep.memory.working_status = 'move';
				break;
			}
			case 'move': {
				let xy = conf.containers.MINE.pos;
				let pos = creep.room.getPositionAt(xy[0], xy[1]);
				let mine = Game.getObjectById(conf.mine);
				let mine_container = creep.room.container.MINE;
				if (mine_container == undefined) {
					creep.say("MHf");
					break;
				}
				if (basic_job.trymovetopos(creep, pos, moveoptions_noset) !== 2) {
					creep.say("MHm");
					break;
				}
				creep.memory.working_status = 'work';
				break;
			}
			case 'work': {
				if (creep.room.extractor.cooldown > 0) {
					break;
				}
				let mine = Game.getObjectById(conf.mine);
				let mine_container = creep.room.container.MINE;
				if (mine_container.store.getFreeCapacity() >= creep.getActiveBodyparts(WORK) * 5) {
					basic_job.harvest_source(creep, mine);
					creep.say("MHh");
				}
				break;
			}
		}
        return 0;
    } else if (creep.memory.role == 'minecarrier') {
        creep.say("mC")
        creep.memory.movable = false;
        creep.memory.crossable = true;
		if (basic_job.boost_request(creep, {"carry": "KH"}, true) !== 0) {
			creep.say("mCb");
			return 0;
		}
        let mineral_type = game_memory.mine_status.type;
        if (game_memory.mine_status.harvestable) {
            let container = creep.room.container.MINE;
			if (container == undefined) {
				creep.say("MCf");
			}
            if (creep.store.getUsedCapacity(mineral_type) == 0) {
				if (creep.pos.getRangeTo(container) == 1) {
					if (basic_job.discard_useless_from_container(creep, container, mineral_type) == 0) {
						return 0;
					}
				}
                if (creep.pos.isNearTo(container) && container.store.getUsedCapacity(mineral_type) >= creep.store.getCapacity()) {
                    creep.withdraw(container, mineral_type);
					creep.say("mCw")
                } else {
					basic_job.movetopos(creep, container.pos, 1);
					creep.say("mCs1")
                }
            } else {
				let target = (creep.room.terminal ? creep.room.terminal : creep.room.storage);
				if (target !== undefined) {
					basic_job.transfer(creep, target, mineral_type)
					creep.say("mCt")
				}
            }
        } else {
			basic_job.moveto_stayxy(creep, conf.mineral_stay_pos);
			creep.say("mCs2")
        }
        return 0;
    } else if (creep.memory.role == 'builder') {
        creep.say("B")
        creep.memory.movable = false;
        creep.memory.crossable = true;
		if (creep.memory.request_boost && creep.room.link.MAIN !== undefined) {
			if (basic_job.boost_request(creep, {"work": "LH2O"}, false) == 1) {
				creep.say("Bbo");
				return 0;
			}
		}
		if (creep.ticksToLive < 20) {
			basic_job.return_energy_before_die(creep);
			creep.say("Bd");
		}
		let link_modes = Object.keys(creep.room.link);
        if (creep.store.getUsedCapacity("energy") == 0) {
			delete creep.memory.current_building_target;
			basic_job.get_energy(creep);
			creep.say("Bg");
			return 0;
		} else {
			basic_job.build_structure(creep, {}, {priority_list: ['link', 'terminal', 'storage']});
			creep.say("Bb");
		}
        return 0;
    } else if (creep.memory.role == 'wall_repairer') {
        creep.say("WR");
        creep.memory.movable = false;
        creep.memory.crossable = true;
		if (global.basic_costmatrices_safe[creep.room.name].get(creep.pos.x, creep.pos.y) == 255) {
			basic_job.movetopos(creep, creep.room.terminal.pos, 1);
		}
		if (basic_job.boost_request(creep, {"work": "LH2O"}, false, moveoptions_safe) == 1) {
			creep.say("WRb");
			return 0;
		}
        if (creep.store.getUsedCapacity("energy") == 0) {
			basic_job.get_energy(creep, {min_energy: 200, moveoptions: moveoptions_safe, require_safe: true});
			creep.say("WRg");
        } else {
			let global_memory = global.memory[creep.room.name]
			let wall;
            if (creep.memory.wall_to_repair !== undefined && creep.memory.wall_min_hits !== undefined) {
                wall = Game.getObjectById(creep.memory.wall_to_repair);
				if (wall == null) {
					delete creep.memory.wall_to_repair;
					delete creep.memory.wall_min_hits;
					creep.say("WRd");
					return 0;
				}
				let this_hits;
				if ((<Array<Id<Structure_Wall_Rampart>>>global_memory.secondary_ramparts_id).includes(creep.memory.wall_to_repair)) {
					this_hits = wall.hits * config.secondary_rampart_factor;
				} else {
					this_hits = wall.hits;
				}
				if (this_hits - creep.memory.wall_min_hits >= 500000) {
					delete creep.memory.wall_to_repair;
					delete creep.memory.wall_min_hits;
					creep.say("WRd");
					return 0;
				}
            } else {
				let walls = global_memory.walls_id.map((e) => <Structure_Wall_Rampart> Game.getObjectById(e));
				let main_ramparts = global_memory.main_ramparts_id.map((e) => <Structure_Wall_Rampart> Game.getObjectById(e));
				let secondary_ramparts = global_memory.secondary_ramparts_id.map((e) => <Structure_Wall_Rampart> Game.getObjectById(e));
				let wall_ramparts= walls.concat(main_ramparts).concat(secondary_ramparts);
				let hits = walls.map((e) => e.hits).concat(main_ramparts.map((e) => e.hits)).concat(secondary_ramparts.map((e) => e.hits*5));
				let hits_min = mymath.min(hits);
                let wall_ramparts_left = mymath.range(wall_ramparts.length).filter((i) => hits[i] < hits_min + 20000).map((i) => wall_ramparts[i]);
                let closest_id = mymath.argmin(wall_ramparts_left.map((e) => creep.pos.getRangeTo(e)));
                wall = wall_ramparts_left[closest_id];
                creep.memory.wall_to_repair = < Id < Structure_Wall_Rampart >> wall.id;
				creep.memory.wall_min_hits = hits_min;
				creep.say("WRs");
            }
            if (creep.repair(wall) == ERR_NOT_IN_RANGE) {
                basic_job.movetopos(creep, wall.pos, 3, moveoptions_safe);
				creep.say("WRm");
				return 0;
            }
			creep.say("WRr");
        }
        return 0;
    }
    return 1;
}
