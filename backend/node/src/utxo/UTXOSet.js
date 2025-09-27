export class UTXOSet {
  constructor() {
    // key: `${txid}:${vout}` => { address, value }
    this.map = new Map();
  }
  get(txid, vout) {
    return this.map.get(`${txid}:${vout}`);
  }
  set(txid, vout, utxo) {
    this.map.set(`${txid}:${vout}`, utxo);
  }
  delete(txid, vout) {
    this.map.delete(`${txid}:${vout}`);
  }
  balanceOf(address) {
    let sum = 0;
    for (const [_, u] of this.map.entries()) {
      if (u.address === address) sum += Number(u.value || 0);
    }
    return sum;
  }
  applyBlock(block) {
    for (const tx of block.txs) {
      // spend inputs
      for (const i of tx.vin) this.delete(i.txid, i.vout);
      // create outputs
      tx.vout.forEach((o, idx) => this.set(tx.txid(), idx, { address: o.address, value: o.value }));
    }
  }
}
