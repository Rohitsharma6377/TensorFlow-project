// Helpers for mining quota
const DAILY_MINES_LIMIT = 100;
const BATCH_SIZE = 25; // pause after every 25 mines
const PAUSE_SECONDS = 60; // cooldown seconds after each batch

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

async function getMiningStat(userId) {
  const date = todayStr();
  let stat = await MiningStat.findOne({ user: userId, date });
  if (!stat) {
    stat = await MiningStat.create({ user: userId, date, count: 0, pausedUntil: null });
  }
  return stat;
}

function secondsLeft(date) {
  if (!date) return 0;
  const now = Date.now();
  const t = new Date(date).getTime();
  return Math.max(0, Math.ceil((t - now) / 1000));
}

 
const express = require('express');
const WalletAddress = require('../models/WalletAddress');
const { body, param, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { chain, Transaction, TxIn, TxOut } = require('../web3/blockchain');
const { generateKeyPair, verify, publicKeyToAddress } = require('../web3/wallet');
const User = require('../models/User');
const MiningStat = require('../models/MiningStat');

const router = express.Router();
const NODE_BASE = process.env.IND_NODE_BASE || '';

async function nodeFetch(path, init) {
  const url = NODE_BASE.replace(/\/$/, '') + path;
  const res = await fetch(url, { headers: { 'content-type': 'application/json' }, ...init });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Get mining quota status
router.get('/quota', auth(), async (req, res) => {
  try {
    const stat = await getMiningStat(req.user.id);
    const pausedFor = secondsLeft(stat.pausedUntil);
    res.json({
      success: true,
      date: stat.date,
      count: stat.count,
      limit: DAILY_MINES_LIMIT,
      remaining: Math.max(0, DAILY_MINES_LIMIT - stat.count),
      batchSize: BATCH_SIZE,
      paused: pausedFor > 0,
      pausedFor,
      pausedUntil: stat.pausedUntil,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to get quota' });
  }
});

// Save a wallet address for the current user (Mongo)
router.post('/wallets', auth(), [body('address').isString()], async (req, res) => {
  try {
    const { address, publicKey, type = 'ind', label, metadata } = req.body || {};
    if (!address) return res.status(400).json({ success: false, message: 'address required' });
    const wa = await WalletAddress.findOneAndUpdate(
      { user: req.user.id, address },
      { $set: { publicKey, type, label, metadata } },
      { upsert: true, new: true }
    );
    return res.json({ success: true, wallet: wa });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// List wallet addresses for current user
router.get('/wallets', auth(), async (req, res) => {
  try {
    const list = await WalletAddress.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, wallets: list });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// Chain info
router.get('/info', auth(), async (req, res) => {
  if (NODE_BASE) {
    try {
      const info = await nodeFetch('/api/v1/chain');
      return res.json({ success: true, coin: 'IND', difficulty: Number(process.env.IND_NODE_DIFFICULTY || 3), miningReward: 50, height: info?.height ?? 0, miner: chain.currentMiner, valid: true });
    } catch (e) {
      return res.status(502).json({ success: false, message: e.message });
    }
  }
  res.json({
    success: true,
    coin: chain.coinName,
    difficulty: chain.difficulty,
    miningReward: chain.miningReward,
    height: chain.chain.length - 1,
    miner: chain.currentMiner,
    valid: chain.isChainValid(),
  });
});

// Get full chain (for demo; do not expose in production at scale)
router.get('/chain', auth(), async (req, res) => {
  if (NODE_BASE) {
    try { const c = await nodeFetch('/api/v1/chain'); return res.json({ success: true, chain: c.chain, valid: true }); } catch (e) { return res.status(502).json({ success: false, message: e.message }); }
  }
  res.json({ success: true, chain: chain.chain, valid: chain.isChainValid() });
});

// Get balance
router.get('/balance/:address', auth(), [param('address').isString()], async (req, res) => {
  if (NODE_BASE) {
    try { const b = await nodeFetch(`/api/v1/balance/${req.params.address}`); return res.json({ success: true, address: b.address, balance: b.balance, coin: 'IND' }); } catch (e) { return res.status(502).json({ success: false, message: e.message }); }
  }
  const balance = chain.getBalanceOfAddress(req.params.address);
  res.json({ success: true, address: req.params.address, balance, coin: chain.coinName });
});

// Get mempool
router.get('/mempool', auth(), async (req, res) => {
  if (NODE_BASE) {
    try { const m = await nodeFetch('/api/v1/mempool'); return res.json({ success: true, mempool: m.mempool }); } catch (e) { return res.status(502).json({ success: false, message: e.message }); }
  }
  res.json({ success: true, mempool: chain.getPendingTransactions() });
});

// List UTXOs for address
router.get('/utxo/:address', auth(), [param('address').isString()], async (req, res) => {
  if (NODE_BASE) {
    try { const u = await nodeFetch(`/api/v1/utxo/${req.params.address}`); return res.json({ success: true, address: u.address, utxos: u.utxos }); } catch (e) { return res.status(502).json({ success: false, message: e.message }); }
  }
  const utxos = chain.listUtxoByAddress(req.params.address);
  res.json({ success: true, address: req.params.address, utxos });
});

// Peers (node connections)
router.get('/peers', auth(), async (req, res) => {
  if (NODE_BASE) {
    try { const p = await nodeFetch('/api/v1/peers'); return res.json({ success: true, count: p.count || 0 }); } catch (e) { return res.status(502).json({ success: false, message: e.message }); }
  }
  return res.json({ success: true, count: 0 });
});

// Register or generate a wallet for the current user (server stores only public key + address)
router.post('/wallet/register', auth(), async (req, res) => {
  try {
    // If client provides a publicKey, derive address from it; otherwise generate a key pair for the user
    const clientPublicKey = req.body?.publicKey;
    let publicKey, address, privateKey;
    if (clientPublicKey) {
      publicKey = clientPublicKey;
      address = publicKeyToAddress(publicKey);
    } else {
      const kp = generateKeyPair();
      publicKey = kp.publicKey;
      address = kp.address;
      privateKey = kp.privateKey; // return to client; do NOT store
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { walletPublicKey: publicKey, walletAddress: address },
      { new: true }
    ).select('-passwordHash');

    res.json({ success: true, user, wallet: { address, publicKey, privateKey } });
  } catch (e) {
    console.error('wallet register error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Queue a signed transaction into mempool (preferred)
router.post(
  '/tx/queue',
  auth(),
  [
    body('vin').isArray({ min: 1 }),
    body('vout').isArray({ min: 1 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    // If external node configured, submit there
    if (NODE_BASE) {
      try {
        const sub = await nodeFetch('/api/v1/tx/submit', { method: 'POST', body: JSON.stringify({ vin: req.body.vin, vout: req.body.vout }) });
        return res.status(202).json({ success: true, txid: sub.txid || 'queued' });
      } catch (e) {
        return res.status(502).json({ success: false, message: e.message });
      }
    }

    const { vin, vout } = req.body;
    // Build tx from provided inputs/outputs (already signed per input)
    const txIns = vin.map((i) => new TxIn(i.txid, i.vout, i.signature, i.publicKey));
    const txOuts = vout.map((o) => new TxOut(o.address, Number(o.value)));
    const tx = new Transaction(txIns, txOuts);
    // Basic per-input verification: publicKey->address must own referenced utxo; verify signatures
    const sHash = tx.signingHash();
    for (const i of tx.vin) {
      const utxo = chain.listUtxoByAddress(publicKeyToAddress(i.publicKey)).find((u) => u.txid === i.txid && u.vout === i.vout);
      if (!utxo) {
        return res.status(400).json({ success: false, message: 'Referenced UTXO not found for input' });
      }
      if (!i.signature || !i.publicKey) {
        return res.status(400).json({ success: false, message: 'Missing signature/publicKey on input' });
      }
      const ok = verify(sHash, i.signature, i.publicKey);
      if (!ok) return res.status(400).json({ success: false, message: 'Invalid signature on input' });
    }
    try {
      chain.queueTransaction(tx);
      return res.status(202).json({ success: true, txid: tx.txid() });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }
);

// Helper: Build an unsigned transaction (greedy coin selection)
router.post(
  '/tx/build',
  auth(),
  [
    body('fromAddress').isString(),
    body('outputs').isArray({ min: 1 }), // [{address, value}]
    body('fee').optional().isFloat({ gt: 0 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    if (NODE_BASE) {
      nodeFetch('/api/v1/tx/build', { method: 'POST', body: JSON.stringify(req.body) })
        .then((d) => res.json(d))
        .catch((e) => res.status(502).json({ success: false, message: e.message }));
      return;
    }
    const { fromAddress, outputs, fee = 0 } = req.body;
    const target = outputs.reduce((a, o) => a + Number(o.value || 0), 0) + Number(fee);
    const utxos = chain.listUtxoByAddress(fromAddress).sort((a, b) => b.value - a.value);
    let sum = 0;
    const selected = [];
    for (const u of utxos) {
      selected.push(u);
      sum += u.value;
      if (sum >= target) break;
    }
    if (sum < target) return res.status(400).json({ success: false, message: 'Insufficient balance' });
    const vin = selected.map((u) => ({ txid: u.txid, vout: u.vout }));
    const vout = outputs.map((o) => ({ address: o.address, value: Number(o.value) }));
    const change = sum - target;
    if (change > 0) vout.push({ address: fromAddress, value: change });
    const tx = new Transaction(vin.map((i) => new TxIn(i.txid, i.vout)), vout.map((o) => new TxOut(o.address, o.value)));
    const signingHash = tx.signingHash();
    res.json({ success: true, signingHash, vin, vout });
  }
);

// Configure miner address
router.post('/miner', auth(), [body('address').isString()], (req, res) => {
  chain.setMiner(req.body.address);
  res.json({ success: true, miner: chain.currentMiner });
});

// Mine pending transactions (includes coinbase reward)
router.post('/mine', auth(), [body('minerAddress').optional().isString()], async (req, res) => {
  try {
    if (NODE_BASE) {
      const b = await nodeFetch('/api/v1/mine', { method: 'POST', body: JSON.stringify({ minerAddress: req.body?.minerAddress }) });
      return res.status(201).json({ success: true, blockHash: b.blockHash, height: b.height });
    }
    // Enforce daily quota and batch pauses
    const stat = await getMiningStat(req.user.id);
    if (stat.count >= DAILY_MINES_LIMIT) {
      return res.status(429).json({ success: false, message: 'Daily mining limit reached', limit: DAILY_MINES_LIMIT });
    }
    const pausedFor = secondsLeft(stat.pausedUntil);
    if (pausedFor > 0) {
      return res.status(429).json({ success: false, message: `Mining paused, retry in ${pausedFor}s`, pausedFor });
    }

    const block = chain.minePendingTransactions(req.body.minerAddress);

    // Increment count and set pause if needed
    stat.count += 1;
    if (stat.count % BATCH_SIZE === 0 && stat.count < DAILY_MINES_LIMIT) {
      stat.pausedUntil = new Date(Date.now() + PAUSE_SECONDS * 1000);
    }
    await stat.save();

    res.status(201).json({ success: true, blockHash: block.hash, height: block.index, count: stat.count, limit: DAILY_MINES_LIMIT, pausedUntil: stat.pausedUntil });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Create a transaction and mine a block immediately (legacy demo PoW)
router.post(
  '/tx',
  auth(),
  [
    body('fromAddress').optional({ nullable: true }).isString(),
    body('toAddress').isString(),
    body('amount').isFloat({ gt: 0 }),
    body('signature').optional().isString(),
    body('publicKey').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { fromAddress = null, toAddress, amount, signature, publicKey } = req.body;
    const tx = new Transaction(fromAddress, toAddress, Number(amount));
    const hash = tx.calculateHash();

    if (fromAddress) {
      // Verify signature for non-coinbase tx
      if (!signature || !publicKey) {
        return res.status(400).json({ success: false, message: 'Signature and publicKey are required' });
      }
      const ok = verify(hash, signature, publicKey);
      if (!ok) return res.status(400).json({ success: false, message: 'Invalid signature' });
      tx.signature = signature;
    }

    const block = chain.addBlock([tx]);
    res.status(201).json({ success: true, tx, blockHash: block.hash });
  }
);

module.exports = router;
