import fs from "fs-extra"
import path from "path"
import { SmartBuffer } from "smart-buffer"
import { PESection, WindowsIcon, findIcons, SaveIcon } from "./icon"

const main = async () => {
	const input: string = path.join(__dirname, "tests", "k3.exe");
	if(!await fs.exists(input))
		throw new Error("The input file does not exist.");
	const exe: SmartBuffer = SmartBuffer.fromBuffer(await fs.readFile(input));
	if(exe.readString(2) != "MZ")
		throw new Error("Invalid exe header");
	exe.readOffset = 0x3C;
	exe.readOffset = exe.readUInt32LE();
	if(exe.readString(6) != "PE\0\0\x4C\x01")
		throw new Error("Invalid PE header");
	const sectionCount: number = exe.readUInt16LE();
	exe.readOffset += 12;
	const optionalLength: number = exe.readUInt16LE();
	exe.readOffset += optionalLength+2;
	let upx0VirtualLength: number = null;
	let upx1Data: [number, number] = null;
	let rsrcLocation: number = null;
	const sections: Array<PESection> = [];
	for(let i: number = 0; i < sectionCount; ++i){
		let sectionName: Buffer = exe.readBuffer(8);
		const virtualSize = exe.readUInt32LE();
		const virtualAddress = exe.readUInt32LE();
		const diskSize = exe.readUInt32LE();
		const diskAddress = exe.readUInt32LE();
		exe.readOffset += 16;
		if(sectionName.compare(Buffer.from([0x55, 0x50, 0x58, 0x30, 0x00, 0x00, 0x00, 0x00])) == 0)
			upx0VirtualLength = virtualSize;
		if(sectionName.compare(Buffer.from([0x55, 0x50, 0x58, 0x31, 0x00, 0x00, 0x00, 0x00])) == 0)
			upx1Data = [virtualSize, diskAddress];
		if(sectionName.compare(Buffer.from([0x2E, 0x72, 0x73, 0x72, 0x63, 0x00, 0x00, 0x00])) == 0)
			rsrcLocation = diskAddress;
		sections.push({
			virtualSize: virtualSize,
			virtualAddress: virtualAddress,
			diskSize: diskSize,
			diskAddress: diskAddress,
		});
	}
	let iconData: Array<WindowsIcon> = [];
	let icoFileRaw: Array<number> = [];
	if(rsrcLocation !== null){
		const readOffsetBackup = exe.readOffset;
		exe.readOffset = rsrcLocation;
		[iconData, icoFileRaw] = findIcons(exe, sections);
	}
	await SaveIcon(iconData, path.join(__dirname, "tests", "issou"));
	console.log("Ended parsing!");
}

main().catch(console.error);
