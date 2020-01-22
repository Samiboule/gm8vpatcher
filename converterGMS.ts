import fs from "fs-extra"
import path from "path"
import md5 from "md5"
import _7zip from "7zip-min"
import { Utils, Ports } from "./utils"

const TMP_FOLDER: string = path.join(__dirname, "tmp");

const Unpack = async function(file: string, folder: string): Promise<boolean> {
	return new Promise((resolve, _) => {
		_7zip.unpack(file, folder, function(err): void {
			if(err)
				resolve(false);
			else
				resolve(true);
		});
	});
}

const CopyHttpDll = async function(to: string): Promise<void> {
	const httpFile: string = "http_dll_2_3.dll";
	await fs.copyFile(path.join(__dirname, "lib", httpFile), path.join(to, httpFile));
}

export const IsGMS = async function(input: string): Promise<boolean> {
	return (await Unpack(input, TMP_FOLDER)) || fs.exists(path.join(path.dirname(input), "data.win"));
}

export const ConverterGMS = async function(input: string, gameName: string, password: string, server: string, ports: Ports): Promise<void> {
	await Utils.rimraf(path.join(TMP_FOLDER, "*"));
	console.log("Reading file...");
	const isPacked: boolean = await Unpack(input, TMP_FOLDER);
	const oldDataWin: string = path.join(TMP_FOLDER, "data2.win");
	const newDataWin: string = path.join(TMP_FOLDER, "data.win");
	if(isPacked){
		const tmpDataWin: string = path.join(TMP_FOLDER, "data.win");
		if(!await fs.exists(tmpDataWin))
			throw new Error("Cannot find data.win");
		await fs.rename(tmpDataWin, oldDataWin);
	}else{
		await fs.copyFile(path.join(path.dirname(input), "data.win"), oldDataWin);
	}
	console.log("Generating unique key...");
	const gameID: string = md5(await fs.readFile(oldDataWin))+password;
	const converter: string = path.join(__dirname, "lib", "converterGMS.exe");
	console.log("Converting data.win...");
	await Utils.exec([
		converter,
		oldDataWin,
		newDataWin,
		gameName,
		gameID,
		server,
		ports.tcp,
		ports.udp,
	].map(el => `"${el}"`).join(" "), path.dirname(converter));
	await fs.unlink(oldDataWin);
	if(isPacked){
		const onlineDir: string = path.join(path.dirname(input), `${gameName}_online`);
		await Utils.rimraf(onlineDir);
		await Utils.copyDir(TMP_FOLDER, onlineDir);
		await CopyHttpDll(onlineDir);
	}else{
		const tmpDataWin: string = path.join(path.dirname(input), "data.win");
		await fs.rename(tmpDataWin, path.join(path.dirname(input), "data_backup.win"));
		await fs.copyFile(newDataWin, tmpDataWin);
		await CopyHttpDll(path.dirname(input));
	}
	await Utils.rimraf(path.join(TMP_FOLDER, "*"));
}
