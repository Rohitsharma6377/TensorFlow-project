#!/usr/bin/env node
import { randomBytes } from 'crypto';
import { privToPub } from '../src/utils/crypto.js';

function toHex(buf) { return Buffer.from(buf).toString('hex'); }

const priv = toHex(randomBytes(32));
const pub = privToPub(priv, true);
const addr = '0x' + pub.slice(-40);

console.log(JSON.stringify({ privateKey: priv, publicKey: pub, address: addr }, null, 2));
