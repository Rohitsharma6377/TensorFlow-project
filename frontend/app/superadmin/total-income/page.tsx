"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { DataTable } from "../components/DataTable";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchAdminOrders, setOrdersPage, setOrdersQuery, setOrdersRange, setOrdersStatus } from "@/store/slice/adminOrdersSlice";
import { 
  fetchAdminSellers, 
  manageSellerWallet, 
  setSellerPlanLimit,
  setSelectedSeller,
  clearWalletError,
  clearPlanError 
} from "@/store/slice/adminSellersSlice";
import { AdminAPI, api } from "@/lib/api";
import BackendTest from "@/components/BackendTest";

function exportCSV(rows: any[], filename: string) {
  const headers = ['_id','shop','amount','status','createdAt'];
  const csv = [headers.join(',')].concat(
    rows.map(r => [r._id, `"${(r.shop?.name||r.shop||'').toString().replace(/"/g,'""')}"`, r.amount ?? '', r.status ?? '', r.createdAt ?? ''].join(','))
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export default function SuperAdminTotalIncomePage() {
  const dispatch = useAppDispatch();
  
  // Orders state
  const { items, status, error, page, limit, total, q, statusFilter, from, to, sum } = useAppSelector((s)=> (s as any).adminOrders) as any;
  
  // Sellers state from Redux
  const { 
    sellers, 
    selectedSeller: reduxSelectedSeller,
    status: sellersStatus, 
    walletStatus, 
    planStatus,
    error: sellersError,
    walletError,
    planError
  } = useAppSelector((s) => s.adminSellers);
  
  // Local UI state
  const [search, setSearch] = useState<string>(q || "");
  const [rangeFrom, setRangeFrom] = useState<string>(from || "");
  const [rangeTo, setRangeTo] = useState<string>(to || "");
  const [selectedSellerId, setSelectedSellerId] = useState<string>("");
  const [showMoneyModal, setShowMoneyModal] = useState<boolean>(false);
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [moneyAmount, setMoneyAmount] = useState<string>("");
  const [moneyType, setMoneyType] = useState<"add" | "deduct">("add");
  const [planLimit, setPlanLimit] = useState<string>("");

  // Handle money management using Redux
  const handleMoneyAction = async () => {
    if (!selectedSellerId || !moneyAmount) return;
    
    const amount = parseFloat(moneyAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await dispatch(manageSellerWallet({
        sellerId: selectedSellerId,
        type: moneyType,
        amount: amount,
        reason: `Admin ${moneyType} - Total Income Management`
      })).unwrap();

      alert(`Successfully ${moneyType === 'add' ? 'added' : 'deducted'} $${amount} ${moneyType === 'add' ? 'to' : 'from'} seller wallet`);
      setShowMoneyModal(false);
      setMoneyAmount("");
      dispatch(clearWalletError());
    } catch (e: any) {
      alert(`Failed to ${moneyType} money: ${e?.message || 'Unknown error'}`);
    }
  };

  // Handle plan limit management using Redux
  const handlePlanLimit = async () => {
    if (!selectedSellerId || !planLimit) return;
    
    const limit = parseInt(planLimit);
    if (isNaN(limit) || limit < 0) {
      alert('Please enter a valid limit');
      return;
    }

    try {
      await dispatch(setSellerPlanLimit({
        sellerId: selectedSellerId,
        type: 'order_limit',
        limit: limit
      })).unwrap();

      alert(`Successfully set plan limit to ${limit} for seller`);
      setShowPlanModal(false);
      setPlanLimit("");
      dispatch(clearPlanError());
    } catch (e: any) {
      alert(`Failed to set plan limit: ${e?.message || 'Unknown error'}`);
    }
  };

  useEffect(() => { if (status === 'idle') dispatch(fetchAdminOrders(undefined) as any) }, [status, dispatch]);
  useEffect(() => { dispatch(fetchAdminOrders(undefined) as any) }, [dispatch, page, limit, q, statusFilter, from, to]);
  useEffect(() => { 
    if (sellersStatus === 'idle') {
      dispatch(fetchAdminSellers({ limit: 100 }));
    }
  }, [sellersStatus, dispatch]);

  const columns = useMemo(() => ([
    { key: '_id', header: 'Order' },
    { key: 'shop', header: 'Shop', render: (_: any, r: any) => (r?.shop?.name || r?.shop || '-') },
    { key: 'amount', header: 'Amount', render: (v: any) => (typeof v === 'number' ? `$${v.toFixed(2)}` : v) },
    { key: 'status', header: 'Status' },
    { key: 'createdAt', header: 'Date', render: (v: any) => (v ? new Date(v).toLocaleDateString() : '-') },
  ] as const), []);

  return (
    <div className="space-y-4">
      <PageHeader title="Total Income" subtitle="Revenue breakdown and seller management" />
      
      {/* Backend Connection Test */}
      <BackendTest />
      
      {/* Seller Management Section */}
      <Section title="Seller Management" description="Manage seller wallets and plan limits">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <select 
            className="px-3 py-2 text-sm border rounded-md dark:bg-gray-900 min-w-[200px]" 
            value={selectedSellerId} 
            onChange={(e) => setSelectedSellerId(e.target.value)}
            disabled={sellersStatus === 'loading'}
          >
            <option value="">Select Seller...</option>
            {sellers.map((seller) => {
              const ownerId = typeof seller.owner === 'object' ? seller.owner?._id : seller.owner;
              const ownerEmail = typeof seller.owner === 'object' ? seller.owner?.email : '';
              const ownerUsername = typeof seller.owner === 'object' ? seller.owner?.username : '';
              return (
                <option key={seller._id} value={ownerId || seller._id}>
                  {seller.name} ({ownerEmail || ownerUsername || 'No email'})
                </option>
              );
            })}
          </select>
          <button 
            className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800 disabled:opacity-50" 
            onClick={() => setShowMoneyModal(true)}
            disabled={!selectedSellerId || walletStatus === 'loading'}
          >
            Manage Money
          </button>
          <button 
            className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800 disabled:opacity-50" 
            onClick={() => setShowPlanModal(true)}
            disabled={!selectedSellerId || planStatus === 'loading'}
          >
            Set Plan Limit
          </button>
          <button 
            className="px-2 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800" 
            onClick={() => dispatch(fetchAdminSellers({ limit: 100 }))}
            disabled={sellersStatus === 'loading'}
          >
            {sellersStatus === 'loading' ? 'Loading...' : '↻'}
          </button>
        </div>
        {sellersError && (
          <div className="text-sm text-red-600 mb-2">Error loading sellers: {sellersError}</div>
        )}
      </Section>

      <Section title="Orders" description="Filter by date/status and export CSV">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <input
            className="w-full max-w-xs border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { dispatch(setOrdersQuery(search)); dispatch(setOrdersPage(1)); } }}
          />
          <select 
            className="px-2 py-2 text-sm border rounded-md dark:bg-gray-900" 
            value={selectedSellerId} 
            onChange={(e) => {
              setSelectedSellerId(e.target.value);
              // Filter orders by selected seller
              dispatch(setOrdersQuery(e.target.value ? `shop:${e.target.value}` : ''));
              dispatch(setOrdersPage(1));
            }}
          >
            <option value="">All Sellers</option>
            {sellers.map((seller) => {
              const ownerId = typeof seller.owner === 'object' ? seller.owner?._id : seller.owner;
              return (
                <option key={seller._id} value={ownerId || seller._id}>
                  {seller.name}
                </option>
              );
            })}
          </select>
          <select className="px-2 py-2 text-sm border rounded-md dark:bg-gray-900" value={statusFilter || ''} onChange={(e)=>{ dispatch(setOrdersStatus(e.target.value)); dispatch(setOrdersPage(1)); }}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
          <input type="date" className="px-2 py-2 text-sm border rounded-md dark:bg-gray-900" value={rangeFrom} onChange={(e)=> setRangeFrom(e.target.value)} />
          <span className="text-slate-500">to</span>
          <input type="date" className="px-2 py-2 text-sm border rounded-md dark:bg-gray-900" value={rangeTo} onChange={(e)=> setRangeTo(e.target.value)} />
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800" onClick={() => { dispatch(setOrdersQuery(search)); dispatch(setOrdersRange({ from: rangeFrom || undefined, to: rangeTo || undefined })); dispatch(setOrdersPage(1)); }}>Apply</button>
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800" onClick={() => exportCSV(items || [], `orders-${Date.now()}.csv`)}>Export CSV</button>
          <div className="ml-auto text-xs text-slate-500">{total || 0} orders • Total: <span className="font-medium">${(sum ?? 0).toFixed?.(2) || (Number(sum || 0)).toFixed(2)}</span></div>
        </div>

        {status === 'loading' && (<div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Loading orders...</div>)}
        {status === 'failed' && (<div className="text-sm text-red-600 mb-2">{error}</div>)}

        <DataTable columns={columns as any} data={items || []} />

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">Page {page} • Showing {items?.length || 0} of {total || 0}</div>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 text-sm rounded-md border disabled:opacity-50" disabled={page <= 1} onClick={() => dispatch(setOrdersPage(Math.max(1, page - 1)))}>Prev</button>
            <button className="px-2 py-1 text-sm rounded-md border disabled:opacity-50" disabled={(page * limit) >= (total || 0)} onClick={() => dispatch(setOrdersPage(page + 1))}>Next</button>
          </div>
        </div>
      </Section>

      {/* Money Management Modal */}
      {showMoneyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Manage Seller Money</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Action Type</label>
                <select 
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-900"
                  value={moneyType}
                  onChange={(e) => setMoneyType(e.target.value as "add" | "deduct")}
                >
                  <option value="add">Add Money</option>
                  <option value="deduct">Deduct Money</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-900"
                  placeholder="Enter amount..."
                  value={moneyAmount}
                  onChange={(e) => setMoneyAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button 
                  className="px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => {
                    setShowMoneyModal(false);
                    setMoneyAmount("");
                    dispatch(clearWalletError());
                  }}
                  disabled={walletStatus === 'loading'}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  onClick={handleMoneyAction}
                  disabled={walletStatus === 'loading' || !moneyAmount}
                >
                  {walletStatus === 'loading' ? 'Processing...' : `${moneyType === 'add' ? 'Add' : 'Deduct'} Money`}
                </button>
              </div>
              {walletError && (
                <div className="text-sm text-red-600 mt-2">{walletError}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plan Limit Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Set Plan Limit</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Order Limit</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-900"
                  placeholder="Enter order limit..."
                  value={planLimit}
                  onChange={(e) => setPlanLimit(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Set maximum number of orders seller can process</p>
              </div>
              <div className="flex gap-2 justify-end">
                <button 
                  className="px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => {
                    setShowPlanModal(false);
                    setPlanLimit("");
                    dispatch(clearPlanError());
                  }}
                  disabled={planStatus === 'loading'}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  onClick={handlePlanLimit}
                  disabled={planStatus === 'loading' || !planLimit}
                >
                  {planStatus === 'loading' ? 'Setting...' : 'Set Limit'}
                </button>
              </div>
              {planError && (
                <div className="text-sm text-red-600 mt-2">{planError}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
