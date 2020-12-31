import * as mymath from "./mymath"
import * as external_room from "./external_room"
import * as functions from "./functions"
var moveoptions = {
    reusePath: 0,
    //visualizePathStyle: {},
    maxRooms: 0,
    costCallback: functions.avoid_exits,
};

function not_edge(pos: RoomPosition): boolean {
    return pos.x > 2 && pos.x < 47 && pos.y > 2 && pos.y < 47
}
export function hunt(creep: Creep) {
    let conf = Memory.rooms_conf[creep.memory.home_room_name];
    let attacked = false;
    if (!("hunting" in conf)) {
        return;
    }
    if (creep.room.name !== conf.hunting.room_name && creep.hits == creep.hitsMax) {
        external_room.movethroughrooms(creep, conf.hunting.rooms_forwardpath, conf.hunting.names_forwardpath);
    } else {
        let enermies = creep.room.find(FIND_HOSTILE_CREEPS);
        let dangerous;
        let vital;
        let target = null;
        let moving_target = null;
        let others = creep.room.find(FIND_MY_CREEPS).filter((e) => e.memory.role == 'hunter').filter((e) => e.name !== creep.name);
        if (enermies.length > 0) {
            var creeps_components = enermies.map((e) => functions.analyze_component(e));
            let distance = enermies.map((e) => creep.pos.getRangeTo(e));
            let argmin = mymath.argmin(distance);
            target = enermies[argmin];
            if (creep.attack(target) == 0) {
                attacked = true;
            }
            let enermies_movable = enermies.filter((e) => not_edge(e.pos));
            if (enermies_movable.length > 0) {
                let distance_movable = enermies_movable.map((e) => creep.pos.getRangeTo(e));
                let argmin_movable = mymath.argmin(distance_movable);
                moving_target = enermies_movable[argmin_movable];
            }
            creep.rangedAttack(target);
            var total_components: {
                [key: string]: number
            } = {};
            for (let key in creeps_components[0]) {
                total_components[key] = mymath.array_sum(creeps_components.map((e) => e[key]));
            }
            console.log(JSON.stringify(total_components));
            dangerous = (total_components.n_attack > 5 || total_components.n_rangedattack > 3);
            vital = (total_components.n_attack > 10 || total_components.n_rangedattack > 6 || total_components.n_attack + total_components.n_rangedattack > 12);
        }
        if (!attacked) {
            if (creep.hits < creep.hitsMax) {
                creep.heal(creep);
            } else {
                let heal_targets = others.filter((e) => creep.pos.getRangeTo(e) <= 3);
                if (heal_targets.length > 0 && heal_targets[0].hits < heal_targets[0].hitsMax) {
                    creep.heal(heal_targets[0]);
                } else {
                    let structures = creep.room.find(FIND_STRUCTURES);
                    let distance_structures = structures.map((e) => creep.pos.getRangeTo(e));
                    if (distance_structures.length > 0) {
                        let argmin_structures = mymath.argmin(distance_structures);
                        let closest_structure = structures[argmin_structures];
                        creep.attack(closest_structure);
                        creep.rangedAttack(closest_structure);
                    }
                }
            }
        }
        if (creep.hits <= creep.hitsMax * 0.8 || creep.room.name !== conf.hunting.room_name) {
            external_room.movethroughrooms(creep, conf.hunting.rooms_backwardpath, conf.hunting.names_backwardpath);
            return;
        }
        if (!dangerous && enermies.length > 0) {
            if (moving_target !== null) {
                creep.moveTo(moving_target, moveoptions);
            }
            return;
        }
        if (others.length < conf.hunting.number - 1) {
            external_room.movethroughrooms(creep, conf.hunting.rooms_forwardpath, conf.hunting.names_forwardpath);
            return;
        }
        let distance_to_others = others.map((e) => creep.pos.getRangeTo(e));
        if (mymath.any(distance_to_others.map((e) => e > 2))) {
            creep.moveTo(others[0], moveoptions);
            return;
        }
        if (enermies.length > 0) {
            if (!vital) {
                if (moving_target !== null) {
                    creep.moveTo(moving_target, moveoptions);
                    return;
                } else {
                    creep.moveTo(conf.hunting.stay_pos[0], conf.hunting.stay_pos[1]);
                    return;
                }
            } else {
                if (total_components.n_attack >= 8) {
                    if (creep.pos.getRangeTo(target) >= 5) {
                        if (not_edge(target.pos)) {
                            creep.moveTo(target, moveoptions)
                        }
                        return;
                    } else {
                        external_room.movethroughrooms(creep, conf.hunting.rooms_backwardpath, conf.hunting.names_backwardpath);
                        return;
                    }
                } else {
                    if (not_edge(target.pos)) {
                        creep.moveTo(target, moveoptions)
                    } else {
                        creep.moveTo(conf.hunting.stay_pos[0], conf.hunting.stay_pos[1]);
                    }
                }
            }
        } else {
            creep.moveTo(conf.hunting.stay_pos[0], conf.hunting.stay_pos[1]);
            return;
        }
    }
}
