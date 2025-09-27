import { Block } from './Block.js';

export class Blockchain {
  constructor({ genesis, utxoSet, difficulty = 3 }) {
    this.chain = [genesis];
    this.utxo = utxoSet;
    this.difficulty = difficulty;
    this.mempool = []; // tx objects
  }

  tip() { return this.chain[this.chain.length - 1]; }

  isValidNewBlock(block, prev) {
    if (block.index !== prev.index + 1) return false;
    if (block.prevHash !== prev.hash) return false;
    const prefix = '0'.repeat(block.difficulty);
    if (!block.hash.startsWith(prefix)) return false;
    // TODO: verify merkleRoot, tx validity
    return true;
  }

  addBlock(txs = []) {
    const prev = this.tip();
    const block = new Block({ index: this.chain.length, prevHash: prev.hash, txs, difficulty: this.difficulty });
    block.mine();
    if (!this.isValidNewBlock(block, prev)) throw new Error('Invalid block');
    // Apply UTXO changes
    this.chain.push(block);
    this.utxo.applyBlock(block);
    // Remove mined txs from mempool
    const minedTxids = new Set(txs.map((t) => t.txid()));
    this.mempool = this.mempool.filter((t) => !minedTxids.has(t.txid()));
    return block;
  }

  queueTx(tx) {
    // naive: just push; production would validate inputs and sigs
    this.mempool.push(tx);
  }
}
