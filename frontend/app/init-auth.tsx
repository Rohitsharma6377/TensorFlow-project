"use client";
import { useEffect } from 'react'
import { useAppDispatch } from '@/store'
import { meThunk, setToken } from '@/store/slice/authSlice'

export default function InitAuth() {
  const dispatch = useAppDispatch()
  useEffect(() => {
    console.log('[InitAuth] Starting auth initialization...')
    
    // Check localStorage for backward compatibility but prioritize cookies
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    console.log('[InitAuth] Token from localStorage:', token ? 'present' : 'none')
    
    if (token) {
      console.log('[InitAuth] Setting token in Redux for API calls')
      dispatch(setToken(token))
    }
    
    // Always attempt to fetch current user - this will use cookies if available
    console.log('[InitAuth] Dispatching meThunk to check session via cookies...')
    dispatch(meThunk())
      .unwrap()
      .then((result) => {
        console.log('[InitAuth] meThunk success:', result)
        // Don't clear localStorage immediately - keep it as backup
      })
      .catch((error) => {
        console.log('[InitAuth] meThunk failed:', error)
        // If cookie auth fails and we have localStorage token, keep it
      })
  }, [dispatch])
  return null
}
