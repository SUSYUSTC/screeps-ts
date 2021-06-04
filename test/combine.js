const mymath = require("../dist/mymath")
let str1 = '\na\nabc'
let str2 = '\nd\ndef\ndefgh'
console.log(str1)
console.log(str2)

function vertical_split_string(str1, str2) {
	part1 = str1.split('\n').slice(1)
	part2 = str2.split('\n').slice(1)
	n1 = part1.length
	n2 = part2.length
	nmax = Math.max(n1, n2)
	let lens = part1.map((e) => e.length)
	let maxlen = mymath.max(lens) + 2
	console.log(maxlen)
	let result = ''
	for (let i of mymath.range(nmax)) {
		if (part1[i] == undefined) {
			part1[i] = ''
		}
		if (part2[i] == undefined) {
			part2[i] = ''
		}
		result += '\n'
		result += part1[i] + ' '.repeat(maxlen - part1[i].length) + part2[i]
	}
	return result;
}
