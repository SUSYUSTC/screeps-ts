const plus = (a: number, b: number): number => a + b;
const minus = (a: number, b: number): number => a - b;
const multiply = (a: number, b: number): number => a * b;
const divide = (a: number, b: number): number => a / b;
const array_sum = (arr: number[]): number => {
    return arr.reduce(plus, 0);
}
function array_ele<T1, T2, T3>(f: {(x: T1, y: T2): T3}, arr1: T1[], arr2: T2[]): T3[] {
    if (arr1.length !== arr2.length) {
		throw Error("different length of arrays")
    }
    var result = [];
    for (var i = 0; i < arr1.length; i++) {
        result.push(f(arr1[i], arr2[i]));
    }
    return result;
}
const array_ele_plus = (arr1: number[], arr2: number[]): number[] => {
    return array_ele(plus, arr1, arr2);
}
const array_ele_minus = (arr1: number[], arr2: number[]): number[] => {
    return array_ele(minus, arr1, arr2);
}
const array_ele_multiply = (arr1: number[], arr2: number[]): number[] => {
    return array_ele(multiply, arr1, arr2);
}
const array_ele_divide = (arr1: number[], arr2: number[]): number[] => {
    return array_ele(divide, arr1, arr2);
}
const argmax = (arr: number[]): number => {
    return arr.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}
const argmin = (arr: number[]): number => {
    return arr.map((x, i) => [x, i]).reduce((r, a) => (a[0] < r[0] ? a : r))[1];
}

function all(arr: boolean[]): boolean {
    return arr.reduce((a, b) => a && b, true);
}

function any(arr: boolean[]): boolean {
    return arr.reduce((a, b) => a || b, false);
}

function range(n: number): number[] {
    var result = []
    for (let i = 0; i < n; i++) {
        result.push(i);
    }
    return result;
}

function where(arr: boolean[]): number[] {
    var result: number[] = [];
    range(arr.length).forEach((e) => {
        arr[e] && result.push(e)
    });
    return result
}

function array_equal(arr1: any[], arr2: any[]): boolean {
    if (arr1.length !== arr2.length) {
        return false;
    }
    if (all(range(arr1.length).map((i) => arr1[i] == arr2[i]))) {
        return true;
    } else {
        return false;
    }
}

module.exports.array_sum = array_sum;
module.exports.array_ele = array_ele;
module.exports.array_ele_plus = array_ele_plus;
module.exports.array_ele_minus = array_ele_minus;
module.exports.array_ele_multiply = array_ele_multiply;
module.exports.array_ele_divide = array_ele_divide;
module.exports.argmin = argmin;
module.exports.argmax = argmax;
module.exports.range = range;
module.exports.all = all;
module.exports.any = any;
module.exports.where = where;
module.exports.array_equal = array_equal;
