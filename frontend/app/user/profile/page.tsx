"use client";

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateProfileThunk } from '@/store/slice/userSlice';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user: authUser } = useAppSelector((s) => s.auth);
  const { user, status } = useAppSelector((s) => s.user);
  const [form, setForm] = useState({
    fullName: '',
    bio: '',
    profilePic: '',
  });

  useEffect(() => {
    const base = user || authUser;
    if (base) {
      setForm({
        fullName: base.profile?.fullName || '',
        bio: base.profile?.bio || '',
        profilePic: base.profilePic || '',
      });
    }
  }, [user, authUser]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.id) return;
    try {
      await dispatch(
        updateProfileThunk({
          userId: authUser.id,
          updates: {
            profilePic: form.profilePic || undefined,
            profile: { fullName: form.fullName || undefined, bio: form.bio || undefined },
          },
        })
      ).unwrap();
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border-emerald-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-emerald-900">Profile</CardTitle>
          <CardDescription className="text-emerald-700">Manage your public profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" value={form.fullName} onChange={onChange} placeholder="Your full name" className="border-emerald-200 focus:ring-emerald-400" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profilePic">Profile Picture URL</Label>
                <Input id="profilePic" name="profilePic" value={form.profilePic} onChange={onChange} placeholder="https://..." className="border-emerald-200 focus:ring-emerald-400" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Input id="bio" name="bio" value={form.bio} onChange={onChange} placeholder="Tell us about yourself" className="border-emerald-200 focus:ring-emerald-400" />
              </div>
            </div>
            <Button type="submit" disabled={status === 'loading'} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white border-emerald-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-emerald-900">Wallet</CardTitle>
          <CardDescription className="text-emerald-700">Your current wallet balance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold text-emerald-900">
            ₹{(user || authUser)?.walletBalance ?? 0}
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-emerald-700">Top-up and withdrawal features can be added here.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
