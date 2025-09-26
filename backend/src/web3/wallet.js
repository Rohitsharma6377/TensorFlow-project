const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

function generateKeyPair() {
  const key = ec.genKeyPair();
  const privateKey = key.getPrivate('hex');
  const publicKey = key.getPublic('hex');
  const address = publicKeyToAddress(publicKey);
  return { privateKey, publicKey, address };
}

function publicKeyToAddress(publicKeyHex) {
  // Simple address derivation: sha256(publicKey) -> take last 40 hex chars
  const hash = crypto.createHash('sha256').update(Buffer.from(publicKeyHex, 'hex')).digest('hex');
  return '0x' + hash.slice(-40);
}

function sign(dataHashHex, privateKeyHex) {
  const key = ec.keyFromPrivate(privateKeyHex, 'hex');
  const signature = key.sign(dataHashHex, 'hex', { canonical: true });
  return signature.toDER('hex');
}

function verify(dataHashHex, signatureHex, publicKeyHex) {
  const key = ec.keyFromPublic(publicKeyHex, 'hex');
  return key.verify(dataHashHex, signatureHex);
}

module.exports = {
  generateKeyPair,
  publicKeyToAddress,
  sign,
  verify,
};
