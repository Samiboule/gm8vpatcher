import fs from "fs-extra"
import path from "path"
import _7zip from "7zip-min"
import { compile } from "nexe"
import { Utils } from "./utils"

const buildExe = function(output: string): Promise<void> {
	return new Promise((resolve, reject) => {
		compile({output: output})
		.then(resolve)
		.catch(reject);
	})
}

const zip = function(folder: string, file: string): Promise<void> {
	return new Promise((resolve, reject) => {
		_7zip.pack(folder, file, function(err): void {
			if(err)
				reject(err);
			else
				resolve();
		});
	});
}

const build = async function(): Promise<string> {
	const buildDir: string = path.join(__dirname, "build");
	const unpackedDir: string = path.join(buildDir, "iwpo");
	const output: string = path.join(unpackedDir, "iwpo.exe");
	console.log("Cleaning the build directory...");
	await Utils.rimraf(buildDir);
	console.log("Creating the executable...");
	await buildExe(output);
	console.log("Changing the icon...");
	await Utils.exec([
		"rh",
		"-open",
		`"${output}"`,
		"-save",
		`"${output}"`,
		"-action",
		"addoverwrite",
		"-res",
		`"${path.join(__dirname, "icon.ico")}"`,
		"-mask",
		"ICONGROUP,MAINICON,0",
	].join(" "), __dirname);
	console.log("Copying dependencies...");
	await fs.mkdir(path.join(unpackedDir, "node_modules"));
	await fs.mkdir(path.join(unpackedDir, "node_modules", "7zip-bin"));
	await Promise.all([
		fs.copyFile(path.join(__dirname, "README.txt"), path.join(unpackedDir, "README.txt")),
		Utils.copyDir(path.join(__dirname, "lib"), path.join(unpackedDir, "lib")),
		Utils.copyDir(path.join(__dirname, "gml"), path.join(unpackedDir, "gml")),
		fs.mkdir(path.join(unpackedDir, "tmp")),
		Utils.copyDir(path.join(__dirname, "node_modules", "7zip-bin"), path.join(unpackedDir, "node_modules", "7zip-bin")),
	]);
	const readmeFilename: string = path.join(unpackedDir, "README.txt");
	const readme: Array<string> = (await fs.readFile(readmeFilename, "utf8")).split(/\r\n|\r|\n/g);
	readme[0] += Utils.getVersion();
	await fs.writeFile(readmeFilename, readme.join("\r\n"), "utf8");
	console.log("Compressing the tool...");
	await zip(unpackedDir, path.join(buildDir, `iwpo ${Utils.getVersion()}.zip`));
	console.log("Cleaning residue files...");
	await fs.unlink(path.join(__dirname, "rh.ini"));
	return "Success!";
}

build()
.then(console.log)
.catch(console.error);
