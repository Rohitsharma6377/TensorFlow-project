"use client";

import React, { useEffect, useState } from 'react';
import { useAppSelector } from '@/store';

export function SessionDebug() {
  const { user, accessToken, status } = useAppSelector((s) => s.auth);
  const [cookies, setCookies] = useState<string>('');
  const [localStorageToken, setLocalStorageToken] = useState<string>('');

  useEffect(() => {
    const updateCookies = () => {
      if (typeof window !== 'undefined') {
        setCookies(document.cookie);
        setLocalStorageToken(localStorage.getItem('token') || '');
      }
    };
    
    updateCookies();
    // Update cookies every 2 seconds to catch changes
    const interval = setInterval(updateCookies, 2000);
    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const hasSidCookie = cookies.includes('sid=');
  const hasTokenCookie = cookies.includes('token=');

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 text-white text-xs p-3 rounded max-w-md z-50 max-h-64 overflow-y-auto">
      <div className="font-bold mb-2">Session Debug</div>
      <div>Status: <span className={status === 'loading' ? 'text-yellow-300' : status === 'error' ? 'text-red-300' : 'text-green-300'}>{status}</span></div>
      <div>User: {user ? `${user.username} (${user.role})` : 'None'}</div>
      <div>AccessToken: <span className={accessToken ? 'text-green-300' : 'text-red-300'}>{accessToken ? 'Present' : 'None'}</span></div>
      <div>LocalStorage Token: <span className={localStorageToken ? 'text-green-300' : 'text-red-300'}>{localStorageToken ? 'Present' : 'None'}</span></div>
      <div>SID Cookie: <span className={hasSidCookie ? 'text-green-300' : 'text-red-300'}>{hasSidCookie ? 'Present' : 'Missing'}</span></div>
      <div>Token Cookie: <span className={hasTokenCookie ? 'text-green-300' : 'text-red-300'}>{hasTokenCookie ? 'Present' : 'Missing'}</span></div>
      <div className="mt-2 text-xs text-gray-400">
        All Cookies: {cookies || 'None'}
      </div>
      <div className="mt-2 text-yellow-300">
        Expected: Both sid and token cookies after login
      </div>
      <div className="mt-2 flex gap-2">
        <button 
          onClick={() => window.location.href = 'http://localhost:4000/api/v1/auth/debug/sessions'}
          className="px-2 py-1 bg-blue-600 rounded text-xs"
        >
          Check Sessions
        </button>
        <button 
          onClick={() => window.location.href = 'http://localhost:4000/api/v1/auth/debug/cookies'}
          className="px-2 py-1 bg-green-600 rounded text-xs"
        >
          Check Cookies
        </button>
      </div>
    </div>
  );
}

export default SessionDebug;
