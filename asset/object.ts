import { SmartBuffer } from "smart-buffer"
import { Asset } from "../asset"

const VERSION: number = 430;
const VERSION_EVENT: number = 400;

export class GMObject extends Asset {
	public name: string;
	public source: string;
	public static deserialize(data: SmartBuffer): GMObject {
		const object: GMObject = new GMObject();
		object.name = data.readString(data.readUInt32LE());
		if(data.readUInt32LE() != VERSION)
			throw new Error("Object version is incorrect");
		object.source = data.readString(data.readUInt32LE());
		return object;
	}
	public serialize(data: SmartBuffer): void {
		// 
	}
}
