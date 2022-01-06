import fs from "fs-extra"
import path from "path"
import _7zip from "7zip-min"

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

export const IsGMS = async function(input: string): Promise<boolean> {
	return (await Unpack(input, TMP_FOLDER)) || fs.exists(path.join(path.dirname(input), "data.win"));
}