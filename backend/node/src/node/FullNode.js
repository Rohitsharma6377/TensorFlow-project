import { Blockchain } from '../block/Blockchain.js';
import { Block } from '../block/Block.js';
import { UTXOSet } from '../utxo/UTXOSet.js';
import { PeerService } from '../p2p/PeerService.js';
import { EventEmitter } from 'events';
import { Transaction, TxIn, TxOut } from '../tx/Transaction.js';

export class FullNode {
  constructor({ difficulty = 3, p2pListen, bootnodes = [] }) {
    // Genesis block with coinbase to a null address for simplicity
    const genesis = new Block({ index: 0, prevHash: '0'.repeat(64), txs: [], difficulty, timestamp: Date.now() });
    genesis.hash = genesis.computeHash();
    this.chain = new Blockchain({ genesis, utxoSet: new UTXOSet(), difficulty });

    this.p2p = new PeerService({
      onBlock: (b) => this.onRemoteBlock(b),
      onTx: (t) => this.onRemoteTx(t),
      listen: p2pListen,
      bootstrapPeers: bootnodes,
    });
    this.events = new EventEmitter();
  }

  async startP2P() {
    await this.p2p.start();
  }

  onRemoteBlock(block) {
    try {
      // naive: accept if valid successor
      const prev = this.chain.tip();
      if (block.prevHash !== prev.hash) return; // ignore forks for now
      this.chain.addBlock(block.txs || []); // remine locally to keep PoW; in future, verify hash directly
    } catch (e) {
      // ignore invalid
    }
  }

  onRemoteTx(tx) {
    try { this.chain.queueTx(tx); this.events.emit('tx', tx); } catch {}
  }

  queueTx(tx) {
    this.chain.queueTx(tx);
    // Broadcast
    this.p2p.broadcastTx(tx).catch(() => {});
    this.events.emit('tx', tx);
  }

  minePending(minerAddress) {
    // Optional coinbase to miner
    const txs = [...this.chain.mempool];
    if (minerAddress) {
      const coinbase = new Transaction([], [ new TxOut(minerAddress, 50) ]);
      txs.unshift(coinbase);
    }
    const block = this.chain.addBlock(txs);
    // Broadcast mined block header+txs
    this.p2p.broadcastBlock({ ...block, txs: block.txs }).catch(() => {});
    this.events.emit('block', block);
    return block;
  }
}
