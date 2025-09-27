import 'dotenv/config';
import http from 'http';
import { buildApi } from './src/api/http.js';
import { FullNode } from './src/node/FullNode.js';
import { WebSocketServer } from 'ws';

const P2P_LISTEN = process.env.P2P_LISTEN || ''; // e.g., "/ip4/0.0.0.0/tcp/30301"
const BOOTNODES = (process.env.BOOTNODES || '').split(',').map((s) => s.trim()).filter(Boolean);
const HTTP_PORT = Number(process.env.HTTP_PORT || 4100);
const DIFFICULTY = Number(process.env.DIFFICULTY || 3);

async function main() {
  const node = new FullNode({ difficulty: DIFFICULTY, p2pListen: P2P_LISTEN, bootnodes: BOOTNODES });
  await node.startP2P();

  const app = buildApi({ node });
  const server = http.createServer(app);
  server.listen(HTTP_PORT, () => {
    console.log(`[ind-chain-node] HTTP listening on :${HTTP_PORT}`);
    console.log(`[ind-chain-node] P2P listen: ${P2P_LISTEN || '(none)'}`);
    if (BOOTNODES.length) console.log(`[ind-chain-node] Bootnodes:`, BOOTNODES);
  });

  // WebSocket: broadcast blocks and txs for explorer/clients
  const wss = new WebSocketServer({ server, path: '/ws' });
  const sendAll = (obj) => {
    const data = JSON.stringify(obj);
    wss.clients.forEach((c) => { try { c.send(data); } catch {} });
  };
  node.events.on('block', (b) => sendAll({ type: 'block', block: { index: b.index, hash: b.hash, ts: b.timestamp } }));
  node.events.on('tx', (t) => sendAll({ type: 'tx', tx: t }));
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
