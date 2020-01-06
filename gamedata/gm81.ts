import { SmartBuffer } from "smart-buffer"
import { Tuple } from "../utils"

export enum XorMethod {
	Normal,
	Sudalv,
}

export class GM81 {
	public static check(exe: SmartBuffer): boolean {
		if(exe.length < 0x226D8A)
			return false;
		exe.readOffset = 0x00226CF3;
		if(exe.readBuffer(8).compare(Buffer.from([0xE8, 0x80, 0xF2, 0xDD, 0xFF, 0xC7, 0x45, 0xF0])) == 0){
			const headerStart: number = exe.readUInt32LE();
			exe.readOffset += 125;
			let gm81Magic: number = null;
			if(exe.readBuffer(3).compare(Buffer.from([0x81, 0x7D, 0xEC])) == 0){
				const magic: number = exe.readUInt32LE();
				if(exe.readUInt8() == 0x74)
					gm81Magic = magic;
			}
			exe.readOffset = 0x0010BB83;
			let xorMethod: XorMethod;
			if(exe.readBuffer(8).compare(Buffer.from([0x8B, 0x02, 0xC1, 0xE0, 0x10, 0x8B, 0x11, 0x81])) == 0)
				xorMethod = XorMethod.Sudalv;
			else
				xorMethod = XorMethod.Normal;
			exe.readOffset = headerStart;
			if(gm81Magic !== null){
				if(GM81.seekValue(exe, gm81Magic) === null)
					return false;
			}else{
				exe.readOffset += 8;
			}
			GM81.decrypt(exe, xorMethod);
			return true;
		}
		return false;
	}
	public static checkLazy(exe: SmartBuffer): boolean {
		exe.readOffset = 3800004;
		if(GM81.seekValue(exe, 0xF7140067) !== null){
			GM81.decrypt(exe, XorMethod.Normal);
			exe.readOffset += 20;
			return true;
		}
		return false;
	}
	public static seekValue(exe: SmartBuffer, value: number): number {
		let pos: number = exe.readOffset;
		while(true){
			exe.readOffset = pos;
			const d1: number = exe.readUInt32LE();
			const d2: number = exe.readUInt32LE();
			const parsedValue: number = ((d1 & 0xFF00FF00) | (d2 & 0x00FF00FF)) >>> 0;
			const parsedXor: number = ((d1 & 0x00FF00FF) | (d2 & 0xFF00FF00)) >>> 0;
			if(parsedValue == value)
				return parsedXor;
			pos++;
			if(pos + 8 >= exe.length)
				return null;
		}
	}
	public static decrypt(exe: SmartBuffer, xorMethod: XorMethod): void {
		const crc32 = function(hashKey: Array<number>, crcTable: Array<number>): number {
			let result: number = 0xFFFFFFFF;
			for(const c of hashKey)
				result = ((result >> 8) ^ crcTable[((result & 0xFF) ^ c) >>> 0]) >>> 0;
			return result;
		}
		const crc32Reflect = function(value: number, c: number): number {
			let rValue: number = 0;
			for(let i = 1; i <= c; ++i){
				if(((value & 1) >>> 0) != 0)
					rValue = (rValue | (1 << (c-i))) >>> 0;
				value = value >>> 1;
			}
			return rValue;
		}
		const sudalvMagicPoint: number = exe.readOffset-12;
		const hashKey: string = `_MJD${exe.readUInt32LE()}#RWK`;
		const hashKeyUTF16: Array<number> = [...Buffer.from(hashKey)];
		for(let i = hashKeyUTF16.length; i > 0; --i)
			hashKeyUTF16.splice(i, 0, 0);
		let crcTable: Array<number> = new Array(256).fill(0);
		const crcPolynomial: number = 0x04C11DB7;
		for(let i: number = 0; i < 256; ++i){
			crcTable[i] = (crc32Reflect(i, 8) << 24) >>> 0;
			for(let j: number = 0; j < 8; ++j){
				let xorMask: number = 0;
				if((crcTable[i] & (1 << 31)) >>> 0 != 0))
					xorMask = crcPolynomial;
				crcTable[i] = ((crcTable[i] << 1) ^ xorMask) >>> 0;
			}
			crcTable[i] = crc32Reflect(i, 32);
		}
		// CONTINUE HERE
		// get our two seeds for generating xor masks
		let seed1 = data.read_u32_le()?;
		let seed2 = crc_32(&hash_key_utf16, &crc_table);
		// work out where gm81 encryption starts
		let encryption_start = data.position() + u64::from(seed2 & 0xFF) + 10;
		// Make the seed-cycling iterator
		let mut generator = match xor_method {
			XorMethod::Normal => {
				Box::new(NormalMaskGenerator { seed1, seed2 }) as Box<dyn Iterator<Item = u32>>
			}
			XorMethod::Sudalv => {
				let mask_data = &data.get_ref()[..(sudalv_magic_point + 4) as usize];
				let mask_count = mask_data
					.rchunks_exact(2)
					.skip(1)
					.zip(mask_data.rchunks_exact(2))
					.position(|xy| xy == (&[0, 0], &[0, 0]))
					.unwrap();
				let iter = mask_data
					.rchunks_exact(2)
					.skip(1)
					.map(|x| u16::from_le_bytes([x[0], x[1]]))
					.take(mask_count + 1)
					.collect::<Vec<u16>>()
					.into_iter()
					.cycle();
				Box::new(SudalvMaskGenerator { seed1, seed2, iter }) as Box<dyn Iterator<Item = u32>>
			}
		};
		// Decrypt stream from encryption_start
		let game_data = &mut data.get_mut()[encryption_start as usize..];
		for chunk in game_data
			.chunks_exact_mut(4)
			.map(|s| unsafe { &mut *(s as *mut _ as *mut u32) })
		{
			*chunk ^= generator.next().unwrap();
		}
	}
}
