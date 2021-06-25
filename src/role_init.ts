//screeps
import * as _ from "lodash";
import * as mymath from "./mymath";
import * as basic_job from "./basic_job";
import * as config from "./config";
//let visual_options={visualizePathStyle: {stroke: '#ffffff'}};

interface type_work_result {
	type: string;
	id: Id<any>;
}
function determine_stage(creep: Creep) {
	if (!("harvesting" in creep.memory)) {
		creep.memory.harvesting = true;
	}
	if (!creep.memory.harvesting && creep.store["energy"] == 0) {
		creep.memory.harvesting = true;
	}
	if (creep.memory.harvesting && creep.store.getFreeCapacity("energy") == 0) {
		creep.memory.harvesting = false;
	}
}

function assign_work(creep: Creep): type_work_result{
    let conf = config.conf_rooms[creep.room.name];
    let source = Game.getObjectById(conf.sources[creep.memory.source_name]);
    let charge_list = global.memory[creep.room.name].energy_filling_list.map((id) => Game.getObjectById(id));
	charge_list = charge_list.filter((e) => (<GeneralStore>e.store).getFreeCapacity("energy") > 0)
    let sites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
    let distance_charge = charge_list.map((obj) => creep.pos.getRangeTo(obj.pos));
    let distance_build = sites.map((obj) => source.pos.getRangeTo(obj.pos) - obj.progress * 0.001);
    let distance_controller = creep.pos.getRangeTo(creep.room.controller.pos);
    let priority_charge = distance_charge.map((d) => 10 - d);
    let priority_build = distance_build.map((d) => 5 - d);
    let priority_controller = -100 - distance_controller;
    let priorities = priority_charge.concat(priority_build).concat([priority_controller])
    let types = priority_charge.map((e) => "charge").concat(priority_build.map((e) => "build")).concat(["upgrade"])
	let ids = charge_list.map((e) => < Id<any> > e.id).concat(sites.map((e) => < Id<any> > e.id)).concat([ < Id<any> > creep.room.controller.id]);
    let argmax = mymath.argmax(priorities);
	return { type: types[argmax], id: ids[argmax]};
}

export function init_work(creep: Creep) {
    determine_stage(creep);
    if (creep.memory.harvesting) {
        creep.say("IH")
		let conf = config.conf_rooms[creep.room.name];
        let source_name = creep.memory.source_name;
        let source_id = conf.sources[source_name];
        let source = Game.getObjectById(source_id);
        basic_job.harvest_source(creep, source);
    } else {
		let work_result = assign_work(creep);
        let obj = Game.getObjectById(work_result.id);
		let type = work_result.type;
        if (type == 'charge') {
            creep.say("IT")
            if (creep.transfer(obj, "energy") == ERR_NOT_IN_RANGE) {
				creep.moveTo(obj, {maxRooms: 1});
            }
        } else if (type == 'build') {
            creep.say("IB")
            if (creep.build(obj) == ERR_NOT_IN_RANGE) {
				creep.moveTo(obj, {maxRooms: 1});
            }
        } else if (type == 'upgrade') {
            creep.say("IU")
            if (creep.upgradeController(obj) == ERR_NOT_IN_RANGE) {
				creep.moveTo(obj, {maxRooms: 1});
            }
        } else {
            throw Error("Wrong type");
        }
    }
}
