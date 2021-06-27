import * as mymath from "./mymath"
import * as functions from "./functions"
import * as config from "./config"
function is_pos_accessable(pos: RoomPosition): boolean {
    let room = Game.rooms[pos.roomName];
    let xmin = Math.min(25, pos.x);
    let xmax = Math.max(25, pos.x);
    let ymin = Math.min(25, pos.y);
    let ymax = Math.max(25, pos.y);
    let n_walls = room.lookForAtArea("structure", ymin, xmin, ymax, xmax, true).filter((e) => e.structure.structureType == 'constructedWall').length;
    return n_walls == 0;
}
global.is_pos_accessable = is_pos_accessable;

var detection_period = 500;

export function detect_resources(room_name: string) {
    if (Memory.pb_cooldown_time == undefined) {
        Memory.pb_cooldown_time = 0;
    }
    if (Memory.pb_cooldown_time > 0) {
        Memory.pb_cooldown_time -= 1;
        return;
    }
    let cpu_used = Game.cpu.getUsed();

    let room = Game.rooms[room_name];
    if (room.controller.level < 8) {
        return;
    }
    let game_memory = Game.memory[room_name];
    let external_rooms = config.highway_resources[room_name];
    if (external_rooms == undefined || !global.memory[room_name].unique_structures_status.observer.finished) {
        return;
    }
    if (room.memory.external_resources == undefined) {
        room.memory.external_resources = {
            "pb": {},
            "depo": {},
        };
    }
    if (room.memory.external_resources.pb == undefined) {
        room.memory.external_resources.pb = {};
    }
    if (room.memory.external_resources.depo == undefined) {
        room.memory.external_resources.depo = {};
    }
    for (let i = 0; i < external_rooms.length; i++) {
        if (Game.time % detection_period == i) {
            let observer_status = global.memory[room_name].unique_structures_status.observer
            let observer = Game.getObjectById(observer_status.id);
            if (observer == undefined) {
                continue;
            }
            let external_room_name = external_rooms[i];
            observer.observeRoom(external_room_name);
        }
    }
    for (let i = 0; i < external_rooms.length; i++) {
        if (Game.time % detection_period == i + 1) {
            let external_room_name = external_rooms[i];
            let external_room = Game.rooms[external_room_name];
            if (external_room == undefined) {
                console.log(`Warning: Fail to observe room ${external_room_name} from ${room_name} at time ${Game.time}`);
                continue;
            }
            let pb = < StructurePowerBank > external_room.find(FIND_STRUCTURES).filter((e) => e.structureType == "powerBank")[0];
            if (pb !== undefined && pb.power >= 1000 && pb.ticksToDecay >= 2000) {
                if (room.memory.external_resources.pb[external_room_name] == undefined) {
                    let accessable = is_pos_accessable(pb.pos);
                    if (!accessable) {
                        continue;
                    }
                    let ok_attacker = functions.is_boost_resource_enough(room_name, config.pb_attacker_body);
                    let ok_healer = functions.is_boost_resource_enough(room_name, config.pb_healer_body);
                    let ok = ok_attacker && ok_healer;
                    if (!ok) {
                        console.log(`Warning: Boost resource not enough when detecting pb at room ${external_room_name} from room ${room_name} at time ${Game.time}`)
                        continue;
                    }
                    let name = "pb_" + external_room_name + '_' + Game.time.toString();
                    let pb_attacker_name = "pb_attacker" + external_room_name + '_' + Game.time.toString()
                    let pb_healer_name = "pb_healer" + external_room_name + '_' + Game.time.toString()
                    let pb_carrier_names: string[] = [];
                    let pb_carrier_sizes: number[] = [];
                    let path = PathFinder.search(Game.getObjectById(global.memory[room_name].spawn_list[0]).pos, {
                        "pos": pb.pos,
                        "range": 1
                    }, {
                        maxOps: 6000,
                        roomCallback: functions.restrict_passing_rooms,
                    })
                    if (path.incomplete) {
                        console.log(`Warning: Cannot find path when detecting pb at room ${external_room_name} from room ${room_name} at time ${Game.time}`)
                        continue;
                    }
                    if (path.path.length > 320) {
                        continue;
                    }
                    let exits_path = functions.get_exits_from_path(path.path);
                    let n_moves = Math.ceil(pb.power / 100);
                    while (true) {
                        if (n_moves > 16) {
                            n_moves -= 16;
                            pb_carrier_sizes.push(16);
                        } else {
                            pb_carrier_sizes.push(n_moves);
                            break;
                        }
                    }
                    for (let i = 0; i < pb_carrier_sizes.length; i++) {
                        let pb_carrier_name = "pb_carrier" + external_room_name + '_' + Game.time.toString() + i.toString();
                        pb_carrier_names.push(pb_carrier_name);
                    }
                    room.memory.external_resources.pb[external_room_name] = {
                        "name": name,
                        "xy": [pb.pos.x, pb.pos.y],
                        "id": pb.id,
                        "status": 0,
                        "time_last": 0,
                        "rooms_path": exits_path.rooms_path,
                        "poses_path": exits_path.poses_path,
                        "distance": path.cost,
                        "amount": pb.power,
                        "amount_received": 0,
                        "pb_attacker_name": pb_attacker_name,
                        "pb_healer_name": pb_healer_name,
                        "pb_carrier_names": pb_carrier_names,
                        "pb_carrier_sizes": pb_carrier_sizes,
                        "n_pb_carrier_finished": 0,
                    }
                    Memory.pb_cooldown_time = 500;
                }
            }
            /*
            let depo = < Deposit > external_room.find(FIND_DEPOSITS)[0];
            if (depo !== undefined && depo.lastCooldown <= config.depo_last_cooldown && depo.ticksToDecay > 2000) {
                let path = PathFinder.search(room.terminal.pos, {
                    "pos": depo.pos,
                    "range": 1
                }, {
                    maxOps: 6000,
                    roomCallback: functions.restrict_passing_rooms,
                })
                if (path.incomplete) {
                    continue;
                }
                let name = "depo_" + Game.time.toString();
                let rooms_path: string[] = [room_name];
                let poses_path: number[] = [];
                for (let pos of path.path) {
                    if (pos.roomName != rooms_path[rooms_path.length - 1]) {
                        rooms_path.push(pos.roomName);
                        if (pos.x == 0 || pos.x == 49) {
                            poses_path.push(pos.y);
                        }
                        if (pos.y == 0 || pos.y == 49) {
                            poses_path.push(pos.x);
                        }
                    }
                }
                room.memory.external_resources.depo[external_room_name] = {
                    "name": name,
                    "xy": [depo.pos.x, depo.pos.y],
                    "id": depo.id,
                    "status": 0,
                    "time_last": 0,
                    "rooms_path": rooms_path,
                    "poses_path": poses_path,
                    "distance": path.cost,
                    "last_cooldown": depo.lastCooldown,
                    "container_progress": 0,
                }
            }
			*/
        }
    }
}

export function update_resources(room_name: string) {
    let room = Game.rooms[room_name];
    if (room.controller.level < 8) {
        return;
    }
    if (room.memory.external_resources == undefined) {
        room.memory.external_resources = {
            "pb": {},
            "depo": {},
        };
    }
    if (room.memory.external_resources.pb == undefined) {
        room.memory.external_resources.pb = {};
    }
    if (room.memory.external_resources.depo == undefined) {
        room.memory.external_resources.depo = {};
    }
    for (let external_room_name in room.memory.external_resources.pb) {
        let pb_status = room.memory.external_resources.pb[external_room_name]
        if (pb_status.status == 0) {
            // pb detected
            let pb_attacker_body = global.get_body(functions.conf_body_to_body_components(config.pb_attacker_body));
            let pb_healer_body = global.get_body(functions.conf_body_to_body_components(config.pb_healer_body));
            let pb_attacker_memory = {
                "home_room_name": room_name,
                "role": "pb_attacker",
                "external_room_name": external_room_name,
            }
            let pb_healer_memory = {
                "home_room_name": room_name,
                "role": "pb_healer",
                "external_room_name": external_room_name,
            }
            global.spawn_in_queue(room_name, pb_attacker_body, pb_status.pb_attacker_name, pb_attacker_memory, false);
            global.spawn_in_queue(room_name, pb_healer_body, pb_status.pb_healer_name, pb_healer_memory, false);
            pb_status.status = 1;
        } else if (pb_status.status == 1) {
            // attacker and healer spawned
            pb_status.time_last += 1;
            if (pb_status.time_last >= 800) {
                let pb_carrier_memory = {
                    "home_room_name": room_name,
                    "role": "pb_carrier",
                    "external_room_name": external_room_name,
                };
                for (let i = 0; i < pb_status.pb_carrier_sizes.length; i++) {
                    let pb_carrier_body: BodyPartConstant[] = [];
                    let pb_carrier_size = pb_status.pb_carrier_sizes[i];
                    let pb_carrier_name = pb_status.pb_carrier_names[i];
                    mymath.range(pb_carrier_size * 2).forEach((e) => pb_carrier_body.push(CARRY));
                    mymath.range(pb_carrier_size).forEach((e) => pb_carrier_body.push(MOVE));
                    global.spawn_in_queue(room_name, pb_carrier_body, pb_carrier_name, pb_carrier_memory, false);
                    pb_status.status = 2;
                    pb_status.time_last = 0;
                }
            }
        } else if (pb_status.status == 2) {
            // carrier spawned
            pb_status.time_last += 1;
            if (pb_status.time_last >= 2000 || pb_status.n_pb_carrier_finished == pb_status.pb_carrier_names.length) {
                if (Memory.pb_log == undefined) {
                    Memory.pb_log = [];
                }
                let pb_item: type_pb_log = {
                    name: pb_status.name,
                    home_room_name: room_name,
                    external_room_name: external_room_name,
                    amount: pb_status.amount,
                    amount_received: pb_status.amount_received,
                };
                Memory.pb_log.push(pb_item);
                if (Memory.pb_log.length > 10) {
                    Memory.pb_log = Memory.pb_log.slice(0, 10);
                }
                if (pb_status.amount - pb_status.amount_received >= 100) {
                    console.log(`Warning: unexpected pb mining ${pb_status.name}`);
                }
                delete room.memory.external_resources.pb[external_room_name];
            }
        }
    }
    /*
    for (let external_room_name in room.memory.external_resources.depo) {
        let depo_status = room.memory.external_resources.depo[external_room_name];
        if (depo_status.status == 0) {
            let do_spawn_builder = false;
            if (depo_status.depo_container_builder_name == undefined) {
                do_spawn_builder = true;
            } else {
                let depo_container_builder = Game.creeps[depo_status.depo_container_builder_name];
                if (depo_container_builder == undefined) {
                    do_spawn_builder = true;
                } else if (depo_container_builder.ticksToLive !== undefined && depo_container_builder.ticksToLive < depo_status.distance + 36) {
                    do_spawn_builder = true;
                }
            }
            if (do_spawn_builder) {
                let depo_container_builder_name = "depo_container_builder_" + Game.time.toString();
                let body: BodyPartConstant[] = [];
                mymath.range(5).forEach((e) => body.push(WORK));
                mymath.range(2).forEach((e) => body.push(CARRY));
                mymath.range(5).forEach((e) => body.push(MOVE));
                let depo_container_builder_memory = {
                    "home_room_name": room_name,
                    "role": "depo_container_builder",
                    "external_room_name": external_room_name,
                }
                global.spawn_in_queue(room_name, body, depo_container_builder_name, depo_container_builder_memory, false);
				depo_status.depo_container_builder_name = depo_container_builder_name;
            }
            let do_spawn_energy_carrier = false;
            if (depo_status.depo_energy_carrier_name == undefined) {
                do_spawn_energy_carrier = true;
            } else {
				let depo_energy_carrier = Game.creeps[depo_status.depo_energy_carrier_name];
                if (depo_energy_carrier == undefined || Game.creeps[depo_status.depo_energy_carrier_name] == undefined) {
                    do_spawn_energy_carrier = true;
                }
            }
			let depo_commuting_times = Math.floor((Math.floor(1450 / depo_status.distance) + 1) / 2);
        } else if (depo_status.status == 1) {}
    }
	*/
}

