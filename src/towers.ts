import * as _ from "lodash";
import * as mymath from "./mymath";
import * as config from "./config";
import * as functions from "./functions"
import * as defense from "./defense";
export function attack_all(room_name: string) {
    let room = Game.rooms[room_name]
    let game_memory = Game.memory[room_name];
    let enemies = functions.find_hostile(room);
    if (enemies.length > 0) {
        let hits = enemies.map((e) => e.hits);
        let index = mymath.argmin(hits);
        let towers = global.memory[room_name].tower_list.map((e) => Game.getObjectById(e));
        for (let tower of towers) {
            tower.attack(enemies[index]);
        }
        return 0;
    }
    return 1;
}
export function heal_all(room_name: string) {
    let room = Game.rooms[room_name]
	if (room.memory.next_time.tower_heal == undefined) {
		room.memory.next_time.tower_heal = Game.time;
	}
	if (Game.time < room.memory.next_time.tower_heal) {
		return 1;
	}
    let game_memory = Game.memory[room_name];
    let creeps = room.find(FIND_MY_CREEPS);
    for (let creep of creeps) {
        if (creep.hits < creep.hitsMax) {
            let towers = global.memory[room_name].tower_list.map((e) => Game.getObjectById(e));
            for (let tower of towers) {
                tower.heal(creep);
            }
            return 0;
        }
    }
    let pcs = room.find(FIND_MY_POWER_CREEPS);
    for (let pc of pcs) {
        if (pc.hits < pc.hitsMax) {
            let towers = global.memory[room_name].tower_list.map((e) => Game.getObjectById(e));
            for (let tower of towers) {
                tower.heal(pc);
            }
            return 0;
        }
    }
	room.memory.next_time.tower_heal = Game.time + 5;
    return 1;
}
function repair(structure: Structure) {
	let towers = global.memory[structure.room.name].tower_list.map((e) => Game.getObjectById(e));
	let distance = towers.map((e) => structure.pos.getRangeTo(e));
	let argmin = mymath.argmin(distance);
	towers[argmin].repair(structure);
	return 0;
}
export function repair_all(room_name: string) {
    let room = Game.rooms[room_name]
    if (global.memory[room_name].tower_list.length == 0) {
        return 1;
    }
	if (global.memory[room_name].repair_list.length > 0) {
		repair(Game.getObjectById(global.memory[room_name].repair_list[0]));
		return 0;
	}
	if (global.memory[room_name].ramparts_to_repair.length > 0) {
		repair(Game.getObjectById(global.memory[room_name].ramparts_to_repair[0]));
		return 0;
	}
}
