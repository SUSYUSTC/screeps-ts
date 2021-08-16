import * as mymath from "./mymath"
export function log() {
    if (Memory.debug_mode) {
        let total_cpu = 0;
		console.log("Main Actions")
		let max_length = mymath.max(Object.keys(Game.tick_cpu).concat(Object.keys(Game.tick_cpu_main)).map((e) => e.length)) + 1;
        for (let key in Game.tick_cpu_main) {
            console.log("CPU spent on", key + '.'.repeat(max_length - key.length), Game.tick_cpu_main[key].toFixed(4), "# actions:", Game.function_actions_count[key]);
            total_cpu += Game.tick_cpu_main[key];
        }
		console.log("Functions")
        for (let key in Game.tick_cpu) {
            console.log("CPU spent on", key + '.'.repeat(max_length - key.length), Game.tick_cpu[key].toFixed(4), "# actions:", Game.function_actions_count[key]);
        }
        console.log("Added CPU spending:", total_cpu);
        console.log("Read CPU spending:", Game.cpu.getUsed());
    }
	if (Memory.history_cpus == undefined) {
		Memory.history_cpus = [];
	}
	Memory.history_cpus.push(Game.cpu.getUsed());
	if (Memory.history_cpus.length > 50) {
		Memory.history_cpus.shift();
	}
	console.log("Averaged CPU:", mymath.array_mean(Memory.history_cpus));
}
