import { SmartBuffer } from "smart-buffer"
import { Unpack } from "./upx"

export enum GameVersion {
	GameMaker80,
	GameMaker81,
}

export const FindGameData = function(exe: SmartBuffer, upxData: [number, number]): GameVersion {
    if(upxData !== null){
        const maxSize: number = upxData[0];
        const diskOffset: number = upxData[1];
        const unpacked: Array<number> = Unpack(exe, maxSize, diskOffset);
        console.log(`Successfully unpacked UPX - output is ${unpacked.length} bytes`);
    }else{
        console.log("null");
    }
    return GameVersion.GameMaker80;
}
