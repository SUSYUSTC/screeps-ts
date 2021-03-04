import * as _ from "lodash"
import * as mymath from "./mymath"
import * as functions from "./functions"
import * as basic_job from "./basic_job"
interface type_ranged_group_x2 {
    healer: string;
    ranged_attacker: string;
}
interface type_dismantle_group_x2 {
    healer: string;
    dismantler: string;
}

export function dismantle_group_x2(group: type_dismantle_group_x2, flagname: string): number {
    let healer = Game.creeps[group.healer];
    let dismantler = Game.creeps[group.dismantler];
    let healer_damage = healer.hitsMax - healer.hits;
    let dismantler_damage = dismantler.hitsMax - dismantler.hits;
    let close = false;
    let sameroom = false;
    if (healer.room.name == dismantler.room.name) {
        sameroom = true;
        if (healer.pos.getRangeTo(dismantler) <= 1) {
            close = true;
        }
    }
    if (dismantler.room.controller == undefined || !dismantler.room.controller.my) {
        // dismantle tower first, then other structure with the lowest hits
        let xmin = Math.max(dismantler.pos.x - 1, 0);
        let xmax = Math.min(dismantler.pos.x + 1, 49);
        let ymin = Math.max(dismantler.pos.y - 1, 0);
        let ymax = Math.min(dismantler.pos.y + 1, 49);
        let structures_in_range = dismantler.room.lookForAtArea("structure", ymin, xmin, ymax, xmax, true).map((e) => e.structure);
        structures_in_range = structures_in_range.filter((e) => !(['storage', 'terminal'].includes(e.structureType)));
        let towers = < Array < StructureTower >> structures_in_range.filter((e) => e.structureType == "tower");
        if (towers.length > 0) {
            let hits = towers.map((e) => e.hits);
            let argmin = mymath.argmin(hits);
            dismantler.dismantle(towers[argmin]);
        } else if (structures_in_range.length > 0) {
            let hits = structures_in_range.map((e) => e.hits);
            let argmin = mymath.argmin(hits);
            dismantler.dismantle(structures_in_range[argmin]);
        }
    }
    // try to heal dismantler first if close
    if (close && dismantler_damage >= healer_damage) {
        healer.heal(dismantler);
    } else {
        healer.heal(healer);
    }
    if (sameroom) {
        if (!close) {
            healer.moveTo(dismantler);
            dismantler.moveTo(healer);
        } else {
            if (healer.pos.x == 0 && dismantler.pos.x == 0) {
                dismantler.move(RIGHT);
                healer.move(RIGHT);
            } else if (healer.pos.x == 49 && dismantler.pos.x == 49) {
                dismantler.move(LEFT);
                healer.move(LEFT);
            } else if (healer.pos.y == 0 && dismantler.pos.y == 0) {
                dismantler.move(BOTTOM);
                healer.move(BOTTOM);
            } else if (healer.pos.y == 49 && dismantler.pos.y == 49) {
                dismantler.move(TOP);
                healer.move(TOP);
            } else {
                let flag = Game.flags[flagname];
                if (flag !== undefined && flag.room !== undefined && flag.room.name == dismantler.room.name) {
                    if (flag.pos.x == 0) {
                        if (dismantler.pos.x == 1 && healer.pos.x == 1) {
                            dismantler.move(LEFT);
                            healer.move(LEFT);
                        }
                    } else if (flag.pos.x == 49) {
                        if (dismantler.pos.x == 48 && healer.pos.x == 48) {
                            dismantler.move(RIGHT);
                            healer.move(RIGHT);
                        }
                    } else if (flag.pos.y == 0) {
                        if (dismantler.pos.y == 1 && healer.pos.y == 1) {
                            dismantler.move(TOP);
                            healer.move(TOP);
                        }
                    } else if (flag.pos.y == 49) {
                        if (dismantler.pos.y == 48 && healer.pos.y == 48) {
                            dismantler.move(BOTTOM);
                            healer.move(BOTTOM);
                        }
                    } else {
                        dismantler.moveTo(flag, {
                            maxRooms: 1,
                            reusePath: 0,
                            costCallback: functions.avoid_exits
                        });
                        healer.moveTo(dismantler);
                    }
                }
            }
        }
    }
    return 0;
}

global.spawn_dismantler_group_x2 = function(room_name: string, suffix: string): number {
    let body_dismantler: BodyPartConstant[] = []
    mymath.range(10).forEach((e) => body_dismantler.push(TOUGH));
    mymath.range(30).forEach((e) => body_dismantler.push(WORK));
    mymath.range(10).forEach((e) => body_dismantler.push(MOVE));
    global.spawn_in_queue(room_name, body_dismantler, "dismantler_" + suffix);
    let body_healer: BodyPartConstant[] = [];
    mymath.range(10).forEach((e) => body_healer.push(TOUGH));
    mymath.range(30).forEach((e) => body_healer.push(HEAL));
    mymath.range(10).forEach((e) => body_healer.push(MOVE));
    global.spawn_in_queue(room_name, body_healer, "healer_" + suffix);
    return 0;
}

global.do_dismantler_group_x2 = function(suffix: string, flagname: string): number {
    let dismantler_name = 'dismantler_' + suffix;
    let healer_name = 'healer_' + suffix;
    let dismantler = Game.creeps[dismantler_name];
    let healer = Game.creeps[healer_name];
    let output_dismantler = basic_job.boost_request(dismantler, {
        "work": "XZH2O",
        "move": "XZHO2",
        "tough": "XGHO2"
    });
    let output_healer = basic_job.boost_request(healer, {
        "heal": "XLHO2",
        "move": "XZHO2",
        "tough": "XGHO2"
    });
    let flag = Game.flags[flagname];
    if (output_dismantler == 0 && output_healer == 0) {
        dismantle_group_x2({
            "dismantler": dismantler_name,
            "healer": healer_name
        }, flagname);
    } else if (output_dismantler == 0) {
        if (flag !== undefined) {
            dismantler.moveTo(flag);
        }
    } else if (output_healer == 0) {
        if (flag !== undefined) {
            healer.moveTo(flag);
        }
    }
    return 0;
}
