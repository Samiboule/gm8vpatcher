import fs from "fs-extra"
import path from "path"
import zlib from "zlib"
import { SmartBuffer } from "smart-buffer"
import { PESection, WindowsIcon, Icon } from "./icon"
import { GameConfig, GameData } from "./gamedata"
import { GM80 } from "./gamedata/gm80"
import { Settings } from "./settings"
import { Asset } from "./asset"
import { Extension } from "./asset/extension"
import { Trigger } from "./asset/trigger"
import { Constant } from "./asset/constant"
import { Sound } from "./asset/sound"
import { Sprite } from "./asset/sprite"
import { Background } from "./asset/background"
import { Path } from "./asset/path"
import { Script } from "./asset/script"
import { Font } from "./asset/font"
import { Timeline } from "./asset/timeline"
import { GMObject } from "./asset/object"
import { GMLCode } from "./getGMLCode"

export const Converter = async function(input: string, output: string): Promise<void> {
	if(!await fs.exists(input))
		throw new Error("The input file does not exist");
	console.log("Reading file...");
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
	// let rsrcLocation: number = null;
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
		// if(sectionName.compare(Buffer.from([0x2E, 0x72, 0x73, 0x72, 0x63, 0x00, 0x00, 0x00])) == 0)
		// 	rsrcLocation = diskAddress;
		sections.push({
			virtualSize: virtualSize,
			virtualAddress: virtualAddress,
			diskSize: diskSize,
			diskAddress: diskAddress,
		});
	}
	// let iconData: Array<WindowsIcon> = [];
	// let icoFileRaw: Array<number> = [];
	// if(rsrcLocation !== null){
	// 	const readOffsetBackup = exe.readOffset;
	// 	exe.readOffset = rsrcLocation;
	// 	[iconData, icoFileRaw] = Icon.find(exe, sections);
	// 	exe.readOffset = readOffsetBackup;
	// 	await Icon.save(iconData, path.join(__dirname, "tests", "issou"));
	// }
	let upxData: [number, number] = null;
	if(upx0VirtualLength !== null && upx1Data !== null)
		upxData = [upx0VirtualLength+upx1Data[0], upx1Data[1]];
	console.log("Decrypting...");
	const gameConfig: GameConfig = GameData.decrypt(exe, upxData);
	const settingsLength: number = exe.readUInt32LE();
	const settingsStart: number = exe.readOffset;
	const settings: Settings = Settings.load(exe, gameConfig, settingsStart, settingsLength);
	settings.showErrorMessage = true;
	settings.alwaysAbort = false;
	settings.treatCloseAsEsc = true;
	settings.logErrors = false;
	settings.dontShowButtons = false;
	settings.f4FullscreenToggle = true;
	settings.allowResize = true;
	settings.scaling = -1;
	const dllNameLength: number = exe.readUInt32LE();
	exe.readOffset += dllNameLength;
	const dxDll: Array<number> = [...exe.readBuffer(exe.readUInt32LE())];
	const encryptionStartGM80: number = exe.readOffset;
	const ID: string = GM80.decrypt(exe);
	const garbageDWords = exe.readUInt32LE();
	exe.readOffset += garbageDWords*4;
	exe.writeOffset = exe.readOffset;
	exe.writeUInt32LE(Number(true));
	const proFlag: boolean = exe.readUInt32LE() != 0;
	const gameID: number = exe.readUInt32LE();
	const guid: [number, number, number, number] = [
		exe.readUInt32LE(),
		exe.readUInt32LE(),
		exe.readUInt32LE(),
		exe.readUInt32LE(),
	];
	const getAssetRefs = function(src: SmartBuffer): Array<Buffer> {
		const count: number = src.readUInt32LE();
		const refs: Array<Buffer> = new Array(count);
		for(let i: number = 0; i < count; ++i){
			const length: number = src.readUInt32LE();
			const data: Buffer = src.readBuffer(length);
			refs[i] = data;
		}
		return refs;
	}
	const getAssets = function(src: SmartBuffer, deserializer: (data: SmartBuffer) => Asset): Array<Asset> {
		const toAsset = function(ch: Buffer): Asset {
			const data: Buffer = zlib.inflateSync(ch);
			if(data.length < 4)
				throw new Error("Malformed data");
			if(data.slice(0, 4).compare(Buffer.from([0, 0, 0, 0])) == 0)
				return null;
			const sBuffer: SmartBuffer = SmartBuffer.fromBuffer(data.slice(4));
			const asset: Asset = deserializer(sBuffer);
			sBuffer.destroy();
			return asset;
		}
		return getAssetRefs(src).map(toAsset);
	}
	const putAssets = function(exe: SmartBuffer, assets: Array<Asset>): Buffer {
		const data: SmartBuffer = new SmartBuffer();
		data.writeUInt32LE(assets.length);
		for(let i: number = 0, n: number = assets.length; i < n; ++i){
			const tmpData: SmartBuffer = new SmartBuffer();
			tmpData.writeOffset = 0;
			tmpData.readOffset = 0;
			const asset: Asset = assets.shift();
			if(asset !== null){
				tmpData.writeBuffer(Buffer.from([1, 0, 0, 0]));
				asset.serialize(tmpData);
			}else{
				tmpData.writeBuffer(Buffer.from([0, 0, 0, 0]));
			}
			const tmpData2: Buffer = zlib.deflateSync(tmpData.toBuffer());
			tmpData.destroy();
			data.writeUInt32LE(tmpData2.length);
			data.writeBuffer(tmpData2);
		}
		return data.toBuffer();
	}
	const replaceChunk = function(exe: SmartBuffer, offsets: [number, number], newData: Buffer): void {
		const part1: Buffer = exe.toBuffer().subarray(0, offsets[0]);
		const part2: Buffer = exe.toBuffer().subarray(offsets[1], exe.length);
		exe.clear();
		exe.writeOffset = 0;
		exe.writeBuffer(Buffer.from([...part1, ...newData, ...part2]));
		exe.readOffset = part1.length+newData.length;
		exe.writeOffset = exe.readOffset;
	}
	const findAsset = function(assets: Array<Asset>, names: Array<string>): Asset {
		let result: Asset;
		for(let i: number = 0; i < names.length; ++i){
			result = assets.filter(asset => asset && asset["name"] == names[i])[0];
			if(result !== undefined)
				break;
		}
		return result;
	}
	console.log("Reading game data...");
	if(exe.readUInt32LE() != 700)
		throw new Error("Extensions header");
	const extensionCountPos: number = exe.readOffset;
	const extensionCount: number = exe.readUInt32LE();
	let extensions: Array<Extension> = new Array(extensionCount);
	let hasWindowsDialogs: boolean = false;
	for(let i: number = 0; i < extensionCount; ++i){
		extensions[i] = Extension.read(exe);
		if(extensions[i].name == "GM Windows Dialogs")
			hasWindowsDialogs = true;
		if(extensions[i].name == "Http Dll 2.3" && extensions[i].folderName == "http_dll_2_3")
			throw new Error("This game is already an online version");
	}
	const addExtension = async function(exe: SmartBuffer, extensions: Array<Extension>, file: string): Promise<void> {
		const pos: number = exe.readOffset;
		const part1: Buffer = exe.toBuffer().subarray(0, pos);
		const part2: Buffer = await fs.readFile(path.join(__dirname, file));
		const part3: Buffer = exe.toBuffer().subarray(pos, exe.length);
		exe.clear();
		exe.writeOffset = 0;
		exe.writeBuffer(Buffer.from([...part1, ...part2, ...part3]));
		exe.readOffset = pos+part2.length;
		extensions.push(null);
	}
	if(!hasWindowsDialogs)
		await addExtension(exe, extensions, "gm_windows_dialog");
	await addExtension(exe, extensions, "http_dll_2");
	exe.writeOffset = extensionCountPos;
	exe.writeUInt32LE(extensions.length);
	extensions = null;
	if(exe.readUInt32LE() != 800)
		throw new Error("Triggers header");
	let triggers: Array<Trigger> = getAssets(exe, Trigger.deserialize) as Array<Trigger>;
	triggers = null;
	if(exe.readUInt32LE() != 800)
		throw new Error("Constants header");
	const constantCount: number = exe.readUInt32LE();
	const constants: Array<Constant> = new Array(constantCount);
	for(let i: number = 0; i < constantCount; ++i){
		const name: string = exe.readString(exe.readUInt32LE());
		const expression: string = exe.readString(exe.readUInt32LE());
		constants[i] = {
			name: name,
			expression: expression,
		}
	}
	if(exe.readUInt32LE() != 800)
		throw new Error("Sounds header");
	const soundsOffsets: [number, number] = [exe.readOffset, 0];
	let sounds: Array<Sound> = getAssets(exe, Sound.deserialize) as Array<Sound>;
	soundsOffsets[1] = exe.readOffset;
	const newSound = async function(sounds: Array<Sound>, file: string): Promise<void> {
		const sound: Sound = new Sound();
		sound.name = file;
		sound.content = await fs.readFile(path.join(__dirname, file));
		sounds.push(sound);
	}
	await newSound(sounds, "sound_chatbox");
	await newSound(sounds, "sound_saved");
	replaceChunk(exe, soundsOffsets, putAssets(exe, sounds));
	sounds = null;
	if(exe.readUInt32LE() != 800)
		throw new Error("Sprites header");
	let sprites: Array<Sprite> = getAssets(exe, Sprite.deserialize) as Array<Sprite>;
	sprites = null;
	if(exe.readUInt32LE() != 800)
		throw new Error("Backgrounds header");
	let backgrounds: Array<Background> = getAssets(exe, Background.deserialize) as Array<Background>;
	backgrounds = null;
	if(exe.readUInt32LE() != 800)
		throw new Error("Paths header");
	let paths: Array<Path> = getAssets(exe, Path.deserialize) as Array<Path>;
	paths = null;
	if(exe.readUInt32LE() != 800)
		throw new Error("Scripts header");
	const scriptsOffsets: [number, number] = [exe.readOffset, 0];
	let scripts: Array<Script> = getAssets(exe, Script.deserialize) as Array<Script>;
	scriptsOffsets[1] = exe.readOffset;
	if(exe.readUInt32LE() != 800)
		throw new Error("Fonts header");
	const fontsOffsets: [number, number] = [exe.readOffset, 0];
	let fonts: Array<Font> = getAssets(exe, Font.deserialize) as Array<Font>;
	fontsOffsets[1] = exe.readOffset;
	const newFont = async function(fonts: Array<Font>, file: string): Promise<void> {
		const font: Font = new Font();
		font.name = file;
		font.content = await fs.readFile(path.join(__dirname, file));
		fonts.push(font);
	}
	await newFont(fonts, "font_online");
	replaceChunk(exe, fontsOffsets, putAssets(exe, fonts));
	fonts = null;
	if(exe.readUInt32LE() != 800)
		throw new Error("Timelines header");
	let timelines: Array<Timeline> = getAssets(exe, Timeline.deserialize) as Array<Timeline>;
	timelines = null;
	if(exe.readUInt32LE() != 800)
		throw new Error("Objects header");
	const objectsOffsets: [number, number] = [exe.readOffset, 0];
	let objects: Array<GMObject> = getAssets(exe, GMObject.deserialize) as Array<GMObject>;
	objectsOffsets[1] = exe.readOffset;
	const world: GMObject = findAsset(objects, ["world", "objWorld", "oWorld"]) as GMObject;
	const player: GMObject = findAsset(objects, ["player", "objPlayer", "oPlayer"]) as GMObject;
	const player2: GMObject = findAsset(objects, ["player2", "objPlayer2", "oPlayer2"]) as GMObject;
	if(world == undefined)
		throw new Error("No object world");
	if(player == undefined)
		throw new Error("No object player");
	world.addCreateCode(GMLCode.getWorldCreate(ID, input));
	world.addEndStepCode(GMLCode.getWorldEndStep(player, player2));
	world.addGameEndCode(GMLCode.getWorldGameEnd());
	const newObject = function(name: string, visible: boolean, depth: number, persistent: boolean): GMObject {
		const obj: GMObject = new GMObject();
		obj.name = name;
		obj.spriteIndex = -1;
		obj.solid = false;
		obj.visible = visible;
		obj.depth = depth;
		obj.persistent = persistent;
		obj.parentIndex = -1;
		obj.maskIndex = -1;
		obj.events = [[], [], [], [], [], [], [], [], [], [], [], []];
		return obj;
	}
	const onlinePlayer: GMObject = newObject("__ONLINE_onlinePlayer", false, -10, true);
	onlinePlayer.addCreateCode(GMLCode.getOnlinePlayerCreate());
	onlinePlayer.addEndStepCode(GMLCode.getOnlinePlayerEndStep(player, player2));
	onlinePlayer.addDrawCode(GMLCode.getOnlinePlayerDraw());
	const chatbox: GMObject = newObject("__ONLINE_chatbox", true, -9, true);
	chatbox.addCreateCode(GMLCode.getChatboxCreate());
	chatbox.addEndStepCode(GMLCode.getChatboxEndStep(player, player2));
	chatbox.addDrawCode(GMLCode.getChatboxDraw());
	const playerSaved: GMObject = newObject("__ONLINE_playerSaved", true, -10, false);
	playerSaved.addEndStepCode(GMLCode.getPlayerSavedEndStep());
	playerSaved.addDrawCode(GMLCode.getPlayerSavedDraw());
	objects.push(onlinePlayer);
	objects.push(chatbox);
	objects.push(playerSaved);
	replaceChunk(exe, objectsOffsets, putAssets(exe, objects));
	objects = null;
	const saveGame: Script = findAsset(scripts, ["saveGame", "scrSaveGame"]) as Script;
	const loadGame: Script = findAsset(scripts, ["loadGame", "scrLoadGame"]) as Script;
	const saveExe: Script = findAsset(scripts, ["saveExe", "scrSaveExe"]) as Script;
	const tempExe: Script = findAsset(scripts, ["tempExe", "scrTempExe"]) as Script;
	if(saveGame === undefined)
		throw new Error("No script saveGame");
	if(loadGame == undefined)
		throw new Error("No script loadGame");
	saveGame.source += GMLCode.getSaveGame(world, player, player2);
	loadGame.source = GMLCode.getLoadGame(world)+loadGame.source;
	if(saveExe == undefined && tempExe == undefined){
		loadGame.source += GMLCode.getTempSaveExe(world, player, player2);
	}else{
		if(tempExe !== undefined)
			tempExe.source += GMLCode.getTempSaveExe(world, player, player2);
		else
			saveExe.source += GMLCode.getTempSaveExe(world, player, player2);
	}
	replaceChunk(exe, scriptsOffsets, putAssets(exe, scripts));
	scripts = null;
	exe.readOffset = encryptionStartGM80;
	console.log("Encrypting...");
	GM80.encrypt(exe);
	settings.save(exe);
	GameData.encrypt(exe, gameConfig);
	console.log("Writing...");
	await fs.writeFile(output, exe.toBuffer());
}
