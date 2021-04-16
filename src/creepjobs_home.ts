import * as _ from "lodash"
import * as role_init from "./role_init";
import * as mymath from "./mymath";
import * as basic_job from "./basic_job";
import * as defense from "./defense";
import * as hunting from "./hunting"
import * as functions from "./functions"
import * as external_room from "./external_room";
import * as config from "./config";
var moveoptions_noset: type_movetopos_options = {
	setmovable: false,
};
export function creepjob(creep: Creep): number {
    var conf = config.conf_rooms[creep.room.name];
    var game_memory = Game.memory[creep.room.name];
    var rolename = creep.memory.role;
    var link_modes = game_memory.link_modes;
    var links_status = creep.room.memory.named_structures_status.link;
    var containers_status = creep.room.memory.named_structures_status.container;
    if (creep.memory.role == 'init') {
        role_init.init_work(creep);
        creep.memory.movable = false;
        return 0;
    } else if (creep.memory.role == 'harvester') {
        creep.say("H")
        creep.memory.movable = false;
        creep.memory.crossable = false;
        let source_name = creep.memory.source_name;
        let source_id = conf.sources[source_name];
        let source = Game.getObjectById(source_id);
        let link_mode = false;
        let link_source: StructureLink;
        let container_source;
        if (true) {
            link_mode = link_modes.includes(source_name);
            if (link_mode) {
                let conf_link_source = links_status[source_name];
                if (!conf_link_source.finished) {
					creep.say("Hf1")
                    return 0;
                }
                link_source = Game.getObjectById(conf_link_source.id);
            }
            let conf_container_source = containers_status[source_name];
            if (!conf_container_source.finished) {
				creep.say("Hf2")
                return 0;
            }
            container_source = Game.getObjectById(conf_container_source.id);
        }
		if (basic_job.trymovetopos(creep, container_source.pos, moveoptions_noset) !== 2) {
			creep.say("Hm")
			return 0;
		}
        if (creep.ticksToLive < 5) {
			basic_job.return_energy_before_die(creep, moveoptions_noset);
			creep.say("Hd")
			return 0;
        }
		if (basic_job.repair_container(creep) == 0) {
			creep.say("Hr")
			return 0;
		}
        basic_job.harvest_source(creep, source);
		creep.say("Hh")
		let harvest_rate = creep.getActiveBodyparts(WORK) * 2;
        if (link_mode) {
            if (container_source.store.getUsedCapacity("energy") > 1600 && creep.store.getUsedCapacity("energy") <= harvest_rate) {
                creep.withdraw(container_source, "energy");
				creep.say("Hw")
            } else if (creep.store.getFreeCapacity() < harvest_rate && container_source.store.getUsedCapacity("energy") >= 1200) {
                creep.transfer(link_source, "energy");
				creep.say("Ht")
            }
        }
        return 0;
    } else if (creep.memory.role == 'carrier') {
        creep.say("C")
        creep.memory.movable = false;
        creep.memory.crossable = true;
        let source_name = creep.memory.source_name;
        let container_source;
        if (creep.memory.source_name == 'storage') {
            container_source = creep.room.storage;
        } else {
            let conf_container_source = containers_status[source_name];
            let conf_container_controller = containers_status.CT;
            if (!(conf_container_source.finished && conf_container_controller.finished)) {
				creep.say("Cf")
                return 0;
            }
            container_source = Game.getObjectById(conf_container_source.id);
        }
		if (creep.ticksToLive < 20) {
			basic_job.return_energy_before_die(creep);
			creep.say("Cd")
			return 0;
		}
		if (creep.store.getFreeCapacity("energy") == 0) {
			basic_job.withdraw(creep, container_source, {left: 300});
			creep.say("Cw")
		} else {
            let prefered_container = basic_job.preferred_container(creep, containers_status, conf.carriers[source_name].preferences);
            if (prefered_container !== null) {
                basic_job.transfer(creep, prefered_container);
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
        let xy = conf.containers.MINE.pos;
        let pos = creep.room.getPositionAt(xy[0], xy[1]);
		if (basic_job.trymovetopos(creep, pos, moveoptions_noset) !== 2) {
			creep.say("MHm");
			return 0;
		}
        let mine = Game.getObjectById(conf.mine);
        let mine_container = Game.getObjectById(containers_status.MINE.id);
        basic_job.harvest_source(creep, mine);
		creep.say("MHh");
        return 0;
    } else if (creep.memory.role == 'upgrader') {
        creep.say("U")
        creep.memory.movable = false;
        creep.memory.crossable = false;
		if (basic_job.boost_request(creep, {"work": config.upgrader_boost_request}, false, moveoptions_noset) == 1) {
			creep.say("Ub");
			return 0;
		}
        if (true) {
            let conf_locations = conf.upgraders.locations;
            let locations = conf_locations.map((e) => creep.room.getPositionAt(e[0], e[1]));
            let output = basic_job.movetoposexceptoccupied(creep, locations);
            if (output == 0) {
				creep.say("Um");
                return 0;
            } else if (output == 1) {
                basic_job.movetopos(creep, creep.room.controller.pos, 1);
            }
        }
        let container = Game.getObjectById(containers_status.CT.id);
		if (basic_job.repair_container(creep, container) == 0) {
			creep.say("Ur");
			return 0;
		}
        let link_mode = link_modes.includes('CT');
        let container_energy = container.store.getUsedCapacity("energy");
        let use_link = false;
        let link;
        if (link_mode) {
            link = Game.getObjectById(links_status.CT.id);
            let link_energy = link.store.getUsedCapacity("energy");
            if (link_energy > container_energy) {
                use_link = true;
            }
        }
        if (creep.store.getUsedCapacity("energy") < creep.store.getFreeCapacity("energy") * 0.2 && creep.ticksToLive >= 10) {
            var lower_limit = (link_mode ? 100 : 800);
            if (use_link) {
                basic_job.withdraw(creep, link, {left: lower_limit});
            } else {
                basic_job.withdraw(creep, container, {left: lower_limit});
            }
			creep.say("Uw");
        }
        basic_job.upgrade_controller(creep, creep.room.controller);
		creep.say("Uu");
        return 0;
    } else if (creep.memory.role == 'builder') {
        creep.say("B")
        creep.memory.movable = false;
        creep.memory.crossable = true;
		if (creep.room.memory.sites_total_progressleft >= 100000) {
			if (basic_job.boost_request(creep, {"work": "LH2O"}, false) == 1) {
				creep.say("Bbo");
				return 0;
			}
		}
		if (creep.ticksToLive < 20) {
			basic_job.return_energy_before_die(creep);
			creep.say("Bd");
		}
        if (creep.store.getUsedCapacity("energy") == 0) {
			let link_mode = link_modes.includes('CT');
			let freecapacity = creep.store.getFreeCapacity("energy");
			let lower_limit = (link_mode ? Math.floor(freecapacity / 2) : freecapacity + 100);
			basic_job.get_energy(creep, {min_energy: lower_limit});
			creep.say("Bg");
			return 0;
		} else {
			basic_job.build_structure(creep);
			creep.say("Bb");
		}
        return 0;
    } else if (creep.memory.role == 'transferer') {
        creep.say("T")
        creep.memory.movable = false;
        creep.memory.crossable = true;
        let min_fill_energy;
        if (creep.room.controller.level >= 7) {
            min_fill_energy = 100;
        } else {
            min_fill_energy = 50;
        }
		if (creep.ticksToLive < 20) {
			basic_job.return_energy_before_die(creep);
			creep.say("Td");
			return 0;
		}
        if (creep.store.getUsedCapacity("energy") < min_fill_energy) {
			basic_job.get_energy(creep, {min_energy: Math.ceil(creep.store.getCapacity() / 2)});
			creep.say("Tg");
			return 0;
		} else {
			basic_job.charge_all(creep);
			creep.say("Tc");
			return 0;
		}
        return 0;
    } else if (creep.memory.role == 'minecarrier') {
        creep.say("mC")
        creep.memory.movable = false;
        creep.memory.crossable = true;
        let mineral_type = game_memory.mine_status.type;
        if (game_memory.mine_status.harvestable) {
            let container = Game.getObjectById(containers_status.MINE.id);
            if (creep.store.getUsedCapacity(mineral_type) == 0) {
                if (creep.pos.isNearTo(container) && container.store.getUsedCapacity(mineral_type) >= creep.store.getCapacity()) {
                    creep.withdraw(container, mineral_type);
					creep.say("mCw")
                } else {
                    basic_job.moveto_stayxy(creep, conf.mineral_stay_pos);
					creep.say("mCs1")
                }
            } else {
				let target = (creep.room.terminal ? creep.room.terminal : creep.room.storage);
				if (target !== undefined) {
					basic_job.transfer(creep, target, {sourcetype: mineral_type})
					creep.say("mCt")
				}
            }
        } else {
			basic_job.moveto_stayxy(creep, conf.mineral_stay_pos);
			creep.say("mCs2")
        }
        return 0;
    } else if (creep.memory.role == 'wall_repairer') {
        creep.say("WR");
        creep.memory.movable = false;
        creep.memory.crossable = true;
		if (basic_job.boost_request(creep, {"work": "LH2O"}, false) == 1) {
			creep.say("WRb");
			return 0;
		}
        if (creep.store.getUsedCapacity("energy") == 0) {
			basic_job.get_energy(creep, {min_energy: 200});
			creep.say("WRg");
        } else {
            let wall_ramparts = creep.room.find(FIND_STRUCTURES).filter((e) => (e.structureType == 'constructedWall' && e.hits) || e.structureType == 'rampart');
            let hits = wall_ramparts.map((e) => e.hits);
            let hits_max = Math.max(...hits);
            let hits_min = Math.min(...hits);
            let wall;
            if (creep.memory.wall_to_repair) {
                wall = Game.getObjectById(creep.memory.wall_to_repair);
                if (wall.hits - hits_min > 500000) {
                    delete creep.memory.wall_to_repair;
					creep.say("WRd");
                    return 0;
                }
            } else {
                let wall_ramparts_left = mymath.range(wall_ramparts.length).filter((i) => hits[i] < hits_min + 20000).map((i) => wall_ramparts[i]);
                let closest_id = mymath.argmin(wall_ramparts_left.map((e) => creep.pos.getRangeTo(e)));
                wall = wall_ramparts_left[closest_id];
                creep.memory.wall_to_repair = < Id < Structure_Wall_Rampart >> wall.id;
				creep.say("WRs");
            }
            if (creep.repair(wall) == ERR_NOT_IN_RANGE) {
                basic_job.movetopos(creep, wall.pos, 3);
				creep.say("WRm");
            }
			creep.say("WRr");
        }
        return 0;
    }
    return 1;
}
