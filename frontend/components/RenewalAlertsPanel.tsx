"use client";

import { useState, useEffect } from 'react';

interface RenewalAlert {
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  plan: string;
  monthlyAmount: number;
  renewalDate: string;
  daysUntilRenewal: number;
  urgency: 'high' | 'medium' | 'low';
}

interface RenewalAlertsData {
  alerts: RenewalAlert[];
  total: number;
  highUrgency: number;
  mediumUrgency: number;
  lowUrgency: number;
}

export default function RenewalAlertsPanel() {
  const [alerts, setAlerts] = useState<RenewalAlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [sendingNotifications, setSendingNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRenewalAlerts();
  }, []);

  const fetchRenewalAlerts = async () => {
    setLoading(true);
    setError('');
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE}/api/v1/admin/renewal-alerts`, {
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
      setAlerts(data.data);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch renewal alerts');
    } finally {
      setLoading(false);
    }
  };

  const sendRenewalNotification = async (sellerId: string) => {
    setSendingNotifications(prev => new Set(prev).add(sellerId));
    
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
    } finally {
      setSendingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(sellerId);
        return newSet;
      });
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '⏰';
      default: return '📅';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">Loading renewal alerts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-red-600">Error: {error}</div>
        <button 
          onClick={fetchRenewalAlerts}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!alerts || alerts.total === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">📅 Renewal Alerts</h3>
        <div className="text-center text-gray-500">
          <p>🎉 No renewal alerts at this time!</p>
          <p className="text-sm mt-2">All sellers have active subscriptions with more than 32 days remaining.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">📅 Renewal Alerts ({alerts.total})</h3>
        <button 
          onClick={fetchRenewalAlerts}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg border border-red-200">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🚨</span>
            <div>
              <div className="text-2xl font-bold text-red-600">{alerts.highUrgency}</div>
              <div className="text-sm text-red-600">High Urgency (≤7 days)</div>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center">
            <span className="text-2xl mr-2">⚠️</span>
            <div>
              <div className="text-2xl font-bold text-orange-600">{alerts.mediumUrgency}</div>
              <div className="text-sm text-orange-600">Medium Urgency (8-15 days)</div>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <span className="text-2xl mr-2">⏰</span>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{alerts.lowUrgency}</div>
              <div className="text-sm text-yellow-600">Low Urgency (16-32 days)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.alerts.map(alert => (
          <div 
            key={alert.sellerId} 
            className={`p-4 rounded-lg border ${getUrgencyColor(alert.urgency)}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2">{getUrgencyIcon(alert.urgency)}</span>
                  <h4 className="font-semibold">{alert.sellerName}</h4>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(alert.urgency)}`}>
                    {alert.daysUntilRenewal} days left
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Email:</strong> {alert.sellerEmail}</p>
                    <p><strong>Plan:</strong> {alert.plan}</p>
                  </div>
                  <div>
                    <p><strong>Monthly Amount:</strong> ${alert.monthlyAmount}</p>
                    <p><strong>Renewal Date:</strong> {new Date(alert.renewalDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="ml-4">
                <button
                  onClick={() => sendRenewalNotification(alert.sellerId)}
                  disabled={sendingNotifications.has(alert.sellerId)}
                  className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingNotifications.has(alert.sellerId) ? 'Sending...' : 'Send Notice'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Auto-notification Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Auto-Notification System</h4>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Sellers are automatically notified when their subscription has 32 days or less remaining. 
          You can manually send additional reminders using the "Send Notice" button above.
        </p>
      </div>
    </div>
  );
}
