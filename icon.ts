import { SmartBuffer } from "smart-buffer"

export interface PESection {
	virtualSize: number;
	virtualAddress: number;
	diskSize: number;
	diskAddress: number;
}

export interface WindowsIcon {
	width: number,
	height: number,
	originalBPP: number;
	bgraData: Uint8Array;
}

const writeUInt8Array = function(buff: SmartBuffer, arr: Uint8Array): void {
	for(let i: number = 0; i < arr.length; ++i){
		buff.writeUInt8(arr[i]);
	}
}

export const findIcons = function(exe: SmartBuffer, sections: Array<PESection>): [Array<WindowsIcon>, Uint8Array] {
	const rsrcBase: number = exe.readOffset;
	exe.readOffset += 12;
	const nameCount: number = exe.readUInt16LE();
	const idCount: number = exe.readUInt16LE();
	exe.readOffset += nameCount*8;
	let icons: Array<[number, number, number]> = [];
	for(let i: number = 0; i < idCount; ++i){
		const id: number = exe.readUInt32LE();
		const offset: number = exe.readUInt32LE() & 0x7FFFFFFF;
		if(id == 3){
			const topLevelPos: number = exe.readOffset;
			exe.readOffset = offset+rsrcBase+14;
			const leafCount: number = exe.readUInt16LE();
			if(leafCount == 0){
				return [[], Uint8Array.from([])];
			}
			for(let j: number = 0; j < leafCount; ++j){
				const leafPos: number = exe.readOffset;
				const iconID: number = exe.readUInt32LE();
				const languageOffset: number = exe.readUInt32LE() & 0x7FFFFFFF;
				exe.readOffset = languageOffset+rsrcBase+20;
				const leaf: number = exe.readUInt32LE();
				exe.readOffset = leaf+rsrcBase;
				const rva: number = exe.readUInt32LE();
				const size: number = exe.readUInt32LE();
				icons.push([iconID, rva, size]);
				exe.readOffset = leafPos+8;
			}
			exe.readOffset = topLevelPos;
		}else if(id == 14){
			exe.readOffset = offset+rsrcBase+12;
			const leafCount: number = exe.readUInt16LE()+exe.readUInt16LE();
			if(leafCount == 0){
				return [[], Uint8Array.from([])];
			}
			exe.readOffset += 4;
			const languageOffset: number = exe.readUInt32LE() & 0x7FFFFFFF;
			exe.readOffset = languageOffset+rsrcBase+20;
			const leaf: number = exe.readUInt32LE();
			exe.readOffset = leaf+rsrcBase;
			const rva: number = exe.readUInt32LE();
			const size: number = exe.readUInt32LE();
			const v: Uint8Array = extractVirtualBytes(exe, sections, rva, size);
			if(v !== null){
				const icoHeader: SmartBuffer = SmartBuffer.fromBuffer(Buffer.from(v));
				icoHeader.readOffset += 4;
				const imageCount: number = icoHeader.readUInt16LE();
				const iconGroup: Array<WindowsIcon> = [];
				const rawHeaderSize: number = 6+imageCount*16;
				const rawBodySize: number = icons.map(t => t[2]).reduce((a: number, b: number) => a+b, 0);
				const rawFile: SmartBuffer = SmartBuffer.fromSize(rawHeaderSize+rawBodySize); 
				const rawFileBody: SmartBuffer = SmartBuffer.fromSize(rawBodySize);
				writeUInt8Array(rawFile, v.slice(0, 6));
				for(let j: number = 0; j < imageCount; ++j){
					const pos: number = icoHeader.readOffset;
					writeUInt8Array(rawFile, v.slice(pos, pos+12));
					rawFile.writeUInt32LE(rawHeaderSize+rawFileBody.length);
					const width: number = icoHeader.readUInt8();
					const height: number = icoHeader.readUInt8();
					icoHeader.readOffset += 4;
					icoHeader.readUInt16LE();
					icoHeader.readOffset += 4;
					const ordinal: number = icoHeader.readUInt16LE();
					for(const icon of icons){
						if(icon[0] == ordinal && icon[2] >= 40){
							const v2: Uint8Array = extractVirtualBytes(exe, sections, icon[1], icon[2]);
							if(v2 !== null){
								writeUInt8Array(rawFileBody, v2);
								const i: WindowsIcon = makeIcon(width, height, v2);
								if(i !== null){
									iconGroup.push(i);
								}
							}
							break;
						}
					}
				}
				rawFile.writeBuffer(rawFileBody.toBuffer());
				return [iconGroup, Uint8Array.from([...rawFile.toBuffer()])];
			}
		}
	}
	return [[], Uint8Array.from([])];
}

const makeIcon = function(width: number, height: number, blob: Uint8Array): WindowsIcon {
	const data: SmartBuffer = SmartBuffer.fromBuffer(Buffer.from(blob));
	const dataStart = data.readUInt32LE();
	data.readOffset = 14;
	const bpp: number = data.readUInt16LE();
	data.readOffset = dataStart;
	const icoWH: (n: number) => number = n => n == 0 ? 256 : n;
	switch(bpp){
		case 32:
			const d: Buffer = data.toBuffer().subarray(dataStart, dataStart+width*height*4);
			if(d !== null){
				return {
					width: icoWH(width),
					height: icoWH(height),
					originalBPP: bpp,
					bgraData: Uint8Array.from([...d]),
				}
			}else{
				return null;
			}
		case 8:
			const pixelCount: number = width*height;
			const bgraData: SmartBuffer = SmartBuffer.fromSize(pixelCount*4);
			data.readOffset += 1024;
			for(let i: number = 0; i < pixelCount; ++i){
				const lutPos = dataStart+data.readUInt8()*4;
				writeUInt8Array(bgraData, blob.slice(lutPos, lutPos+4));
			}
			let cursor: number = 0;
			// while(cursor+4*8 <= bgraData.length){
			// 	let bitmask = data.readUInt8();
			// 	for(let i: number = 0; i < 8; ++i){
			// 		// const [m, b] = bitmask.overflowingAdd(bitmask);
			// 		// bitmask = m;
			// 		// bgraData[cursor+3] = b ? 0x0 : 0xFF;
			// 		// cursor += 4;
			// 	}
			// }
			// if(cursor < bgraData.length){
			// 	let bitmask = data.readUInt8();
			// 	while(cursor < bgraData.length){
			// 		// const [m, b] = bitmask.overflowingAdd(bitmask);
			// 		// bitmask = m;
			// 		// bgraData[cursor+3] = b ? 0x0 : 0xFF;
			// 		// cursor += 4;
			// 	}
			// }
			return {
				width: icoWH(width),
				height: icoWH(height),
				originalBPP: bpp,
				bgraData: Uint8Array.from([...bgraData.toBuffer()]),
			}
		default:
			return null;
	}
}

const extractVirtualBytes = function(exe: SmartBuffer, sections: Array<PESection>, rva: number, size: number): Uint8Array {
	for(const section of sections){
		if(rva >= section.virtualAddress && rva+size < section.virtualAddress+section.virtualSize){
			const offsetOnDisk: number = rva-section.virtualAddress;
			const dataLocation: number = section.diskAddress+offsetOnDisk;
			const readOffsetBackup: number = exe.readOffset;
			exe.readOffset = dataLocation;
			const arr: Buffer = exe.readBuffer(size);
			exe.readOffset = readOffsetBackup;
			return Uint8Array.from([...arr]);
		}
	}
	return null;
}
