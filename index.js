const fs = require("fs-extra");
const path = require("path");
const SmartBuffer = require("smart-buffer");

(async () => {
	const input = path.join(__dirname, "tests", "diva.exe");
	if(!await fs.exists(input))
		throw new Error("The input file does not exist.");
	// 
	console.log("Done!");
})()
.catch(console.error);
