export const OverflowingAdd = function(n1: number, n2: number, bytes: number): [number, boolean] {
	const max: number = Math.pow(2, bytes);
	let overflow: boolean = false;
	n1 += n2;
	while(n1 >= max){
		n1 -= max;
		overflow = true;
	}
	return [n1, overflow];
}
