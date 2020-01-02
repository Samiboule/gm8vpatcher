import { SmartBuffer } from "smart-buffer"
import { OverflowingAdd } from "./utils"

export const Unpack = function(data: SmartBuffer, maxSize: number, diskOffset: number): Array<number> {
	const output: Array<number> = new Array(0x400).fill(0);
	data.readOffset = diskOffset+0xD;
	const pullNewBit = function(maskBuffer: number, nextBitBuffer: boolean, data: SmartBuffer): [number, boolean] {
		let [b, w]: [number, boolean] = OverflowingAdd(maskBuffer, maskBuffer, 32);
		if(b == 0){
			const v: number = data.readUInt32LE();
			[b, w] = OverflowingAdd(v, v, 32);
			maskBuffer = b+1;
			nextBitBuffer = w;
		}else{
			maskBuffer = b;
			nextBitBuffer = w;
		}
		return [maskBuffer, nextBitBuffer];
	}
	const v: number = data.readUInt32LE();
	let [b, w]: [number, boolean] = OverflowingAdd(v, v, 32);
	let maskBuffer: number = b+1;
	let nextBitBuffer: boolean = w;
	let uVar12: number = 0xFFFFFFFF;
	while(true){
		if(nextBitBuffer){
			output.push(data.readUInt8());
			[maskBuffer, nextBitBuffer] = pullNewBit(maskBuffer, nextBitBuffer, data);
			continue;
		}
		let uVar6: number = 1;
		while(true){
			[maskBuffer, nextBitBuffer] = pullNewBit(maskBuffer, nextBitBuffer, data);
			uVar6 = (uVar6 << 1) >>> 0;
			uVar6 = (uVar6 | Number(nextBitBuffer)) >>> 0;
			[maskBuffer, nextBitBuffer] = pullNewBit(maskBuffer, nextBitBuffer, data);
			if(nextBitBuffer)
				break;
			[maskBuffer, nextBitBuffer] = pullNewBit(maskBuffer, nextBitBuffer, data);
			uVar6 -= 1;
			uVar6 = (uVar6 << 1) >>> 0;
			uVar6 = (uVar6 | Number(nextBitBuffer)) >>> 0;
		}
		if(uVar6 < 3)
			[maskBuffer, nextBitBuffer] = pullNewBit(maskBuffer, nextBitBuffer, data);
		else{
			uVar12 = (uVar6-3 << 8 & 0xFFFFFF00)+(data.readUInt8() & 0xFF) ^ 0xFFFFFFFF >>> 0;
			if(uVar12 == 0)
				break;
			nextBitBuffer = (uVar12 & 1) != 0;
			uVar12 = uVar12 >> 1 >>> 0;
		}
		let byteCount: number = 0;
		let doPushBit: boolean = true;
		if(!nextBitBuffer){
			byteCount = 1;
			[maskBuffer, nextBitBuffer] = pullNewBit(maskBuffer, nextBitBuffer, data);
			if(!nextBitBuffer){
				while(true){
					[maskBuffer, nextBitBuffer] = pullNewBit(maskBuffer, nextBitBuffer, data);
					byteCount = byteCount << 1 >>> 0;
					byteCount += Number(nextBitBuffer);
					[maskBuffer, nextBitBuffer] = pullNewBit(maskBuffer, nextBitBuffer, data);
					if(nextBitBuffer)
						break;
				}
				byteCount += 2;
				doPushBit = false;
			}
		}
		if(doPushBit){
			[maskBuffer, nextBitBuffer] = pullNewBit(maskBuffer, nextBitBuffer, data);
			byteCount = byteCount << 1 >>> 0;
			byteCount += Number(nextBitBuffer);
		}
		byteCount += 2;
		if(uVar12 < 0xFFFFFB00)
			byteCount += 1;
		let cursor: number = OverflowingAdd(output.length, uVar12, 32)[0];
		for(let i: number = 0; i < byteCount; ++i){
			output.push(output[cursor]);
			cursor += 1;
		}
		[maskBuffer, nextBitBuffer] = pullNewBit(maskBuffer, nextBitBuffer, data);
	}
	return output;
}