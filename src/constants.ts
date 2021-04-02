type type_allowed_reactions = {
    [key in MineralCompoundConstant]: [GeneralMineralConstant, GeneralMineralConstant];
}
type type_mineral_level = {
    [key in GeneralMineralConstant]: number;
}
type type_mineral_minimum_amount = {
    [key in GeneralMineralConstant]: number;
}
export var allowed_reactions: type_allowed_reactions = {
    "ZK": ["Z", "K"],
    "UL": ["U", "L"],
    "OH": ["O", "H"],
    "G": ["ZK", "UL"],
    "GH": ["G", "H"],
    "GO": ["G", "O"],
    "UH": ["U", "H"],
    "UO": ["U", "O"],
    "LH": ["L", "H"],
    "LO": ["L", "O"],
    "ZH": ["Z", "H"],
    "ZO": ["Z", "O"],
    "KH": ["K", "H"],
    "KO": ["K", "O"],
    "GH2O": ["GH", "OH"],
    "GHO2": ["GO", "OH"],
    "UH2O": ["UH", "OH"],
    "UHO2": ["UO", "OH"],
    "LH2O": ["LH", "OH"],
    "LHO2": ["LO", "OH"],
    "ZH2O": ["ZH", "OH"],
    "ZHO2": ["ZO", "OH"],
    "KH2O": ["KH", "OH"],
    "KHO2": ["KO", "OH"],
    "XGH2O": ["X", "GH2O"],
    "XGHO2": ["X", "GHO2"],
    "XUH2O": ["X", "UH2O"],
    "XUHO2": ["X", "UHO2"],
    "XLH2O": ["X", "LH2O"],
    "XLHO2": ["X", "LHO2"],
    "XZH2O": ["X", "ZH2O"],
    "XZHO2": ["X", "ZHO2"],
    "XKH2O": ["X", "KH2O"],
    "XKHO2": ["X", "KHO2"],
}
export var mineral_compounds = <Array<MineralCompoundConstant>>Object.keys(allowed_reactions)
export var mineral_level: type_mineral_level = {
    "U": 0,
    "L": 0,
    "Z": 0,
    "K": 0,
    "O": 0,
    "H": 0,
    "X": 1,
    "UL": 0,
    "ZK": 0,
    "OH": 1,
    "G": 0,
    "GH": 0,
    "GO": 0,
    "UH": 0,
    "UO": 0,
    "LH": 0,
    "LO": 0,
    "ZH": 0,
    "ZO": 0,
    "KH": 0,
    "KO": 0,
    "GH2O": 1,
    "GHO2": 1,
    "UH2O": 1,
    "UHO2": 1,
    "LH2O": 1,
    "LHO2": 1,
    "ZH2O": 1,
    "ZHO2": 1,
    "KH2O": 1,
    "KHO2": 1,
    "XGH2O": 2,
    "XGHO2": 2,
    "XUH2O": 2,
    "XUHO2": 2,
    "XLH2O": 2,
    "XLHO2": 2,
    "XZH2O": 2,
    "XZHO2": 2,
    "XKH2O": 2,
    "XKHO2": 2,
};
export var general_minerals = <Array<GeneralMineralConstant>> Object.keys(mineral_level);
export var basic_minerals = <Array<MineralConstant>>['U', 'L', 'Z', 'K', 'X', 'O', 'H'];
let amount_mapping = [1960, 840, 0];
var temp_mineral_minimum_amount: any = {};
for (let key in mineral_level) {
    temp_mineral_minimum_amount[key] = amount_mapping[mineral_level[ < GeneralMineralConstant > key]];
}
export var mineral_minimum_amount = < type_mineral_minimum_amount > temp_mineral_minimum_amount;
