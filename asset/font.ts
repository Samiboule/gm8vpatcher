import { SmartBuffer } from "smart-buffer"
import { Asset } from "../asset"

const VERSION: number = 800;

export class Font extends Asset {
	public name: string;
	public sysName: string;
	public size: number;
	public bold: boolean;
	public italic: boolean;
	public rangeStart: number;
	public rangeEnd: number;
	public charset: number;
	public aaLevel: number;
	public dMap: Array<number>;
	public mapWidth: number;
	public mapHeight: number;
	public pixelMap: Array<number>;
	public static deserialize(data: SmartBuffer): Font {
		const font: Font = new Font();
		font.name = data.readString(data.readUInt32LE());
		if(data.readUInt32LE() != VERSION)
			throw new Error("Font version is incorrect");
		font.sysName = data.readString(data.readUInt32LE());
		font.size = data.readUInt32LE();
		font.bold = data.readUInt32LE() != 0;
		font.italic = data.readUInt32LE() != 0;
		font.rangeStart = data.readUInt32LE();
		font.rangeEnd = data.readUInt32LE();
		font.charset = 0;
		font.aaLevel = 0;
		font.dMap = new Array(0x600).fill(0);
		for(let i: number = 0; i < 0x600; ++i)
			font.dMap[i] = data.readUInt32LE();
		font.mapWidth = data.readUInt32LE();
		font.mapHeight = data.readUInt32LE();
		const length: number = data.readUInt32LE();
		font.pixelMap = [...data.readBuffer(length)];
		return font;
	}
	public serialize(data: SmartBuffer): void {
		// 
	}
}
