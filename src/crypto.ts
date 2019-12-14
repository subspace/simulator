import * as crypto from 'crypto';
import { Tree } from 'merkle-tree-binary';
import { ROUNDS } from './constants';
import { num2bin16 } from './utils';

export function randomBytes(length: number): Uint8Array {
  return new Uint8Array(crypto.randomBytes(length));
}

export function hash(data: Uint8Array, outputLength = 32, type = 'sha256'): Uint8Array {
  const hasher = crypto.createHash(type);
  hasher.update(data);
  let hash = new Uint8Array(hasher.digest());
  hash = hash.subarray(0, outputLength);
  return hash;
}

export function hmac(encoding: Uint8Array, challenge: Uint8Array): Uint8Array {
  const hmac = crypto.createHmac('sha256', encoding);
  hmac.update(challenge);
  return hmac.digest();
}

export function encode(piece: Uint8Array, index: number, key: Uint8Array, rounds = ROUNDS): Uint8Array {
  const iv = num2bin16(index);
  let encoding = piece;
  for (let r = 0; r < rounds; ++r) {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const cipherText = cipher.update(encoding);
    encoding = Buffer.concat([cipherText, cipher.final()]);
  }
  return encoding;
}

export function decode(encoding: Uint8Array, index: number, key: Uint8Array, rounds = ROUNDS): Uint8Array {
  const iv = num2bin16(index);
  let piece = encoding;
  for (let r = 0; r < rounds; ++r) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const plainText = decipher.update(piece);
    piece = Buffer.concat([plainText, decipher.final()]);
  }
  return piece;
}

export interface IMerkleData {
  root: Uint8Array;
  proofs: Uint8Array[];
}

function merkleHash(data: Uint8Array): Uint8Array {
  return hash(data, 32, 'sha256');
}

export function buildMerkleTree(items: Uint8Array[]): IMerkleData {
  const tree = new Tree(items, merkleHash);
  const root = tree.getRoot();
  const proofs: Uint8Array[] = [];

  for (const item of items) {
    proofs.push(tree.getProof(item));
  }

  return { root, proofs };
}

export function isValidMerkleProof(root: Uint8Array, proof: Uint8Array, item: Uint8Array): boolean {
  return Tree.checkProof(root, proof, item, merkleHash);
}
