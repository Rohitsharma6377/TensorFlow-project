"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { addAddressThunk, updateAddressThunk, deleteAddressThunk, setUser } from '@/store/slice/userSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import type { AddressDTO } from '@/lib/api';

export default function AddressesPage() {
  const dispatch = useAppDispatch();
  const { user: authUser } = useAppSelector((s) => s.auth);
  const { user: userState, status } = useAppSelector((s) => s.user);
  const user = userState || authUser;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressDTO>({
    label: '',
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  });

  const addresses = useMemo(() => user?.addresses || [], [user]);

  useEffect(() => {
    // keep userSlice in sync initially
    if (authUser && !userState) dispatch(setUser(authUser as any));
  }, [authUser, userState, dispatch]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ label: '', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.id) return;
    try {
      if (editingId) {
        await dispatch(
          updateAddressThunk({ userId: authUser.id, addressId: editingId, address: form })
        ).unwrap();
        toast.success('Address updated');
      } else {
        await dispatch(addAddressThunk({ userId: authUser.id, address: form })).unwrap();
        toast.success('Address added');
      }
      resetForm();
    } catch (err: any) {
      toast.error(err?.message || 'Operation failed');
    }
  };

  const onEdit = (addr: any) => {
    setEditingId(addr.id);
    setForm({
      id: addr.id,
      label: addr.label || '',
      name: addr.name || '',
      phone: addr.phone || '',
      line1: addr.line1 || '',
      line2: addr.line2 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    });
  };

  const onDelete = async (id: string) => {
    if (!authUser?.id) return;
    try {
      await dispatch(deleteAddressThunk({ userId: authUser.id, addressId: id })).unwrap();
      toast.success('Address removed');
      if (editingId === id) resetForm();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border-emerald-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-emerald-900">Addresses</CardTitle>
          <CardDescription className="text-emerald-700">Manage your shipping addresses.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input id="label" name="label" value={form.label} onChange={onChange} placeholder="Home / Office" className="border-emerald-200 focus:ring-emerald-400" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={form.name} onChange={onChange} placeholder="Recipient name" className="border-emerald-200 focus:ring-emerald-400" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" value={form.phone} onChange={onChange} placeholder="10-digit phone" className="border-emerald-200 focus:ring-emerald-400" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" name="pincode" value={form.pincode} onChange={onChange} placeholder="110011" className="border-emerald-200 focus:ring-emerald-400" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="line1">Address line 1</Label>
                <Input id="line1" name="line1" value={form.line1} onChange={onChange} placeholder="Street, area" className="border-emerald-200 focus:ring-emerald-400" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="line2">Address line 2</Label>
                <Input id="line2" name="line2" value={form.line2} onChange={onChange} placeholder="Landmark, building" className="border-emerald-200 focus:ring-emerald-400" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" value={form.city} onChange={onChange} placeholder="City" className="border-emerald-200 focus:ring-emerald-400" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" value={form.state} onChange={onChange} placeholder="State" className="border-emerald-200 focus:ring-emerald-400" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={status === 'loading'} className="bg-emerald-600 hover:bg-emerald-700 text-white">{editingId ? 'Update' : 'Add'} Address</Button>
              {editingId && (
                <Button type="button" variant="outline" className="border-emerald-200 text-emerald-800 hover:bg-emerald-50" onClick={resetForm}>Cancel</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {addresses.map((addr: any) => (
          <Card key={addr.id} className="bg-white border-emerald-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-emerald-900">{addr.label || 'Address'}</span>
                <span className="text-sm text-emerald-700">{addr.pincode}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1 text-emerald-900">
                <div className="font-medium text-emerald-900">{addr.name} • {addr.phone}</div>
                <div>{addr.line1}</div>
                {addr.line2 ? <div>{addr.line2}</div> : null}
                <div>{addr.city}, {addr.state}</div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-800 hover:bg-emerald-50" onClick={() => onEdit(addr)}>Edit</Button>
                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => onDelete(addr.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {addresses.length === 0 && (
          <Card className="bg-white border-emerald-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-emerald-900">No addresses yet</CardTitle>
              <CardDescription className="text-emerald-700">Add your first shipping address using the form above.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
