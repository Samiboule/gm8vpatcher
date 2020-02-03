import fs from "fs-extra"
import path from "path"

export class GMLCode {
	private static prefix: string = "__ONLINE_";
	private static variables: Array<string> = [];
	public static addVariables(...variables: Array<string>): void {
		GMLCode.variables.splice(0, 0, ...variables);
	}
	private static parseGML(lines: Array<string>, variables: Array<string>): [Array<string>, number] {
		let linesRead: number = 0;
		for(let i: number = 0; i < lines.length; ++i){
			const line: string = lines[i].trim();
			linesRead++;
			if(line.slice(0, 6) == "#endif"){
				return [lines.slice(0, i), linesRead-1];
			}else if(line.slice(0, 4) == "#if "){
				const beginIf: number = i;
				let not: boolean = false;
				if(line.slice(0, 8) == "#if not ")
					not = true;
				let variable = line.slice(not ? 8 : 4, line.length);
				let keep: boolean = variables.indexOf(variable) != -1;
				if(not)
					keep = !keep;
				const [ifSection, lengthOfSection]: [Array<string>, number] = GMLCode.parseGML(lines.slice(i+1, lines.length), variables);
				linesRead += lengthOfSection+1;
				if(lines[i+lengthOfSection+1].trim() != "#endif")
					throw new Error("Unexpected error");
				lines.splice(beginIf, lengthOfSection+2);
				i = beginIf;
				if(keep){
					lines.splice(i, 0, ...ifSection);
					i += ifSection.length;
				}
				--i;
			}
		}
		return [lines, linesRead];
	}
	public static async getGML(filename: string, ...args: Array<string | number>): Promise<string> {
		let gml: string = await fs.readFile(path.join(__dirname, "gml", `${filename}.gml`), "utf8");
		gml = gml.replace(/@/g, GMLCode.prefix);
		gml = gml.replace(/\t/g, "");
		for(let i: number = 0; i < args.length; ++i)
			gml = gml.replace(new RegExp(`%arg${i}`, "g"), args[i].toString());
		gml = GMLCode.parseGML(gml.split(/\r\n|\r|\n/g), GMLCode.variables)[0].join("\r\n");
		return gml;
	}
}
