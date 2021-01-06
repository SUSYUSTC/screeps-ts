import * as _ from "lodash";
import * as mymath from "./mymath";
export function attack_all(room_name: string) {
    var room = Game.rooms[room_name]
    var enemies = room.find(FIND_HOSTILE_CREEPS);
    var structures = room.find(FIND_STRUCTURES);
    if (enemies.length > 0) {
        var hits = enemies.map((e) => e.hits);
        var index = mymath.argmin(hits);
        var towers = room.memory.tower_list.map((e) => Game.getObjectById(e));
        for (var tower of towers) {
            tower.attack(enemies[index]);
        }
        return 0;
    }
    return 1;
}
export function heal_all(room_name: string) {
    var room = Game.rooms[room_name]
    var creeps = room.find(FIND_MY_CREEPS);
    for (var creep of creeps) {
        if (creep.hits < creep.hitsMax) {
            var structures = room.find(FIND_STRUCTURES);
            var towers = room.memory.tower_list.map((e) => Game.getObjectById(e));
            for (var tower of towers) {
                tower.heal(creep)
            }
            return 0;
        }
    }
    return 1;
}
export function repair_all(room_name: string) {
    var room = Game.rooms[room_name]
    var conf = Memory.rooms_conf[room.name];
    var structures = room.find(FIND_STRUCTURES);
    var roads = _.filter(structures, (e) => e.structureType == 'road')
    var roads_needrepair = _.filter(roads, (e) => e.hitsMax - e.hits >= 1000)
    var containers = _.filter(structures, (e) => e.structureType == 'container')
    var containers_needrepair = _.filter(containers, (e) => e.hitsMax - e.hits >= 150000)
    var towers = room.memory.tower_list.map((e) => Game.getObjectById(e));
    if (towers.length == 0) {
        return;
    }
    var others_needrepair = structures.filter((e) => e.hitsMax - e.hits > 0 && ['lab', 'extension', 'spawn', 'storage', 'link', 'terminal'].includes(e.structureType))
    var structures_needrepair = roads_needrepair.concat(containers_needrepair).concat(others_needrepair);
    var distance_array = structures_needrepair.map((structure) => towers.map((tower) => tower.pos.getRangeTo(structure.pos)));
    var tower_index = distance_array.map((array) => mymath.argmin(array));
    var scheduled = towers.map((e) => false);
    var temp_walls = _.filter(structures, (e) => (e.structureType == "constructedWall" || e.structureType == "rampart"))
    var all_walls = temp_walls.map((e) => < Structure_Wall_Rampart > e);
    var walls = all_walls.filter((e) => e.hits < conf.wall_strength);
    var wall_distance_array = walls.map((structure) => towers.map((tower) => tower.pos.getRangeTo(structure.pos)));
    var wall_tower_index = wall_distance_array.map((array) => mymath.argmin(array));
    for (var i = 0; i < towers.length; ++i) {
        let tower = towers[i];
        if (tower.store['energy'] == 0) {
            continue;
        }
        let index: number[] = mymath.range(tower_index.length).filter((e: number) => tower_index[e] == i);
        let structures_matchtower = index.map((e) => structures_needrepair[e]);
        if (structures_matchtower.length > 0) {
            var hits_structures = structures_matchtower.map((e) => e.hits);
            var index_weakest = mymath.argmin(hits_structures);
            var output = tower.repair(structures_matchtower[index_weakest]);
            scheduled[i] = true;
        }
    }
    for (var i = 0; i < towers.length; ++i) {
        let tower = towers[i];
        if (tower.store.getFreeCapacity('energy') > 500 || scheduled[i]) {
            continue;
        }
        let index: number[] = mymath.range(wall_tower_index.length).filter((e: number) => wall_tower_index[e] == i);
        let structures_matchtower = index.map((e) => walls[e]);
        if (structures_matchtower.length > 0) {
            let hits_structures = structures_matchtower.map((e) => e.hits);
            let index_weakest = mymath.argmin(hits_structures);
            let output = tower.repair(structures_matchtower[index_weakest]);
            scheduled[i] = true;
        }
    }
    for (var i = 0; i < towers.length; ++i) {
        let tower = towers[i];
        if (Game.time % 20 !== i || tower.store.getFreeCapacity('energy') > 600 || scheduled[i]) {
            continue;
        }
    }
	if (room.memory.n_needed_wallrepair > 0) {
		let hits_argmin = mymath.argmin(all_walls.map((e) => e.hits));
		let wall_to_repair = all_walls[hits_argmin];
		let distance_to_the_wall = towers.map((e) => wall_to_repair.pos.getRangeTo(e));
		let distance_argmin = mymath.argmin(distance_to_the_wall);
		if (!scheduled[distance_argmin]) {
			let output = towers[distance_argmin].repair(wall_to_repair);
			if (output == 0) {
				room.memory.n_needed_wallrepair -= 1;
			}
		}
	}
}
