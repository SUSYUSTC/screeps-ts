import * as mymath from "./mymath";
import * as config from "./config";
export function work(room_name: string) {
    let room = Game.rooms[room_name];
    let conf = config.conf_rooms[room_name];
	let links_status = room.memory.named_structures_status.link;
    let game_memory = Game.memory[room_name];
    if (!("links" in conf)) {
        return;
    }
    let sources_name = game_memory.link_modes.filter((e) => game_memory.are_links_source[e])
    let sinks_name = game_memory.link_modes.filter((e) => !game_memory.are_links_source[e])
    let sources = sources_name.map((e) => Game.getObjectById(links_status[e].id));
    sources = sources.filter((e) => e.cooldown == 0);
    let sinks = sinks_name.map((e) => Game.getObjectById(links_status[e].id));
    if (sources.length == 0 || sinks.length == 0) {
        return;
    }
    let sources_energies = sources.map((e) => e.store.getUsedCapacity("energy"));
    let sinks_energies = sinks.map((e) => e.store.getUsedCapacity("energy"));
    let argsource = mymath.argmax(sources_energies)
    let argsink = mymath.argmin(sinks_energies)
    let gap = sources_energies[argsource] - sinks_energies[argsink];
    if (gap >= config.link_transfer_gap) {
        sources[argsource].transferEnergy(sinks[argsink]);
    }
}
