import express from 'express';
import { Transaction, TxIn, TxOut } from '../tx/Transaction.js';
import { pubKeyToAddress } from '../utils/crypto.js';

export function buildApi({ node }) {
  const app = express();
  app.use(express.json());
  // make node available to handlers (used by tx/build)
  app.locals.node = node;

  app.get('/api/v1/peerinfo', (req, res) => {
    const peerId = node.p2p?.node?.peerId?.toString?.() || null;
    const addrs = node.p2p?.node?.getMultiaddrs?.().map(a => a.toString()) || [];
    res.json({ success: true, peerId, addrs });
  });

  // Build unsigned transaction selecting UTXOs greedily from address
  app.post('/api/v1/tx/build', (req, res) => {
    try {
      const { fromAddress, outputs, fee = 0 } = req.body || {};
      if (!fromAddress || !Array.isArray(outputs) || outputs.length === 0) {
        return res.status(400).json({ success: false, message: 'fromAddress and outputs[] required' });
      }
      const target = Number(outputs.reduce((a, o) => a + Number(o.value || 0), 0)) + Number(fee || 0);
      const utxos = [];
      for (const [key, u] of app.locals.node.chain.utxo.map.entries()) {
        if (u.address === fromAddress) {
          const [txid, vout] = key.split(':');
          utxos.push({ txid, vout: Number(vout), value: Number(u.value) });
        }
      }
      utxos.sort((a, b) => b.value - a.value);
      let sum = 0;
      const selected = [];
      for (const u of utxos) { selected.push(u); sum += u.value; if (sum >= target) break; }
      if (sum < target) return res.status(400).json({ success: false, message: 'Insufficient balance' });
      const vin = selected.map(u => ({ txid: u.txid, vout: u.vout }));
      const vout = outputs.map(o => ({ address: o.address, value: Number(o.value) }));
      const change = sum - target;
      if (change > 0) vout.push({ address: fromAddress, value: change });
      const tx = new Transaction(vin.map(i => new TxIn(i.txid, i.vout)), vout.map(o => new TxOut(o.address, o.value)));
      const signingHash = tx.signingHash();
      return res.json({ success: true, signingHash, vin, vout });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  });

  // Submit signed transaction, verify signatures for all inputs
  app.post('/api/v1/tx/submit', (req, res) => {
    try {
      const { vin, vout } = req.body || {};
      if (!Array.isArray(vin) || vin.length === 0 || !Array.isArray(vout) || vout.length === 0) {
        return res.status(400).json({ success: false, message: 'vin and vout required' });
      }
      const tx = new Transaction(
        vin.map(i => new TxIn(i.txid, Number(i.vout), i.signature, i.publicKey)),
        vout.map(o => new TxOut(o.address, Number(o.value)))
      );
      const ok = Transaction.verifyAllInputs(tx, app.locals.node.chain.utxo, pubKeyToAddress);
      if (!ok) return res.status(400).json({ success: false, message: 'Invalid signatures or inputs' });
      app.locals.node.queueTx({ vin: tx.vin, vout: tx.vout });
      return res.status(202).json({ success: true, txid: tx.txid() });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get('/api/v1/chain', (req, res) => {
    res.json({ success: true, height: node.chain.chain.length - 1, chain: node.chain.chain.map(b => ({ index: b.index, hash: b.hash, prevHash: b.prevHash, txs: b.txs.length, timestamp: b.timestamp })) });
  });

  app.get('/api/v1/balance/:address', (req, res) => {
    const bal = node.chain.utxo.balanceOf(req.params.address);
    res.json({ success: true, address: req.params.address, balance: bal });
  });

  // List UTXOs for an address
  app.get('/api/v1/utxo/:address', (req, res) => {
    try {
      const list = [];
      for (const [key, utxo] of node.chain.utxo.map.entries()) {
        if (utxo.address === req.params.address) {
          const [txid, vout] = key.split(':');
          list.push({ txid, vout: Number(vout), value: utxo.value });
        }
      }
      res.json({ success: true, address: req.params.address, utxos: list });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post('/api/v1/tx', (req, res) => {
    try {
      const tx = req.body; // expect same shape as Transaction instance
      node.queueTx(tx);
      res.status(202).json({ success: true, txid: tx.txid || 'queued' });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  app.get('/api/v1/mempool', (req, res) => {
    try {
      res.json({ success: true, mempool: node.chain.mempool.map(t => ({ vin: t.vin, vout: t.vout })) });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post('/api/v1/mine', (req, res) => {
    try {
      const b = node.minePending(req.body?.minerAddress);
      res.status(201).json({ success: true, blockHash: b.hash, height: b.index });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  // Faucet: mint 50 IND to provided address by mining a coinbase-only block
  app.post('/api/v1/faucet', (req, res) => {
    try {
      const { address } = req.body || {};
      if (!address) return res.status(400).json({ success: false, message: 'address required' });
      const b = node.minePending(address);
      res.status(201).json({ success: true, blockHash: b.hash, height: b.index });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  app.get('/api/v1/peers', async (req, res) => {
    const conns = node.p2p?.node?.getConnections?.() || [];
    res.json({ success: true, count: conns.length });
  });

  return app;
}
