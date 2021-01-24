import * as mymath from "./mymath";
export function work(room_name: string) {
    var room = Game.rooms[room_name];
    var conf = Memory.rooms_conf[room_name];
    if (!("links" in conf)) {
        return;
    }
    var sources_name = room.memory.link_modes.filter((e) => conf.links[e].source)
    var sinks_name = room.memory.link_modes.filter((e) => !conf.links[e].source)
    var sources = sources_name.map((e) => Game.getObjectById(conf.links[e].id));
    sources = sources.filter((e) => e.cooldown == 0);
    var sinks = sinks_name.map((e) => Game.getObjectById(conf.links[e].id));
    if (sources.length == 0 || sinks.length == 0) {
        return;
    }
    var sources_energies = sources.map((e) => e.store.getUsedCapacity("energy"));
    var sinks_energies = sinks.map((e) => e.store.getUsedCapacity("energy"));
    var argsource = mymath.argmax(sources_energies)
    var argsink = mymath.argmin(sinks_energies)
    var gap = sources_energies[argsource] - sinks_energies[argsink];
    if (gap >= conf.link_transfer_gap) {
        sources[argsource].transferEnergy(sinks[argsink]);
    }
}
