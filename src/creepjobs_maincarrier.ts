import * as _ from "lodash"
import * as role_init from "./role_init";
import * as mymath from "./mymath";
import * as basic_job from "./basic_job";
import * as defense from "./defense";
import * as hunting from "./hunting"
import * as functions from "./functions"
import * as external_room from "./external_room";
import * as config from "./config";
var moveoptions = {
    reusePath: 5,
    //visualizePathStyle: {},
    maxRooms: 0,
    costCallback: functions.avoid_exits,
};

function move_to_working_pos(creep: Creep, conf_maincarrier: conf_maincarrier) {
    // 0: moving, 1: arrived
    let main_pos = creep.room.getPositionAt(conf_maincarrier.main_pos[0], conf_maincarrier.main_pos[1]);
    let arrived = false;
    let occupied = false;
    for (let pos of conf_maincarrier.working_zone) {
        if (creep.pos.isEqualTo(pos[0], pos[1])) {
            arrived = true;
            break;
        }
        if (creep.room.lookForAt("creep", pos[0], pos[1]).length > 0) {
            occupied = true;
            break;
        }
    }
    if (!arrived) {
        if (occupied) {
            let waiting_pos = creep.room.getPositionAt(conf_maincarrier.waiting_pos[0], conf_maincarrier.waiting_pos[1]);
            if (creep.pos.isEqualTo(waiting_pos)) {
                creep.memory.movable = false;
                creep.memory.crossable = true;
                return 0;
            } else {
                basic_job.movetopos(creep, waiting_pos, 0);
                creep.memory.movable = true;
                creep.memory.crossable = true;
            }
        } else {
            let costmatrix = functions.get_costmatrix_road(creep.room.name).clone()
            for (let xy of conf_maincarrier.working_zone) {
                costmatrix.set(xy[0], xy[1], 1);
            }
            basic_job.movetopos(creep, main_pos, 0, costmatrix);
            creep.memory.movable = true;
            creep.memory.crossable = true;
        }
        return 0;
    }
    return 1;
}

function movetopos_restricted(creep: Creep, pos: RoomPosition, range: number): number {
    let output = 1;
    let costmatrix = functions.get_costmatrix_road(creep.room.name).clone()
    let conf_maincarrier = config.conf_rooms[creep.room.name].maincarrier;
    for (let xy of conf_maincarrier.working_zone) {
        costmatrix.set(xy[0], xy[1], 1);
    }
    for (let xy of conf_maincarrier.working_zone) {
        if (pos.getRangeTo(xy[0], xy[1]) <= range) {
            basic_job.movetopos(creep, creep.room.getPositionAt(xy[0], xy[1]), 0, costmatrix);
            return 0;
        }
    }
    return output;
}

function transfer(creep: Creep, structure: AnyStoreStructure, resource_type: ResourceConstant) {
    if (creep.transfer(structure, resource_type) == ERR_NOT_IN_RANGE) {
        movetopos_restricted(creep, structure.pos, 1);
    }
}

function withdraw(creep: Creep, structure: AnyStoreStructure, resource_type: ResourceConstant) {
    if (creep.withdraw(structure, resource_type) == ERR_NOT_IN_RANGE) {
        movetopos_restricted(creep, structure.pos, 1);
    }
}

function boost_serve(creep: Creep, conf_maincarrier: conf_maincarrier) {
    let request = creep.room.memory.current_boost_request;
    let labs_status = creep.room.memory.named_structures_status.lab;
    let lab_id = labs_status.B1.id;
    let lab = Game.getObjectById(lab_id);
    if (lab.store.getUsedCapacity("energy") < request.amount * 20) {
        // energy is not enough
        if (creep.memory.resource_type == undefined) {
            withdraw(creep, creep.room.terminal, "energy");
        } else if (creep.memory.resource_type == "energy") {
            transfer(creep, lab, "energy");
        } else {
            transfer(creep, creep.room.terminal, creep.memory.resource_type);
        }
    } else if (lab.mineralType !== undefined && lab.mineralType !== request.compound) {
        // mineral in lab does not match request
        if (creep.store.getUsedCapacity() !== 0) {
            transfer(creep, creep.room.terminal, creep.memory.resource_type);
        } else {
            withdraw(creep, lab, lab.mineralType);
        }
    } else if (lab.mineralType == undefined || lab.mineralAmount < request.amount * 30) {
        // mineral is not enough
        if (creep.memory.resource_type == undefined) {
            withdraw(creep, creep.room.terminal, request.compound);
        } else if (creep.memory.resource_type == request.compound) {
            transfer(creep, lab, request.compound);
        } else {
            transfer(creep, creep.room.terminal, creep.memory.resource_type);
        }
    }
}

function react_serve(creep: Creep, conf_maincarrier: conf_maincarrier): number {
    let request = creep.room.memory.reaction_request;
    let labs_status = creep.room.memory.named_structures_status.lab;
    if (_.filter(labs_status, (e) => e.finished).length == 10) {
        let source1_id = labs_status.S1.id;
        let source2_id = labs_status.S2.id;
        let react_ids = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'].map((e) => labs_status[e].id);
        let source1_lab = Game.getObjectById(source1_id);
        let source2_lab = Game.getObjectById(source2_id);
        let react_labs = react_ids.map((e) => Game.getObjectById(e));
        if (creep.room.memory.reaction_ready) {
            if (source1_lab.mineralType == undefined && source2_lab.mineralType == undefined) {
                creep.room.memory.reaction_ready = false;
            }
        } else {
            if (source1_lab.store.getUsedCapacity(request.reactant1) == 280 && source2_lab.store.getUsedCapacity(request.reactant2) == 280) {
                creep.room.memory.reaction_ready = true;
            }
        }
        if (!creep.room.memory.reaction_ready) {
            let source_labs = [source1_lab, source2_lab];
            let reactants = [request.reactant1, request.reactant2];
            let temp_source_labs = {
                [reactants[0]]: source_labs[0],
                [reactants[1]]: source_labs[1]
            }
            let has_enough_source = mymath.all(reactants.map((e) => creep.room.terminal.store.getUsedCapacity(e) >= 280 || creep.store.getUsedCapacity(e) >= 280 || temp_source_labs[e].store.getUsedCapacity(e) >= 280));
            for (let lab of react_labs) {
                if (lab.mineralType !== undefined && (!has_enough_source || lab.mineralType !== request.product || lab.store.getUsedCapacity(lab.mineralType) >= 280)) {
                    if (creep.store.getUsedCapacity() !== 0) {
                        transfer(creep, creep.room.terminal, creep.memory.resource_type);
                        return 0;
                    } else {
                        withdraw(creep, lab, lab.mineralType);
                        return 0;
                    }
                }
            }
            if (!has_enough_source) {
                delete creep.room.memory.reaction_request;
                return 0;
            }
            for (let i of [0, 1]) {
                let lab = source_labs[i];
                let reactant = reactants[i];
                if (lab.mineralType == undefined) {
                    if (creep.memory.resource_type == reactant && creep.store.getUsedCapacity(creep.memory.resource_type) == 280) {
                        transfer(creep, lab, reactant);
                        return 0;
                    } else if (creep.memory.resource_type == undefined) {
                        let output = creep.withdraw(creep.room.terminal, reactant, 280);
                        if (output == ERR_NOT_IN_RANGE) {
                            movetopos_restricted(creep, creep.room.terminal.pos, 1);
                        } else if (output == ERR_NOT_ENOUGH_RESOURCES) {
                            delete creep.room.memory.reaction_request;
                        }
                        return 0;
                    } else {
                        transfer(creep, creep.room.terminal, creep.memory.resource_type);
                        return 0;
                    }
                } else if (lab.mineralType !== reactant || lab.store.getUsedCapacity(lab.mineralType) !== 280) {
                    if (creep.memory.resource_type == undefined) {
                        withdraw(creep, lab, lab.mineralType);
                        return 0;
                    } else {
                        transfer(creep, creep.room.terminal, creep.memory.resource_type);
                        return 0;
                    }
                }
            }
        }
    }
    return 1;
}

interface type_resource_status {
    source: string;
    sink: string;
    withdraw_amount: number;
    transfer_amount: number;
}

function get_energy_status(creep_amount: number, link_amount: number, link_target_amount: number, storage_amount: number, terminal_amount: number | undefined, factory_amount: number | undefined, powerspawn_amount: number | undefined, nuker_amount: number | undefined): type_resource_status {
    let source = "storage";
    let sink = "storage";
    let withdraw_amount = undefined;
    let transfer_amount = undefined;
    if (storage_amount + creep_amount >= 700000 && factory_amount !== undefined) {
        sink = "factory";
    } else if (storage_amount < config.storage_full && factory_amount + creep_amount >= 5000) {
        source = "factory";
    }
    if (storage_amount + creep_amount >= config.storage_full && nuker_amount !== undefined && nuker_amount < 300000) {
        sink = "nuker";
    }
    if (storage_amount + creep_amount >= config.storage_full && powerspawn_amount !== undefined && powerspawn_amount < 3000) {
        sink = "powerspawn";
    }
    if (terminal_amount !== undefined) {
        if (terminal_amount + creep_amount >= 60000) {
            source = "terminal";
        } else if (terminal_amount < 50000) {
            sink = "terminal";
        }
    }
    if (link_amount + creep_amount > link_target_amount) {
        source = "link";
        withdraw_amount = link_amount - link_target_amount;
    } else if (link_amount < link_target_amount) {
        sink = "link";
        withdraw_amount = link_target_amount - link_amount;
        transfer_amount = link_target_amount - link_amount;
    }
    if (source == "storage" && sink == "storage" && creep_amount > 0) {
        source = "link";
    }
    let resource_status: type_resource_status = {
        "source": source,
        "sink": sink,
        "withdraw_amount": withdraw_amount,
        "transfer_amount": transfer_amount,
    }
    return resource_status
}

function get_power_status(creep_amount: number, terminal_amount: number | undefined, powerspawn_amount: number | undefined): type_resource_status {
    let source = "terminal";
    let sink = "terminal";
    let withdraw_amount = undefined;
    let transfer_amount = undefined;
    if (terminal_amount !== undefined && powerspawn_amount !== undefined) {
        if (terminal_amount + creep_amount >= 100 && powerspawn_amount == 0) {
            sink = "powerspawn";
            withdraw_amount = 100;
            transfer_amount = 100;
        } else if (powerspawn_amount > 0 && creep_amount > 0) {
            source = "powerspawn";
        }
    }
    let resource_status: type_resource_status = {
        "source": source,
        "sink": sink,
        "withdraw_amount": withdraw_amount,
        "transfer_amount": transfer_amount,
    }
    return resource_status
}

function get_battery_status(creep_amount: number, storage_amount: number, terminal_amount: number | undefined, factory_amount: number | undefined): type_resource_status {
    let source = "storage";
    let sink = "storage";
    let withdraw_amount = undefined;
    let transfer_amount = undefined;
    if (terminal_amount !== undefined) {
        if (terminal_amount + creep_amount >= 3000) {
            source = "terminal";
        } else if (terminal_amount < 2000 && storage_amount + creep_amount >= 1000) {
            sink = "terminal";
        }
    }
    if (factory_amount !== undefined) {
        if (factory_amount + creep_amount >= 3000) {
            source = "factory";
        } else if (factory_amount < 2000 && storage_amount + creep_amount >= 1000) {
            sink = "factory";
        }
    }
    let resource_status: type_resource_status = {
        "source": source,
        "sink": sink,
        "withdraw_amount": withdraw_amount,
        "transfer_amount": transfer_amount,
    }
    return resource_status
}

function get_G_status(creep_amount: number, terminal_amount: number | undefined, nuker_amount: number | undefined): type_resource_status {
    let source = "terminal";
    let sink = "terminal";
    let withdraw_amount = undefined;
    let transfer_amount = undefined;
    if (terminal_amount !== undefined && nuker_amount !== undefined) {
        if (terminal_amount + creep_amount >= 100 && nuker_amount < 5000) {
            sink = "nuker";
        }
        withdraw_amount = 5000 - nuker_amount;
        transfer_amount = 5000 - nuker_amount;
    }
    let resource_status: type_resource_status = {
        "source": source,
        "sink": sink,
        "withdraw_amount": withdraw_amount,
        "transfer_amount": transfer_amount,
    }
    return resource_status
}

function get_mineral_status(creep_amount: number, storage_amount: number, terminal_amount: number | undefined): type_resource_status {
    let source = "storage";
    let sink = "storage";
    let withdraw_amount = undefined;
    let transfer_amount = undefined;
    if (terminal_amount !== undefined) {
        if (terminal_amount + creep_amount >= 100000 && storage_amount < 100000) {
            source = "terminal";
		} else if (terminal_amount < 20000 && storage_amount + creep_amount >= 1000) {
            sink = "terminal";
        }
    }
    let resource_status: type_resource_status = {
        "source": source,
        "sink": sink,
        "withdraw_amount": withdraw_amount,
        "transfer_amount": transfer_amount,
    }
    return resource_status
}

function structure_from_name(room_name: string, name: string): AnyStoreStructure {
    let target: AnyStoreStructure;
    let room = Game.rooms[room_name];
    if (name == 'storage') {
        target = room.storage;
    } else if (name == 'terminal') {
        target = room.terminal;
    } else if (name == 'link') {
        let links_status = room.memory.named_structures_status.link;
        let link_id = links_status.MAIN.id;
        let link = Game.getObjectById(link_id);
        target = link;
    } else if (name == 'factory') {
        let factory_id = room.memory.unique_structures_status.factory.id;
        target = Game.getObjectById(factory_id);
    } else if (name == 'powerspawn') {
        let powerspawn_id = room.memory.unique_structures_status.powerSpawn.id;
        target = Game.getObjectById(powerspawn_id);
    } else if (name == 'nuker') {
        let nuker_id = room.memory.unique_structures_status.nuker.id;
        target = Game.getObjectById(nuker_id);
    }
    return target;
}

function transfer_resource(creep: Creep, resource_type: ResourceConstant, resource_status: type_resource_status) {
    let structure_names: {
        [key: string]: string
    } = {
        "storage": "S",
        "terminal": "T",
        "link": "L",
        "factory": "F",
        "powerspawn": "P",
        "nuker": "N",
    }
    let resource_names: {
        [key in ResourceConstant] ? : string
    } = {
        "energy": "E",
        "battery": "B",
        "power": "P",
        "G": "G",
    }
    creep.say(resource_names[resource_type] + ": " + structure_names[resource_status.source] + ">" + structure_names[resource_status.sink]);
    if (creep.memory.resource_type == undefined) {
        let target = structure_from_name(creep.room.name, resource_status.source);
        let output;
        if (resource_status.withdraw_amount == undefined) {
            output = creep.withdraw(target, resource_type);
        } else {
            output = creep.withdraw(target, resource_type, Math.min(creep.store.getCapacity(), resource_status.withdraw_amount));
        }
        if (output == 0) {
            basic_job.movetopos(creep, target.pos, 1);
        }
    } else {
        let target = structure_from_name(creep.room.name, resource_status.sink);
        let output;
        if (resource_status.transfer_amount == undefined) {
            output = creep.transfer(target, resource_type);
        } else {
            output = creep.transfer(target, resource_type, Math.min(creep.store.getUsedCapacity(resource_type), resource_status.transfer_amount));
        }
        if (output == 0) {
            basic_job.movetopos(creep, target.pos, 1);
        }
    }
    return 0;
}

export function creepjob(creep: Creep): number {
    var conf = config.conf_rooms[creep.room.name];
    if (creep.memory.role == 'maincarrier') {
        creep.say("MC");
        creep.memory.movable = false;
        creep.memory.crossable = false;
        if (creep.ticksToLive < 6 && creep.store.getUsedCapacity() == 0) {
            creep.suicide();
            return 0;
        }
        let conf_maincarrier = conf.maincarrier;
        let main_pos = creep.room.getPositionAt(conf_maincarrier.main_pos[0], conf_maincarrier.main_pos[1]);
        if (move_to_working_pos(creep, conf_maincarrier) == 0) {
            return 0;
        }
        if (creep.store.getUsedCapacity() == 0) {
            delete creep.memory.resource_type;
        } else {
            creep.memory.resource_type = < ResourceConstant > Object.keys(creep.store)[0]
        }
        if (creep.room.memory.current_boost_request !== undefined && creep.room.terminal) {
            creep.say("boost");
            boost_serve(creep, conf_maincarrier);
            return 0;
        }
        if (creep.room.memory.reaction_request !== undefined && creep.room.terminal) {
            creep.say("react");
            if (react_serve(creep, conf_maincarrier) == 0) {
                return 0;
            }
        }
        creep.say("MC");
        if (!creep.pos.isEqualTo(main_pos.x, main_pos.y)) {
            let costmatrix = functions.get_costmatrix_road(creep.room.name).clone()
            for (let xy of conf_maincarrier.working_zone) {
                costmatrix.set(xy[0], xy[1], 1);
            }
            basic_job.movetopos(creep, main_pos, 0, costmatrix);
        }
        let mineral_type = Game.memory[creep.room.name].mine_status.type;
        let creep_energy = creep.store.getUsedCapacity("energy");
        let creep_power = creep.store.getUsedCapacity("power");
        let creep_battery = creep.store.getUsedCapacity("battery");
        let creep_G = creep.store.getUsedCapacity("G");
        let creep_mineral = creep.store.getUsedCapacity(mineral_type);
        let links_status = creep.room.memory.named_structures_status.link;
        let link_id = links_status.MAIN.id;
        let link = Game.getObjectById(link_id);
        let link_energy = link.store.getUsedCapacity("energy")
        let storage_energy = creep.room.storage.store.getUsedCapacity("energy");
        let storage_battery = creep.room.storage.store.getUsedCapacity("battery");
        let storage_mineral = creep.room.storage.store.getUsedCapacity(mineral_type);
        let terminal_energy;
        let terminal_power;
        let terminal_battery;
        let terminal_G;
        let terminal_mineral;
        if (creep.room.terminal !== undefined) {
            terminal_energy = creep.room.terminal.store.getUsedCapacity("energy");
            terminal_power = creep.room.terminal.store.getUsedCapacity("power");
            terminal_battery = creep.room.terminal.store.getUsedCapacity("battery");
            terminal_G = creep.room.terminal.store.getUsedCapacity("G");
            terminal_mineral = creep.room.terminal.store.getUsedCapacity(mineral_type);
        }
        let factory_id = creep.room.memory.unique_structures_status.factory.id;
        let factory;
        let factory_energy;
        let factory_battery;
        if (factory_id !== undefined) {
            factory = Game.getObjectById(factory_id);
            factory_energy = factory.store.getUsedCapacity("energy");
            factory_battery = factory.store.getUsedCapacity("battery");
        }
        let powerspawn_id = creep.room.memory.unique_structures_status.powerSpawn.id;
        let powerspawn;
        let powerspawn_energy;
        let powerspawn_power;
        if (powerspawn_id !== undefined) {
            powerspawn = Game.getObjectById(powerspawn_id);
            powerspawn_energy = powerspawn.store.getUsedCapacity("energy");
            powerspawn_power = powerspawn.store.getUsedCapacity("power");
        }

        let nuker_id = creep.room.memory.unique_structures_status.nuker.id;
        let nuker;
        let nuker_energy;
        let nuker_G;
        if (nuker_id !== undefined) {
            nuker = Game.getObjectById(nuker_id);
            nuker_energy = nuker.store.getUsedCapacity("energy");
            nuker_G = nuker.store.getUsedCapacity("G");
        }

        let energy_status = get_energy_status(creep_energy, link_energy, creep.room.memory.maincarrier_link_amount, storage_energy, terminal_energy, factory_energy, powerspawn_energy, nuker_energy);
        let power_status = get_power_status(creep_power, terminal_power, powerspawn_power);
        let G_status = get_G_status(creep_G, terminal_G, nuker_G);
        let battery_status = get_battery_status(creep_battery, storage_battery, terminal_battery, factory_battery);
        let mineral_status = get_mineral_status(creep_mineral, storage_mineral, terminal_mineral);
        let resources_status: {
            [key in ResourceConstant] ? : type_resource_status
        } = {
            "energy": energy_status,
            "power": power_status,
            "battery": battery_status,
            "G": G_status,
			[mineral_type]: mineral_status,
        }

        for (let resource_type of ["energy", "power", "G", "battery", mineral_type]) {
            if (creep.memory.resource_type == undefined || creep.memory.resource_type == resource_type) {
                let resource_status = resources_status[ < ResourceConstant > resource_type];
                if (resource_status.source !== resource_status.sink) {
                    transfer_resource(creep, < ResourceConstant > resource_type, resource_status);
                    return 0;
                }
            }
            if (creep.memory.resource_type == resource_type) {
                return 0;
            }
        }

        if (creep.room.terminal !== undefined) {
            creep.transfer(creep.room.terminal, creep.memory.resource_type)
        } else {
            creep.transfer(creep.room.storage, creep.memory.resource_type)
        }
    }
    return 0;
}
