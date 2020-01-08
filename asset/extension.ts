import { SmartBuffer } from "smart-buffer"

const ARG_MAX = 17;
const VERSION = 700;

interface ExtFile {
	name: string;
	kind: FileKind;
	initializer: string;
	finalizer: string;
	functions: Array<FileFunction>;
	constants: Array<FileConst>;
}

enum FileKind {
	DynamicLibrary = 1,
	GmlScript = 2,
	ActionLibrary = 3,
	Other = 4,
}

const FileKindFrom = function(n: number): FileKind {
	switch(n){
		case FileKind.DynamicLibrary:
			return FileKind.DynamicLibrary;
		case FileKind.GmlScript:
			return FileKind.GmlScript;
		case FileKind.ActionLibrary:
			return FileKind.ActionLibrary;
		case FileKind.Other:
		default:
			return FileKind.Other;
	}
}

enum FunctionValueKind {
	GMString = 1,
	GMReal = 2,
}

const FunctionValueKindFrom = function(n: number): FunctionValueKind {
	switch(n){
		case FunctionValueKind.GMString:
			return FunctionValueKind.GMString;
		case FunctionValueKind.GMReal:
		default:
			return FunctionValueKind.GMReal;
	}
}

interface FileFunction {
	name: string;
	externalName: string;
	convention: CallingConvention;
	id: number;
	argCount: number;
	argTypes: Array<FunctionValueKind>;
	returnType: FunctionValueKind;
}

interface FileConst {
	name: string;
	value: string;
}

enum CallingConvention {
	Gml = 2,
	Stdcall = 11,
	Cdecl = 12,
	Unknown,
}

const CallingConventionFrom = function(n: number): CallingConvention {
	switch(n){
		case CallingConvention.Gml:
			return CallingConvention.Gml;
		case CallingConvention.Stdcall:
			return CallingConvention.Stdcall;
		case CallingConvention.Cdecl:
			return CallingConvention.Cdecl;
		default:
			return CallingConvention.Unknown;
	}
}

export class Extension {
	public name: string;
	public folderName: string;
	public files: Array<ExtFile>;
	public content: Array<number>;
	public static read(exe: SmartBuffer): Extension {
		const ext: Extension = new Extension();
		const backupOffset: number = exe.readOffset;
		if(exe.readUInt32LE() != VERSION)
			throw new Error("Extension version is incorrect");
		ext.name = exe.readString(exe.readUInt32LE());
		ext.folderName = exe.readString(exe.readUInt32LE());
		const fileCount = exe.readUInt32LE();
		ext.files = new Array(fileCount);
		for(let i: number = 0; i < fileCount; ++i){
			if(exe.readUInt32LE() != VERSION)
				throw new Error("Extension file version is incorrect");
			const name: string = exe.readString(exe.readUInt32LE());
			const kind: FileKind = FileKindFrom(exe.readUInt32LE());
			const initializer: string = exe.readString(exe.readUInt32LE());
			const finalizer: string = exe.readString(exe.readUInt32LE());
			const functionCount: number = exe.readUInt32LE();
			const functions: Array<FileFunction> = new Array(functionCount);
			for(let j: number = 0; j < functionCount; ++j){
				if(exe.readUInt32LE() != VERSION)
					throw new Error("Extension file function version is incorrect");
				const name: string = exe.readString(exe.readUInt32LE());
				const externalName: string = exe.readString(exe.readUInt32LE());
				const convention: CallingConvention = CallingConventionFrom(exe.readUInt32LE());
				const id: number = exe.readUInt32LE();
				const argCount: number = exe.readUInt32LE();
				const argTypes: Array<FunctionValueKind> = new Array(ARG_MAX).fill(FunctionValueKind.GMReal);
				for(let k: number = 0; k < ARG_MAX; ++k)
					argTypes[k] = FunctionValueKindFrom(exe.readUInt32LE());
				const returnType: FunctionValueKind = FunctionValueKindFrom(exe.readUInt32LE());
				functions[j] = {
					name: name,
					externalName: externalName,
					convention: convention,
					id: id,
					argCount: argCount,
					argTypes: argTypes,
					returnType: returnType,
				}
			}
			const constCount: number = exe.readUInt32LE();
			const constants: Array<FileConst> = new Array(constCount);
			for(let j: number = 0; j < constCount; ++j){
				if(exe.readUInt32LE() != VERSION)
					throw new Error("Extension file constant version is incorrect");
				const name: string = exe.readString(exe.readUInt32LE());
				const value: string = exe.readString(exe.readUInt32LE());
				constants[j] = {
					name: name,
					value: value,
				}
			}
			ext.files[i] = {
				name: name,
				kind: kind,
				initializer: initializer,
				finalizer: finalizer,
				functions: functions,
				constants: constants,
			}
		}
		const contentsLength: number = exe.readUInt32LE()-4;
		exe.readUInt32LE();
		exe.readOffset += contentsLength;
		ext.content = [...exe.internalBuffer.slice(backupOffset, exe.readOffset)];
		return ext;
	}
}
