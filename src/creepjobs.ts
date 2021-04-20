import * as _ from "lodash"
import * as creepjobs_home from "./creepjobs_home"
import * as creepjobs_external from "./creepjobs_external"
import * as creepjobs_maincarrier from "./creepjobs_maincarrier"
import * as creepjobs_combat from "./creepjobs_combat"
import * as creepjobs_resources from "./creepjobs_resources"
import * as config from "./config"
import * as basic_job from "./basic_job"
var creepjob_dict: {[key in type_creep_role] ?: any} = {
};
for (let role of config.creep_roles_home) {
	creepjob_dict[role] = creepjobs_home.creepjob;
}
for (let role of config.creep_roles_external) {
	creepjob_dict[role] = creepjobs_external.creepjob;
}
for (let role of config.creep_roles_maincarrier) {
	creepjob_dict[role] = creepjobs_maincarrier.creepjob;
}
for (let role of config.creep_roles_combat) {
	creepjob_dict[role] = creepjobs_combat.creepjob;
}
for (let role of config.creep_roles_resources) {
	creepjob_dict[role] = creepjobs_resources.creepjob;
}
export function creepjob(creep: Creep) {
    if (creep.spawning || creep.ticksToLive == undefined) {
        return;
    }
	if (basic_job.move_with_path_in_memory(creep) == 0) {
		return;
	}
    if (creep.memory.role !== undefined) {
		creepjob_dict[creep.memory.role](creep);
    }
}
