import path from "path"
import { Converter } from "./converter"

const main = async function(): Promise<void> {
	const name: string = "diva";
	const server: string = "isocodes.org";
	const ports: {tcp: number, udp: number} = {
		tcp: 3003,
		udp: 3005,
	}
	const input: string = path.join(__dirname, "tests", `${name}.exe`);
	const output: string = path.join(__dirname, "tests", `${name}_online.exe`);
	await Converter(input, output, server, ports);
}

main().catch(console.error);
