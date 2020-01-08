export class Utils {
	public static overflowingAdd = function(n1: number, n2: number, bits: number): [number, boolean] {
		const max: number = Math.pow(2, bits);
		n1 += n2;
		return [n1%max, n1 >= max];
	}
	public static overflowingSub = function(n1: number, n2: number, bits: number): [number, boolean] {
		const max: number = Math.pow(2, bits);
		n1 -= n2;
		return [((n1%max)+max)%max, n1 < 0];
	}
	public static bytesToU32(bytes: [number, number, number, number]): number {
		let result: number = 0;
		const bytesCount: number = 4;
		for(let i = 0; i < bytesCount; ++i)
			result += (bytes[i] << 8*(bytesCount-i-1)) >>> 0;
		return result;
	}
	public static u32ToBytes(u32: number): [number, number, number, number] {
		const result: [number, number, number, number] = [0, 0, 0, 0];
		const bytesCount: number = 4;
		for(let i = 0; i < bytesCount; ++i)
			result[i] = ((u32 >> (8*(bytesCount-i-1))) & 0xFF) >>> 0;
		return result;
	}
	public static swapBytes32(input: number): number {
		const [a, b, c, d]: [number, number, number, number] = Utils.u32ToBytes(input);
		return Utils.bytesToU32([d, c, b, a]);
	}
}
