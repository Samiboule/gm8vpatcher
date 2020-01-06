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
		// TODO: rewrite everything with less code
		if(upxData !== null){
			const maxSize: number = upxData[0];
			const diskOffset: number = upxData[1];
			const unpacked: SmartBuffer = SmartBuffer.fromBuffer(Buffer.from(Unpack(exe, maxSize, diskOffset)));
			let antidecSettings: AntidecMetadata = Antidec.check80(unpacked);
			if(antidecSettings !== null){
				unpacked.destroy();
				if(Antidec.decrypt(exe, antidecSettings)){
					exe.readOffset += 16;
					return GameVersion.GameMaker80;
				}
				throw new Error("Unknown format");
			}
			antidecSettings = Antidec.check81(unpacked);
			unpacked.destroy();
			if(antidecSettings !== null){
				if(Antidec.decrypt(exe, antidecSettings)){
					if(GM81.seekValue(exe, 0xF7140067) !== null){
						GM81.decrypt(exe, XorMethod.Normal);
						exe.readOffset += 20;
						return GameVersion.GameMaker81;
					}
				}
			}
			throw new Error("Unknown format");
		}else{
			let antidecSettings: AntidecMetadata = Antidec.check80(exe);
			if(antidecSettings !== null){
				if(Antidec.decrypt(exe, antidecSettings)){
					exe.readOffset += 16;
					return GameVersion.GameMaker80;
				}
				throw new Error("Unknown format");
			}
			antidecSettings = Antidec.check81(exe);
			if(antidecSettings !== null){
				if(Antidec.decrypt(exe, antidecSettings)){
					if(GM81.seekValue(exe, 0xF7140067) !== null){
						GM81.decrypt(exe, XorMethod.Normal);
						exe.readOffset += 20;
						return GameVersion.GameMaker81;
					}
					throw new Error("Unknown format");
				}
			}else{
				if(GM80.check(exe))
					return GameVersion.GameMaker80;
				if(GM81.check(exe))
					return GameVersion.GameMaker81;
				if(GM81.checkLazy(exe))
					return GameVersion.GameMaker81;
				throw new Error("Unknown format");
			}
		}
		return GameVersion.GameMaker80;
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
