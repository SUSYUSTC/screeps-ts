console.log("Running module layout");
import * as _ from "lodash";
import * as mymath from "./mymath";
import * as config from "./config";

type allowed_structure_types = STRUCTURE_LINK | STRUCTURE_CONTAINER | STRUCTURE_TOWER;

function is_potential_structure(e: LookAtResult, structuretype: allowed_structure_types): boolean {
    var is_structure = (e.type == 'structure' && e.structure.structureType == structuretype);
    var is_constructionsite = (e.type == 'constructionSite' && e.constructionSite.structureType == structuretype);
    return (is_structure || is_constructionsite);
}

function create_structure(room_name: string, pos: RoomPosition, structuretype: allowed_structure_types) {
    var room = Game.rooms[room_name];
    var structure_sites = _.filter(Game.rooms[room_name].lookAt(pos.x, pos.y), (e) => is_potential_structure(e, structuretype));
    if (structure_sites.length !== 1) {
        room.createConstructionSite(pos, structuretype);
        return null;
    }
    var typ = structure_sites[0].type;
    var temp = < any > structure_sites[0][typ];
    var id = temp.id;
    return [typ, id];
}

export function update_structure_info(room_name: string, structuretype: allowed_structure_types) {
    var room = Game.rooms[room_name];
    var key: string = ( < string > structuretype) + "s";
    var conf = Memory.rooms_conf[room_name][key];
    for (var structure_name in conf) {
        if (conf[structure_name].hasOwnProperty("RCL") && room.controller.level < conf[structure_name].RCL) {
            continue;
        }
        var xy = conf[structure_name].pos;
        var pos = room.getPositionAt(xy[0], xy[1]);
        var temp = create_structure(room_name, pos, structuretype);
        if (temp == null) {
            conf[structure_name].exists = false;
            conf[structure_name].finished = false;
            return;
        }
        conf[structure_name].exists = true;
        const [typ, id] = temp;
        conf[structure_name].finished = (typ == 'structure');
        conf[structure_name].id = id;
    }
};

