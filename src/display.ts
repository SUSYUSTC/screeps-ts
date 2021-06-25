//screeps
import * as mymath from "./mymath"
import * as config from "./config"
import * as functions from "./functions"

function arrange_string(str: string, length: number): string {
    return ' '.repeat(Math.max(length - str.length, 0)) + str;
}

function obj2string(obj: any, json: boolean): string {
	if (obj == undefined) {
		return 'undefined';
	} else if (typeof obj == 'object') {
		if (json) {
			return JSON.stringify(obj)
		} else {
			return obj.toString()
		}
	} else if (typeof obj == 'string') {
        return obj;
    } else if (typeof obj == 'number' && !Number.isInteger(obj)) {
        return obj.toFixed(3);
    } else {
        return obj.toString();
    }
}


function vertical_split_string(str1: string, str2: string): string {
	let part1 = str1.split('\n').slice(1)
	let part2 = str2.split('\n').slice(1)
	let n1 = part1.length
	let n2 = part2.length
	let nmax = Math.max(n1, n2)
	let lens = part1.map((e) => e.length)
	let maxlen = Math.max(mymath.max(lens) + 2, 40);
	let result = ''
	for (let i of mymath.range(nmax)) {
		if (part1[i] == undefined) {
			part1[i] = ''
		}
		if (part2[i] == undefined) {
			part2[i] = ''
		}
		result += '\n'
		result += part1[i] + ' '.repeat(maxlen - part1[i].length) + part2[i]
	}
	return result;
}

export function init() {
	global.visualize_cost = function(room_name: string, x_center: number, y_center: number, range: number): number {
		let cost = functions.get_costmatrix_road(room_name);
		for (let x = x_center - range; x <= x_center + range; x++) {
			for (let y = y_center - range; y <= y_center + range; y++) {
				Game.rooms[room_name].visual.text(cost.get(x, y).toString(), x, y);
			}
		}
		return 0;
	}

	global.format_objs = function(objs: any[], json: boolean): string {
		let str = '\n'	
		if (objs.length == 0) {
			return str;
		}
		let keys = Object.keys(objs[0]);
		let lengths: {[key: string]: number} = {};
		for (let key of keys) {
			lengths[key] = mymath.max(objs.map((e) => obj2string(e[key], json).length))
			lengths[key] = Math.max(lengths[key], key.length) + 2;
		}
		for (let key of keys) {
			str += arrange_string(key, lengths[key]);
		}
		for (let obj of objs) {
			str += '\n'
			for (let key of keys) {
				str += arrange_string(obj2string(obj[key], json), lengths[key])
			}
		}
		return str;
	}

	global.format_json = function(obj: any, options: type_format_options = {}): string {
		let arr: any[] = [];
		let keys = Object.keys(obj);
		if (options.sort) {
			keys = keys.sort(functions.sort_str);
		}
		for (let key of keys) {
			let item: any = {...{keyname: key}, ...{value: obj[key]}};
			arr.push(item);
		}
		return global.format_objs(arr, options.json);
	}

	global.format_json2 = function(obj: any, options: type_format_options = {}): string {
		let arr: any[] = [];
		let keys = Object.keys(obj);
		if (options.sort) {
			keys = keys.sort(functions.sort_str);
		}
		for (let key of keys) {
			let item: any = {...{keyname: key}, ...(_.clone(obj[key]))};
			arr.push(item);
		}
		return global.format_objs(arr, options.json);
	}

	global.init_stat = function(): number {
		global.reset_market_stat();
		Memory.reaction_log = {};
		Memory.stat_reset_time = Game.time;
		Memory.stat_reset_realtime = (new Date()).getTime() / 1000;
		Memory.tot_transaction_cost = 0;
		Memory.power_processed_stat = 0;
		Memory.op_power_processed_stat = 0;
		Memory.produce_battery_stat = 0;
		return 0;
	}

	global.display_stat = function(): string {
		let amounts: {
			[key: string]: {
				terminal: number;
				storage: number;
				energy: number;
				battery: number;
				power: number;
			}
		} = {};
		for (let room_name of config.controlled_rooms) {
			amounts[room_name] = {
				terminal: Game.rooms[room_name].terminal.store.getUsedCapacity(),
				storage: Game.rooms[room_name].storage.store.getUsedCapacity(),
				energy: Game.rooms[room_name].storage.store.getUsedCapacity("energy") + Game.rooms[room_name].terminal.store.getUsedCapacity("energy"), 
				battery: Game.rooms[room_name].storage.store.getUsedCapacity("battery") + Game.rooms[room_name].terminal.store.getUsedCapacity("battery"),
				power: Game.rooms[room_name].terminal.store.getUsedCapacity("power"),
			}
		}
		let ongoing_pb: {
			[key: string]: {
				home_room_name: string;
				external_room_name: string;
				amount: number;
				status: number;
				time_last: number;
			}
		} = {};
		for (let home_room_name of config.controlled_rooms) {
			let external_resources = Game.rooms[home_room_name].memory.external_resources;
			if (external_resources == undefined || external_resources.pb == undefined) {
				continue;
			}
			for (let external_room_name in external_resources.pb) {
				let pb = external_resources.pb[external_room_name];
				ongoing_pb[pb.name] = {
					home_room_name: home_room_name,
					external_room_name: external_room_name,
					amount: pb.amount,
					status: pb.status,
					time_last: pb.time_last,
				}
			}
		}
		let str1:string = '';
		let str2:string = '';
		let str3:string = '';
		let realtime = (new Date()).getTime() / 1000;
		let realtimediff = realtime - Memory.stat_reset_realtime;
		let timediff = Game.time - Memory.stat_reset_time;
		str1 += '\nstore: ' + global.format_json(global.terminal_store, {sort: true, json: true});
		str2 += `\nstat from ${Memory.stat_reset_time} to ${Game.time}, ${timediff} in total, `
		str2 += `\nrealtime ${Math.floor(realtimediff)} seconds, ${(realtimediff/3600).toFixed(2)} hours, tickrate ${(realtimediff/timediff).toFixed(2)}s \n`;
		str2 += '\nselling stat' + global.format_json2(Memory.market_accumulation_stat.sell, {sort: true, json: true});
		str2 += '\nbuying stat' + global.format_json2(Memory.market_accumulation_stat.buy, {sort: true, json: true});
		str2 += '\nreaction stat' + global.format_json(Memory.reaction_log, {sort: true, json: true});
		str2 += '\ntransaction cost: ' + Memory.tot_transaction_cost.toString();
		str2 += '\nbattery processed: ' + Memory.produce_battery_stat.toString();
		str3 += '\nroom store amount: ' + global.format_json2(amounts, {sort: false, json: true});
		str3 += '\ntotal energy: ' + Memory.total_energies.toString();
		str3 += '\npb stat' + global.format_objs(Memory.pb_log, true);
		str3 += '\nongoing pb' + global.format_json2(ongoing_pb, {sort: false, json: true});
		//str2 += '\npower processed: ' + Memory.power_processed_stat.toString();
		//str2 += '\nop power processed: ' + Memory.op_power_processed_stat.toString();
		return vertical_split_string(vertical_split_string(str1, str2), str3);
	}
}
