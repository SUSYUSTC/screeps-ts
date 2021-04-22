export function log() {
    if (Memory.debug_mode) {
        let total_cpu = 0;
        for (let key in Game.tick_cpu_main) {
            console.log("CPU spent on", key + '.'.repeat(30 - key.length), Game.tick_cpu_main[key].toFixed(4), "# actions:", Game.function_actions_count[key]);
            total_cpu += Game.tick_cpu_main[key];
        }
        console.log("Added CPU spending:", total_cpu);
        console.log("Read CPU spending:", Game.cpu.getUsed());
        console.log("");
        for (let key in Game.tick_cpu) {
            console.log("CPU spent on", key + '.'.repeat(30 - key.length), Game.tick_cpu[key].toFixed(4), "# actions:", Game.function_actions_count[key]);
        }
    }
}
