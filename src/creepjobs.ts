import * as _ from "lodash"
import * as creepjobs_home from "./creepjobs_home"
import * as creepjobs_external from "./creepjobs_external"
import * as creepjobs_maincarrier from "./creepjobs_maincarrier"
import * as creepjobs_combat from "./creepjobs_combat"
import * as creepjobs_resources from "./creepjobs_resources"
import * as config from "./config"
export function creepjob(creep: Creep) {
    if (creep.spawning || creep.ticksToLive == undefined) {
        return;
    }
    if (!("role" in creep.memory)) {
        return;
    } else if (config.creep_roles_home.includes(creep.memory.role)) {
        creepjobs_home.creepjob(creep);
        return;
    } else if (config.creep_roles_maincarrier.includes(creep.memory.role)) {
        creepjobs_maincarrier.creepjob(creep);
        return;
    } else if (config.creep_roles_external.includes(creep.memory.role)) {
        creepjobs_external.creepjob(creep);
        return;
    } else if (config.creep_roles_combat.includes(creep.memory.role)) {
        creepjobs_combat.creepjob(creep);
        return;
    } else if (config.creep_roles_resources.includes(creep.memory.role)) {
        creepjobs_resources.creepjob(creep);
        return;
    }
}
