/**
 Module: actionCounter
 Author: fangxm, Scorpior_gh
 Date:   2019.12.27
 Usage:
 module:main
 let actionCounter = require('actionCounter')

 actionCounter.warpActions();

 //your modules go here

 module.exports.loop=function(){
     actionCounter.init();

     //your codes go here

     actionCounter.save(1500);
     //you can use console.log(actionCounter.ratio()) after actionCounter.save() to auto print cpu ratio
 }

 The module can count the times of action and measure the CPU used by it.
*/

let warpGetUsed = false;

let totalCPU = 0;
let actionsTime = {};
var historyTotalCPU = {};
var historyForcedCPU = {};

/*
let functionsToWarp = [
    {name: 'Game.notify', parent: Game, val: Game.notify},
    {name: 'Market.cancelOrder', parent: Game.market, val: Game.market.cancelOrder},
    {name: 'Market.changeOrderPrice', parent: Game.market, val: Game.market.changeOrderPrice},
    {name: 'Market.createOrder', parent: Game.market, val: Game.market.createOrder},
    {name: 'Market.deal', parent: Game.market, val: Game.market.deal},
    {name: 'Market.extendOrder', parent: Game.market, val: Game.market.extendOrder},
    {name: 'ConstructionSite.remove', parent: ConstructionSite.prototype, val: ConstructionSite.prototype.remove},
    {name: 'Creep.attack', parent: Creep.prototype, val: Creep.prototype.attack},
    {name: 'Creep.attackController', parent: Creep.prototype, val: Creep.prototype.attackController},
    {name: 'Creep.build', parent: Creep.prototype, val: Creep.prototype.build},
    {name: 'Creep.claimController', parent: Creep.prototype, val: Creep.prototype.claimController},
    {name: 'Creep.dismantle', parent: Creep.prototype, val: Creep.prototype.dismantle},
    {name: 'Creep.drop', parent: Creep.prototype, val: Creep.prototype.drop},
    {name: 'Creep.generateSafeMode', parent: Creep.prototype, val: Creep.prototype.generateSafeMode},
    {name: 'Creep.harvest', parent: Creep.prototype, val: Creep.prototype.harvest},
    {name: 'Creep.heal', parent: Creep.prototype, val: Creep.prototype.heal},
    {name: 'Creep.move', parent: Creep.prototype, val: Creep.prototype.move},
    {name: 'Creep.notifyWhenAttacked', parent: Creep.prototype, val: Creep.prototype.notifyWhenAttacked},
    {name: 'Creep.pickup', parent: Creep.prototype, val: Creep.prototype.pickup},
    {name: 'Creep.rangedAttack', parent: Creep.prototype, val: Creep.prototype.rangedAttack},
    {name: 'Creep.rangedHeal', parent: Creep.prototype, val: Creep.prototype.rangedHeal},
    {name: 'Creep.rangedMassAttack', parent: Creep.prototype, val: Creep.prototype.rangedMassAttack},
    {name: 'Creep.repair', parent: Creep.prototype, val: Creep.prototype.repair},
    {name: 'Creep.reserveController', parent: Creep.prototype, val: Creep.prototype.reserveController},
    {name: 'Creep.signController', parent: Creep.prototype, val: Creep.prototype.signController},
    {name: 'Creep.suicide', parent: Creep.prototype, val: Creep.prototype.suicide},
    {name: 'Creep.transfer', parent: Creep.prototype, val: Creep.prototype.transfer},
    {name: 'Creep.upgradeController', parent: Creep.prototype, val: Creep.prototype.upgradeController},
    {name: 'Creep.withdraw', parent: Creep.prototype, val: Creep.prototype.withdraw},
    {name: 'Flag.remove', parent: Flag.prototype, val: Flag.prototype.remove},
    {name: 'Flag.setColor', parent: Flag.prototype, val: Flag.prototype.setColor},
    {name: 'Flag.setPosition', parent: Flag.prototype, val: Flag.prototype.setPosition},
    {name: 'PowerCreep.delete', parent: PowerCreep.prototype, val: PowerCreep.prototype.delete},
    {name: 'PowerCreep.drop', parent: PowerCreep.prototype, val: PowerCreep.prototype.drop},
    {name: 'PowerCreep.enableRoom', parent: PowerCreep.prototype, val: PowerCreep.prototype.enableRoom},
    {name: 'PowerCreep.move', parent: PowerCreep.prototype, val: PowerCreep.prototype.move},
    {name: 'PowerCreep.notifyWhenAttacked', parent: PowerCreep.prototype, val: PowerCreep.prototype.notifyWhenAttacked},
    {name: 'PowerCreep.pickup', parent: PowerCreep.prototype, val: PowerCreep.prototype.pickup},
    {name: 'PowerCreep.renew', parent: PowerCreep.prototype, val: PowerCreep.prototype.renew},
    {name: 'PowerCreep.spawn', parent: PowerCreep.prototype, val: PowerCreep.prototype.spawn},
    {name: 'PowerCreep.suicide', parent: PowerCreep.prototype, val: PowerCreep.prototype.suicide},
    {name: 'PowerCreep.transfer', parent: PowerCreep.prototype, val: PowerCreep.prototype.transfer},
    {name: 'PowerCreep.upgrade', parent: PowerCreep.prototype, val: PowerCreep.prototype.upgrade},
    {name: 'PowerCreep.usePower', parent: PowerCreep.prototype, val: PowerCreep.prototype.usePower},
    {name: 'PowerCreep.withdraw', parent: PowerCreep.prototype, val: PowerCreep.prototype.withdraw},
    {name: 'Room.createConstructionSite', parent: Room.prototype, val: Room.prototype.createConstructionSite},
    {name: 'Room.createFlag', parent: Room.prototype, val: Room.prototype.createFlag},
    {name: 'Structure.destroy', parent: Structure.prototype, val: Structure.prototype.destroy},
    {name: 'Structure.notifyWhenAttacked', parent: Structure.prototype, val: Structure.prototype.notifyWhenAttacked},
    {name: 'StructureController.activateSafeMode', parent: StructureController.prototype, val: StructureController.prototype.activateSafeMode},
    {name: 'StructureController.unclaim', parent: StructureController.prototype, val: StructureController.prototype.unclaim},
    {name: 'StructureFactory.produce', parent: StructureFactory.prototype, val: StructureFactory.prototype.produce},
    {name: 'StructureLab.boostCreep', parent: StructureLab.prototype, val: StructureLab.prototype.boostCreep},
    {name: 'StructureLab.runReaction', parent: StructureLab.prototype, val: StructureLab.prototype.runReaction},
    {name: 'StructureLab.unboostCreep', parent: StructureLab.prototype, val: StructureLab.prototype.unboostCreep},
    {name: 'StructureLink.transferEnergy', parent: StructureLink.prototype, val: StructureLink.prototype.transferEnergy},
    {name: 'StructureNuker.launchNuke', parent: StructureNuker.prototype, val: StructureNuker.prototype.launchNuke},
    {name: 'StructureObserver.observeRoom', parent: StructureObserver.prototype, val: StructureObserver.prototype.observeRoom},
    {name: 'StructurePowerSpawn.processPower', parent: StructurePowerSpawn.prototype, val: StructurePowerSpawn.prototype.processPower},
    {name: 'StructureRampart.setPublic', parent: StructureRampart.prototype, val: StructureRampart.prototype.setPublic},
    {name: 'StructureSpawn.spawnCreep', parent: StructureSpawn.prototype, val: StructureSpawn.prototype.spawnCreep},
    {name: 'StructureSpawn.recycleCreep', parent: StructureSpawn.prototype, val: StructureSpawn.prototype.recycleCreep},
    {name: 'StructureSpawn.renewCreep', parent: StructureSpawn.prototype, val: StructureSpawn.prototype.renewCreep},
    {name: 'Spawning.cancel', parent: StructureSpawn.Spawning.prototype, val: StructureSpawn.Spawning.prototype.cancel},
    {name: 'Spawning.setDirections', parent: StructureSpawn.Spawning.prototype, val: StructureSpawn.Spawning.prototype.setDirections},
    {name: 'StructureTerminal.send', parent: StructureTerminal.prototype, val: StructureTerminal.prototype.send},
    {name: 'StructureTower.attack', parent: StructureTower.prototype, val: StructureTower.prototype.attack},
    {name: 'StructureTower.heal', parent: StructureTower.prototype, val: StructureTower.prototype.heal},
    {name: 'StructureTower.repair', parent: StructureTower.prototype, val: StructureTower.prototype.repair},
]
*/

let functionsToWarp_creep = [
    {name: 'Creep.attack', parent: Creep.prototype, val: Creep.prototype.attack},
    {name: 'Creep.attackController', parent: Creep.prototype, val: Creep.prototype.attackController},
    {name: 'Creep.build', parent: Creep.prototype, val: Creep.prototype.build},
    {name: 'Creep.claimController', parent: Creep.prototype, val: Creep.prototype.claimController},
    {name: 'Creep.dismantle', parent: Creep.prototype, val: Creep.prototype.dismantle},
    {name: 'Creep.drop', parent: Creep.prototype, val: Creep.prototype.drop},
    {name: 'Creep.generateSafeMode', parent: Creep.prototype, val: Creep.prototype.generateSafeMode},
    {name: 'Creep.harvest', parent: Creep.prototype, val: Creep.prototype.harvest},
    {name: 'Creep.heal', parent: Creep.prototype, val: Creep.prototype.heal},
    {name: 'Creep.move', parent: Creep.prototype, val: Creep.prototype.move},
    {name: 'Creep.notifyWhenAttacked', parent: Creep.prototype, val: Creep.prototype.notifyWhenAttacked},
    {name: 'Creep.pickup', parent: Creep.prototype, val: Creep.prototype.pickup},
    {name: 'Creep.rangedAttack', parent: Creep.prototype, val: Creep.prototype.rangedAttack},
    {name: 'Creep.rangedHeal', parent: Creep.prototype, val: Creep.prototype.rangedHeal},
    {name: 'Creep.rangedMassAttack', parent: Creep.prototype, val: Creep.prototype.rangedMassAttack},
    {name: 'Creep.repair', parent: Creep.prototype, val: Creep.prototype.repair},
    {name: 'Creep.reserveController', parent: Creep.prototype, val: Creep.prototype.reserveController},
    {name: 'Creep.signController', parent: Creep.prototype, val: Creep.prototype.signController},
    {name: 'Creep.suicide', parent: Creep.prototype, val: Creep.prototype.suicide},
    {name: 'Creep.transfer', parent: Creep.prototype, val: Creep.prototype.transfer},
    {name: 'Creep.upgradeController', parent: Creep.prototype, val: Creep.prototype.upgradeController},
    {name: 'Creep.withdraw', parent: Creep.prototype, val: Creep.prototype.withdraw},
]

/**
 * Warp functions, it should be call when global reset.
 */
export function warpActions(){
	Game.creep_actions_count = {};
    functionsToWarp_creep.forEach(({name, parent, val}) => warpAction(name, parent, val))
}

function warpAction(name, parent, action){
    let actionName = name.split('.').pop();

    function warppedAction() {
        const start = Game.cpu.getUsed();

        let code = action.apply(this, arguments);
		let role = this.memory.role;

        const end = Game.cpu.getUsed();
        if(code === OK && end - start > 0.1) {
			if (Game.creep_actions_count[role] == undefined) {
				Game.creep_actions_count[role] = 0;
			}
			Game.creep_actions_count[role] += 1;
        }

        return code;
    }

    parent['_' + actionName] = action;
    parent[actionName] = warppedAction;
}

