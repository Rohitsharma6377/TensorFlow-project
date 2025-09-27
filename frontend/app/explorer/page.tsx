"use client";

import { useEffect, useMemo, useState } from "react";
import { Web3API } from "@/lib/api";

type BlockEvt = { type: "block"; block: { index: number; hash: string; ts: number } };
type TxEvt = { type: "tx"; tx: any };
type Evt = BlockEvt | TxEvt;

export default function ExplorerPage() {
  const [blocks, setBlocks] = useState<Array<{ index: number; hash: string; ts: number }>>([]);
  const [txs, setTxs] = useState<any[]>([]);
  const [wsStatus, setWsStatus] = useState<string>("Connecting…");
  const [height, setHeight] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<number>(0);
  const [peers, setPeers] = useState<number>(0);
  const [addr, setAddr] = useState<string>("");
  const [balance, setBalance] = useState<number | null>(null);
  const [utxos, setUtxos] = useState<Array<{ txid: string; vout: number; value: number }>>([]);
  const [opMsg, setOpMsg] = useState<string>("");

  // Tx Builder state
  const [fromAddress, setFromAddress] = useState<string>("");
  const [toAddress, setToAddress] = useState<string>("");
  const [sendValue, setSendValue] = useState<string>("");
  const [fee, setFee] = useState<string>("0");
  const [buildResult, setBuildResult] = useState<any | null>(null);

  const wsUrl = useMemo(() => {
    const envUrl = process.env.NEXT_PUBLIC_IND_WS_URL;
    if (envUrl) return envUrl;
    const proto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://localhost:4100/ws`;
  }, []);

  // WS streaming
  useEffect(() => {
    let ws: WebSocket | null = null;
    let retry = 0;
    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => { setWsStatus('Live'); };
        ws.onclose = () => {
          setWsStatus('Reconnecting…');
          retry = Math.min(retry + 1, 5);
          setTimeout(connect, 1000 * retry);
        };
        ws.onerror = () => setWsStatus('Error');
        ws.onmessage = (evt) => {
          try {
            const data: Evt = JSON.parse(evt.data);
            if (data.type === 'block') {
              setBlocks((prev) => [{...data.block}, ...prev].slice(0, 20));
              setHeight((h) => Math.max(h, data.block.index));
            } else if (data.type === 'tx') {
              setTxs((prev) => [data.tx, ...prev].slice(0, 50));
            }
          } catch {}
        };
      } catch {}
    };
    connect();
    return () => { try { ws?.close(); } catch {} };
  }, [wsUrl]);

  // Poll peers periodically
  useEffect(() => {
    let t: any;
    const loop = async () => {
      try {
        const [p, info] = await Promise.all([
          Web3API.peers().catch(() => ({ count: 0 })),
          Web3API.info().catch(() => null),
        ]);
        setPeers(p.count || 0);
        if (info) {
          setHeight(info.height ?? 0);
          setDifficulty(info.difficulty ?? 0);
        }
      } catch {}
      t = setTimeout(loop, 3000);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  const refreshAddr = async () => {
    if (!addr) return;
    setOpMsg('');
    try {
      const b = await Web3API.balance(addr);
      setBalance(b.balance);
      const u = await Web3API.utxo(addr);
      setUtxos(u.utxos);
    } catch (e: any) { setOpMsg(e?.message || 'Failed'); }
  };

  const faucet = async () => {
    if (!addr) return;
    setOpMsg('Requesting faucet…');
    try {
      await Web3API.faucet(addr);
      setOpMsg('Faucet success. Refreshing…');
      setTimeout(refreshAddr, 600);
    } catch (e: any) { setOpMsg(e?.message || 'Faucet failed'); }
  };

  const mine = async () => {
    if (!addr) return;
    setOpMsg('Mining…');
    try {
      await Web3API.mine(addr);
      setOpMsg('Mined. Refreshing…');
      setTimeout(refreshAddr, 600);
    } catch (e: any) { setOpMsg(e?.message || 'Mine failed'); }
  };

  // Build unsigned transaction
  const buildTx = async () => {
    setBuildResult(null);
    if (!fromAddress || !toAddress || !sendValue) {
      setBuildResult({ error: 'fromAddress, toAddress, value required' });
      return;
    }
    try {
      const valueNum = Number(sendValue);
      const feeNum = Number(fee || 0);
      if (Number.isNaN(valueNum) || Number.isNaN(feeNum)) {
        setBuildResult({ error: 'value/fee must be numbers' });
        return;
      }
      const res = await Web3API.txBuild(fromAddress, [{ address: toAddress, value: valueNum }], feeNum);
      setBuildResult(res);
    } catch (e: any) {
      setBuildResult({ error: e?.message || 'Build failed' });
    }
  };

  const copyBuildJson = async () => {
    if (!buildResult) return;
    try {
      const txt = JSON.stringify(buildResult, null, 2);
      await navigator.clipboard.writeText(txt);
      setBuildResult({ ...buildResult, copied: true });
      setTimeout(() => setBuildResult((r: any) => r && { ...r, copied: false }), 800);
    } catch {}
  };

  return (
    <div className="p-6 space-y-6">
      {/* Hero with animated gradient and coin */}
      <div className="relative overflow-hidden rounded-xl border p-6 bg-white/50 dark:bg-gray-900/50">
        <div className="animated-gradient absolute inset-0 -z-10 opacity-60" />
        <div className="flex items-center justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">IND Explorer (Live)</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Real-time blocks, mempool, wallet tools — powered by your local FullNode.
            </p>
            <div className="mt-2 text-sm">
              WS: <code className="px-1 py-0.5 bg-emerald-50 dark:bg-emerald-900/40 rounded border">{wsUrl}</code>
              <span className="mx-2">•</span>
              <span>Status: <b>{wsStatus}</b></span>
              <span className="mx-2">•</span>
              <span>Height: <b>{height}</b></span>
              <span className="mx-2">•</span>
              <span>Peers: <b>{peers}</b></span>
              <span className="mx-2">•</span>
              <span>Diff: <b>{difficulty}</b></span>
            </div>
          </div>
          {/* 3D-like rotating coin */}
          <div className="shrink-0">
            <div className="coin3d w-24 h-24 md:w-28 md:h-28" aria-hidden="true">
              <div className="coin-face">IND</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="border rounded-md p-4 bg-white/80 dark:bg-gray-900/50 lg:col-span-2">
          <h2 className="font-semibold mb-2">Latest Blocks</h2>
          <div className="space-y-2 text-sm">
            {blocks.length === 0 && <div className="text-muted-foreground">Waiting for blocks…</div>}
            {blocks.map((b) => (
              <div key={b.hash} className="flex items-center justify-between">
                <div className="truncate">#{b.index} • {b.hash.slice(0, 16)}…</div>
                <div className="text-xs text-muted-foreground">{new Date(b.ts).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="border rounded-md p-4 bg-white/80 dark:bg-gray-900/50">
          <h2 className="font-semibold mb-2">Controls</h2>
          <div className="space-y-2">
            <label className="text-sm">Address</label>
            <input className="w-full border rounded px-2 h-9" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="0x..." />
            <div className="flex gap-2">
              <button className="border rounded px-3 h-9" onClick={refreshAddr}>Refresh</button>
              <button className="border rounded px-3 h-9" onClick={faucet}>Faucet 50 IND</button>
              <button className="border rounded px-3 h-9" onClick={mine}>Mine 1</button>
            </div>
            {opMsg && <div className="text-xs text-muted-foreground">{opMsg}</div>}
            <div className="mt-2 text-sm">Balance: <b>{balance ?? '-'}</b> IND</div>
            <div className="mt-2 text-sm">
              <div className="font-semibold">UTXOs</div>
              <div className="space-y-1 max-h-48 overflow-auto">
                {utxos.length === 0 && <div className="text-muted-foreground">No UTXOs</div>}
                {utxos.map(u => (
                  <div key={`${u.txid}:${u.vout}`} className="flex items-center justify-between">
                    <div className="truncate">{u.txid.slice(0,16)}…:{u.vout}</div>
                    <div className="font-mono">{u.value} IND</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded-md p-4 bg-white/80 dark:bg-gray-900/50">
        <h2 className="font-semibold mb-2">Mempool (Live)</h2>
        <div className="space-y-2 text-sm">
          {txs.length === 0 && <div className="text-muted-foreground">Waiting for transactions…</div>}
          {txs.map((t, idx) => (
            <div key={idx} className="truncate">
              {JSON.stringify(t).slice(0, 120)}{JSON.stringify(t).length > 120 ? '…' : ''}
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-md p-4 bg-white/80 dark:bg-gray-900/50">
        <h2 className="font-semibold mb-2">Build Transaction (Unsigned)</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">From Address</label>
            <input className="w-full border rounded px-2 h-9" value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} placeholder="0xFrom" />
          </div>
          <div>
            <label className="text-sm">To Address</label>
            <input className="w-full border rounded px-2 h-9" value={toAddress} onChange={(e) => setToAddress(e.target.value)} placeholder="0xTo" />
          </div>
          <div>
            <label className="text-sm">Value (IND)</label>
            <input className="w-full border rounded px-2 h-9" value={sendValue} onChange={(e) => setSendValue(e.target.value)} placeholder="10" />
          </div>
          <div>
            <label className="text-sm">Fee</label>
            <input className="w-full border rounded px-2 h-9" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0" />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button className="border rounded px-3 h-9" onClick={buildTx}>Build</button>
          {buildResult && !buildResult.error && <button className="border rounded px-3 h-9" onClick={copyBuildJson}>{buildResult?.copied ? 'Copied!' : 'Copy JSON'}</button>}
        </div>
        <div className="mt-3 text-xs">
          {buildResult && buildResult.error && <div className="text-red-600">{buildResult.error}</div>}
          {buildResult && !buildResult.error && (
            <pre className="whitespace-pre-wrap break-all bg-gray-50 dark:bg-gray-800/40 p-3 rounded border overflow-auto max-h-64">{JSON.stringify(buildResult, null, 2)}</pre>
          )}
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">Tip: Sign the returned signingHash client-side and POST to /api/v1/web3/tx/queue with per-input signatures and public keys.</div>
      </div>

      {/* About / details section */}
      <div className="border rounded-md p-4 bg-white/80 dark:bg-gray-900/50">
        <h2 className="font-semibold mb-2">About IND</h2>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="font-medium">What is IND?</div>
            <p className="text-muted-foreground">IND is a demo coin for this local blockchain. Use Faucet to mint test coins, Mine to create blocks, and send IND using the unsigned transaction builder.</p>
          </div>
          <div>
            <div className="font-medium">Consensus & Blocks</div>
            <p className="text-muted-foreground">Blocks are streamed in real-time from the node. Height, difficulty and peer count update automatically over WebSocket and periodic polling.</p>
          </div>
          <div>
            <div className="font-medium">UTXO Model</div>
            <p className="text-muted-foreground">Balances are tracked by unspent transaction outputs (UTXOs). Transactions consume inputs and create new outputs that can be spent later.</p>
          </div>
        </div>
      </div>

      {/* Page-scoped styles for gradient and coin */}
      <style jsx>{`
        .animated-gradient {
          background: radial-gradient(1200px 600px at 10% -10%, rgba(99,102,241,0.25), transparent 60%),
                      radial-gradient(1000px 500px at 110% 10%, rgba(16,185,129,0.25), transparent 60%),
                      linear-gradient(120deg, rgba(59,130,246,0.18), rgba(16,185,129,0.18), rgba(236,72,153,0.18));
          background-size: 200% 200%;
          animation: gradientShift 16s ease-in-out infinite;
          filter: blur(0px);
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .coin3d {
          position: relative;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #ffe47a, #f2c94c 45%, #caa000 70%, #8a6d00 100%);
          box-shadow: inset 0 0 12px rgba(0,0,0,0.2), 0 8px 20px rgba(0,0,0,0.15);
          transform-style: preserve-3d;
          animation: spin 6s linear infinite;
        }
        .coin3d::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, #f7d774, #e9c64e, #d4af37, #f7d774);
          filter: blur(0.5px);
          z-index: -1;
        }
        .coin3d::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle at 70% 30%, rgba(255,255,255,0.7), rgba(255,255,255,0) 45%);
          mix-blend-mode: screen;
        }
        .coin-face {
          font-weight: 800;
          font-size: 20px;
          color: rgba(0,0,0,0.55);
          letter-spacing: 1px;
          text-shadow: 0 1px 0 rgba(255,255,255,0.6);
        }
        @keyframes spin {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  );
}
