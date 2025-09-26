const express = require('express');
const { body, param, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { chain, Transaction, TxIn, TxOut } = require('../web3/blockchain');
const { generateKeyPair, verify, publicKeyToAddress } = require('../web3/wallet');
const User = require('../models/User');

const router = express.Router();

// Chain info
router.get('/info', auth(), (req, res) => {
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
router.get('/chain', auth(), (req, res) => {
  res.json({ success: true, chain: chain.chain, valid: chain.isChainValid() });
});

// Get balance
router.get('/balance/:address', auth(), [param('address').isString()], (req, res) => {
  const balance = chain.getBalanceOfAddress(req.params.address);
  res.json({ success: true, address: req.params.address, balance, coin: chain.coinName });
});

// Get mempool
router.get('/mempool', auth(), (req, res) => {
  res.json({ success: true, mempool: chain.getPendingTransactions() });
});

// List UTXOs for address
router.get('/utxo/:address', auth(), [param('address').isString()], (req, res) => {
  const utxos = chain.listUtxoByAddress(req.params.address);
  res.json({ success: true, address: req.params.address, utxos });
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
router.post('/mine', auth(), [body('minerAddress').optional().isString()], (req, res) => {
  try {
    const block = chain.minePendingTransactions(req.body.minerAddress);
    res.status(201).json({ success: true, blockHash: block.hash, height: block.index });
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
