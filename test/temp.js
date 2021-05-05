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

var functions = require("../dist/functions")
var orders = [{"createdTimestamp":1619123246806,"active":true,"type":"buy","amount":7227,"remainingAmount":7227,"resourceType":"X","price":1.503,"totalAmount":30000,"roomName":"E19N53","created":27542260,"id":"6081dc2e7946f4141d3097a6"},{"createdTimestamp":1619147397166,"active":true,"type":"sell","amount":19530,"remainingAmount":19530,"resourceType":"XGHO2","price":20,"totalAmount":20000,"roomName":"E19N51","created":27549667,"id":"60823a857946f4a7e54ddc2e"},{"createdTimestamp":1619864936157,"active":true,"type":"buy","amount":29230,"remainingAmount":29230,"resourceType":"X","price":1.529,"totalAmount":30000,"roomName":"E19N53","created":27758600,"id":"608d2d683501973cf1931820"},{"createdTimestamp":1619971145913,"active":true,"type":"buy","amount":73122,"remainingAmount":116000,"resourceType":"energy","price":0.001,"totalAmount":120000,"roomName":"E15N58","created":27790400,"id":"608ecc4935d3313a686d7b87"},{"createdTimestamp":1619981149070,"active":true,"type":"buy","amount":73122,"remainingAmount":120000,"resourceType":"energy","price":0.001,"totalAmount":120000,"roomName":"E15N58","created":27793400,"id":"608ef35d35d3312e9b79db57"},{"createdTimestamp":1620007683674,"active":true,"type":"buy","amount":24150,"remainingAmount":24150,"resourceType":"battery","price":3.048,"totalAmount":30000,"roomName":"E19N51","created":27801200,"id":"608f5b0335d331730a991f35"},{"createdTimestamp":1620007683674,"active":true,"type":"buy","amount":30000,"remainingAmount":30000,"resourceType":"battery","price":3.048,"totalAmount":30000,"roomName":"E21N49","created":27801200,"id":"608f5b0335d3315974991f36"},{"createdTimestamp":1620007683674,"active":true,"type":"buy","amount":29000,"remainingAmount":29000,"resourceType":"battery","price":3.048,"totalAmount":30000,"roomName":"E9N54","created":27801200,"id":"608f5b0335d331500c991f37"},{"createdTimestamp":1620083612759,"active":true,"type":"sell","amount":30000,"remainingAmount":30000,"resourceType":"ops","price":0.4,"totalAmount":30000,"roomName":"E16N58","created":27823063,"id":"6090839c35d331c559f0e92f"},{"createdTimestamp":1620083632643,"active":true,"type":"sell","amount":24544,"remainingAmount":25000,"resourceType":"ops","price":0.4,"totalAmount":25000,"roomName":"E19N55","created":27823069,"id":"609083b035d33169b2f0ef1c"},{"createdTimestamp":1620091725576,"active":true,"type":"buy","amount":30000,"remainingAmount":30000,"resourceType":"X","price":0.001,"totalAmount":30000,"roomName":"E19N53","created":27825400,"id":"6090a34d35d33168eef9f329"},{"createdTimestamp":1620097974850,"active":true,"type":"buy","amount":18600,"remainingAmount":18600,"resourceType":"L","price":0.271,"totalAmount":30000,"roomName":"E9N54","created":27827200,"id":"6090bbb635d331b6b100ca7f"},{"createdTimestamp":1620099374353,"active":true,"type":"buy","amount":30000,"remainingAmount":30000,"resourceType":"battery","price":2.602,"totalAmount":30000,"roomName":"E15N58","created":27827600,"id":"6090c12e35d3315f180254a1"},{"createdTimestamp":1620103437410,"active":true,"type":"buy","amount":13589,"remainingAmount":13589,"resourceType":"Z","price":0.106,"totalAmount":30000,"roomName":"E14N51","created":27828800,"id":"6090d10d35d331299506f882"},{"createdTimestamp":1620105472567,"active":true,"type":"buy","amount":13700,"remainingAmount":13700,"resourceType":"U","price":0.379,"totalAmount":30000,"roomName":"E15N58","created":27829400,"id":"6090d90035d3312b900943f2"}]
let str = global.format_objs(orders.sort((a, b) => Number(a.resourceType > b.resourceType) - 0.5))
console.log(str)
