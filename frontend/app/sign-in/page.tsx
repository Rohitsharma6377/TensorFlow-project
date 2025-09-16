"use client";
import React from 'react'
import { Form, Input, Button, message, Select } from 'antd'
import { useAppDispatch } from '@/store'
import { loginThunk } from '@/store/slice/authSlice'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const dispatch = useAppDispatch()
  const router = useRouter()

  const onFinish = async (values: any) => {
    try {
      const res = await dispatch(loginThunk({ email: values.email, password: values.password })).unwrap()
      message.success(`Welcome back ${res.user?.username || ''}`)
      router.replace('/dashboard')
    } catch (err: any) {
      message.error(err?.message || 'Login failed')
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border bg-white p-6">
      <h1 className="text-xl font-semibold">Sign In</h1>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
          <Input placeholder="you@example.com" />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
          <Input.Password placeholder="••••••••" />
        </Form.Item>
        <div className="flex items-center justify-between">
          <Button type="primary" htmlType="submit">Sign In</Button>
          <Button type="link" onClick={() => router.push('/sign-up')}>Create account</Button>
        </div>
      </Form>
    </div>
  )
}
