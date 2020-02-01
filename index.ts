import fs from "fs-extra"
import path from "path"
import process from "process"
import { ConverterGM8 } from "./converterGM8"
import { ConverterGMS, IsGMS } from "./converterGMS"
import { Utils, Ports } from "./utils"

const getInputGame = async function(): Promise<string> {
	let input: string = "";
	// console.log(process.argv);
	if(process.argv.length > 2)
		input = process.argv[2];
	if(input == "")
		throw new Error("Please drag and drop a game executable on this program in order to use it");
	if(path.extname(input) != ".exe")
		throw new Error("The game has to be an executable");
	if(!await fs.exists(input))
		throw new Error(`Cannot find the file ${input}`);
	return input;
}

const getServer = async function(): Promise<{server: string, ports: Ports}> {
	let server: string = "isocodes.org";
	let ports: Ports = {
		tcp: 3003,
		udp: 3005,
	}
	const keyword: string = "server=";
	for(const arg of process.argv){
		if(arg.slice(0, keyword.length) == keyword){
			const splits = arg.slice(keyword.length).split(/,/g);
			server = splits[0];
			if (splits.length > 1) {
				ports.tcp = Number(splits[1]);
			}
			if (splits.length > 2) {
				ports.udp = Number(splits[2]);
			}
			break;
		}
	}
	return {server, ports};
}

const main = async function(): Promise<string> {
	const input: string = await getInputGame();
	const gameName: string = path.basename(input, ".exe");
	const {server, ports} = await getServer();
	console.log(`Using Server ${server}, Ports`, ports);
	if(await IsGMS(input)){
		console.log("GameMaker Studio detected!");
		await ConverterGMS(input, gameName, server, ports);
	}else{
		console.log("Assuming it is Game Maker 8");
		await ConverterGM8(input, gameName, server, ports);
	}
	return "Success!";
}

main()
.then(console.log)
.catch(err => console.log(err.toString()))
.then(() => Utils.getString("Press enter to quit\n"))
