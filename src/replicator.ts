// tslint:disable: object-literal-sort-keys

import { GENESIS_PIECE_HASH } from './constants';
import * as crypto from './crypto';
import { Plotter } from './plotter';
import { Ed25519Signatures, IKeyPair } from "./signatures";
import { areArraysEqual, measureQuality, modulo, num2bin16 } from './utils';

export interface ISolution {
  index: number;
  encoding: Uint8Array;
  tag: Uint8Array;
  quality: number;
}

export async function solve(challenge: Uint8Array, pieceCount: number, plot: Plotter): Promise<ISolution> {
  const index = modulo(challenge, pieceCount);
  const encoding = await plot.get(index);
  const tag = crypto.hmac(challenge, encoding);
  const quality = measureQuality(tag);
  return {
    index,
    encoding,
    tag,
    quality,
  };
}

export interface IProof {
  challenge: Uint8Array;
  publicKey: Uint8Array;
  tag: Uint8Array;
  signature: Uint8Array;
  merkleProof: Uint8Array;
  encoding: Uint8Array;
}

export function prove(challenge: Uint8Array, solution: ISolution, notary: Ed25519Signatures, keys: IKeyPair, merkleProof: Uint8Array): IProof {
  const signature = notary.sign(solution.tag, keys.binaryPublicKey, keys.binaryPrivateKey);
  return {
    challenge,
    publicKey: keys.binaryPublicKey,
    tag: solution.tag,
    signature,
    merkleProof,
    encoding: solution.encoding,
  };
}

export function verify(proof: IProof, notary: Ed25519Signatures, pieceCount: number, root: Uint8Array): boolean {

  // is challenge part of my chain?

  // derive the challenge index
  const index = modulo(proof.challenge, pieceCount);

  // is tag correct?
  if (! areArraysEqual(proof.tag, crypto.hmac(proof.encoding, proof.challenge))) {
    throw new Error('Invalid proof of storage, tag is incorrect');
  }

  // does encoding decode to to pieceHash with public key and challenge index
  const key = crypto.hash(proof.publicKey);
  const piece = crypto.decode(proof.encoding, index, key, 384);
  const pieceHash = crypto.hash(piece);
  if (! areArraysEqual(pieceHash, GENESIS_PIECE_HASH)) {
    throw new Error('Invalid proof of storage, decoding fails');
  }

  // does signature match public key
  const validSig = notary.verify(proof.tag, proof.signature, proof.publicKey);
  if (!validSig) {
    throw new Error('Invalid proof of storage, signature is invalid');
  }

  // is merkle proof and index valid?
  const merkleLeaf = crypto.hash(num2bin16(index % 256));
  const isValidMerkleProof = crypto.isValidMerkleProof(root, proof.merkleProof, merkleLeaf);
  if (!isValidMerkleProof) {
    throw new Error('Invalid proof of storage, merkle proof is invalid');
  }

  return true;
}
