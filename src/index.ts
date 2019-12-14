// tslint:disable: no-console
import * as process from 'process';
import { GENESIS_PIECE, PIECE_SIZE, PLOT_SIZES } from './constants';
import * as crypto from './crypto';
import { Plotter } from './plotter';
import * as replicator from './replicator';
import { Ed25519Signatures } from './signatures';
import { num2bin16 } from './utils';

// ToDo
  // refactor signatures into wallet module
  // parse the proof into a block and add to ledger
  // set quality threshold and adjust as improves

// main program
async function run(): Promise<void> {

  try {
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
    const plotTimeStart = process.hrtime.bigint();
    const plotSize = PLOT_SIZES[0];
    const pieceCount = plotSize / PIECE_SIZE;
    const plot = await Plotter.init(plotSize, process.argv[2]);
    for (let i = 0; i < pieceCount; ++i) {
      await plot.add(GENESIS_PIECE, id, i);
    }
    const totalPlotTime = process.hrtime.bigint() - plotTimeStart;
    const averagePlotTime = totalPlotTime / BigInt(pieceCount);
    console.log('\nCompleted Plotting');
    console.log(`For ${pieceCount} pieces, average plot time is ${averagePlotTime} ns`);

    // solve, prove, and verify some number of challenges
    const samples = 1;
    let challenge = crypto.randomBytes(32);
    const evaluationTimeStart = process.hrtime.bigint();
    for (let i = 0; i < samples; ++i) {
      const solution = await replicator.solve(challenge, pieceCount, plot);
      // console.log(solution);
      const merkleProof = merkleTree.proofs[solution.index];
      const proof = replicator.prove(challenge, solution, notary, keys, merkleProof);
      // console.log(proof);
      replicator.verify(proof, notary, pieceCount, merkleTree.root);
      challenge = crypto.hash(solution.tag);
    }
    const totalEvaluationTime = process.hrtime.bigint() - evaluationTimeStart;
    const averageEvaluationTime = totalEvaluationTime / BigInt(samples);
    console.log('\nCompleted evaluation loop');
    console.log(`For ${samples} samples, average evaluation time is ${averageEvaluationTime} ns`);

    // After Ledger Module Built

    // After Network Module Built
      // connect to the network
      // sync the ledger
      // start farming
  } catch (error) {
    console.error(error);
  }
}

run();
