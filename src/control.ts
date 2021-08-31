//screeps
import * as external_room from "./external_room"
export function action() {
	/*
	if (Game.time % 2000 == 500) {
		global.spawn_invader_group_x2("E11S39", "S1", 2, {work: 36}, global.my_shard_paths.W41S41)
	}
	*/
	let creep = Game.creeps.test;
	if (creep !== undefined) {
		creep.moveTo(new RoomPosition(37, 28, "W32S38"));
	}
}
