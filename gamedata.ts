import { SmartBuffer } from "smart-buffer"
import { Unpack } from "./upx"
import { Antidec, AntidecMetadata } from "./gamedata/antidec"
import { GM81, XorMethod } from "./gamedata/gm81"
import { GM80 } from "./gamedata/gm80"

export enum GameVersion {
	GameMaker80,
	GameMaker81,
}

export interface GameConfig {
	version: GameVersion;
	antidecSettings: AntidecMetadata;
}

export class GameData {
	public static decrypt(exe: SmartBuffer, upxData: [number, number]): GameConfig {
		let unpacked: SmartBuffer = exe;
		const config: GameConfig = {
			version: GameVersion.GameMaker80,
			antidecSettings: null,
		};
		if(upxData !== null){
			const maxSize: number = upxData[0];
			const diskOffset: number = upxData[1];
			unpacked = SmartBuffer.fromBuffer(Buffer.from(Unpack(exe, maxSize, diskOffset)));
		}
		config.antidecSettings = Antidec.check80(unpacked);
		if(config.antidecSettings === null){
			Antidec.check81(unpacked);
			config.version = GameVersion.GameMaker81;
		}
		if(upxData !== null)
			unpacked.destroy();
		if(config.antidecSettings === null){
			config.version = GameVersion.GameMaker80;
			if(GM80.check(exe))
				return config;
			config.version = GameVersion.GameMaker81;
			if(GM81.check(exe))
				return config;
			if(GM81.checkLazy(exe))
				return config;
			throw new Error("Unknown format");
		}
		if(!Antidec.decrypt(exe, config.antidecSettings))
			throw new Error("Unknown format");
		if(config.version == GameVersion.GameMaker81){
			if(GM81.seekValue(exe, 0xF7140067) !== null){
				GM81.decrypt(exe, XorMethod.Normal);
				exe.readOffset += 4;
			}else{
				throw new Error("Unknown format");
			}
		}
		exe.readOffset += 16;
		return config;
	}
	public static encrypt(exe: SmartBuffer, config: GameConfig): void {
		if(config.antidecSettings === null){
			if(config.version == GameVersion.GameMaker81){
				if(!GM81.check(exe))
					GM81.checkLazy(exe);
			}
		}else{
			if(config.version == GameVersion.GameMaker81){
				if(GM81.seekValue(exe, 0xF7140067) !== null)
					GM81.decrypt(exe, XorMethod.Normal);
			}
			Antidec.encrypt(exe, config.antidecSettings);
		}
	}
}
