import { exec } from "child_process"
import { ncp } from "ncp"
import rimraf from "rimraf"

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
	public static exec(cmd: string, verbose: boolean = false): Promise<string> {
		return new Promise(function(resolve: (stdout: string) => void, reject: (stderr: string) => void): void {
			const std = {
				out: "",
				err: "",
			}
			if(verbose)
				console.log(`### STARTING PROCESS (${cmd}) ###`);
			let process = exec(cmd, {
				cwd: __dirname,
			});
			for(let stream in std)
				process[`std${stream}`].on("data", function(data: string): void {
					if(verbose){
						if(stream == "out")
							console.log(data);
						else
							console.error(data);
					}
					std[stream] += data;
				});
			process.on("exit", function(code: number): void {
				if(verbose)
					console.log(`### TERMINATED WITH CODE ${code} ###`);
				if(code)
					reject(std.err);
				else
					resolve(std.out);
			});
		});
	}
	public static rimraf(dir: string): Promise<string> {
		return new Promise(function(resolve: () => void, reject: (err: NodeJS.ErrnoException) => void): void {
			rimraf(dir, function(err): void {
				if(err)
					reject(err);
				else
					resolve();
			});
		});
	}
	public static copyDir(srcDir: string, destDir: string): Promise<void> {
		return new Promise(function(resolve, reject): void {
			ncp(srcDir, destDir, function(err: any): void {
				if(err)
					reject(err);
				else
					resolve();
			});
		});
	}
}
