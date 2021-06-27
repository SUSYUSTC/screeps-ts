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
    "X": 0,
    "UL": 1,
    "ZK": 1,
    "OH": 1,
    "G": 1,
    "GH": 1,
    "GO": 1,
    "UH": 1,
    "UO": 1,
    "LH": 1,
    "LO": 1,
    "ZH": 1,
    "ZO": 1,
    "KH": 1,
    "KO": 1,
    "GH2O": 2,
    "GHO2": 2,
    "UH2O": 2,
    "UHO2": 2,
    "LH2O": 2,
    "LHO2": 2,
    "ZH2O": 2,
    "ZHO2": 2,
    "KH2O": 2,
    "KHO2": 2,
    "XGH2O": 3,
    "XGHO2": 3,
    "XUH2O": 3,
    "XUHO2": 3,
    "XLH2O": 3,
    "XLHO2": 3,
    "XZH2O": 3,
    "XZHO2": 3,
    "XKH2O": 3,
    "XKHO2": 3,
};
export var general_minerals = <Array<GeneralMineralConstant>> Object.keys(mineral_level);
export var t1_minerals = general_minerals.filter((e) => mineral_level[e] == 1)
export var t2_minerals = general_minerals.filter((e) => mineral_level[e] == 2)
export var t3_minerals = general_minerals.map((e) => mineral_level[e] == 3)
export var t12_minerals = t1_minerals.concat(t2_minerals);
export var basic_minerals = <Array<MineralConstant>>['U', 'L', 'Z', 'K', 'X', 'O', 'H'];
export var t012_minerals = (<Array<GeneralMineralConstant>>basic_minerals).concat(t12_minerals);
