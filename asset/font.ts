import { SmartBuffer } from "smart-buffer"
import { Asset } from "../asset"

const VERSION: number = 800;

export class Font extends Asset {
	public name: string;
	public content: Array<number>;
	public static deserialize(data: SmartBuffer): Font {
		const from: number = data.readOffset;
		const font: Font = new Font();
		font.name = data.readString(data.readUInt32LE());
		if(data.readUInt32LE() != VERSION)
			throw new Error("Font version is incorrect");
		const sysName = data.readString(data.readUInt32LE());
		const size = data.readUInt32LE();
		const bold = data.readUInt32LE() != 0;
		const italic = data.readUInt32LE() != 0;
		const rangeStart = data.readUInt32LE();
		const rangeEnd = data.readUInt32LE();
		const charset = 0;
		const aaLevel = 0;
		const dMap = new Array(0x600).fill(0);
		for(let i: number = 0; i < 0x600; ++i)
			dMap[i] = data.readUInt32LE();
		const mapWidth = data.readUInt32LE();
		const mapHeight = data.readUInt32LE();
		const length: number = data.readUInt32LE();
		const pixelMap = [...data.readBuffer(length)];
		const to: number = data.readOffset;
		font.content = [...data.toBuffer().subarray(from, to)];
		return font;
	}
	public serialize(data: SmartBuffer): void {
		data.writeBuffer(Buffer.from(this.content));
	}
}
