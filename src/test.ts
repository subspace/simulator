// tslint:disable: no-console

import * as crypto from './crypto';
import { areArraysEqual, createGenesisPiece, num2bin16 } from './utils';

// test encode/decode
const piece = createGenesisPiece('SUBSPACE');
const key = crypto.randomBytes(32);
const iv = num2bin16(55);
const rounds = 384;

const encoding = crypto.encode(piece, iv, key, rounds);
const decoding = crypto.decode(encoding, iv, key, rounds);

const valid = areArraysEqual(crypto.hash(piece), crypto.hash(decoding));
console.log(valid);
