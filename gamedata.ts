import { SmartBuffer } from "smart-buffer"
import { Unpack } from "./upx"
import { Antidec, AntidecMetadata } from "./gamedata/antidec"
import { GM81, XorMethod } from "./gamedata/gm81"
import { GM80 } from "./gamedata/gm80"

export enum GameVersion {
	GameMaker80,
	GameMaker81,
}

export class GameData {
	public static decrypt(exe: SmartBuffer, upxData: [number, number]): GameVersion {
		let unpacked: SmartBuffer = exe;
		let upx: boolean = false;
		let ver: GameVersion = GameVersion.GameMaker80;
		if(upxData !== null){
			const maxSize: number = upxData[0];
			const diskOffset: number = upxData[1];
			unpacked = SmartBuffer.fromBuffer(Buffer.from(Unpack(exe, maxSize, diskOffset)));
			upx = true;
		}
		let antidecSettings: AntidecMetadata = Antidec.check80(unpacked);
		if(antidecSettings === null){
			Antidec.check81(unpacked);
			ver = GameVersion.GameMaker81;
		}
		if(upx)
			unpacked.destroy();
		if(antidecSettings === null){
			if(GM80.check(exe))
				return GameVersion.GameMaker80;
			if(GM81.check(exe))
				return GameVersion.GameMaker81;
			if(GM81.checkLazy(exe))
				return GameVersion.GameMaker81;
		}
		Antidec.decrypt(exe, antidecSettings);
		if(ver == GameVersion.GameMaker81){
			GM81.decrypt(exe, XorMethod.Normal);
			exe.readOffset += 4;
		}
		exe.readOffset += 16;
		return ver;
	}
	public static encrypt(exe: SmartBuffer, upxData: [number, number]): void {
		if(upxData !== null){
			const maxSize: number = upxData[0];
			const diskOffset: number = upxData[1];
			const unpacked: SmartBuffer = SmartBuffer.fromBuffer(Buffer.from(Unpack(exe, maxSize, diskOffset)));
			let antidecSettings: AntidecMetadata = Antidec.check80(unpacked);
			if(antidecSettings !== null){
				Antidec.encrypt(exe, antidecSettings);
				return;
			}
			antidecSettings = Antidec.check81(unpacked);
			if(antidecSettings !== null){
				// TODO: Do GM81 encryption if the header is found
				Antidec.encrypt(exe, antidecSettings);
				return;
			}
			throw new Error("Unknown format");
		}else{
			console.log("null");
		}
	}
}
