const plus = (a: number, b: number): number => a + b;
const minus = (a: number, b: number): number => a - b;
const multiply = (a: number, b: number): number => a * b;
const divide = (a: number, b: number): number => a / b;
export function array_sum(arr: number[]): number {
    return arr.reduce(plus, 0);
}
export function array_mean(arr: number[]): number {
    return array_sum(arr) / arr.length;
}
export function array_ele < T1, T2, T3 > (f: {
    (x: T1, y: T2): T3
}, arr1: T1[], arr2: T2[]): T3[] {
    if (arr1.length !== arr2.length) {
        throw Error("different length of arrays")
    }
    var result = [];
    for (var i = 0; i < arr1.length; i++) {
        result.push(f(arr1[i], arr2[i]));
    }
    return result;
}
export function array_ele_plus(arr1: number[], arr2: number[]): number[] {
    return array_ele(plus, arr1, arr2);
}
export function array_ele_minus(arr1: number[], arr2: number[]): number[] {
    return array_ele(minus, arr1, arr2);
}
export function array_ele_multiply(arr1: number[], arr2: number[]): number[] {
    return array_ele(multiply, arr1, arr2);
}
export function array_ele_divide(arr1: number[], arr2: number[]): number[] {
    return array_ele(divide, arr1, arr2);
}
export function argmax(arr: number[]): number {
    return arr.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}
export function argmin(arr: number[]): number {
    return arr.map((x, i) => [x, i]).reduce((r, a) => (a[0] < r[0] ? a : r))[1];
}

export function all(arr: boolean[]): boolean {
    return arr.reduce((a, b) => a && b, true);
}

export function any(arr: boolean[]): boolean {
    return arr.reduce((a, b) => a || b, false);
}

export function range(n: number): number[] {
    var result = []
    for (let i = 0; i < n; i++) {
        result.push(i);
    }
    return result;
}

export function where(arr: boolean[]): number[] {
    var result: number[] = [];
    range(arr.length).forEach((e) => {
        arr[e] && result.push(e)
    });
    return result
}

export function array_equal(arr1: any[], arr2: any[]): boolean {
    if (arr1.length !== arr2.length) {
        return false;
    }
    if (all(range(arr1.length).map((i) => arr1[i] == arr2[i]))) {
        return true;
    } else {
        return false;
    }
}

export function argsort(array: number[]) {
    const arrayObject = array.map((value, idx) => {
        return {
            value,
            idx
        };
    });
    arrayObject.sort((a, b) => {
        if (a.value < b.value) {
            return -1;
        }
        if (a.value > b.value) {
            return 1;
        }
        return 0;
    });
    const argIndices = arrayObject.map(data => data.idx);
    return argIndices;
}
