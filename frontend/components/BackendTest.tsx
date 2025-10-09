"use client";

import { useState } from 'react';

export default function BackendTest() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

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

  return (
    <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-2">Backend Connection Test</h3>
      <button 
        onClick={testBackend}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Backend Connection'}
      </button>
      
      {result && (
        <pre className="mt-3 p-3 bg-white dark:bg-gray-900 border rounded text-sm whitespace-pre-wrap">
          {result}
        </pre>
      )}
      
      <div className="mt-2 text-xs text-gray-600">
        <p>API Base: {process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}</p>
        <p>Token: {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}</p>
      </div>
    </div>
  );
}
