//screeps
export function avoid_exits(room_name: string, costMatrix: CostMatrix) {
    for (var i = 0; i < 50; i++) {
        costMatrix.set(0, i, 100);
        costMatrix.set(49, i, 100);
        costMatrix.set(i, 49, 100);
        costMatrix.set(i, 0, 100);
    }
}
