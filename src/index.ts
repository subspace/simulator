// tslint:disable: no-console

import { GENESIS_PIECE, PIECE_SIZE, PLOT_SIZES } from './constants';
import * as crypto from './crypto';
import { Plotter } from './plotter';
import * as replicator from './replicator';
import { Ed25519Signatures } from './signatures';
import { num2bin16 } from './utils';

// ToDo
  // time test solve / verify now over many rounds
  // refactor signatures into wallet module
  // parse the proof into a block and add to ledger
  // check quality and adjust quality

// main program
async function run(): Promise<void> {

  // generate keys and node id
  const notary = await Ed25519Signatures.init();
  const keySeed = crypto.randomBytes(32);
  const keys = notary.generateKeypair(keySeed);
  const id = crypto.hash(keys.binaryPublicKey);
  console.log('Generated keys');

  // generate one merkle tree
  const indexHashes: Uint8Array[] = [];
  for (let i = 0; i < 255; ++i) {
    indexHashes.push(crypto.hash(num2bin16(i)));
  }
  const merkleTree = crypto.buildMerkleTree(indexHashes);
  console.log('Built merkle tree');

  // plot the farm
  const plotSize = PLOT_SIZES[0];
  const pieceCount = plotSize / PIECE_SIZE;
  const plot = await Plotter.init(plotSize, process.argv[2]);
  for (let i = 0; i < pieceCount; ++i) {
    await plot.add(GENESIS_PIECE, id, i);
  }
  console.log('Completed Plotting');

  // solve, prove, and verify some number of challenges
  const samples = 1;
  const minQuality = 0;
  let challenge = crypto.randomBytes(32);
  for (let i = 0; i < samples; ++i) {
    const solution = await replicator.solve(challenge, pieceCount, plot);
    challenge = crypto.hash(solution.tag);
    if (solution.quality > minQuality) {
      const merkleProof = merkleTree.proofs[solution.index];
      const proof = replicator.prove(challenge, solution, notary, keys, merkleProof);
      replicator.verify(proof, notary, pieceCount, merkleTree.root);
    }
  }
  console.log('Completed evaluation loop');

  // After Ledger Module Built

  // After Network Module Built
    // connect to the network
    // sync the ledger
    // start farming
}

run();
