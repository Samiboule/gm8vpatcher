import fs from "fs-extra"
import path from "path"
import { SmartBuffer } from "smart-buffer"
import { PESection, WindowsIcon, Icon } from "./icon"
import { GameVersion, GameData } from "./gamedata"
import { Settings } from "./settings"

const main = async () => {
	const input: string = path.join(__dirname, "tests", "k2.exe");
	const output: string = path.join(__dirname, "tests", "k2_modded.exe");
	if(!await fs.exists(input))
		throw new Error("The input file does not exist");
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
		const virtualSize: number = exe.readUInt32LE();
		const virtualAddress: number = exe.readUInt32LE();
		const diskSize: number = exe.readUInt32LE();
		const diskAddress: number = exe.readUInt32LE();
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
		[iconData, icoFileRaw] = Icon.find(exe, sections);
		exe.readOffset = readOffsetBackup;
		await Icon.save(iconData, path.join(__dirname, "tests", "issou"));
	}
	let upxData: [number, number] = null;
	if(upx0VirtualLength !== null && upx1Data !== null)
		upxData = [upx0VirtualLength+upx1Data[0], upx1Data[1]];
	const gameVer: GameVersion = GameData.decrypt(exe, upxData);
	console.log(GameVersion[gameVer]);
	const settingsLength: number = exe.readUInt32LE();
	const settingsStart: number = exe.readOffset;
	const settings: Settings = Settings.load(exe, gameVer, settingsStart, settingsLength);
	// TODO: check why scaling of 0 does not work
	settings.scaling = -1;
	// 
	settings.showErrorMessage = false;
	settings.logErrors = false;
	settings.save(exe, gameVer, settingsStart, settingsLength);
	console.log("Encrypting back");
	GameData.encrypt(exe, upxData);
	console.log("Writing file");
	await fs.writeFile(output, exe.internalBuffer);
	console.log("Ended parsing!");
}

main().catch(console.error);
