import * as _ from "lodash"
import * as mymath from "./mymath"
interface type_ranged_group_x2 {
    healer: string;
    ranged_attacker: string;
}
interface type_dismantle_group_x2 {
    healer: string;
    dismantler: string;
}

export function dismantle_group_x2(group: type_dismantle_group_x2, flagname: string): number {
    let healer = Game.creeps[group.healer];
    let dismantler = Game.creeps[group.dismantler];
    let healer_damage = healer.hitsMax - healer.hits;
    let dismantler_damage = dismantler.hitsMax - dismantler.hits;
    let close = false;
	let sameroom = false;
    if (healer.room.name == dismantler.room.name) {
		sameroom = true;
        if (healer.pos.getRangeTo(dismantler) <= 1) {
            close = true;
        }
    }
	if (!dismantler.room.controller.my) {
		// dismantle tower first, then other structure with the lowest hits
		let structures_in_range = dismantler.room.lookForAtArea("structure", dismantler.pos.y-1, dismantler.pos.x-1, dismantler.pos.y+1, dismantler.pos.x+1, true).map((e) => e.structure);
		let towers = <Array<StructureTower>> structures_in_range.filter((e) => e.structureType == "tower");
		if (towers.length > 0) {
			let hits = towers.map((e) => e.hits);
			let argmin = mymath.argmin(hits);
			dismantler.dismantle(towers[argmin]);
		}
		else if (structures_in_range.length > 0){
			let hits = structures_in_range.map((e) => e.hits);
			let argmin = mymath.argmin(hits);
			dismantler.dismantle(structures_in_range[argmin]);
		}
	}
	// try to heal dismantler first if close
	if (close && dismantler_damage >= healer_damage) {
        healer.heal(dismantler);
    }
	else {
        healer.heal(healer);
	}
	if (sameroom && !close) {
		healer.moveTo(dismantler);
		dismantler.moveTo(healer);
	} else if (close) {
		let flag = Game.flags[flagname];
		if (flag !== undefined) {
			dismantler.moveTo(flag);
		}
		healer.moveTo(dismantler);
	} else {
		//not in the same room
		if (dismantler.pos.x == 0) {
			dismantler.move(RIGHT);
		} else if (dismantler.pos.x == 49) {
			dismantler.move(LEFT);
		} else if (dismantler.pos.y == 0) {
			dismantler.move(BOTTOM);
		} else if (dismantler.pos.y == 49) {
			dismantler.move(TOP);
		}
	}
    return 0;
}
