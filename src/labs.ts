import * as _ from "lodash"
export function reaction(room_name: string) {
	let room = Game.rooms[room_name];
	if (!room.memory.reaction_ready) {
		return;
	}
	let conf = Memory.rooms_conf[room_name].labs;
	let source1_ids = _.filter(conf, (e) => e.state=='source1' && e.finished);
	let source2_ids = _.filter(conf, (e) => e.state=='source2' && e.finished);
	let react_ids = _.filter(conf, (e) => e.state=='react' && e.finished);
	if (source1_ids.length == 1 && source2_ids.length == 1 && react_ids.length == 7) {
		let source1_lab = Game.getObjectById(source1_ids[0].id);
		let source2_lab = Game.getObjectById(source2_ids[0].id);
		let react_labs = react_ids.map((e) => Game.getObjectById(e.id));
		for (let lab of react_labs) {
			if (lab.cooldown == 0) {
				lab.runReaction(source1_lab, source2_lab);
			}
		}
	}
}
