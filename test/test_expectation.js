function get_expected_addition_amount(cd, last_cd, t, rate) {
	let accumulated_time = cd;
	let init_amount = Math.ceil((last_cd * 1000) ** (1/1.2));
	let additional_amount = rate;
	while (true) {
		let delta_t = Math.ceil((init_amount + additional_amount) ** 1.2 * 0.001);
		if (accumulated_time + delta_t > t) {
			return additional_amount;
		} else {
			accumulated_time += delta_t;
			additional_amount += rate;
		}
	}
}

console.log(get_expected_addition_amount(1, 4, 300, 24))
