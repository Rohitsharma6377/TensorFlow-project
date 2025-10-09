"use client";

import { useState } from 'react';

export default function BackendTest() {
  const [result, setResult] = useState<string>('');
  const [sellersResult, setSellersResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sellersLoading, setSellersLoading] = useState<boolean>(false);

  const testBackend = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      console.log('Testing backend at:', API_BASE);
      
      const response = await fetch(`${API_BASE}/api/v1/admin/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        setResult(`❌ Backend Error: ${response.status} - ${errorText}`);
        return;
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      setResult(`✅ Backend Connected!\n${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      console.error('Backend test error:', error);
      setResult(`❌ Connection Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSellers = async () => {
    setSellersLoading(true);
    setSellersResult('Loading sellers...');
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      console.log('Testing sellers at:', API_BASE);
      
      const response = await fetch(`${API_BASE}/api/v1/admin/debug/sellers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include'
      });

      console.log('Sellers response status:', response.status);
      console.log('Sellers response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        setSellersResult(`❌ Sellers Error: ${response.status} - ${errorText}`);
        return;
      }

      const data = await response.json();
      console.log('Sellers response data:', data);
      
      setSellersResult(`✅ Sellers Data:\n${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      console.error('Sellers test error:', error);
      setSellersResult(`❌ Sellers Connection Failed: ${error.message}`);
    } finally {
      setSellersLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-2">Backend Connection Test</h3>
      <button 
        onClick={testBackend}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 mr-2"
      >
        {loading ? 'Testing...' : 'Test Backend Connection'}
      </button>
      
      <button 
        onClick={testSellers}
        disabled={sellersLoading}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
      >
        {sellersLoading ? 'Loading...' : 'Debug Sellers'}
      </button>
      
      {result && (
        <pre className="mt-3 p-3 bg-white dark:bg-gray-900 border rounded text-sm whitespace-pre-wrap">
          {result}
        </pre>
      )}
      
      {sellersResult && (
        <pre className="mt-3 p-3 bg-white dark:bg-gray-900 border rounded text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
          {sellersResult}
        </pre>
      )}
      
      <div className="mt-2 text-xs text-gray-600">
        <p>API Base: {process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}</p>
        <p>Token: {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}</p>
      </div>
    </div>
  );
}
