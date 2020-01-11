import { Asset } from "../asset"
import { SmartBuffer } from "smart-buffer"

const VERSION: number = 800;

enum SoundKind {
	Normal = 0,
	BackgroundMusic = 1,
	ThreeDimensional = 2,
	Multimedia = 3,
}

const SoundKindFrom = function(n: number): SoundKind {
	switch(n){
		case 1:
			return SoundKind.BackgroundMusic;
		case 2:
			return SoundKind.ThreeDimensional;
		case 3:
			return SoundKind.Multimedia;
		case 0:
		default:
			return SoundKind.Normal;
	}
}

interface SoundFX {
	chorus: boolean;
	echo: boolean;
	flanger: boolean;
	gargle: boolean;
	reverb: boolean;
}

export class Sound extends Asset {
	public name: string;
	public content: Array<number>;
	public static deserialize(data: SmartBuffer): Sound {
		const from: number = data.readOffset;
		const sound: Sound = new Sound();
		sound.name = data.readString(data.readUInt32LE());
		if(data.readUInt32LE() != VERSION)
			throw new Error("Sound version is incorrect");
		const kind = SoundKindFrom(data.readUInt32LE());
		const extension = data.readString(data.readUInt32LE());
		const source = data.readString(data.readUInt32LE());
		let soundData = null;
		if(data.readUInt32LE() != 0){
			const length: number = data.readUInt32LE();
			soundData = [...data.readBuffer(length)];
		}
		const effects: number = data.readUInt32LE();
		const fx = {
			chorus: (effects & 0b1) >>> 0 != 0,
			echo: (effects & 0b1) >>> 0 != 0,
			flanger: (effects & 0b1) >>> 0 != 0,
			gargle: (effects & 0b1) >>> 0 != 0,
			reverb: (effects & 0b1) >>> 0 != 0,
		}
		const volume = data.readDoubleLE();
		const pan = data.readDoubleLE();
		const preload = data.readUInt32LE() != 0;
		const to: number = data.readOffset;
		sound.content = [...data.toBuffer().subarray(from, to)];
		return sound;
	}
	public serialize(data: SmartBuffer): void {
		data.writeBuffer(Buffer.from(this.content));
	}
}
