const crypto = require('crypto');
const { verify, publicKeyToAddress } = require('./wallet');

class TxIn {
  constructor(txid, vout, signature = null, publicKey = null) {
    this.txid = txid; // hex id of prev tx
    this.vout = vout; // output index
    this.signature = signature; // hex DER
    this.publicKey = publicKey; // hex
  }
}

class TxOut {
  constructor(address, value) {
    this.address = address; // recipient address
    this.value = value; // number (IND)
  }
}

class Transaction {
  constructor(vin = [], vout = [], lockTime = 0, version = 1) {
    this.version = version;
    this.vin = vin; // array of TxIn
    this.vout = vout; // array of TxOut
    this.lockTime = lockTime;
  }

  isCoinbase() {
    return this.vin.length === 0;
  }

  serializeForHash(includeSignatures = false) {
    const obj = {
      version: this.version,
      vin: this.vin.map((i) => ({ txid: i.txid, vout: i.vout, ...(includeSignatures ? { signature: i.signature, publicKey: i.publicKey } : {}) })),
      vout: this.vout.map((o) => ({ address: o.address, value: o.value })),
      lockTime: this.lockTime,
    };
    return JSON.stringify(obj);
  }

  txid() {
    const pre = this.serializeForHash(false);
    // Double SHA256 like Bitcoin
    const first = crypto.createHash('sha256').update(pre).digest();
    return crypto.createHash('sha256').update(first).digest('hex');
  }

  signingHash() {
    // Hash used for signing (no signatures in preimage)
    return crypto.createHash('sha256').update(this.serializeForHash(false)).digest('hex');
  }
}

class Block {
  constructor(index, timestamp, transactions, previousHash = '', bits = 3, version = 1) {
    this.version = version;
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions; // array of Transaction
    this.previousHash = previousHash;
    this.bits = bits; // simplified difficulty: number of leading zeros required
    this.merkleRoot = this.computeMerkleRoot();
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  computeMerkleRoot() {
    if (!this.transactions.length) return ''.padStart(64, '0');
    let layer = this.transactions.map((tx) => tx.txid());
    while (layer.length > 1) {
      const next = [];
      for (let i = 0; i < layer.length; i += 2) {
        const left = layer[i];
        const right = layer[i + 1] || left;
        const first = crypto.createHash('sha256').update(Buffer.from(left + right, 'hex')).digest();
        const h = crypto.createHash('sha256').update(first).digest('hex');
        next.push(h);
      }
      layer = next;
    }
    return layer[0];
  }

  calculateHash() {
    const header = `${this.version}|${this.index}|${this.previousHash}|${this.merkleRoot}|${this.timestamp}|${this.bits}|${this.nonce}`;
    return crypto.createHash('sha256').update(header).digest('hex');
  }

  mineBlock(difficulty) {
    const target = '0'.repeat(difficulty);
    while (!this.hash.startsWith(target)) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }
}

class Blockchain {
  constructor() {
    // Initialize core fields BEFORE creating the genesis block
    this.difficulty = 3; // number of leading zeros
    this.mempool = []; // pending Transaction
    this.coinName = 'IND';
    this.miningReward = 50; // IND per block (subsidy)
    this.currentMiner = null; // address to receive reward on mine
    this.utxo = new Map(); // key: `${txid}:${index}` -> TxOut
    // Now we can safely create the genesis block which populates UTXO
    this.chain = [this.createGenesisBlock()];
  }

  createGenesisBlock() {
    const genesisTx = new Transaction([], [new TxOut('SYSTEM', 0)]);
    const block = new Block(0, Date.now(), [genesisTx], '0', this.difficulty);
    block.mineBlock(1);
    // Initialize UTXO with genesis outputs
    const txid = genesisTx.txid();
    genesisTx.vout.forEach((o, idx) => this.utxo.set(`${txid}:${idx}`, o));
    return block;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(transactions) {
    const block = new Block(
      this.chain.length,
      Date.now(),
      transactions,
      this.getLatestBlock().hash,
      this.difficulty
    );
    block.mineBlock(this.difficulty);
    // Apply UTXO changes
    for (const tx of transactions) {
      const txid = tx.txid();
      // Spend inputs
      for (const input of tx.vin) {
        this.utxo.delete(`${input.txid}:${input.vout}`);
      }
      // Add outputs
      tx.vout.forEach((o, idx) => this.utxo.set(`${txid}:${idx}`, o));
    }
    this.chain.push(block);
    return block;
  }

  setMiner(address) {
    this.currentMiner = address;
  }

  getPendingTransactions() {
    return this.mempool.slice();
  }

  queueTransaction(tx) {
    // Validate structure
    if (!(tx instanceof Transaction)) throw new Error('Invalid tx');
    if (!Array.isArray(tx.vin) || !Array.isArray(tx.vout) || tx.vout.length === 0) throw new Error('Invalid tx body');
    // Verify inputs & signatures
    if (!tx.isCoinbase()) {
      const sHash = tx.signingHash();
      const seen = new Set();
      let inputSum = 0;
      for (const input of tx.vin) {
        const key = `${input.txid}:${input.vout}`;
        if (seen.has(key)) throw new Error('Duplicate input');
        seen.add(key);
        const prevOut = this.getUtxoFromSnapshots(key);
        if (!prevOut) throw new Error('Referenced output not found or already spent');
        // Ownership: public key -> address must match prevOut.address
        const addr = publicKeyToAddress(input.publicKey);
        if (addr !== prevOut.address) throw new Error('Input public key does not own referenced output');
        if (!input.signature) throw new Error('Missing signature');
        const ok = verify(sHash, input.signature, input.publicKey);
        if (!ok) throw new Error('Invalid signature');
        inputSum += prevOut.value;
      }
      const outputSum = tx.vout.reduce((a, o) => a + Number(o.value || 0), 0);
      if (inputSum < outputSum) throw new Error('Inputs less than outputs');
    }
    // Basic anti-double-spend within mempool
    for (const mem of this.mempool) {
      for (const i of mem.vin) {
        for (const j of tx.vin) {
          if (i.txid === j.txid && i.vout === j.vout) throw new Error('Double spend in mempool');
        }
      }
    }
    this.mempool.push(tx);
  }

  getBalanceConsideringMempool(address) {
    const utxos = this.listUtxoByAddress(address);
    let balance = utxos.reduce((a, u) => a + u.value, 0);
    // Apply mempool spends and outputs
    for (const tx of this.mempool) {
      for (const i of tx.vin) {
        const key = `${i.txid}:${i.vout}`;
        const out = this.utxo.get(key);
        if (out && out.address === address) balance -= out.value;
      }
      for (const o of tx.vout) {
        if (o.address === address) balance += o.value;
      }
    }
    return balance;
  }

  minePendingTransactions(minerAddress) {
    const miner = minerAddress || this.currentMiner;
    if (!miner) throw new Error('Miner address not set');
    // Calculate total fees from mempool
    let totalFees = 0;
    for (const tx of this.mempool) {
      if (tx.isCoinbase()) continue;
      let inSum = 0;
      for (const i of tx.vin) {
        const prev = this.utxo.get(`${i.txid}:${i.vout}`);
        if (!prev) throw new Error('Mempool tx references missing utxo');
        inSum += prev.value;
      }
      const outSum = tx.vout.reduce((a, o) => a + o.value, 0);
      totalFees += Math.max(0, inSum - outSum);
    }
    const coinbase = new Transaction([], [new TxOut(miner, this.miningReward + totalFees)]);
    const blockTxs = [coinbase, ...this.mempool];
    this.mempool = [];
    return this.addBlock(blockTxs);
  }

  getBalanceOfAddress(address) {
    return this.listUtxoByAddress(address).reduce((a, u) => a + u.value, 0);
  }

  listUtxoByAddress(address) {
    const items = [];
    for (const [key, out] of this.utxo.entries()) {
      if (out.address === address) {
        const [txid, vout] = key.split(':');
        items.push({ txid, vout: Number(vout), value: out.value });
      }
    }
    return items;
  }

  getUtxoFromSnapshots(key) {
    // Check if utxo is already spent by mempool
    for (const mem of this.mempool) {
      for (const i of mem.vin) {
        if (`${i.txid}:${i.vout}` === key) return null;
      }
    }
    return this.utxo.get(key) || null;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const prev = this.chain[i - 1];
      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== prev.hash) return false;
      // Merkle root should match
      if (current.merkleRoot !== current.computeMerkleRoot()) return false;
    }
    return true;
  }
}

// Singleton instance for app lifetime
const chain = new Blockchain();

module.exports = {
  Transaction,
  TxIn,
  TxOut,
  Block,
  Blockchain,
  chain,
};
