import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { mplex } from '@libp2p/mplex';
import { noise } from '@chainsafe/libp2p-noise';

// Minimal custom protocol broadcaster (no gossipsub dependency)
export class PeerService {
  constructor({ onBlock, onTx, listen, bootstrapPeers = [] }) {
    this.onBlock = onBlock;
    this.onTx = onTx;
    this.listen = listen;
    this.bootstrapPeers = (bootstrapPeers || []).filter(Boolean);
    this.PROTOCOL = '/ind/1.0.0';
    this.streams = new Set();
  }

  async start() {
    this.node = await createLibp2p({
      addresses: { listen: this.listen ? [this.listen] : [] },
      transports: [tcp()],
      connectionEncryption: [noise()],
      streamMuxers: [mplex()],
      connectionManager: { minConnections: 1, maxConnections: 50 },
      peerDiscovery: [],
    });
    await this.node.start();

    // Handle inbound protocol streams
    this.node.handle(this.PROTOCOL, async ({ stream }) => {
      this.attachStream(stream);
    });

    // Dial bootstrap peers and open protocol streams
    for (const addr of this.bootstrapPeers) {
      try {
        const conn = await this.node.dial(addr);
        const { stream } = await conn.newStream(this.PROTOCOL);
        this.attachStream(stream);
      } catch (e) {
        console.warn('[p2p] dial failed', addr, e.message);
      }
    }
  }

  attachStream(stream) {
    this.streams.add(stream);
    // read loop
    (async () => {
      try {
        for await (const chunk of stream.source) {
          try {
            const msg = JSON.parse(new TextDecoder().decode(chunk));
            if (msg?.type === 'block' && this.onBlock) this.onBlock(msg.payload);
            if (msg?.type === 'tx' && this.onTx) this.onTx(msg.payload);
          } catch {}
        }
      } catch {}
      finally {
        this.streams.delete(stream);
      }
    })();
  }

  async broadcast(type, payload) {
    const data = new TextEncoder().encode(JSON.stringify({ type, payload }));
    for (const s of Array.from(this.streams)) {
      try { await s.sink([data]); } catch {}
    }
  }

  async broadcastBlock(block) { return this.broadcast('block', block); }
  async broadcastTx(tx) { return this.broadcast('tx', tx); }
}
