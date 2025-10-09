"use client";

import { useState } from 'react'
import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";

export default function SuperAdminSettingsPage() {
  const [razorpayKey, setRazorpayKey] = useState<string>('')
  const [razorpaySecret, setRazorpaySecret] = useState<string>('')
  const [defaultCourier, setDefaultCourier] = useState<string>('')
  const [taxRate, setTaxRate] = useState<number>(0)
  const [features, setFeatures] = useState<Record<string, boolean>>({
    referrals: true,
    coupons: true,
    premium: false,
    crypto: false,
  })

  const savePayments = () => {
    // TODO: wire to backend admin settings API
    alert('Saved Payments (local-only)')
  }
  const saveCouriers = () => { alert('Saved Couriers (local-only)') }
  const saveTaxes = () => { alert('Saved Taxes (local-only)') }
  const saveFeatures = () => { alert('Saved Feature Toggles (local-only)') }

  return (
    <div className="space-y-4">
      <PageHeader title="Platform Settings" subtitle="Payment gateways, couriers, taxes, feature toggles" />

      <Section title="Payments" description="Configure payment gateways">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Razorpay Key</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900" value={razorpayKey} onChange={(e)=> setRazorpayKey(e.target.value)} placeholder="rzp_live_xxx" />
          </div>
          <div>
            <label className="block text-sm mb-1">Razorpay Secret</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900" value={razorpaySecret} onChange={(e)=> setRazorpaySecret(e.target.value)} placeholder="••••••" />
          </div>
        </div>
        <div className="mt-3">
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800" onClick={savePayments}>Save Payments</button>
        </div>
      </Section>

      <Section title="Couriers" description="Default courier and logistics preferences">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Default Courier</label>
            <select className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900" value={defaultCourier} onChange={(e)=> setDefaultCourier(e.target.value)}>
              <option value="">Select</option>
              <option value="delhivery">Delhivery</option>
              <option value="bluedart">Blue Dart</option>
              <option value="xpressbees">XpressBees</option>
            </select>
          </div>
        </div>
        <div className="mt-3">
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800" onClick={saveCouriers}>Save Couriers</button>
        </div>
      </Section>

      <Section title="Taxes" description="Global tax configuration">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Default Tax (%)</label>
            <input type="number" className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900" value={taxRate} onChange={(e)=> setTaxRate(Number(e.target.value))} />
          </div>
        </div>
        <div className="mt-3">
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800" onClick={saveTaxes}>Save Taxes</button>
        </div>
      </Section>

      <Section title="Feature Toggles" description="Enable/disable beta features">
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.keys(features).map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!features[key]} onChange={(e)=> setFeatures(prev => ({...prev, [key]: e.target.checked}))} />
              <span className="capitalize">{key}</span>
            </label>
          ))}
        </div>
        <div className="mt-3">
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800" onClick={saveFeatures}>Save Toggles</button>
        </div>
      </Section>
    </div>
  )
}
