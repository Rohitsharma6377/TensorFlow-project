"use client";

import { useState, useEffect } from 'react';

interface SellerDetails {
  seller: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    walletBalance: number;
    joinedDate: string;
    role: string;
  };
  business: {
    totalShops: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    shops: Array<{
      id: string;
      name: string;
      slug: string;
      status: string;
      verified: boolean;
      createdAt: string;
    }>;
  };
  subscription: {
    plan: string;
    monthlyAmount: number;
    renewalDate: string;
    daysUntilRenewal: number;
    shouldNotify: boolean;
    status: string;
  } | null;
  wallet: {
    balance: number;
    currency: string;
    transactions: Array<{
      id: string;
      type: string;
      amount: number;
      reason: string;
      timestamp: string;
      adminId: string;
    }>;
  };
}

interface Props {
  sellerId: string;
  onClose: () => void;
}

export default function SellerDetailsPanel({ sellerId, onClose }: Props) {
  const [details, setDetails] = useState<SellerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({
    plan: 'basic',
    amount: 29.99,
    duration: 30
  });

  useEffect(() => {
    if (sellerId) {
      fetchSellerDetails();
    }
  }, [sellerId]);

  const fetchSellerDetails = async () => {
    setLoading(true);
    setError('');
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE}/api/v1/admin/seller-details?sellerId=${sellerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setDetails(data.data);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch seller details');
    } finally {
      setLoading(false);
    }
  };

  const sendRenewalNotification = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE}/api/v1/admin/notify-renewal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify({ sellerId })
      });

      if (response.ok) {
        alert('Renewal notification sent successfully!');
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const updateSubscription = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE}/api/v1/admin/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify({
          sellerId,
          ...subscriptionForm
        })
      });

      if (response.ok) {
        alert('Subscription updated successfully!');
        setShowSubscriptionModal(false);
        fetchSellerDetails(); // Refresh data
      } else {
        throw new Error('Failed to update subscription');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
          <div className="text-center">Loading seller details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded">
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!details) return null;

  const getUrgencyColor = (days: number) => {
    if (days <= 7) return 'text-red-600 bg-red-100';
    if (days <= 15) return 'text-orange-600 bg-orange-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Seller Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Seller Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Seller Information</h3>
              <div className="space-y-2">
                <p><strong>Name:</strong> {details.seller.fullName}</p>
                <p><strong>Email:</strong> {details.seller.email}</p>
                <p><strong>Username:</strong> {details.seller.username}</p>
                <p><strong>Wallet Balance:</strong> ${details.seller.walletBalance.toFixed(2)}</p>
                <p><strong>Joined:</strong> {new Date(details.seller.joinedDate).toLocaleDateString()}</p>
                <p><strong>Role:</strong> {details.seller.role}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Business Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded">
                  <div className="text-2xl font-bold text-blue-600">{details.business.totalShops}</div>
                  <div className="text-sm text-blue-600">Total Shops</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900 p-3 rounded">
                  <div className="text-2xl font-bold text-green-600">{details.business.totalProducts}</div>
                  <div className="text-sm text-green-600">Total Products</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900 p-3 rounded">
                  <div className="text-2xl font-bold text-purple-600">{details.business.totalOrders}</div>
                  <div className="text-sm text-purple-600">Total Orders</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900 p-3 rounded">
                  <div className="text-2xl font-bold text-orange-600">${details.business.totalRevenue.toFixed(2)}</div>
                  <div className="text-sm text-orange-600">Total Revenue</div>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          {details.subscription && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Subscription Details</h3>
                <div className="space-x-2">
                  <button
                    onClick={() => setShowSubscriptionModal(true)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Edit Subscription
                  </button>
                  {details.subscription.shouldNotify && (
                    <button
                      onClick={sendRenewalNotification}
                      className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                    >
                      Send Renewal Notice
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p><strong>Plan:</strong> {details.subscription.plan}</p>
                  <p><strong>Monthly Amount:</strong> ${details.subscription.monthlyAmount}</p>
                </div>
                <div>
                  <p><strong>Renewal Date:</strong> {new Date(details.subscription.renewalDate).toLocaleDateString()}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      details.subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {details.subscription.status}
                    </span>
                  </p>
                </div>
                <div>
                  <p><strong>Days Until Renewal:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${getUrgencyColor(details.subscription.daysUntilRenewal)}`}>
                      {details.subscription.daysUntilRenewal} days
                    </span>
                  </p>
                  {details.subscription.shouldNotify && (
                    <p className="text-orange-600 text-sm mt-1">⚠️ Renewal notification required</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Shops List */}
          {details.business.shops.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Shops</h3>
              <div className="space-y-2">
                {details.business.shops.map(shop => (
                  <div key={shop.id} className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded">
                    <div>
                      <p className="font-medium">{shop.name}</p>
                      <p className="text-sm text-gray-600">/{shop.slug}</p>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        shop.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {shop.verified ? 'Verified' : 'Pending'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        shop.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {shop.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          {details.wallet.transactions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Recent Wallet Transactions</h3>
              <div className="space-y-2">
                {details.wallet.transactions.map(transaction => (
                  <div key={transaction.id} className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded">
                    <div>
                      <p className="font-medium">{transaction.reason}</p>
                      <p className="text-sm text-gray-600">{new Date(transaction.timestamp).toLocaleString()}</p>
                    </div>
                    <div className={`font-bold ${transaction.type === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'add' ? '+' : '-'}${transaction.amount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Subscription Modal */}
        {showSubscriptionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Update Subscription</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plan</label>
                  <select
                    value={subscriptionForm.plan}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, plan: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={subscriptionForm.amount}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, amount: parseFloat(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (days)</label>
                  <input
                    type="number"
                    value={subscriptionForm.duration}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, duration: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2 mt-6">
                <button
                  onClick={updateSubscription}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Update Subscription
                </button>
                <button
                  onClick={() => setShowSubscriptionModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
