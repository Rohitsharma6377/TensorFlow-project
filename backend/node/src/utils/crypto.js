import { sha256 } from '@noble/hashes/sha256';
import { getPublicKey } from '@noble/secp256k1';

export function pubKeyToAddress(pubHex) {
  const h = Buffer.from(sha256(Buffer.from(pubHex, 'hex'))).toString('hex');
  return '0x' + h.slice(-40);
}

export function privToPub(privHex, compressed = true) {
  return Buffer.from(getPublicKey(privHex, compressed)).toString('hex');
}
