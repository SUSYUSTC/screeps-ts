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
export var t1_minerals = general_minerals.filter((e) => mineral_level[e] == 1);
export var t2_minerals = general_minerals.filter((e) => mineral_level[e] == 2);
export var t3_minerals = general_minerals.filter((e) => mineral_level[e] == 3);
export var t12_minerals = t1_minerals.concat(t2_minerals);
export var basic_minerals = <Array<MineralConstant>>['U', 'L', 'Z', 'K', 'X', 'O', 'H'];
export var t012_minerals = (<Array<GeneralMineralConstant>>basic_minerals).concat(t12_minerals);
export var bars = <ResourceConstant[]> ['utrium_bar', 'lemergium_bar', 'zynthium_bar', 'keanium_bar', 'ghodium_melt', 'oxidant', 'reductant', 'purifier', 'composite', 'crystal', 'liquid'];
export var basic_commodities : ResourceConstant[] = ['silicon', 'metal', 'biomass', 'mist'];
type type_basic_commodity_production = {
	[key in type_zone]: {
		bar: CommodityConstant,
		depo: ResourceConstant,
		product: CommodityConstant,
	}
}
type type_commodities_related_requirement = {
	[key in type_zone]: {
		bars: CommodityConstant[],
		depo: ResourceConstant,
		products: CommodityConstant[],
	}
}
export var zones: type_zone[] = ["U", "L", "Z", "K"];
export var basic_commodity_production: type_basic_commodity_production = {
	U: {
		bar: 'utrium_bar',
		depo: 'silicon',
		product: 'wire',
	},
	L: {
		bar: 'lemergium_bar',
		depo: 'biomass',
		product: 'cell',
	},
	Z: {
		bar: 'zynthium_bar',
		depo: 'metal',
		product: 'alloy',
	},
	K: {
		bar: 'keanium_bar',
		depo: 'mist',
		product: 'condensate',
	},
}
export var commodities_related_requirements: type_commodities_related_requirement = {
	U: {
		bars: ['utrium_bar', 'oxidant'],
		depo: 'silicon',
		products: ['wire', 'switch'],
	},
	L: {
		bars: ['lemergium_bar', 'oxidant'],
		depo: 'biomass',
		products: ['cell', 'phlegm'],
	},
	Z: {
		bars: ['zynthium_bar'],
		depo: 'metal',
		products: ['alloy', 'tube'],
	},
	K: {
		bars: ['keanium_bar', 'reductant'],
		depo: 'mist',
		products: ['condensate', 'concentrate'],
	}
}
export var commodity_levels: {[key in CommodityConstant] ?: number} = {
	'wire': 0,
	'cell': 0,
	'alloy': 0,
	'condensate': 0,
	'switch': 1,
	'phlegm': 1,
	'tube': 1,
	'concentrate': 1,
	'transistor': 2,
	'tissue': 2,
	'fixtures': 2,
	'extract': 2,
}
export var combating_t3: GeneralMineralConstant[] = ['XGHO2', 'XUH2O', 'XLHO2', 'XZH2O', 'XZHO2', 'XKHO2'];
export var direction2name: {[key in DirectionConstant]: string} = {
	[TOP]: "top",
	[BOTTOM]: "bottom",
	[RIGHT]: "right",
	[LEFT]: "left",
	[TOP_RIGHT]: "top_right",
	[TOP_LEFT]: "top_left", 
	[BOTTOM_RIGHT]: "bottom_right",
	[BOTTOM_LEFT]: "bottom_left",
}
