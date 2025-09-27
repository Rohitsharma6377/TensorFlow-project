import { sha256 } from '@noble/hashes/sha256';

export class Block {
  constructor({ index, prevHash, txs = [], difficulty = 3, timestamp }) {
    this.index = index;
    this.prevHash = prevHash;
    this.txs = txs;
    this.timestamp = timestamp || Date.now();
    this.nonce = 0;
    this.difficulty = difficulty;
    this.merkleRoot = this.computeMerkleRoot();
    this.hash = this.computeHash();
  }

  computeMerkleRoot() {
    const leaves = this.txs.map((t) => t.txid());
    if (leaves.length === 0) {
      return Buffer.from(sha256(new Uint8Array())).toString('hex');
    }
    let level = leaves;
    while (level.length > 1) {
      const next = [];
      for (let i = 0; i < level.length; i += 2) {
        const a = level[i];
        const b = level[i + 1] || level[i];
        next.push(Buffer.from(sha256(Buffer.from(a + b, 'hex'))).toString('hex'));
      }
      level = next;
    }
    return level[0];
  }

  computeHash() {
    const header = `${this.index}|${this.prevHash}|${this.merkleRoot}|${this.timestamp}|${this.nonce}|${this.difficulty}`;
    return Buffer.from(sha256(Buffer.from(header))).toString('hex');
  }

  mine() {
    const prefix = '0'.repeat(this.difficulty);
    while (!this.hash.startsWith(prefix)) {
      this.nonce++;
      this.hash = this.computeHash();
    }
    return this.hash;
  }
}
