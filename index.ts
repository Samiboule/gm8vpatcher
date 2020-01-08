import fs from "fs-extra"
import path from "path"
import { SmartBuffer } from "smart-buffer"
import { PESection, WindowsIcon, Icon } from "./icon"
import { GameConfig, GameData } from "./gamedata"
import { GM80 } from "./gamedata/gm80"
import { Settings } from "./settings"

const main = async () => {
	const name: string = "k3";
	const input: string = path.join(__dirname, "tests", `${name}.exe`);
	const output: string = path.join(__dirname, "tests", `${name}_modded.exe`);
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
	const gameConfig: GameConfig = GameData.decrypt(exe, upxData);
	const settingsLength: number = exe.readUInt32LE();
	const settingsStart: number = exe.readOffset;
	const settings: Settings = Settings.load(exe, gameConfig, settingsStart, settingsLength);
	settings.showErrorMessage = false;
	settings.logErrors = false;
	settings.scaling = 0;
	settings.f4FullscreenToggle = true;
	const dllNameLength: number = exe.readUInt32LE();
	exe.readOffset += dllNameLength;
	const dxDll: Array<number> = [...exe.readBuffer(exe.readUInt32LE())];
	const encryptionStartGM80: number = exe.readOffset;
	GM80.decrypt(exe);
	const garbageDWords = exe.readUInt32LE();
	exe.readOffset += garbageDWords*4;
	exe.writeOffset = exe.readOffset;
	exe.writeUInt32LE(1);
	const proFlag: boolean = exe.readUInt32LE() != 0;
	const gameID: number = exe.readUInt32LE();
	// 
	exe.readOffset = encryptionStartGM80;
	GM80.encrypt(exe);
	settings.save(exe);
	console.log("Encrypting back");
	GameData.encrypt(exe, gameConfig);
	console.log("Writing file");
	await fs.writeFile(output, exe.toBuffer());
}

main().catch(console.error);
