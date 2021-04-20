import * as _ from "lodash"
import * as config from "./config"
import * as mymath from "./mymath"
function compress(pos: number[]): number {
	return pos[0]*50 + pos[1];
}
function decompress(n: number): number[] {
	return  [Math.floor(n / 50), n % 50];
}
var orient_names: {[key in DirectionConstant] ?: string} = {
	[RIGHT]: 'right',
	[LEFT]: 'left',
	[TOP]: 'top',
	[BOTTOM]: 'bottom',
}
interface type_moving_request {
	positive: number[];
	negative: number[];
}
function generate_moving_request(queue: number[], unique_pos: number, priority_list: number[]): type_moving_request {
        let result: type_moving_request = {
                        "positive": [],
                        "negative": [],
        }
        let index_list = [];
        let pos_list = []
        let n = 0;
        for (let i = queue.length - 1; i >= 0; i--) {
                if (queue[i] !== undefined) {
                        index_list.push(queue[i]);
                        pos_list.push(i);
                        n += 1;
                }
        }
        if (n == 1 && unique_pos !== undefined) {
                priority_list = [unique_pos];
        }
        if (priority_list.length > n) {
                priority_list = priority_list.slice(0, n);
        }
        for (let i = 0; i < n; i++) {
                if(pos_list[i] > priority_list[i]) {
                        result.negative.push(index_list[i]);
                } else if (pos_list[i] < priority_list[i]) {
                        result.positive.push(index_list[i]);
                }
        }
        return result;
}
export function run() {
	let conf = config.conf_gcl.conf;
	let conf_map = config.conf_gcl.conf_map;
	let room = Game.rooms[conf_map.gcl_room];
	if (room == undefined) {
		return 0;
	}
	if (room.controller.level == 8) {
		if (room.storage.store.getUsedCapacity("energy") >= 8.0e5 && room.terminal.store.getUsedCapacity("energy") >= 2.4e5) {
			room.controller.unclaim();
			return 0;
		}
	}
	let ready_upgraders = room.find(FIND_MY_CREEPS).filter((e) => e.memory.role == 'gcl_upgrader' && e.memory.ready)
	let upgrader_poses = ready_upgraders.map((e) => [e.pos.x, e.pos.y]);
	let occs: {[key: number]: number} = {};
	mymath.range(upgrader_poses.length).forEach((i) => occs[compress(upgrader_poses[i])] = i);
	let occ_queue1 = conf.queue1_poses.map((e) => occs[compress(e)]);
	let occ_queue2 = conf.queue2_poses.map((e) => occs[compress(e)]);
	let container_pos = mymath.array_ele_minus(conf.storage.pos, conf.direction);
	let occ_container = occs[compress(container_pos)];
	if (occ_container !== undefined) {
		let n_occ_queue1 = occ_queue1.filter((e) => e !== undefined).length;
		let n_occ_queue2 = occ_queue2.filter((e) => e !== undefined).length;
		if (n_occ_queue1 <= n_occ_queue2) {
			//ready_upgraders[occ_container].say(orient_names[conf.queue1_orient]);
			ready_upgraders[occ_container].move(conf.queue1_orient);
		} else {
			//ready_upgraders[occ_container].say(orient_names[conf.queue2_orient]);
			ready_upgraders[occ_container].move(conf.queue2_orient);
		}
	}

	let store: AnyStoreStructure;
	let do_transfer = false;
	let unique_pos: number;
	let priority_list: number[];
	if (room.terminal !== undefined && room.terminal.store.getUsedCapacity("energy") >= 5000) {
		store = room.terminal;
		if (room.storage.store.getUsedCapacity("energy") < 8.0e5 && room.terminal.store.getUsedCapacity("energy") >= 1.5e5) {
			do_transfer = true;
		}
		unique_pos = 2;
		priority_list = [3, 2, 1];
	} else if (room.storage !== undefined && room.storage.store.getUsedCapacity("energy") >= 5000) {
		store = room.storage;
		unique_pos = undefined;
		priority_list = [2, 1, 0];
	} else {
		let container_status = room.memory.named_structures_status.container.CT;
		if (container_status.finished) {
			store = Game.getObjectById(container_status.id);
		}
		unique_pos = undefined;
		priority_list = [1, 0];
	}
	for (let queue of [occ_queue1, occ_queue2]) {
		let moving_request = generate_moving_request(queue, unique_pos, priority_list);
		for (let index of moving_request.positive) {
			ready_upgraders[index].move(conf.positive_orient);
		}
		for (let index of moving_request.negative) {
			ready_upgraders[index].move(conf.negative_orient);
		}
	}

	for (let upgrader of ready_upgraders) {
		if (upgrader.store.getUsedCapacity("energy") < upgrader.getActiveBodyparts(WORK) * 2) {
			upgrader.withdraw(store, "energy");
		}
	}
	if (do_transfer) {
		for (let upgrader of ready_upgraders) {
			if (upgrader.pos.isNearTo(room.storage) && upgrader.store.getUsedCapacity("energy") > upgrader.getActiveBodyparts(WORK) * 2) {
				upgrader.transfer(room.storage, "energy", upgrader.store.getUsedCapacity("energy") - upgrader.getActiveBodyparts(WORK) * 2);
			}
		}
	}
	let xmin = Math.min(conf.storage.pos[0]-1, conf.terminal.pos[0]-1);
	let xmax = Math.min(conf.storage.pos[0]+1, conf.terminal.pos[0]+1);
	let ymin = Math.min(conf.storage.pos[1]-1, conf.terminal.pos[1]-1);
	let ymax = Math.min(conf.storage.pos[1]+1, conf.terminal.pos[1]+1);
	let site = room.lookForAtArea("constructionSite", ymin, xmin, ymax, xmax, true)[0];
	if (site !== undefined) {
		ready_upgraders.forEach((e) => e.build(site.constructionSite));
		ready_upgraders.forEach((e) => e.say("GUb"));
	} else if (store.structureType == 'container' && store.hits < store.hitsMax * 0.8) {
		ready_upgraders.forEach((e) => e.repair(store));
		ready_upgraders.forEach((e) => e.say("GUr"));
	} else {
		if (room.controller.level !== 8) {
			ready_upgraders.forEach((e) => e.upgradeController(room.controller));
			ready_upgraders.forEach((e) => e.say("GUu"));
		}
	}
}
