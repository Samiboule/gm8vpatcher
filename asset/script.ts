import { SmartBuffer } from "smart-buffer"
import { Asset } from "../asset"

const VERSION: number = 800;

export class Script extends Asset {
	public name: string;
	public source: string;
	public static deserialize(data: SmartBuffer): Script {
		const script: Script = new Script();
		script.name = data.readString(data.readUInt32LE());
		if(data.readUInt32LE() != VERSION)
			throw new Error("Script version is incorrect");
		script.source = data.readString(data.readUInt32LE());
		return script;
	}
	public serialize(data: SmartBuffer): void {
		// 
	}
}
