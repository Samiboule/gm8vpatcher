import { SmartBuffer } from "smart-buffer"
import { Unpack } from "./upx"
import { Antidec, AntidecMetadata } from "./gamedata/antidec"

export enum GameVersion {
	GameMaker80,
	GameMaker81,
}

export class GameData {
    public static find(exe: SmartBuffer, upxData: [number, number]): GameVersion {
        if(upxData !== null){
            const maxSize: number = upxData[0];
            const diskOffset: number = upxData[1];
            const unpacked: SmartBuffer = SmartBuffer.fromBuffer(Buffer.from(Unpack(exe, maxSize, diskOffset)));
            console.log(`Successfully unpacked UPX - output is ${unpacked.length} bytes`);
            let antidecSettings: AntidecMetadata = Antidec.check80(unpacked);
            if(antidecSettings !== null){
                if(Antidec.decrypt(exe, antidecSettings)){
                    exe.readOffset += 16;
                    return GameVersion.GameMaker80;
                }
                throw new Error("Unknown format");
            }
            antidecSettings = Antidec.check81(unpacked);
            if(antidecSettings !== null){
                if(Antidec.decrypt(exe, antidecSettings)){
                    // TODO: Do GM81 decryption if the header is found
                    return GameVersion.GameMaker81;
                }
                throw new Error("Unknown format");
            }
            throw new Error("Unknown format");
        }else{
            console.log("null");
        }
        return GameVersion.GameMaker80;
    }
}

