# IND Chain Node (JavaScript)

A minimal JavaScript PoW UTXO blockchain node with libp2p streams for peer-to-peer networking and an HTTP API for wallets and explorers.

## Quick Start

1. Copy env

```
cp .env.example .env
```

Set values in `.env`:

```
HTTP_PORT=4100
P2P_LISTEN=/ip4/0.0.0.0/tcp/30301
BOOTNODES=
DIFFICULTY=3
```

2. Install deps

```
npm install
```

3. Run node

```
npm run dev
```

Open:
- Peer info: http://localhost:4100/api/v1/peerinfo
- Chain: http://localhost:4100/api/v1/chain
- Balance: http://localhost:4100/api/v1/balance/0xabc... (your address)

## Multi-node locally

1. Start node 1
```
HTTP_PORT=4100 P2P_LISTEN=/ip4/0.0.0.0/tcp/30301 npm run dev
```
Visit `/api/v1/peerinfo` and copy the multiaddr with `/p2p/<peerId>`.

2. Start node 2
```
HTTP_PORT=4101 P2P_LISTEN=/ip4/0.0.0.0/tcp/30302 BOOTNODES=/ip4/127.0.0.1/tcp/30301/p2p/<peerId_of_node1> npm run dev
```

Nodes will connect and broadcast blocks/txs over a custom protocol `/ind/1.0.0`.

## HTTP API

- GET `/api/v1/peerinfo` → `{ peerId, addrs }`
- GET `/api/v1/chain` → `{ height, chain: [{ index, hash, prevHash, txs, timestamp }] }`
- GET `/api/v1/balance/:address` → `{ address, balance }`
- POST `/api/v1/tx` → `{ vin:[{txid,vout}], vout:[{address,value}] }`
- POST `/api/v1/mine` → `{ minerAddress? }` returns `{ blockHash, height }`

## Faucet and CLI (coming in this repo)
- Faucet endpoint: `POST /api/v1/faucet` to mint 50 IND to an address (configurable and rate-limited) – added below.
- CLI scripts: `node scripts/keygen.js`, `node scripts/send.js`

## Docker (to be added)
- `Dockerfile` and `docker-compose.yml` will allow booting 2+ peers locally and on VPS.

## Security Note
This is an educational skeleton. Before public deployment, add robust validation, consensus, signature checks, difficulty adjustment, mempool policy and peer ban logic.
