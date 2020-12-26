var external_room = require('./external_room')

function claim_controller(creep: Creep, room_name: string) {
    if (creep.room.name !== room_name) {
        let output = external_room.movethroughrooms(creep, creep.memory.rooms_backwardpath, creep.memory.names_backwardpath);
    } else {
        let output = creep.claimController(creep.room.controller);
        if (output == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller);
        } else {
            console.log("Claim controller: ", output);
        }
    }
}
module.exports.claim_controller = claim_controller;
