"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthAPI, CouponsAPI, Web3API, type CouponDTO } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function RewardsPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [balance, setBalance] = useState<number>(0);
  const [coupons, setCoupons] = useState<CouponDTO[]>([]);

  const points = useMemo(() => Math.floor(balance), [balance]);

  const load = async () => {
    setLoading(true);
    try {
      // Current user + wallet
      const me = await AuthAPI.getCurrentUser();
      const u: any = me?.user || {};
      const addr = u.walletAddress || (typeof window !== 'undefined' ? localStorage.getItem("ind_addr") : "") || "";
      setWalletAddress(addr || "");
      if (addr) {
        const b = await Web3API.balance(addr);
        setBalance(b.balance);
      } else {
        setBalance(0);
      }
      // Coupons (all active coupons)
      const res = await CouponsAPI.list();
      setCoupons((res as any).coupons || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6 bg-gradient-to-b from-sky-50 to-green-50 min-h-[60vh] p-1">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rewards</h1>
        <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-sky-100 border-sky-200 text-slate-800">
          <CardHeader>
            <CardTitle>Loyalty Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-600">Derived from your IND wallet balance</div>
            <div className="mt-3 text-4xl font-bold text-slate-900">{points.toLocaleString()}</div>
            <div className="mt-1 text-sm text-slate-600">Wallet: {walletAddress ? walletAddress.slice(0, 10) + "…" : "Not set"}</div>
            {!walletAddress && (
              <div className="mt-3 text-sm text-amber-700">Generate & register a wallet in Wallet page to start earning points.</div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-green-100 border-green-200 text-slate-800">
          <CardHeader>
            <CardTitle>Available Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            {coupons.length === 0 ? (
              <div className="text-sm text-slate-600">No coupons available.</div>
            ) : (
              <div className="space-y-3">
                {coupons.map((c) => {
                  const exp = c.expiry ? new Date(c.expiry) : null;
                  const isExpired = !!(exp && exp.getTime() < Date.now());
                  return (
                    <div key={c._id || c.code} className="flex items-center justify-between rounded-md border border-white/60 bg-white/60 backdrop-blur-sm p-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className="uppercase tracking-wide">{c.code}</Badge>
                          <span className="text-xs text-slate-600">{c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`}</span>
                        </div>
                        <div className="text-xs text-slate-600">
                          {exp ? (
                            <span className={isExpired ? 'text-red-600' : ''}>Expires {exp.toLocaleDateString()}</span>
                          ) : (
                            <span>No expiry</span>
                          )}
                          {c.usageLimit ? <span> • Limit: {c.usageLimit}</span> : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={c.active === false ? 'bg-slate-200 text-slate-600' : 'bg-emerald-500 text-white'}>{c.active === false ? 'Inactive' : 'Active'}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
