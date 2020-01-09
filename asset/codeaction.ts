import { SmartBuffer } from "smart-buffer"

const VERSION: number = 440;
const PARAM_COUNT: number = 8;

export class CodeAction {
	public id: number;
	public appliesTo: number;
	public isCondition: boolean;
	public invertCondition: boolean;
	public isRelative: boolean;
	public libID: number;
	public actionKind: number;
	public actionIDX: number;
	public canBeRelative: number;
	public appliesToSomething: boolean;
	public fnName: string;
	public fnCode: string;
	public paramCount: number;
	public paramTypes: Array<number>;
	public paramStrings: Array<string>;
	public static fromCur(data: SmartBuffer): CodeAction {
		if(data.readUInt32LE() != VERSION)
			throw new Error("CodeAction version is incorrect");
		const codeAction: CodeAction = new CodeAction();
		codeAction.libID = data.readUInt32LE();
		codeAction.id = data.readUInt32LE();
		codeAction.actionKind = data.readUInt32LE();
		codeAction.canBeRelative = data.readUInt32LE();
		codeAction.isCondition = data.readUInt32LE() != 0;
		codeAction.appliesToSomething = data.readUInt32LE() != 0;
		codeAction.actionIDX = data.readUInt32LE();
		codeAction.fnName = data.readString(data.readUInt32LE());
		codeAction.fnCode = data.readString(data.readUInt32LE());
		codeAction.paramCount = data.readUInt32LE();
		if(codeAction.paramCount > PARAM_COUNT)
			throw new Error("Param count too large");
		if(data.readUInt32LE() != PARAM_COUNT)
			throw new Error("CodeAction param count is incorrect");
		codeAction.paramTypes = new Array(PARAM_COUNT);
		for(let i: number = 0; i < PARAM_COUNT; ++i)
			codeAction.paramTypes[i] = data.readUInt32LE();
		codeAction.appliesTo = data.readUInt32LE();
		codeAction.isRelative = data.readUInt32LE() != 0;
		if(data.readUInt32LE() != PARAM_COUNT)
			throw new Error("CodeAction param count 2 is incorrect");
		codeAction.paramStrings = new Array(PARAM_COUNT);
		for(let i: number = 0; i < PARAM_COUNT; ++i)
			codeAction.paramStrings[i] = data.readString(data.readUInt32LE());
		codeAction.invertCondition = data.readUInt32LE() != 0;
		return codeAction;
	}
}
