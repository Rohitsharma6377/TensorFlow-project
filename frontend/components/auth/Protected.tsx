"use client";
import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/store'
import type { Role } from '@/store/slice/authSlice'

export default function Protected({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const router = useRouter()
  const { accessToken, user } = useAppSelector((s) => s.auth)

  useEffect(() => {
    if (!accessToken) {
      router.replace('/sign-in')
    } else if (roles && user && !roles.includes(user.role as Role)) {
      router.replace('/')
    }
  }, [accessToken, user, roles, router])

  if (!accessToken) return null
  if (roles && user && !roles.includes(user.role as Role)) return null
  return <>{children}</>
}
