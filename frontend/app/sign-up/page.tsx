"use client";
import React from 'react'
import { Form, Input, Button, message, Select } from 'antd'
import { useAppDispatch } from '@/store'
import { signupThunk } from '@/store/slice/authSlice'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const dispatch = useAppDispatch()
  const router = useRouter()

  const onFinish = async (values: any) => {
    try {
      const res = await dispatch(
        signupThunk({ username: values.username, email: values.email, password: values.password, role: values.role })
      ).unwrap()
      message.success(`Welcome ${res.user?.username || ''}`)
      router.replace('/dashboard')
    } catch (err: any) {
      message.error(err?.message || 'Signup failed')
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border bg-white p-6">
      <h1 className="text-xl font-semibold">Create account</h1>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item name="username" label="Username" rules={[{ required: true, min: 3 }]}>
          <Input placeholder="yourname" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
          <Input placeholder="you@example.com" />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
          <Input.Password placeholder="••••••••" />
        </Form.Item>
        <Form.Item name="role" label="Role" initialValue="customer" rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'customer', label: 'Customer' },
              { value: 'seller', label: 'Seller' }
            ]}
          />
        </Form.Item>
        <div className="flex items-center justify-between">
          <Button type="primary" htmlType="submit">Sign Up</Button>
          <Button type="link" onClick={() => router.push('/sign-in')}>Already have an account?</Button>
        </div>
      </Form>
    </div>
  )
}
