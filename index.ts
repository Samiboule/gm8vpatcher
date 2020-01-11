import fs from "fs-extra"
import path from "path"
import { SmartBuffer } from "smart-buffer"
import { PESection, WindowsIcon, Icon } from "./icon"
import { GameConfig, GameData } from "./gamedata"
import { GM80 } from "./gamedata/gm80"
import { Settings } from "./settings"
import { Asset } from "./asset"
import zlib from "zlib"
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

const main = async () => {
	const name: string = "diva";
	const input: string = path.join(__dirname, "tests", `${name}.exe`);
	const output: string = path.join(__dirname, "tests", `${name}_modded.exe`);
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
	settings.showErrorMessage = false;
	settings.logErrors = false;
	settings.dontShowButtons = false;
	settings.f4FullscreenToggle = true;
	const dllNameLength: number = exe.readUInt32LE();
	exe.readOffset += dllNameLength;
	const dxDll: Array<number> = [...exe.readBuffer(exe.readUInt32LE())];
	const encryptionStartGM80: number = exe.readOffset;
	GM80.decrypt(exe);
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
	for(const script of scripts){
		if(!script)
			continue;
		if(script.name == "saveGame"){
			script.source += `
;sound_play(__ONLINE_sndSaved);
			`;
		}
	}
	replaceChunk(exe, scriptsOffsets, putAssets(exe, scripts));
	scripts = null;
	if(exe.readUInt32LE() != 800)
		throw new Error("Fonts header");
	let fonts: Array<Font> = getAssets(exe, Font.deserialize) as Array<Font>;
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
	const world: GMObject = objects.filter(obj => obj && obj.name == "world")[0];
	if(world == undefined)
		throw new Error("No object world");
	world.addCreateCode(`
/// ONLINE
__ONLINE_connected = false;
__ONLINE_buffer = buffer_create();
if(file_exists("tempOnline")){
	buffer_read_from_file(__ONLINE_buffer, "tempOnline");
	__ONLINE_socket = buffer_read_uint16(__ONLINE_buffer);
	__ONLINE_n = buffer_read_uint16(__ONLINE_buffer);
	for(__ONLINE_i = 0; __ONLINE_i < n; __ONLINE_i += 1){
		__ONLINE_oPlayer = instance_create(0, 0, __ONLINE_onlinePlayer);
		__ONLINE_oPlayer.ID = buffer_read_string(__ONLINE_buffer);
		__ONLINE_oPlayer.x = buffer_read_int32(__ONLINE_buffer);
		__ONLINE_oPlayer.y = buffer_read_int32(__ONLINE_buffer);
		__ONLINE_oPlayer.sprite_index = buffer_read_int32(__ONLINE_buffer);
		__ONLINE_oPlayer.image_speed = buffer_read_float32(__ONLINE_buffer);
		__ONLINE_oPlayer.image_xscale = buffer_read_float32(__ONLINE_buffer);
		__ONLINE_oPlayer.image_yscale = buffer_read_float32(__ONLINE_buffer);
		__ONLINE_oPlayer.image_angle = buffer_read_float32(__ONLINE_buffer);
		__ONLINE_oPlayer.oRoom = buffer_read_uint16(__ONLINE_buffer);
		__ONLINE_oPlayer.name = buffer_read_string(__ONLINE_buffer);
	}
}else{
	__ONLINE_socket = socket_create();
	socket_connect(__ONLINE_socket, "isocodes.org", 39083);
	__ONLINE_name = wd_input_box("Name", "Enter your name:", "");
	if(__ONLINE_name == ""){
		__ONLINE_name = "Anonymous";
	}
	__ONLINE_name = string_replace_all(__ONLINE_name, "#", "\#");
	if(string_length(__ONLINE_name) > 20){
		__ONLINE_name = string_copy(__ONLINE_name, 0, 20);
	}
	buffer_clear(__ONLINE_buffer);
	buffer_write_uint8(__ONLINE_buffer, 3);
	buffer_write_string(__ONLINE_buffer, __ONLINE_name);
	socket_write_message(__ONLINE_socket, __ONLINE_buffer);
}
__ONLINE_pExists = false;
__ONLINE_pX = 0;
__ONLINE_pY = 0;
__ONLINE_updating = false;
__ONLINE_t = 0;
__ONLINE_timeUpdating = 3;
	`);
	world.addEndStepCode(`
/// ONLINE
if(__ONLINE_t > __ONLINE_timeUpdating){
	__ONLINE_updating = false;
}
socket_update_read(__ONLINE_socket);
while(socket_read_message(__ONLINE_socket, __ONLINE_buffer)){
	switch(buffer_read_uint8(__ONLINE_buffer)){
		case 0:
			// CREATED
			__ONLINE_ID = buffer_read_string(__ONLINE_buffer);
			__ONLINE_found = false;
			for(__ONLINE_i = 0; __ONLINE_i < instance_number(__ONLINE_onlinePlayer); __ONLINE_i += 1){
				if(instance_find(__ONLINE_onlinePlayer, __ONLINE_i).ID == __ONLINE_ID){
					__ONLINE_found = true;
					break;
				}
			}
			if(!__ONLINE_found){
				__ONLINE_oPlayer = instance_create(0, 0, __ONLINE_onlinePlayer);
				__ONLINE_oPlayer.ID = __ONLINE_ID;
			}
			break;
		case 1:
			// DESTROYED
			__ONLINE_ID = buffer_read_string(__ONLINE_buffer);
			for(__ONLINE_i = 0; __ONLINE_i < instance_number(__ONLINE_onlinePlayer); __ONLINE_i += 1){
				__ONLINE_oPlayer = instance_find(__ONLINE_onlinePlayer, __ONLINE_i);
				if(__ONLINE_oPlayer.ID == __ONLINE_ID){
					with(__ONLINE_oPlayer){
						instance_destroy();
					}
					break;
				}
			}
			break;
		case 2:
			// MOVED
			__ONLINE_ID = buffer_read_string(__ONLINE_buffer);
			__ONLINE_found = false;
			__ONLINE_oPlayer = 0;
			for(__ONLINE_i = 0; __ONLINE_i < instance_number(__ONLINE_onlinePlayer); __ONLINE_i += 1){
				__ONLINE_oPlayer = instance_find(__ONLINE_onlinePlayer, __ONLINE_i);
				if(__ONLINE_oPlayer.ID == __ONLINE_ID){
					__ONLINE_found = true;
					break;
				}
			}
			if(!__ONLINE_found){
				__ONLINE_oPlayer = instance_create(0, 0, __ONLINE_onlinePlayer);
			}
			__ONLINE_oPlayer.ID = __ONLINE_ID;
			__ONLINE_oPlayer.x = buffer_read_int32(__ONLINE_buffer);
			__ONLINE_oPlayer.y = buffer_read_int32(__ONLINE_buffer);
			__ONLINE_oPlayer.sprite_index = buffer_read_int32(__ONLINE_buffer);
			__ONLINE_oPlayer.image_speed = buffer_read_float32(__ONLINE_buffer);
			__ONLINE_oPlayer.image_xscale = buffer_read_float32(__ONLINE_buffer);
			__ONLINE_oPlayer.image_yscale = buffer_read_float32(__ONLINE_buffer);
			__ONLINE_oPlayer.image_angle = buffer_read_float32(__ONLINE_buffer);
			__ONLINE_oPlayer.oRoom = buffer_read_uint16(__ONLINE_buffer);
			__ONLINE_oPlayer.name = buffer_read_string(__ONLINE_buffer);
			break;
		case 4:
			// CHAT MESSAGE
			__ONLINE_ID = buffer_read_string(__ONLINE_buffer);
			__ONLINE_found = false;
			__ONLINE_oPlayer = 0;
			for(__ONLINE_i = 0; __ONLINE_i < instance_number(__ONLINE_onlinePlayer); __ONLINE_i += 1){
				__ONLINE_oPlayer = instance_find(__ONLINE_onlinePlayer, i);
				if(__ONLINE_oPlayer.ID == __ONLINE_ID){
					__ONLINE_found = true;
					break;
				}
			}
			if(__ONLINE_found){
				__ONLINE_message = buffer_read_string(__ONLINE_buffer);
				__ONLINE_oChatbox = instance_create(0, 0, __ONLINE_chatbox);
				__ONLINE_oChatbox.message = __ONLINE_message;
				__ONLINE_oChatbox.follower = __ONLINE_oPlayer;
				if(__ONLINE_oPlayer.visible){
					sound_play(__ONLINE_sndChatbox);
				}
			}
			break;
		case 5:
			// SOMEONE SAVED
			__ONLINE_sGravity = buffer_read_uint8(__ONLINE_buffer);
			__ONLINE_sName = buffer_read_string(__ONLINE_buffer);
			__ONLINE_sX = buffer_read_int32(__ONLINE_buffer);
			__ONLINE_sY = buffer_read_float64(__ONLINE_buffer);
			__ONLINE_sRoom = buffer_read_int16(__ONLINE_buffer);
			__ONLINE_a = instance_create(0, 0, __ONLINE_playerSaved);
			__ONLINE_a.name = __ONLINE_sName;
			buffer_clear(__ONLINE_buffer);
			buffer_write_uint8(__ONLINE_buffer, __ONLINE_sGravity);
			buffer_write_int32(__ONLINE_buffer, __ONLINE_sX);
			buffer_write_float64(__ONLINE_buffer, __ONLINE_sY);
			buffer_write_int16(__ONLINE_buffer, __ONLINE_sRoom);
			buffer_write_to_file(__ONLINE_buffer, "tempOnline2");
			sound_play(__ONLINE_sndSaved);
			break;
	}
}
__ONLINE_mustQuit = false;
switch(socket_get_state(__ONLINE_socket)){
	case 2:
		if(!__ONLINE_connected){
			__ONLINE_connected = true;
		}
		break;
	case 4:
		wd_message_simple("Connection closed.");
		__ONLINE_mustQuit = true;
		break;
	case 5:
		socket_reset(__ONLINE_socket);
		if(connected){
			wd_message_simple("Connection lost.");
		}else{
			wd_message_simple("Could not connect to the server.");
		}
		__ONLINE_mustQuit = true;
		break;
}
if(__ONLINE_mustQuit){
	if(file_exists("temp")){
		file_delete("temp");
	}
	game_end();
}
__ONLINE_p = player;
if(!instance_exists(__ONLINE_p)){
	__ONLINE_p = player2;
}
__ONLINE_exists = instance_exists(__ONLINE_p);
__ONLINE_X = __ONLINE_pX;
__ONLINE_Y = __ONLINE_pY;
if(__ONLINE_exists){
	if(__ONLINE_exists != __ONLINE_pExists){
		// SEND PLAYER CREATE
		buffer_clear(__ONLINE_buffer);
		buffer_write_uint8(__ONLINE_buffer, 0);
		socket_write_message(__ONLINE_socket, __ONLINE_buffer);
	}
	if(!__ONLINE_updating){
		__ONLINE_X = __ONLINE_p.x;
		__ONLINE_Y = __ONLINE_p.y;
		if(__ONLINE_pX != __ONLINE_X || __ONLINE_pY != __ONLINE_Y){
			// SEND PLAYER MOVED
			buffer_clear(__ONLINE_buffer);
			buffer_write_uint8(__ONLINE_buffer, 2);
			buffer_write_int32(__ONLINE_buffer, __ONLINE_X);
			buffer_write_int32(__ONLINE_buffer, __ONLINE_Y);
			buffer_write_int32(__ONLINE_buffer, __ONLINE_p.sprite_index);
			buffer_write_float32(__ONLINE_buffer, __ONLINE_p.image_speed);
			buffer_write_float32(__ONLINE_buffer, __ONLINE_p.image_xscale);
			buffer_write_float32(__ONLINE_buffer, __ONLINE_p.image_yscale);
			buffer_write_float32(__ONLINE_buffer, __ONLINE_p.image_angle);
			buffer_write_uint16(__ONLINE_buffer, room);
			socket_write_message(__ONLINE_socket, __ONLINE_buffer);
			__ONLINE_updating = true;
			__ONLINE_t = 0;
		}
	}    
	if(keyboard_check_pressed(vk_space)){
		__ONLINE_message = wd_input_box("Chat", "Say something:", "");
		__ONLINE_message = string_replace_all(__ONLINE_message, "#", "\#");
		__ONLINE_message_length = string_length(__ONLINE_message);
		if(__ONLINE_message_length > 0){
			__ONLINE_message_max_length = 300;
			if(__ONLINE_message_length > __ONLINE_message_max_length){
				__ONLINE_message = string_copy(__ONLINE_message, 0, __ONLINE_message_max_length);
			}
			buffer_clear(__ONLINE_buffer);
			buffer_write_uint8(__ONLINE_buffer, 4);
			buffer_write_string(__ONLINE_buffer, __ONLINE_message);
			socket_write_message(__ONLINE_socket, __ONLINE_buffer);
			__ONLINE_oChatbox = instance_create(0, 0, __ONLINE_chatbox);
			__ONLINE_oChatbox.message = __ONLINE_message;
			__ONLINE_oChatbox.follower = p;
			sound_play(__ONLINE_sndChatbox);
		}
	}
}else{
	if(__ONLINE_exists != __ONLINE_pExists){
		// SEND PLAYER DESTROYED
		buffer_clear(__ONLINE_buffer);
		buffer_write_uint8(__ONLINE_buffer, 1);
		socket_write_message(__ONLINE_socket, __ONLINE_buffer);
	}
}
__ONLINE_pExists = __ONLINE_exists;
__ONLINE_pX = X;
__ONLINE_pY = Y;
__ONLINE_t += 1;
socket_update_write(__ONLINE_socket);	
	`);
	world.addGameEndCode(`
/// ONLINE
if(!file_exists("temp")){
	if(file_exists("tempOnline")){
		file_delete("tempOnline");
	}
	if(file_exists("tempOnline2")){
		file_delete("tempOnline2");
	}
}
buffer_destroy(__ONLINEbuffer);
if(!file_exists("tempOnline")){
	socket_destroy(__ONLINEsocket);
}
	`);
	replaceChunk(exe, objectsOffsets, putAssets(exe, objects));
	objects = null;
	exe.readOffset = encryptionStartGM80;
	console.log("Encrypting...");
	GM80.encrypt(exe);
	settings.save(exe);
	GameData.encrypt(exe, gameConfig);
	console.log("Writing...");
	await fs.writeFile(output, exe.toBuffer());
}

main().catch(console.error);
