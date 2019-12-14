// tslint:disable: prefer-conditional-expression

import * as fs from "fs";
import * as path from 'path';
import { PIECE_SIZE } from './constants';
import * as crypto from './crypto';
import { num2bin16 } from './utils';

export class Plotter {

  public static async init(size: number, storageDir: string | undefined): Promise<Plotter> {

     // set storage directory for plotting
    let storagePath: string;
    if (storageDir) {
      storagePath = path.normalize(storageDir);
    } else {
      storagePath = path.normalize('./results/plot.bin');
    }

    // allocate empty plot file
    const fileHandle = await fs.promises.open(storagePath, 'w');
    let written = 0;
    const emptyPiece = Buffer.alloc(PIECE_SIZE);

    while (written < size) {
      await fileHandle.write(emptyPiece);
      written += PIECE_SIZE;
    }

    await fileHandle.close();

    // open the plot
    const plotData = await fs.promises.open(storagePath, 'r+');
    return new Plotter(plotData);
  }

  public constructor(private readonly plot: fs.promises.FileHandle) {
  }

  public async add(piece: Uint8Array, key: Uint8Array, index: number): Promise<Uint8Array> {
    const iv = num2bin16(index);
    const encoding = crypto.encode(piece, iv, key);
    await this.plot.write(encoding, 0, PIECE_SIZE, index * PIECE_SIZE);
    return encoding;
  }

  public async get(index: number): Promise<Uint8Array> {
    const encoding = Buffer.allocUnsafe(PIECE_SIZE);
    await this.plot.read(encoding, 0, PIECE_SIZE, PIECE_SIZE * index);
    return encoding;
  }
}
