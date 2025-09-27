import { sha256 } from '@noble/hashes/sha256';
import { verify as secpVerify, sign, getPublicKey } from '@noble/secp256k1';

export class TxIn {
  constructor(txid, vout, signature = null, publicKey = null) {
    this.txid = txid;
    this.vout = vout;
    this.signature = signature;
    this.publicKey = publicKey;
  }
}

export class TxOut {
  constructor(address, value) {
    this.address = address;
    this.value = Number(value);
  }
}

export class Transaction {
  constructor(vin = [], vout = []) {
    this.vin = vin;
    this.vout = vout;
  }
  serialize() {
    return JSON.stringify({ vin: this.vin, vout: this.vout });
  }
  signingHash() {
    return Buffer.from(sha256(Buffer.from(this.serialize()))).toString('hex');
  }
  txid() {
    return Buffer.from(sha256(Buffer.from(this.serialize()))).toString('hex');
  }
  async signAllInputs(privateKeyHex) {
    const h = this.signingHash();
    const sigBytes = await sign(h, privateKeyHex, { recovered: false, der: false });
    const sig = Buffer.from(sigBytes).toString('hex');
    const pub = Buffer.from(getPublicKey(privateKeyHex, true)).toString('hex');
    this.vin = this.vin.map((i) => new TxIn(i.txid, i.vout, sig, pub));
  }
  static verifyAllInputs(tx, utxoSet, pubToAddress) {
    const h = tx.signingHash();
    for (const i of tx.vin) {
      const utxo = utxoSet.get(i.txid, i.vout);
      if (!utxo) return false;
      if (pubToAddress(i.publicKey) !== utxo.address) return false;
      if (!i.signature) return false;
      if (!secpVerify(i.signature, h, i.publicKey)) return false;
    }
    return true;
  }
}
