import { SmartBuffer } from "smart-buffer"
import { GameConfig } from "./gamedata"

export abstract class Asset {
	public static deserialize(data: SmartBuffer): Asset {
		return null;
	}
	public abstract serialize(data: SmartBuffer): void;
}
