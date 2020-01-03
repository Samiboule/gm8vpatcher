export class Utils {
	public static overflowingAdd = function(n1: number, n2: number, bytes: number): [number, boolean] {
		const max: number = Math.pow(2, bytes);
		let overflow: boolean = false;
		n1 += n2;
		while(n1 >= max){
			n1 -= max;
			overflow = true;
		}
		return [n1, overflow];
	}
	public static bytesToU32(bytes: [number, number, number, number]): number {
		let result: number = 0;
		for(let i = 0; i < 4; ++i)
			result += (bytes[i] << 8*(4-i)) >>> 0;
		return result;
	}
	public static u32ToBytes(u32: number): [number, number, number, number] {
		const result: [number, number, number, number] = [0, 0, 0, 0];
		for(let i = 0; i < 4; ++i)
			result[i] = ((u32 >> (8*(4-i))) & 0xFF) >>> 0;
		return result;
	}
	public static swapBytes32(input: number): number {
		const [a, b, c, d]: [number, number, number, number] = Utils.u32ToBytes(input);
		// TODO: see why the order is weird
		return Utils.bytesToU32([b, a, d, c]);
	}
}
