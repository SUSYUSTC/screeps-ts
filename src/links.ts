import * as mymath from "./mymath";
import * as config from "./config";
export function work(room_name: string) {
	if (!Game.powered_rooms.includes(room_name) && Game.time % 3 !== 0) {
		return;
	}
    let room = Game.rooms[room_name];
    let conf = config.conf_rooms[room_name];
	let links_status = global.memory[room_name].named_structures_status.link;
    let game_memory = Game.memory[room_name];
    if (!("links" in conf)) {
        return;
    }
	if (links_status.MAIN == undefined || !links_status.MAIN.finished) {
		return;
	}
	let link_MAIN = Game.getObjectById(links_status.MAIN.id);
	let MAIN_energy = link_MAIN.store.getUsedCapacity("energy");
    let sources_name = game_memory.link_modes.filter((e) => game_memory.are_links_source[e] == true)
    let sources = sources_name.map((e) => Game.getObjectById(links_status[e].id));
	sources.forEach((e) => room.visual.text(">", e.pos));
	sources = sources.filter((e) => e.cooldown == 0);
    let sinks_name = game_memory.link_modes.filter((e) => game_memory.are_links_source[e] == false)
    let sinks = sinks_name.map((e) => Game.getObjectById(links_status[e].id));
	sinks.forEach((e) => room.visual.text("<", e.pos));
	sinks = sinks.filter((e) => e.cooldown == 0);
	if (game_memory.link_modes.includes('Ext')) {
		let link_Ext = Game.getObjectById(links_status.Ext.id);
		let link_Ext_energy = link_Ext.store.getUsedCapacity("energy");
		if (link_Ext.cooldown == 0 && link_Ext_energy > 0 && link_Ext_energy <= 800 - MAIN_energy) {
			link_Ext.transferEnergy(link_MAIN);
			return;
		}
	}
	if (sources.length > 0) {
		let sources_energies = sources.map((e) => e.store.getUsedCapacity("energy"));
		let argsource = mymath.argmax(sources_energies)
		let gap = sources_energies[argsource] - MAIN_energy;
		if (gap >= config.link_transfer_to_main_gap) {
			sources[argsource].transferEnergy(link_MAIN);
			return;
		}
    }
	if (sinks.length > 0) {
		let sinks_energies = sinks.map((e) => e.store.getUsedCapacity("energy"));
		let argsink = mymath.argmin(sinks_energies)
		let gap = MAIN_energy - sinks_energies[argsink];
		if (gap >= config.link_transfer_from_main_gap) {
			link_MAIN.transferEnergy(sinks[argsink]);
			return;
		}
    }
}
