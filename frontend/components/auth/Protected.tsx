"use client";
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/store'
import type { Role } from '@/store/authSlice'

export default function Protected({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const router = useRouter()
  const { token, user } = useAppSelector((s) => s.auth)

  useEffect(() => {
    if (!token) {
      router.replace('/sign-in')
    } else if (roles && user && !roles.includes(user.role as Role)) {
      router.replace('/')
    }
  }, [token, user, roles, router])

  if (!token) return null
  if (roles && user && !roles.includes(user.role as Role)) return null
  return <>{children}</>
}
