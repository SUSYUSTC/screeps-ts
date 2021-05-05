import * as _ from "lodash"
import * as creepjobs_home from "./creepjobs_home"
import * as creepjobs_external from "./creepjobs_external"
import * as creepjobs_maincarrier from "./creepjobs_maincarrier"
import * as creepjobs_combat from "./creepjobs_combat"
import * as creepjobs_resources from "./creepjobs_resources"
import * as config from "./config"
import * as basic_job from "./basic_job"
import { Timer } from "./timer"
var creepjob_dict: {[key in type_creep_role] ?: type_creep_jobtypes} = {
};
for (let role of config.creep_roles_home) {
	creepjob_dict[role] = "home";
}
for (let role of config.creep_roles_external) {
	creepjob_dict[role] = "external";
}
for (let role of config.creep_roles_maincarrier) {
	creepjob_dict[role] = "maincarrier";
}
for (let role of config.creep_roles_combat) {
	creepjob_dict[role] = "combat";
}
for (let role of config.creep_roles_resources) {
	creepjob_dict[role] = "resource";
}
var creepjob_functions: {[key in type_creep_jobtypes] : (creep: Creep) => number} = {
	"home": creepjobs_home.creepjob,
	"external": creepjobs_external.creepjob,
	"maincarrier": creepjobs_maincarrier.creepjob,
	"combat": creepjobs_combat.creepjob,
	"resource": creepjobs_resources.creepjob,
}
export function creepjob(creep: Creep) {
    if (creep.spawning || creep.ticksToLive == undefined) {
        return;
    }
	if (creep.memory.next_time == undefined) {
		creep.memory.next_time = {};
	}
    if (creep.memory.role !== undefined) {
		Game.creep_jobtypes[creepjob_dict[creep.memory.role]].push(creep);
    }
}
export function run() {
	for (let jobtype of <Array<type_creep_jobtypes>> ['home', 'external', 'resource', 'combat', 'maincarrier']) {
		let job = creepjob_functions[jobtype];
		for (let creep of Game.creep_jobtypes[jobtype]) {
			let timer = new Timer(creep.memory.role, false);
			try {
				job(creep);
			} catch (err) {
				creep.say("Error");
				creep.memory.movable = false;
				creep.memory.crossable = false;
				console.log(creep.room.name, creep.name, err.stack)
			}
			timer.end();
		}
	}
}
