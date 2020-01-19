import fs from "fs-extra"
import path from "path"
import _7zip from "7zip-min"
import md5 from "md5"
import process from "process"
import { Converter } from "./converter"
import { Utils } from "./utils"

const main = async function(): Promise<void> {
	let input: string = "";
	for(const arg of process.argv){
		if(path.basename(arg) == "iwpo.exe")
			continue;
		if(path.basename(arg) == "node.exe")
			continue;
		if(path.extname(arg) == ".exe"){
			input = arg;
			break;
		}
	}
	if(input == ""){
		console.log(`Usage: ${process.argv[0]} game`);
		process.exit(0);
	}
	const gameName: string = path.basename(input, ".exe");
	const output: string = path.join(path.dirname(input), `${gameName}_online.exe`);
	const server: string = "isocodes.org";
	const ports: {tcp: number, udp: number} = {
		tcp: 3003,
		udp: 3005,
	}
	try {
		await Converter(input, output, gameName, server, ports);
	}
	catch(e) {
		console.log("Game maker studio detected!");
		await Utils.rimraf(path.join(__dirname, "tmp", "*"));
		const oldDataWin: string = path.join(__dirname, "tmp", "data2.win");
		const newDataWin: string = path.join(__dirname, "tmp", "data.win");
		const isPacked: boolean = await new Promise((resolve, _) => {
			_7zip.unpack(input, path.join(__dirname, "tmp"), function(err): void {
				if(err)
					resolve(false);
				else
					resolve(true);
			});
		});
		if(!isPacked){
			const tmpDataWin: string = path.join(path.dirname(input), "data.win");
			if(!await fs.exists(tmpDataWin))
				throw new Error("Unknown format!");
			await fs.copyFile(tmpDataWin, oldDataWin);
		}else{
			const tmpDataWin: string = path.join(__dirname, "tmp", "data.win");
			if(!await fs.exists(tmpDataWin))
				throw new Error("Unknown format!");
			await fs.copyFile(tmpDataWin, oldDataWin);
			await fs.unlink(tmpDataWin);
		}
		const gameID: string = md5(await fs.readFile(oldDataWin));
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
		].map(el => `"${el}"`).join(" "));
		await fs.unlink(oldDataWin);
		if(isPacked){
			const onlineDir: string = path.join(path.dirname(input), `${gameName}_online`);
			await Utils.copyDir(path.join(__dirname, "tmp"), onlineDir);
			await fs.copyFile(
				path.join(__dirname, "lib", "http_dll_2_3.dll"),
				path.join(onlineDir, "http_dll_2_3.dll")
			);
		}else{
			const tmpDataWin: string = path.join(path.dirname(input), "data.win");
			await fs.copyFile(tmpDataWin, path.join(path.dirname(input), "data_backup.win"));
			await fs.unlink(tmpDataWin);
			await fs.copyFile(newDataWin, tmpDataWin);
			await fs.copyFile(
				path.join(__dirname, "lib", "http_dll_2_3.dll"),
				path.join(path.dirname(input), "http_dll_2_3.dll")
			);
		}
		await Utils.rimraf(path.join(__dirname, "tmp", "*"));
	}
	console.log("Success!");
}

main().catch(console.error);
