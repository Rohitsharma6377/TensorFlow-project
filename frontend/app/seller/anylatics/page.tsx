"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchSellerSeries, fetchSellerStats, fetchProductCount, setIntervalMinutes, setWindowHours } from '@/store/slice/analyticsSlice';
import { fetchMyShop } from '@/store/slice/shopSlice';
import Box from '@mui/material/Box';

export default function SellerAnalyticsPage() {
  const dispatch = useAppDispatch();
  const shop = useAppSelector(s => s.shop?.shop);
  const shopId = shop?._id || shop?.id || '';
  const { stats, points, productCount, loadingStats, loadingSeries, loadingProducts, windowHours, intervalMinutes } = useAppSelector(s => s.analytics);

  useEffect(() => {
    if (!shopId) {
      dispatch(fetchMyShop());
      return;
    }
    if (!shopId) return;
    dispatch(fetchSellerStats({ shop: shopId, sinceHours: 720 }));
    dispatch(fetchSellerSeries({ shop: shopId, windowHours, intervalMinutes }));
    dispatch(fetchProductCount({ shop: shopId }));
    const timer = setInterval(() => {
      dispatch(fetchSellerStats({ shop: shopId, sinceHours: 720 }));
      dispatch(fetchSellerSeries({ shop: shopId, windowHours, intervalMinutes }));
      dispatch(fetchProductCount({ shop: shopId }));
    }, 30000);
    return () => clearInterval(timer);
  }, [dispatch, shopId, windowHours, intervalMinutes]);

  return (
    <div className="space-y-6">
      <Card className="bg-white border-emerald-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-emerald-900">Analytics</CardTitle>
          <CardDescription className="text-emerald-700">Traffic, sales, and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Kpi title="Total Orders" value={loadingStats ? '…' : (stats?.totalOrders ?? 0)} />
            <Kpi title="Total Products" value={loadingProducts ? '…' : (productCount ?? 0)} />
            <Kpi title="Revenue" value={loadingStats ? '…' : `₹${(stats?.revenue ?? 0).toFixed(2)}`} />
            <Kpi title="Products Sold" value={loadingStats ? '…' : (stats?.totalItems ?? 0)} />
            <Kpi title="Delivered" value={loadingStats ? '…' : (stats?.delivered ?? 0)} />
          </div>

          <div className="flex flex-wrap gap-2 mt-4 items-center">
            <span className="text-sm text-emerald-800">Window:</span>
            <Button variant="outline" className="border-emerald-300 text-emerald-900" onClick={()=>dispatch(setWindowHours(24))}>Last 24h</Button>
            <Button variant="outline" className="border-emerald-300 text-emerald-900" onClick={()=>dispatch(setWindowHours(24*7))}>Last 7d</Button>
            <span className="text-sm text-emerald-800 ml-2">Interval:</span>
            <Button variant="outline" className="border-emerald-300 text-emerald-900" onClick={()=>dispatch(setIntervalMinutes(30))}>30m</Button>
            <Button variant="outline" className="border-emerald-300 text-emerald-900" onClick={()=>dispatch(setIntervalMinutes(60))}>60m</Button>
            <span className="text-xs text-gray-500 ml-auto">Window {windowHours}h · Interval {intervalMinutes}m</span>
          </div>

          <div className="mt-4 rounded border border-emerald-200 p-3">
            {loadingSeries ? (
              <div className="text-emerald-800">Loading chart…</div>
            ) : points.length === 0 ? (
              <div className="text-emerald-800">No data</div>
            ) : (
              <div className="w-full">
                <SimplePolyline points={points} height={220} color="#059669" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded border border-emerald-200 p-3 bg-emerald-50/40">
      <div className="text-sm text-emerald-700">{title}</div>
      <div className="text-2xl font-semibold text-emerald-900">{value}</div>
    </div>
  );
}

function SimplePolyline({ points, height = 200, color = '#059669' }: { points: Array<{ t: string; orders: number; revenue: number }>; height?: number; color?: string }) {
  if (!points || points.length === 0) return null;
  const values = points.map(p => p.orders);
  const max = Math.max(1, ...values);
  const stepX = 100 / Math.max(1, (points.length - 1));
  const path = points.map((p, i) => {
    const x = i * stepX;
    const y = 100 - (p.orders / max) * 100;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full" style={{ height }}>
      <polyline fill="none" stroke={color} strokeWidth="2" points={path} />
    </svg>
  );
}
