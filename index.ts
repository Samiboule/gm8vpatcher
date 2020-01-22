import fs from "fs-extra"
import path from "path"
import process from "process"
import { ConverterGM8 } from "./converterGM8"
import { ConverterGMS, IsGMS } from "./converterGMS"
import { Utils, Ports } from "./utils"

const getInputGame = async function(): Promise<string> {
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
	if(input == "")
		throw new Error("Please drag and drop a game executable on this program in order to use it");
	if(!await fs.exists(input))
		throw new Error(`Cannot find the file ${input}`);
	return input;
}

const getPassword = async function(): Promise<string> {
	let password: string = "";
	for(const arg of process.argv){
		if(arg.slice(0, 9) == "password="){
			password = arg.slice(9);
			break;
		}
	}
	return password;
}

const main = async function(): Promise<string> {
	const input: string = await getInputGame();
	const password: string = await getPassword();
	const gameName: string = path.basename(input, ".exe");
	const server: string = "isocodes.org";
	const ports: Ports = {
		tcp: 3003,
		udp: 3005,
	}
	if(await IsGMS(input)){
		console.log("GameMaker Studio detected!");
		await ConverterGMS(input, gameName, password, server, ports);
	}else{
		console.log("Assuming it is Game Maker 8");
		await ConverterGM8(input, gameName, password, server, ports);
	}
	return "Success!";
}

main()
.then(console.log)
.catch(err => console.log(err.toString()))
.then(() => Utils.getString("Press enter to quit\n"))
