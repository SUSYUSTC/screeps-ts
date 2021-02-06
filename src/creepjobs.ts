import * as _ from "lodash"
import * as creepjobs_home from "./creepjobs_home"
import * as creepjobs_external from "./creepjobs_external"
import * as creepjobs_maincarrier from "./creepjobs_maincarrier"
import * as creepjobs_combat from "./creepjobs_combat"
export function creepjob(creep: Creep) {
    if (creep.spawning || creep.ticksToLive == undefined) {
        return;
    }
    if (!("role" in creep.memory)) {
        return;
    }
	if (creepjobs_home.creepjob(creep) == 0) {
		return;
	} else if (creepjobs_maincarrier.creepjob(creep) == 0) {
		return;
	} else if (creepjobs_external.creepjob(creep) == 0) {
		return;
	} else if (creepjobs_combat.creepjob(creep) == 0) {
		return;
	}
}
