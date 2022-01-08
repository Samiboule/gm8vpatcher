import fs from "fs-extra"
import path from "path"
import process from "process"
import { ConverterGM8 } from "./converterGM8"
import { IsGMS } from "./converterGMS"
import { Utils } from "./utils"

let quietmode = false

const getInputGame = async function(): Promise<string> {
	let input: string = "";
	// console.log(process.argv);
	if(process.argv.length > 3) {
		if (process.argv[2] === "-q") {
			quietmode = true
			input = process.argv[3];
		}
	} else if(process.argv.length > 2)
		input = process.argv[2];
	if(input == "")
		throw new Error("Please drag and drop a game executable on this program in order to use it");
	if(path.extname(input) != ".exe")
		throw new Error("The game has to be an executable");
	if(!await fs.exists(input))
		throw new Error(`Cannot find the file ${input}`);
	return input;
}

const main = async function(): Promise<string> {
	const input: string = await getInputGame();
	const gameName: string = path.basename(input, ".exe");
	if(await IsGMS(input)){
		console.log("GameMaker Studio detected!");
		throw new Error("This patch only works on game maker 8 games")
	}else{
		console.log("Assuming it is Game Maker 8");
		await ConverterGM8(input, gameName);
	}
	return "Success!";
}

main()
.then(console.log)
.catch(err => console.log(err.toString()))
.then(() => {if (!quietmode) {Utils.getString("Press enter to quit\n")}})
