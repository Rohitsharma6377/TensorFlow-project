#!/usr/bin/env node
import fetch from 'node-fetch';

// Minimal CLI: node scripts/send.js http://localhost:4100 FROM_TXID:VOUT TO_ADDRESS VALUE
// Example: node scripts/send.js http://localhost:4100 c934...:0 0xabc... 10

const [,, base, inputRef, to, valueStr] = process.argv;
if (!base || !inputRef || !to || !valueStr) {
  console.error('Usage: node scripts/send.js <node_base> <TXID:VOUT> <TO_ADDRESS> <VALUE>');
  process.exit(1);
}

const [txid, voutStr] = inputRef.split(':');
const vout = Number(voutStr);
const value = Number(valueStr);

const tx = { vin: [{ txid, vout }], vout: [{ address: to, value }] };

const res = await fetch(`${base.replace(/\/$/, '')}/api/v1/tx`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(tx)
});
const data = await res.json();
console.log(data);
