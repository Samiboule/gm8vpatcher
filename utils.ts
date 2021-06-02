import { exec } from "child_process"
import { ncp } from "ncp"
import readline from "readline"
import rimraf from "rimraf"
import process from "process"

export interface Ports {
	tcp: number,
	udp: number,
}

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
	public static exec(cmd: string, cwd: string, verbose: boolean = false): Promise<string> {
		return new Promise((resolve, reject) => {
			const std = {
				out: "",
				err: "",
			}
			const process = exec(cmd, {
				cwd: cwd,
				windowsHide: true,
			});
			for(const stream in std)
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
				if(code)
					reject(new Error(std.err));
				else
					resolve(""/*std.out*/);
			});
		});
	}
	public static rimraf(dir: string): Promise<string> {
		return new Promise(function(resolve: (a: undefined) => void, reject: (err: NodeJS.ErrnoException) => void): void {
			rimraf(dir, function(err): void {
				if(err)
					reject(err);
				else
					resolve(undefined);
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
	public static getString(message: string): Promise<string> {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		return new Promise((resolve, _) => {
			rl.question(message, function(answer: string): void {
				rl.close();
				resolve(answer);
			});
		});
	}
	public static getVersion(): string {
		return require("./package.json").version;
	}
}
