import * as _ from "lodash";
import * as mymath from "./mymath";
import * as spawning_func from "./spawning_func";

export function spawn_init(spawn: StructureSpawn, source_name: string, max_creeps: number, total_maxenergy: number, total_energy: number) {
    var creeps = _.filter(Game.creeps, (creep) => creep.room.name == spawn.room.name && creep.memory.source_name == source_name && creep.memory.role == 'init');
	var body: {[key: string]: BodyPartConstant[]}= {};
    body["300"] = [WORK, WORK, MOVE, CARRY];
    body["400"] = [WORK, WORK, WORK, MOVE, CARRY];
    body["450"] = [WORK, WORK, WORK, MOVE, MOVE, CARRY];
    body["550"] = [WORK, WORK, WORK, MOVE, MOVE, CARRY, CARRY, CARRY];
    if (creeps.length == 0 && total_energy >= 200 && spawn.spawning == null) {
        let creepname = "init" + Game.time;
        let output = spawn.spawnCreep([WORK, CARRY, MOVE], creepname, {
            memory: {
                source_name: source_name,
                role: 'init',
                cost: 200
            }
        });
        console.log(spawn.name, "create init creep:" + output);
        return;
    } else {
        for (var amount of [550, 450, 400, 300]) {
			if (total_maxenergy >= amount) {
				var max_amount = amount;
			}
            if (total_maxenergy >= amount && creeps.length < max_creeps) {
                if (total_energy >= amount) {
                    let creepname = "init" + Game.time;
                    spawn.spawnCreep(body[amount.toString()], creepname, {
                        memory: {
                            source_name: source_name,
                            role: 'init',
                            cost: amount
                        }
                    });
                }
                return;
            }
        }
    }
    var argmin = mymath.argmin(creeps.map(e => e.memory.cost));
    if ((creeps[argmin].memory.cost <= max_amount - 200) && (creeps.length == max_creeps) && (total_maxenergy == total_energy) && spawn.memory.can_suicide) {
        creeps[argmin].suicide()
		spawn.memory.can_suicide = false;
        return;
    }
	spawn.memory.can_suicide = true;
}

