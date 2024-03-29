import * as mymath from "./mymath";
import * as functions from "./functions";
import {
	Timer
} from "./timer"


var shardmemory_initialization: type_intershardmemory = {
	last_modify_time: 0,
	creeps: {},
	all_creeps: {},
	cleared_shards: [],
}
var shardmemory_initialization_keys = <Array<keyof type_intershardmemory>> Object.keys(shardmemory_initialization);

function init_one_shard_memory(shard: string) {
	if (Game.InterShardMemory == undefined) {
		Game.InterShardMemory = {};
	}
	try {
		if (shard == Game.shard.name) {
			Game.InterShardMemory[shard] = <type_intershardmemory> JSON.parse(InterShardMemory.getLocal());
		} else {
			Game.InterShardMemory[shard] = <type_intershardmemory> JSON.parse(InterShardMemory.getRemote(shard));
		}
	} catch (err) {
		Game.InterShardMemory[shard] = {};
	}
	if (Game.InterShardMemory[shard] == undefined) {
		Game.InterShardMemory[shard] = {};
	}
	if (Game.InterShardMemory[shard].last_modify_time == undefined) {
		Game.InterShardMemory[shard].last_modify_time = 0;
		if (shard == Game.shard.name) {
			Game.require_update_intershardmemory = true;
			Game.require_update_intershardmemory_modify_time = true;
		}
	}
	if (Game.InterShardMemory[shard].creeps == undefined) {
		Game.InterShardMemory[shard].creeps = {};
		if (shard == Game.shard.name) {
			Game.require_update_intershardmemory = true;
			Game.require_update_intershardmemory_modify_time = true;
		}
	}
	if (Game.InterShardMemory[shard].all_creeps == undefined) {
		Game.InterShardMemory[shard].all_creeps = {};
		if (shard == Game.shard.name) {
			Game.require_update_intershardmemory = true;
			Game.require_update_intershardmemory_modify_time = true;
		}
	}
	if (Game.InterShardMemory[shard].cleared_shards == undefined) {
		Game.InterShardMemory[shard].cleared_shards = [];
		if (shard == Game.shard.name) {
			Game.require_update_intershardmemory = true;
			Game.require_update_intershardmemory_modify_time = true;
		}
	}
}

export function init_shard_memory() {
	init_one_shard_memory(Game.shard.name);
	for (let shard of global.all_shards) {
		if (shard !== Game.shard.name) {
			init_one_shard_memory(shard)
		}
	}
	let argmax = mymath.argmax(global.all_shards.map((e) => Game.InterShardMemory[e].last_modify_time));
	let last_modifed_shard = global.all_shards[argmax];
	let cleared_shards = Game.InterShardMemory[last_modifed_shard].cleared_shards;
	for (let shard of cleared_shards) {
		Game.InterShardMemory[shard] = {
			last_modify_time: 0,
			creeps: {},
			all_creeps: {},
			cleared_shards: cleared_shards,
		};
		if (shard == Game.shard.name) {
			Game.require_update_intershardmemory = true;
			Game.require_update_intershardmemory_modify_time = true;
		}
	}
}

export function find_registered_shard_of_creep(creepname: string) {
	let shards = [];
	for (let shard of global.all_shards) {
		if (Game.InterShardMemory[shard].creeps[creepname] !== undefined) {
			shards.push(shard)
		}
	}
	return shards;
}

global.set_shardmemory = function(keys: string[], value: any) {
	let memory = <type_intershardmemory> JSON.parse(InterShardMemory.getLocal());
	let variable = <any> memory;
	for (let key of keys.slice(0, -1)) {
		variable = variable[key];
	}
	variable[keys.slice(-1)[0]] = value;
	memory.last_modify_time = (new Date()).getTime();
	InterShardMemory.setLocal(JSON.stringify(memory));
	return 0;
}

global.clear_shardmemory = function(shards: string[]) {
	global.set_shardmemory(['cleared_shards'], shards);
	return 0;
}

export function sync_shard_memory() {
	let timer = new Timer("sync_shard_memory", true);
	// init
	init_shard_memory();
	// sync
	let argmax = mymath.argmax(global.all_shards.map((e) => Game.InterShardMemory[e].last_modify_time));
	let last_modifed_shard = global.all_shards[argmax];
	let this_shardmemory = Game.InterShardMemory[Game.shard.name];
	let last_shardmemory = Game.InterShardMemory[last_modifed_shard];
	if (this_shardmemory.last_modify_time < last_shardmemory.last_modify_time) {
		this_shardmemory.all_creeps = _.clone(last_shardmemory.all_creeps);
		this_shardmemory.last_modify_time = _.clone(last_shardmemory.last_modify_time);
		this_shardmemory.cleared_shards = _.clone(last_shardmemory.cleared_shards);
		Game.require_update_intershardmemory = true;
	}
	if (!global.is_main_server) {
		return;
	}
	/*
	for (let shardname of global.all_shards) {
		console.log(shardname, JSON.stringify(Game.InterShardMemory[shardname]));
	}
	*/
	// transfer creeps
	let this_creeps = Game.InterShardMemory[Game.shard.name].creeps;
	let all_creeps = Game.InterShardMemory[Game.shard.name].all_creeps;
	let creeps_to_remove: string[] = [];
	for (let creepname in this_creeps) {
		if (all_creeps[creepname] == undefined) {
			delete this_creeps[creepname];
			console.log("unexpected delete");
			Game.require_update_intershardmemory = true;
		}
	}
	for (let creepname in all_creeps) {
		let registered_shards = find_registered_shard_of_creep(creepname);
		if (registered_shards.length == 0) {
			creeps_to_remove.push(creepname);
			continue;
		}
		// creep exists
		if (this_creeps[creepname] !== undefined && Game.creeps[creepname] !== undefined) {
			let cache_time_ok = (Game.time % 5 !== 0) || (this_creeps[creepname].last_present_time > Game.time - 10);
			let cache_shard_ok = this_creeps[creepname].last_present_shard == Game.shard.name;
			if (!cache_time_ok || !cache_shard_ok) {
				this_creeps[creepname].last_present_time = Game.time;
				this_creeps[creepname].last_present_shard = Game.shard.name;
				Game.require_update_intershardmemory = true;
				Game.require_update_intershardmemory_modify_time = true;
			}
		// creep leaves
		} else if (this_creeps[creepname] !== undefined && Game.creeps[creepname] == undefined) {
			// already found in other shards
			if (registered_shards.length > 1) {
				delete this_creeps[creepname];
				console.log("delete because found in other shards");
				Game.require_update_intershardmemory = true;
				Game.require_update_intershardmemory_modify_time = true;
			// not found in other shards
			} else {
				if (this_creeps[creepname].last_present_time < Game.time - 50) {
					delete this_creeps[creepname];
					creeps_to_remove.push(creepname);
					Game.require_update_intershardmemory = true;
					Game.require_update_intershardmemory_modify_time = true;
				}
			}
		}
		// creep comes
		else if (this_creeps[creepname] == undefined && Game.creeps[creepname] !== undefined) {
			let registered_shard = find_registered_shard_of_creep(creepname)[0];
			console.log('registered_shard', registered_shard);
			if (registered_shard !== undefined) {
				this_creeps[creepname] = _.clone(Game.InterShardMemory[registered_shard].creeps[creepname]);
				this_creeps[creepname].last_present_time = Game.time;
				this_creeps[creepname].last_present_shard = Game.shard.name;
				Game.require_update_intershardmemory = true;
				Game.require_update_intershardmemory_modify_time = true;
			}
		}
	}
	if (creeps_to_remove.length > 0) {
		for (let creepname of creeps_to_remove) {
			delete Game.InterShardMemory[Game.shard.name].all_creeps[creepname];
		}
		Game.require_update_intershardmemory = true;
		Game.require_update_intershardmemory_modify_time = true;
	}
	// update Memory
	all_creeps = Game.InterShardMemory[Game.shard.name].all_creeps;
	for (let creepname in all_creeps) {
		// creep comes, copy shard memory to memory
		let creep = Game.creeps[creepname];
		if (creep !== undefined) {
			let creep_shardmemory = Game.InterShardMemory[Game.shard.name].creeps[creepname];
			if (creep_shardmemory !== undefined && creep.memory.role == undefined) {
				creep.memory = _.clone(creep_shardmemory);
			}
		// creep leaves, delete memory
		} else {
			if (Memory.creeps[creepname] !== undefined) {
				delete Memory.creeps[creepname];
			}
		}
	}

	if (Game.InterShardMemory[Game.shard.name].tick_info == undefined) {
		Game.InterShardMemory[Game.shard.name].tick_info = {};
	}
	if (Game.time % 200 == 0) {
		let this_tick = Game.InterShardMemory[Game.shard.name].tick_info;
		let current_time = (new Date()).getTime() / 1000;
		if (this_tick.last_update_time !== undefined && this_tick.last_update_tick !== undefined) {
			this_tick.tick_rate = (current_time - this_tick.last_update_time) / (Game.time - this_tick.last_update_tick);
		}
		this_tick.last_update_time = current_time;
		this_tick.last_update_tick = Game.time;
		Game.require_update_intershardmemory = true;
	}
	timer.end()
}

export function sync_shard_room_info(room_names: string[]) {
	if (Game.InterShardMemory[Game.shard.name].room_info == undefined) {
		Game.InterShardMemory[Game.shard.name].room_info = {};
	}
	if (Game.time % 20 == 0) {
		let room_info = Game.InterShardMemory[Game.shard.name].room_info;
		for (let room_name of room_names) {
			let room = Game.rooms[room_name];
			if (room == undefined) {
				continue;
			}
			room_info[room_name] = {
				my: room.controller.my,
				rcl: room.controller.level,
				container: Object.keys(room.container),
				link: Object.keys(room.container),
				spawn: Object.keys(room.spawn),
				energyCapacity: room.energyCapacityAvailable,
				storage: room.storage !== undefined,
				terminal: room.terminal !== undefined,
				independent: Game.independent_rooms.includes(room_name),
			}
		}
		Game.require_update_intershardmemory = true;
	}
}

export function update_shard_memory() {
	let timer = new Timer("update_shard_memory", true);
	if (!global.is_main_server) {
		return;
	}
	if (Game.require_update_intershardmemory) {
		let shardmemory = Game.InterShardMemory[Game.shard.name];
		if (Game.require_update_intershardmemory_modify_time) {
			shardmemory.last_modify_time = (new Date()).getTime();
		}
		shardmemory.cleared_shards = shardmemory.cleared_shards.filter((e) => e !== Game.shard.name);
		InterShardMemory.setLocal(JSON.stringify(shardmemory));
		console.log('update inter shard memory');
	}
	timer.end();
}

export function delete_creep_from_shardmemory(name: string) {
	if (!global.is_main_server) {
		return;
	}
	let all_creeps = Game.InterShardMemory[Game.shard.name].all_creeps
	if (all_creeps[name] !== undefined) {
		delete all_creeps[name];
		Game.require_update_intershardmemory = true;
		Game.require_update_intershardmemory = true;
	}
}
