"use client";
import { useEffect } from 'react'
import { useAppDispatch } from '@/store'
import { meThunk, setToken } from '@/store/slice/authSlice'

export default function InitAuth() {
  const dispatch = useAppDispatch()
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      dispatch(setToken(token))
      dispatch(meThunk())
    }
  }, [dispatch])
  return null
}
