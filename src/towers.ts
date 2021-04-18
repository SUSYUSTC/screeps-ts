import * as _ from "lodash";
import * as mymath from "./mymath";
import * as config from "./config";
import * as defense from "./defense";
export function attack_all(room_name: string) {
    let name_of_this_function = "attack_all";
    if (Game.tick_cpu[name_of_this_function] == undefined) {
        Game.tick_cpu[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();

    let room = Game.rooms[room_name]
    let game_memory = Game.memory[room_name];
    let enemies = room.find(FIND_HOSTILE_CREEPS);
    if (enemies.length > 0) {
        let hits = enemies.map((e) => e.hits);
        let index = mymath.argmin(hits);
        let towers = room.memory.tower_list.map((e) => Game.getObjectById(e));
        for (let tower of towers) {
            tower.attack(enemies[index]);
        }
		Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
        return 0;
    }
	Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
    return 1;
}
export function heal_all(room_name: string) {
    let name_of_this_function = "heal_all";
    if (Game.tick_cpu[name_of_this_function] == undefined) {
        Game.tick_cpu[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();

    let room = Game.rooms[room_name]
    let game_memory = Game.memory[room_name];
    let creeps = room.find(FIND_MY_CREEPS);
    for (let creep of creeps) {
        if (creep.hits < creep.hitsMax) {
            let towers = room.memory.tower_list.map((e) => Game.getObjectById(e));
            for (let tower of towers) {
                tower.heal(creep);
            }
			Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
            return 0;
        }
    }
    let pcs = room.find(FIND_MY_POWER_CREEPS);
    for (let pc of pcs) {
        if (pc.hits < pc.hitsMax) {
            let towers = room.memory.tower_list.map((e) => Game.getObjectById(e));
            for (let tower of towers) {
                tower.heal(pc);
            }
			Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
            return 0;
        }
    }
	Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
    return 1;
}
function repair(structure: Structure) {
	let towers = structure.room.memory.tower_list.map((e) => Game.getObjectById(e));
	let distance = towers.map((e) => structure.pos.getRangeTo(e));
	let argmin = mymath.argmin(distance);
	towers[argmin].repair(structure);
	return 0;
}
export function repair_all(room_name: string) {
    let name_of_this_function = "repair_all";
    if (Game.tick_cpu[name_of_this_function] == undefined) {
        Game.tick_cpu[name_of_this_function] = 0
    }
    let cpu_used = Game.cpu.getUsed();

    let room = Game.rooms[room_name]
    if (room.memory.tower_list.length == 0) {
		Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
        return 1;
    }
	if (room.memory.repair_list.length > 0) {
		repair(Game.getObjectById(room.memory.repair_list[0]));
		Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
		return 0;
	}
	if (room.memory.ramparts_to_repair.length > 0) {
		repair(Game.getObjectById(room.memory.ramparts_to_repair[0]));
		Game.tick_cpu[name_of_this_function] += Game.cpu.getUsed() - cpu_used;
		return 0;
	}
}
