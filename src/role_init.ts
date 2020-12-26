//screeps
var mymath = require('./mymath');
var basic_job = require('./basic_job')
var config = require('./config')
require('./includes')
//var visual_options={visualizePathStyle: {stroke: '#ffffff'}};

interface type_work_result {
	type: string;
	id: Id<any>;
}
function determine_stage(creep: Creep) {
	if (!('harvesting' in creep.memory)) {
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
    var metric = config.distance_metric;
    var conf = Memory.rooms_conf[creep.room.name];
    var source: Source = Game.getObjectById(conf.sources[creep.memory.source_name].id);
    var charge_list: AnyStorageStructure[] = creep.room.memory.storage_list.map((id) => Game.getObjectById(id));
    charge_list = charge_list.filter((e) => e.store.getFreeCapacity("energy") > 0)
    var sites: ConstructionSite[] = creep.room.find(FIND_CONSTRUCTION_SITES);
    var distance_charge: number[] = charge_list.map((obj) => metric(creep.room.name, creep.pos, obj.pos));
    var distance_build: number[] = sites.map((obj) => metric(creep.room.name, source.pos, obj.pos) - obj.progress * 0.001);
    var distance_controller: number = metric(creep.room.name, creep.pos, creep.room.controller.pos);
    var priority_charge: number[] = distance_charge.map((d) => 10 - d);
    var priority_build: number[] = distance_build.map((d) => 5 - d);
    var priority_controller: number = -100 - distance_controller;
    var priorities: number[] = priority_charge.concat(priority_build).concat([priority_controller])
    var types: string[] = priority_charge.map((e) => "charge").concat(priority_build.map((e) => "build")).concat(["upgrade"])
	var ids: Id<any>[] = charge_list.map((e) => < Id<any> > e.id).concat(sites.map((e) => < Id<any> > e.id)).concat([ < Id<any> > creep.room.controller.id]);
    var argmax: number = mymath.argmax(priorities);
	return { type: types[argmax], id: ids[argmax]};
}

function init_work(creep: Creep) {
    determine_stage(creep);
    if (creep.memory.harvesting) {
        creep.say("IH")
        var conf = Memory.rooms_conf[creep.room.name];
        var source_name = creep.memory.source_name;
        var source_id = conf.sources[source_name].id;
        var source = Game.getObjectById(source_id);
        basic_job.harvest_source(creep, source);
    } else {
		var work_result = assign_work(creep);
        var obj = Game.getObjectById(work_result.id);
		var type = work_result.type;
        if (type == 'charge') {
            creep.say("IT")
            if (creep.transfer(obj, "energy") == ERR_NOT_IN_RANGE) {
                creep.moveTo(obj);
            }
        } else if (type == 'build') {
            creep.say("IB")
            if (creep.build(obj) == ERR_NOT_IN_RANGE) {
                creep.moveTo(obj);
            }
        } else if (type == 'upgrade') {
            creep.say("IU")
            if (creep.upgradeController(obj) == ERR_NOT_IN_RANGE) {
                creep.moveTo(obj);
            }
        } else {
            throw Error("Wrong type");
        }
    }
}
module.exports.init_work = init_work;
