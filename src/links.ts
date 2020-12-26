import * as mymath from "./mymath";
export function work(room_name: string) {
	var room=Game.rooms[room_name];
    var conf = Memory.rooms_conf[room_name];
	if (!('links' in conf) || !room.memory.link_mode) {
		return;
	}
    var links_name = Object.keys(conf.links).filter((e) => conf.links[e].finished);
    var links = links_name.map((e) => Game.getObjectById(conf.links[e].id));
    var links_energies = links.map((e) => e.store.getUsedCapacity("energy"));
    var argmax = mymath.argmax(links_energies)
    var argmin = mymath.argmin(links_energies)
	var gap=links_energies[argmax]-links_energies[argmin];
	if (gap>conf.link_transfer_gap) {
		links[argmax].transferEnergy(links[argmin], conf.link_transfer_amount);
	}
}
