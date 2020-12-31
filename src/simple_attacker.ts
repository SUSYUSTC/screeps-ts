import * as external_room from "./external_room"
import * as mymath from "./mymath"
export function simple_attack(creep: Creep, rooms_forwardpath: string[], names_forwardpath: string[]) {
    if (creep.hits < creep.hitsMax) {
        creep.heal(creep);
    }
    if (creep.room.name !== rooms_forwardpath[rooms_forwardpath.length - 1]) {
        external_room.movethroughrooms(creep, rooms_forwardpath, names_forwardpath);
    }
    let enemies = creep.room.find(FIND_HOSTILE_CREEPS);
    let attacked = false;
    let rangedattacked = false;
    if (enemies.length > 0) {
        let distance = enemies.map(function(e) {
            return creep.pos.getRangeTo(e);
        });
        let argmin = mymath.argmin(distance);
        let target = enemies[argmin];
        if (creep.pos.getRangeTo(target) <= 3) {
            attacked = (creep.attack(target) == 0);
            rangedattacked = (creep.rangedAttack(target) == 0);
        }
    }
    let structures = creep.room.find(FIND_STRUCTURES).filter((e) => ['spawn', 'extension'].includes(e.structureType));
    if (structures.length > 0) {
        var argmin = mymath.argmin(structures.map((e) => creep.pos.getRangeTo(e)));
        if (!attacked) {
            attacked = (creep.attack(structures[argmin]) == 0);
        }
        if (!rangedattacked) {
            rangedattacked = (creep.rangedAttack(structures[argmin]) == 0);
        }
        if (creep.pos.getRangeTo(structures[argmin]) > 1) {
            creep.moveTo(structures[argmin]);
        }
    }
	if (!attacked) {
		creep.heal(creep);
	}
}
