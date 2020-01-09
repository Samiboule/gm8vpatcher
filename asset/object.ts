import { SmartBuffer } from "smart-buffer"
import { Asset } from "../asset"
import { CodeAction } from "./codeaction"

const VERSION: number = 430;
const VERSION_EVENT: number = 400;

export class GMObject extends Asset {
	public name: string;
	public spriteIndex: number;
	public solid: boolean;
	public visible: boolean;
	public depth: number;
	public persistent: boolean;
	public parentIndex: number;
	public maskIndex: number;
	public events: Array<Array<[number, Array<CodeAction>]>>;
	public static deserialize(data: SmartBuffer): GMObject {
		const object: GMObject = new GMObject();
		object.name = data.readString(data.readUInt32LE());
		if(data.readUInt32LE() != VERSION)
			throw new Error("Object version is incorrect");
		object.spriteIndex = data.readUInt32LE();
		object.solid = data.readUInt32LE() != 0;
		object.visible = data.readUInt32LE() != 0;
		object.depth = data.readUInt32LE();
		object.persistent = data.readUInt32LE() != 0;
		object.parentIndex = data.readUInt32LE();
		object.maskIndex = data.readUInt32LE();
		const eventListCount: number = data.readUInt32LE();
		if(eventListCount != 11)
			throw new Error("Malformed data");
		object.events = new Array(eventListCount+1);
		for(let i: number = 0; i <= eventListCount; ++i){
			const subEventList: Array<[number, Array<CodeAction>]> = new Array(0);
			while(true){
				const index: number = data.readInt32LE();
				if(index == -1)
					break;
				if(data.readUInt32LE() != VERSION_EVENT)
					throw new Error("Object event version is incorrect");
				const actionCount: number = data.readUInt32LE();
				const actions: Array<CodeAction> = new Array(actionCount);
				for(let j: number = 0; j < actionCount; ++j)
					actions.push(CodeAction.fromCur(data));
				subEventList.push([index, actions]);
			}
			object.events[i] = subEventList;
		}
		return object;
	}
	public serialize(data: SmartBuffer): void {
		// 
	}
}
