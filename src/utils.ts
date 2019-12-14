import * as crypto from './crypto';

export function areArraysEqual(array1: Uint8Array, array2: Uint8Array): boolean {
  const length = array1.length;
  for (let i = 0; i < length; ++i) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }
  return true;
}

export function measureQuality(tag: Uint8Array): number {
  let quality = 0;
  let bitString = '';
  tag.forEach((byte) => bitString += byte.toString(2).padStart(8, '0'));
  for (const bit of bitString) {
    if (bit === '0') {
      ++quality;
    } else {
      break;
    }
  }
  return quality;
}

export function num2bin16(num: number): Uint8Array {
  const arr = new ArrayBuffer(16);
  const view = new DataView(arr);
  view.setUint32(0, num, false);
  return new Uint8Array(arr);
}

export function bin2num32(bin: Uint8Array): number {
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  return view.getUint32(0, false);
}

export function modulo(hash: Uint8Array, num: number): number {
  return Number(BigInt(bin2num32(hash)) % BigInt(num));
}

export function sample(mean: number): number {
  return -Math.log(Math.random()) * mean;
}

export function randomWait(meanWaitTime: number): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(), sample(meanWaitTime)));
}

export function createGenesisPiece(seed: string): Uint8Array {
  let pieceSeed = Uint8Array.from(Buffer.from(seed, 'hex'));
  const pieceParts: Uint8Array[] = [];
  for (let i = 0; i < 127; ++i) {
    pieceParts.push(pieceSeed);
    pieceSeed = crypto.hash(pieceSeed);
  }
  return Buffer.concat(pieceParts);
}
