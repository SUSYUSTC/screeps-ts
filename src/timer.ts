export class Timer {
    name: string;
    begin_time: number;
    begin_count: number;
    is_main: boolean;
    constructor(name: string, is_main: boolean) {
        this.name = name;
        this.begin_time = Game.cpu.getUsed();
        this.begin_count = Game.actions_count;
        this.is_main = is_main;
        if (is_main) {
            if (Game.tick_cpu_main[this.name] == undefined) {
                Game.tick_cpu_main[this.name] = 0;
            }
        } else {
            if (Game.tick_cpu[this.name] == undefined) {
                Game.tick_cpu[this.name] = 0;
            }
        }
        if (Game.function_actions_count[this.name] == undefined) {
            Game.function_actions_count[this.name] = 0;
        }
    }
    end() {
        if (this.is_main) {
            Game.tick_cpu_main[this.name] += Game.cpu.getUsed() - this.begin_time;
        } else {
            Game.tick_cpu[this.name] += Game.cpu.getUsed() - this.begin_time;
        }
        Game.function_actions_count[this.name] += Game.actions_count - this.begin_count;
    }
}
