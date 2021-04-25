"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mymath = require("../dist/mymath");
require("./wrapper")
var driver = require("./driver");
var room_name= 'E15N58';
function xy2pos(xy) {
	return new driver.RoomPosition(xy[0], xy[1], room_name);
}
var defense = require("../dist/defense")
console.log("expected: [[0, 1], [2]]")
console.log(defense.group_enemies(3, [[0,1,5], [1,0,5], [5,5,0]]))

var creeps_xy = [[0, 0], [3, 0], [4, 0]];
var ramparts_xy = [[2, 1], [4, 2]];
var creeps_poses = creeps_xy.map((e) => xy2pos(e))
var ramparts_poses = ramparts_xy.map((e) => xy2pos(e))
var assignment = defense.assign_creeps(creeps_poses, ramparts_poses, true)
console.log("expected: [undefined, 0, 1]")

console.log(assignment)
var creeps_xy = [[0, 0], [3, 0]];
var ramparts_xy = [[2, 1], [4, 2]];
var creeps_poses = creeps_xy.map((e) => xy2pos(e))
var ramparts_poses = ramparts_xy.map((e) => xy2pos(e))
var assignment = defense.assign_creeps(creeps_poses, ramparts_poses, true)
console.log("expected: [0, 1]")
console.log(assignment)

var creeps_xy = [[0, 0], [3, 0]];
var ramparts_xy = [[2, 1], [4, 2], [4, 1]];
var creeps_poses = creeps_xy.map((e) => xy2pos(e))
var ramparts_poses = ramparts_xy.map((e) => xy2pos(e))
var assignment = defense.assign_creeps(creeps_poses, ramparts_poses, true)
console.log("expected: [0, 2]")
console.log(assignment)
