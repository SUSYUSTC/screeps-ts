export function log() {
	if (Memory.debug_mode) {
		let total_cpu = 0;
		for (let key in Game.tick_cpu) {
			console.log("CPU spent on", key, ":", Game.tick_cpu[key]);
			if (['movetopos', 'costmatrices'].includes(key)) {
				continue;
			}
			total_cpu += Game.tick_cpu[key];
		}
		console.log("Added CPU spending:", total_cpu);
		console.log("Read CPU spending:", Game.cpu.getUsed());
	}
}
