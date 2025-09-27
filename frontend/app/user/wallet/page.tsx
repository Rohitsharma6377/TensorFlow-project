"use client";

import { useEffect, useState } from "react";
import { Web3API, AuthAPI, type UTXO } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import EC from "elliptic";

const ec = new (EC as any).ec("secp256k1");

type WalletState = {
  address: string;
  publicKey: string;
  privateKey?: string; // local only
};

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [info, setInfo] = useState<{ coin: string; difficulty: number; miningReward: number; height: number; miner?: string } | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [utxos, setUtxos] = useState<UTXO[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [toAddress, setToAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [fee, setFee] = useState<string>("0");
  const [miner, setMiner] = useState<string>("");
  const [indError, setIndError] = useState<string>("");
  const [indSuccessTx, setIndSuccessTx] = useState<string>("");
  const [indSubmitting, setIndSubmitting] = useState<boolean>(false);
  // Mining quota/state
  const [quotaCount, setQuotaCount] = useState<number>(0);
  const [quotaLimit, setQuotaLimit] = useState<number>(100);
  const [quotaRemaining, setQuotaRemaining] = useState<number>(100);
  const [batchSize, setBatchSize] = useState<number>(25);
  const [pausedFor, setPausedFor] = useState<number>(0);
  const [autoMining, setAutoMining] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [cooldownLeft, setCooldownLeft] = useState<number>(0);

  // MetaMask / Ethereum section state
  const [mmAccount, setMmAccount] = useState<string>("");
  const [mmChainId, setMmChainId] = useState<string>("");
  const [mmTo, setMmTo] = useState<string>("");
  const [mmAmount, setMmAmount] = useState<string>("");
  const [mmTokenAddress, setMmTokenAddress] = useState<string>(""); // optional ERC-20
  const [mmTokenDecimals, setMmTokenDecimals] = useState<string>("18");
  const [selectedChainId, setSelectedChainId] = useState<string>("0x1"); // default Ethereum Mainnet
  const [lastEthTx, setLastEthTx] = useState<string>("");
  const [lastTokenTx, setLastTokenTx] = useState<string>("");

  const CHAINS: Record<string, { name: string; explorer: string; native: string; params?: any } > = {
    "0x1": { name: "Ethereum Mainnet", explorer: "https://etherscan.io", native: "ETH" },
    "0x38": { name: "BNB Smart Chain", explorer: "https://bscscan.com", native: "BNB", params: {
      chainId: "0x38", chainName: "BNB Smart Chain", nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 }, rpcUrls: ["https://bsc-dataseed.binance.org"], blockExplorerUrls: ["https://bscscan.com"]
    } },
    "0x89": { name: "Polygon", explorer: "https://polygonscan.com", native: "MATIC", params: {
      chainId: "0x89", chainName: "Polygon", nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 }, rpcUrls: ["https://polygon-rpc.com"], blockExplorerUrls: ["https://polygonscan.com"]
    } },
    "0xa4b1": { name: "Arbitrum One", explorer: "https://arbiscan.io", native: "ETH", params: {
      chainId: "0xa4b1", chainName: "Arbitrum One", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: ["https://arb1.arbitrum.io/rpc"], blockExplorerUrls: ["https://arbiscan.io"]
    } },
    "0x2105": { name: "Base", explorer: "https://basescan.org", native: "ETH", params: {
      chainId: "0x2105", chainName: "Base", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: ["https://mainnet.base.org"], blockExplorerUrls: ["https://basescan.org"]
    } },
  };

  // Bootstrap: current user and any stored wallet
  useEffect(() => {
    (async () => {
      try {
        const me = await AuthAPI.getCurrentUser();
        const u: any = me.user;
        const address = u.walletAddress || localStorage.getItem("ind_addr") || "";
        const publicKey = u.walletPublicKey || localStorage.getItem("ind_pub") || "";
        const privateKey = localStorage.getItem("ind_priv") || undefined;
        if (address && publicKey) setWallet({ address, publicKey, privateKey });
      } catch {}
    })();
  }, []);

  // Load chain info and wallet data
  const refresh = async (addr?: string) => {
    const address = addr || wallet?.address;
    setLoading(true);
    try {
      const i = await Web3API.info();
      setInfo(i as any);
      // Also refresh quota
      try {
        const q = await Web3API.quota();
        setQuotaCount(q.count);
        setQuotaLimit(q.limit);
        setQuotaRemaining(q.remaining);
        setBatchSize(q.batchSize);
        setPausedFor(q.pausedFor || 0);
      } catch {}
      if (address) {
        const b = await Web3API.balance(address);
        setBalance(b.balance);
        const u = await Web3API.utxo(address);
        setUtxos(u.utxos);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ===== MetaMask / Ethereum helpers =====
  function toWei(amount: string, decimals: number = 18): string {
    // Convert decimal string to BigInt of wei-like units
    const [intPart, fracPartRaw] = String(amount || "0").split(".");
    const fracPart = (fracPartRaw || "").slice(0, decimals);
    const paddedFrac = fracPart.padEnd(decimals, "0");
    const bi = BigInt(intPart || "0") * (BigInt(10) ** BigInt(decimals)) + BigInt(paddedFrac || "0");
    return "0x" + bi.toString(16);
  }

  function encodeErc20Transfer(to: string, amountWeiHex: string): string {
    // 0xa9059cbb + pad(to) + pad(amount)
    const selector = "0xa9059cbb";
    const addr = to.replace(/^0x/, "").padStart(64, "0");
    const amt = amountWeiHex.replace(/^0x/, "").padStart(64, "0");
    return selector + addr + amt;
  }

  const switchNetwork = async (targetChainId: string) => {
    const eth = (window as any).ethereum;
    if (!eth) throw new Error("MetaMask not detected");
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: targetChainId }] });
    } catch (switchError: any) {
      // 4902: Unrecognized chain -> try add
      if (switchError?.code === 4902 && CHAINS[targetChainId]?.params) {
        await eth.request({ method: "wallet_addEthereumChain", params: [CHAINS[targetChainId].params] });
      } else {
        throw switchError;
      }
    }
  };

  const connectMetaMask = async () => {
    try {
      const eth = (window as any).ethereum;
      if (!eth) throw new Error("MetaMask not detected");
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      const chainId: string = await eth.request({ method: "eth_chainId" });
      setMmAccount(accounts?.[0] || "");
      setMmChainId(chainId || "");
      // listen for changes
      eth.removeListener?.("accountsChanged", () => {});
      eth.on?.("accountsChanged", (accs: string[]) => setMmAccount(accs?.[0] || ""));
      eth.removeListener?.("chainChanged", () => {});
      eth.on?.("chainChanged", (id: string) => setMmChainId(id));
    } catch (e) { console.error(e); }
  };

  const sendEth = async () => {
    try {
      const eth = (window as any).ethereum;
      if (!eth || !mmAccount) return;
      // ensure correct network for exchange deposit
      if (selectedChainId && mmChainId?.toLowerCase() !== selectedChainId.toLowerCase()) {
        await switchNetwork(selectedChainId);
        const newChainId: string = await eth.request({ method: "eth_chainId" });
        setMmChainId(newChainId);
      }
      const value = toWei(mmAmount || "0", 18);
      const tx = { from: mmAccount, to: mmTo, value };
      const hash = await eth.request({ method: "eth_sendTransaction", params: [tx] });
      setLastEthTx(hash || "");
      console.log("ETH tx sent:", hash);
    } catch (e) { console.error(e); }
  };

  const sendErc20 = async () => {
    try {
      const eth = (window as any).ethereum;
      if (!eth || !mmAccount || !mmTokenAddress) return;
      if (selectedChainId && mmChainId?.toLowerCase() !== selectedChainId.toLowerCase()) {
        await switchNetwork(selectedChainId);
        const newChainId: string = await eth.request({ method: "eth_chainId" });
        setMmChainId(newChainId);
      }
      const decimals = Number(mmTokenDecimals || 18);
      const amountHex = toWei(mmAmount || "0", decimals);
      const data = encodeErc20Transfer(mmTo, amountHex);
      const tx = { from: mmAccount, to: mmTokenAddress, value: "0x0", data } as any;
      const hash = await eth.request({ method: "eth_sendTransaction", params: [tx] });
      setLastTokenTx(hash || "");
      console.log("ERC20 tx sent:", hash);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.address]);

  // Poll quota every 5s
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const q = await Web3API.quota();
        setQuotaCount(q.count);
        setQuotaLimit(q.limit);
        setQuotaRemaining(q.remaining);
        setBatchSize(q.batchSize);
        setPausedFor(q.pausedFor || 0);
        setCooldownLeft(q.pausedFor || 0);
      } catch {}
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Local ticking cooldown timer for UI smoothness
  useEffect(() => {
    if (pausedFor <= 0) return;
    setCooldownLeft(pausedFor);
    const t = setInterval(() => {
      setCooldownLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [pausedFor]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const startAutoMine = async () => {
    if (!wallet?.address) return;
    setAutoMining(true);
    try {
      // Ensure miner set to our address
      try { await Web3API.setMiner(wallet.address); } catch {}
      // Loop until limit reached or user stops
      while (autoMining) {
        // Refresh quota
        let q;
        try { q = await Web3API.quota(); } catch { q = undefined as any; }
        if (q) {
          setQuotaCount(q.count);
          setQuotaLimit(q.limit);
          setQuotaRemaining(q.remaining);
          setBatchSize(q.batchSize);
          setPausedFor(q.pausedFor || 0);
          if (q.remaining <= 0) break;
          if (q.paused && q.pausedFor > 0) {
            // Wait for pause window
            await sleep(Math.min(30, q.pausedFor) * 1000);
            continue;
          }
        }
        // Mine a block
        try {
          await Web3API.mine(wallet.address);
          // Update balance and quota quickly
          refresh();
          await sleep(300); // brief delay to avoid hammering
        } catch (e: any) {
          // If rate limited, wait and continue
          const msg = e?.message || '';
          if (msg.includes('paused') || msg.includes('limit')) {
            await sleep(2000);
            continue;
          }
          console.error('Auto-mine error', e);
          break;
        }
      }
    } finally {
      setAutoMining(false);
    }
  };

  const stopAutoMine = () => setAutoMining(false);

  const generateClientWallet = () => {
    const key = ec.genKeyPair();
    const privateKey = key.getPrivate("hex");
    const publicKey = key.getPublic("hex");
    return { privateKey, publicKey };
  };

  const registerWallet = async () => {
    try {
      setLoading(true);
      const { privateKey, publicKey } = generateClientWallet();
      const res = await Web3API.registerWallet(publicKey);
      const address = res.wallet.address;
      localStorage.setItem("ind_priv", privateKey);
      localStorage.setItem("ind_pub", publicKey);
      localStorage.setItem("ind_addr", address);
      setWallet({ address, publicKey, privateKey });
      // Auto-fund via mining once
      try {
        await Web3API.setMiner(address);
        await Web3API.mine();
      } catch (e) { console.error('auto-mine after register failed', e); }
      await refresh(address);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const setMinerAddress = async () => {
    try {
      const addr = miner || wallet?.address;
      if (!addr) return;
      await Web3API.setMiner(addr);
      setMiner("");
      refresh();
    } catch (e) { console.error(e); }
  };

  const setMinerToMe = async () => {
    if (!wallet?.address) return;
    try {
      await Web3API.setMiner(wallet.address);
      await refresh();
    } catch (e) { console.error(e); }
  };

  const fundWallet = async () => {
    if (!wallet?.address) return;
    try {
      setLoading(true);
      await Web3API.setMiner(wallet.address);
      await Web3API.mine();
      await refresh();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const resetIndWallet = async () => {
    try {
      setLoading(true);
      // Clear local keys
      localStorage.removeItem('ind_priv');
      localStorage.removeItem('ind_pub');
      localStorage.removeItem('ind_addr');
      // Register new wallet (server stores public key + address)
      const { privateKey, publicKey } = generateClientWallet();
      const reg = await Web3API.registerWallet(publicKey);
      const address = reg.wallet.address;
      localStorage.setItem('ind_priv', privateKey);
      localStorage.setItem('ind_pub', publicKey);
      localStorage.setItem('ind_addr', address);
      setWallet({ address, publicKey, privateKey });
      // Set miner and mine one block to fund
      await Web3API.setMiner(address);
      await Web3API.mine();
      await refresh(address);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  function isValidIndAddress(addr: string): boolean {
    return /^0x[0-9a-fA-F]{40}$/.test(addr || '');
  }

  const mineNow = async () => {
    try {
      await Web3API.mine();
      refresh();
    } catch (e) { console.error(e); }
  };

  const submitTx = async () => {
    try {
      if (indSubmitting) return;
      setIndSubmitting(true);
      setIndError("");
      setIndSuccessTx("");
      if (!wallet?.address || !wallet?.privateKey) {
        setIndError("Wallet not ready. Generate & register a wallet first.");
        return;
      }
      const amt = Number(amount);
      const feeNum = Number(fee || 0);
      if (!(amt > 0)) {
        setIndError("Amount must be greater than 0");
        return;
      }
      if (!toAddress) {
        setIndError("Recipient address is required");
        return;
      }
      if (!isValidIndAddress(toAddress)) {
        setIndError("Recipient must be a valid IND address (0x + 40 hex)");
        return;
      }
      // Derive IND address from current private key's public key and ensure it matches wallet.address
      const key = ec.keyFromPrivate(wallet.privateKey, "hex");
      const pub = key.getPublic("hex");
      const derivedAddr = await (async () => {
        // sha256(publicKeyHex) -> take last 40 hex chars, prefix 0x
        const hex = pub.replace(/^0x/, "");
        const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16)));
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        const arr: number[] = Array.from(new Uint8Array(digest));
        const hashHex = arr.map((n: number) => n.toString(16).padStart(2, "0")).join("");
        return "0x" + hashHex.slice(-40);
      })();
      if (wallet.address.toLowerCase() !== derivedAddr.toLowerCase()) {
        setIndError(`Local key mismatch: current private key derives ${derivedAddr} but wallet is ${wallet.address}. Generate & register a new wallet, then mine to fund it.`);
        return;
      }
      // Optional: refresh view to avoid building from stale state
      await refresh();
      // Fetch fresh UTXOs and mempool to pre-validate selection feasibility
      const latestUtxo = await Web3API.utxo(derivedAddr);
      const utxoList = latestUtxo.utxos || [];
      const need = amt + (feeNum > 0 ? feeNum : 0);
      const available = utxoList.reduce((a: number, u: any) => a + Number(u.value || 0), 0);
      if (available < need) {
        setIndError(`Insufficient balance. Available: ${available} IND, Required: ${need} IND`);
        return;
      }
      // Check mempool for any spends from our address (best-effort)
      try {
        const mp = await Web3API.mempool();
        const busy = (mp.mempool || []).some((tx: any) => (tx.vin || []).some((i: any) => Boolean(i?.txid || i?.vout || i)));
        if (busy) {
          setIndError('You have pending transactions in mempool. Please mine a block or wait until they are confirmed before spending again.');
          return;
        }
      } catch {}
      // Build unsigned with the derived (owner) address
      const built = await Web3API.build(derivedAddr, [{ address: toAddress, value: amt }], feeNum > 0 ? feeNum : undefined);
      const sig = key.sign(built.signingHash, { canonical: true }).toDER("hex");
      const signedVin = built.vin.map((i) => ({ ...i, signature: sig, publicKey: pub }));
      const queued = await Web3API.queueTx(signedVin, built.vout);
      if ((queued as any)?.txid) setIndSuccessTx((queued as any).txid);
      setToAddress(""); setAmount("");
      refresh();
    } catch (e: any) {
      console.error(e);
      let msg = e?.message || "Failed to submit transaction";
      if (typeof msg === 'string' && msg.includes('Referenced output not found')) {
        msg = `${msg}. Causes: 1) You already spent these inputs (try Refresh and rebuild), 2) Your local key does not own the selected UTXOs (re-register wallet and mine), 3) Insufficient confirmations.`;
      }
      setIndError(msg);
    } finally { setIndSubmitting(false); }
  };
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold emerald-sky-gradient">Wallet (IND)</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-4 space-y-3 bg-white/80 dark:bg-gray-900/60 border border-emerald-100 dark:border-gray-800 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Status</h2>
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <div>Coin: {info?.coin ?? '-'}</div>
            <div>Height: {info?.height ?? '-'}</div>
            <div>Difficulty: {info?.difficulty ?? '-'}</div>
            <div>Reward: {info?.miningReward ?? '-'} IND</div>
          </div>
          {!wallet?.address ? (
            <Button onClick={registerWallet} disabled={loading}>Generate & Register Wallet</Button>
          ) : (
            <div className="space-y-2">
              <div className="break-all text-sm"><b>Address:</b> {wallet.address}</div>
              <div className="break-all text-xs text-slate-600 dark:text-slate-400"><b>Public Key:</b> {wallet.publicKey.slice(0, 20)}…</div>
              <div className="text-lg font-medium"><span className="emerald-sky-gradient font-extrabold text-2xl align-middle">{balance}</span> <span className="text-slate-800 dark:text-slate-200">IND</span></div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => refresh()} disabled={loading}>Refresh</Button>
                <Button variant="outline" onClick={setMinerToMe} disabled={!wallet?.address}>Set Miner = My Address</Button>
                <Button onClick={fundWallet} disabled={!wallet?.address || loading}>Fund Wallet (Mine 1)</Button>
                <Button variant="outline" onClick={resetIndWallet} disabled={loading}>Reset IND Wallet</Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-3 bg-white/80 dark:bg-gray-900/60 border border-emerald-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Mining</h2>
            <Button size="sm" variant="outline" onClick={() => setShowAdvanced(v => !v)}>
              {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
            </Button>
          </div>
          <div className="space-y-2">
            {showAdvanced && (
              <>
                <Label htmlFor="miner" className="text-slate-800 dark:text-slate-200">Miner Address (optional)</Label>
                <Input id="miner" value={miner} onChange={(e) => setMiner(e.target.value)} placeholder={wallet?.address || "0x..."} />
                <div className="flex gap-2">
                  <Button onClick={setMinerAddress} variant="outline">Set Miner</Button>
                </div>
              </>
            )}
            <div className="flex gap-2">
              <Button onClick={mineNow}>Mine Block</Button>
              <Button variant="outline" onClick={fundWallet}>Fund Wallet (Mine 1)</Button>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 space-y-3 bg-white/80 dark:bg-gray-900/60 border border-emerald-100 dark:border-gray-800 shadow-sm">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">Send IND</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label className="text-slate-800 dark:text-slate-200">To Address</Label>
            <Input className="bg-white dark:bg-gray-800 border border-emerald-200" value={toAddress} onChange={(e) => setToAddress(e.target.value)} placeholder="0xrecipient..." />
          </div>
          <div>
            <Label className="text-slate-800 dark:text-slate-200">Amount (IND)</Label>
            <Input className="bg-white dark:bg-gray-800 border border-emerald-200" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label className="text-slate-800 dark:text-slate-200">Fee (IND)</Label>
            <Input className="bg-white dark:bg-gray-800 border border-emerald-200" type="number" value={fee} onChange={(e) => setFee(e.target.value)} />
          </div>
        </div>
        {indError && (
          <div className="text-sm text-red-600">{indError}</div>
        )}
        {indSuccessTx && (
          <div className="text-sm text-emerald-600">Submitted. TxID: <span className="font-mono break-all">{indSuccessTx}</span></div>
        )}
        <div className="flex gap-2">
          <Button onClick={submitTx} disabled={!wallet?.address || indSubmitting}>{indSubmitting ? 'Submitting…' : 'Submit'}</Button>
          <Button variant="outline" onClick={() => refresh()}>Refresh</Button>
        </div>
      </Card>

      <Card className="p-4 space-y-3 bg-white/80 dark:bg-gray-900/60 border border-emerald-100 dark:border-gray-800 shadow-sm">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">UTXOs</h2>
        {wallet?.address ? (
          <div className="space-y-1 text-sm">
            {utxos.length === 0 && <div className="text-muted-foreground">No UTXOs</div>}
            {utxos.map((u) => (
              <div key={`${u.txid}:${u.vout}`} className="flex items-center justify-between">
                <div className="truncate">{u.txid.slice(0, 16)}…:{u.vout}</div>
                <div className="font-mono">{u.value} IND</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground">Create a wallet to see UTXOs.</div>
        )}
      </Card>

      {/* MetaMask / Ethereum section (Advanced) */}
      {showAdvanced && (
      <Card className="p-4 space-y-3 bg-white/80 dark:bg-gray-900/60 border border-emerald-100 dark:border-gray-800 shadow-sm">
        <h2 className="font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">Ethereum Wallet (MetaMask)
          {mmAccount && (
            <span className="text-xs rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">Connected: {mmAccount.slice(0,6)}…{mmAccount.slice(-4)}</span>
          )}
        </h2>
        <div className="text-sm text-muted-foreground">
          <div>Account: {mmAccount || '-'}</div>
          <div>Network: {mmChainId || '-'}{mmChainId && CHAINS[mmChainId] ? ` • ${CHAINS[mmChainId].name}` : ''}</div>
        </div>
        <div className="flex gap-2">
          <Button onClick={connectMetaMask} variant="outline">Connect MetaMask</Button>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Network</Label>
            <select className="w-full border rounded-md h-9 px-2" value={selectedChainId} onChange={(e) => setSelectedChainId(e.target.value)}>
              {Object.entries(CHAINS).map(([id, c]) => (
                <option key={id} value={id}>{c.name} ({c.native})</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => switchNetwork(selectedChainId)}>Switch in MetaMask</Button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium">Send ETH</h3>
            <Label>To Address</Label>
            <Input value={mmTo} onChange={(e) => setMmTo(e.target.value)} placeholder="0xrecipient..." />
            <Label>Amount (ETH)</Label>
            <Input type="number" value={mmAmount} onChange={(e) => setMmAmount(e.target.value)} />
            <Button onClick={sendEth} disabled={!mmAccount || !mmTo || !mmAmount}>Send ETH</Button>
            {lastEthTx && (
              <div className="text-xs text-muted-foreground">
                Tx Hash: <a className="underline" href={`${CHAINS[selectedChainId]?.explorer || 'https://etherscan.io'}/tx/${lastEthTx}`} target="_blank" rel="noreferrer">View on Explorer</a>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Send Token (ERC-20)</h3>
            <Label>Token Contract</Label>
            <Input value={mmTokenAddress} onChange={(e) => setMmTokenAddress(e.target.value)} placeholder="0xTokenAddress (e.g. WLD)" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>To Address</Label>
                <Input value={mmTo} onChange={(e) => setMmTo(e.target.value)} placeholder="0xrecipient..." />
              </div>
              <div>
                <Label>Decimals</Label>
                <Input type="number" value={mmTokenDecimals} onChange={(e) => setMmTokenDecimals(e.target.value)} />
              </div>
            </div>
            <Label>Amount</Label>
            <Input type="number" value={mmAmount} onChange={(e) => setMmAmount(e.target.value)} />
            <Button onClick={sendErc20} disabled={!mmAccount || !mmTo || !mmAmount || !mmTokenAddress}>Send Token</Button>
            {lastTokenTx && (
              <div className="text-xs text-muted-foreground">
                Tx Hash: <a className="underline" href={`${CHAINS[selectedChainId]?.explorer || 'https://etherscan.io'}/tx/${lastTokenTx}`} target="_blank" rel="noreferrer">View on Explorer</a>
              </div>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Notes: Use the correct deposit network shown by Binance/Bybit for the asset you deposit (e.g., ETH on Ethereum Mainnet, USDT on BSC/Arbitrum/etc). Some exchanges may require specific networks; sending on the wrong network can lead to fund loss. Verify destination chain and token before sending.
        </div>
      </Card>
      )}
    </div>
  );
}
