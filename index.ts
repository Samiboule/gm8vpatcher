import path from "path"
import { Converter } from "./converter"

const main = async function(): Promise<void> {
	const name: string = "i wanna see the moon";
	const input: string = path.join(__dirname, "tests", `${name}.exe`);
	const output: string = path.join(__dirname, "tests", `${name}_online.exe`);
	await Converter(input, output);
}

main().catch(console.error);
