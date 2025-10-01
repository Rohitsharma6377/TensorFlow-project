'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch } from '@/store';
import { signupThunk } from '@/store/slice/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';

type FormData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  shopName?: string;
  phone?: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
};

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('customer');
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    shopName: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = (isSeller: boolean) => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    // Customer min 6 (backend), Seller min 8 (backend)
    if (isSeller) {
      if (formData.password.length < 8) {
        toast.error('For sellers, password must be at least 8 characters long');
        return false;
      }
    } else {
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return false;
      }
    }

    if (isSeller && !formData.shopName) {
      toast.error('Shop name is required');
      return false;
    }

    if (isSeller && !formData.phone) {
      toast.error('Phone number is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isSeller = activeTab === 'seller';
    
    if (!validateForm(isSeller)) return;
    
    setIsLoading(true);
    
    try {
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: (isSeller ? 'seller' : 'customer') as 'seller' | 'customer',
        ...(isSeller && {
          shopName: formData.shopName,
          phone: formData.phone,
          address: formData.address
        })
      };
      
      await dispatch(signupThunk(userData)).unwrap();
      
      toast.success(
        isSeller 
          ? 'Seller account created successfully! Please wait for admin approval.'
          : 'Account created successfully! Welcome to our platform.'
      );
      
      router.push(isSeller ? '/seller/dashboard' : '/user/profile');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-emerald-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
      {/* brand hero */}
      <div className="absolute top-10 left-0 right-0 flex flex-col items-center gap-2 select-none">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">SocialShop</h1>
        <p className="text-xs text-slate-600/80 dark:text-slate-300/80">Join the community of creators and brands</p>
      </div>
      <Card className="w-full max-w-2xl backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-emerald-100 dark:border-slate-700 shadow-xl animate-[slideIn_220ms_ease-out]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">Create an account</CardTitle>
          <CardDescription className="text-center">
            Join our platform to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="customer" 
            className="w-full"
            onValueChange={(value: string) => setActiveTab(value)}
          >
            <TabsList className="grid w-full grid-cols-2 border border-emerald-200 bg-white/60 dark:bg-gray-800/60">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="seller">Seller</TabsTrigger>
            </TabsList>
            
            <TabsContent value="customer" className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      disabled={isLoading}
                      placeholder="Choose a username"
                      className="bg-white/70 dark:bg-gray-800/60 border-sky-200 focus-visible:ring-sky-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                      placeholder="your@email.com"
                      className="bg-white/70 dark:bg-gray-800/60 border-emerald-200 focus-visible:ring-emerald-300"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="Create a password"
                        className="pr-10 bg-white/70 dark:bg-gray-800/60 border-emerald-200 focus-visible:ring-emerald-300"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <Icons.eyeOff className="h-4 w-4" />
                        ) : (
                          <Icons.eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                      placeholder="Confirm your password"
                      className="bg-white/70 dark:bg-gray-800/60 border-sky-200 focus-visible:ring-sky-300"
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-sky-500 text-white hover:from-emerald-600 hover:to-sky-600" disabled={isLoading}>
                  {isLoading && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Customer Account
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="seller" className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seller-username">Username</Label>
                    <Input id="seller-username" name="username" type="text" required value={formData.username} onChange={handleChange} disabled={isLoading} placeholder="Choose a username" className="bg-white/70 dark:bg-gray-800/60 border-sky-200 focus-visible:ring-sky-300" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller-email">Email</Label>
                    <Input id="seller-email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} disabled={isLoading} placeholder="your@email.com" className="bg-white/70 dark:bg-gray-800/60 border-emerald-200 focus-visible:ring-emerald-300" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shopName">Shop Name</Label>
                    <Input id="shopName" name="shopName" type="text" required value={formData.shopName} onChange={handleChange} disabled={isLoading} placeholder="Your shop name" className="bg-white/70 dark:bg-gray-800/60 border-sky-200 focus-visible:ring-sky-300" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange} disabled={isLoading} placeholder="+91 1234567890" className="bg-white/70 dark:bg-gray-800/60 border-emerald-200 focus-visible:ring-emerald-300" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Shop Address</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="street" className="text-xs">Street</Label>
                      <Input id="street" name="address.street" type="text" required value={formData.address?.street} onChange={handleChange} disabled={isLoading} placeholder="123 Main St" className="bg-white/70 dark:bg-gray-800/60 border-sky-200 focus-visible:ring-sky-300" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-xs">City</Label>
                      <Input id="city" name="address.city" type="text" required value={formData.address?.city} onChange={handleChange} disabled={isLoading} placeholder="City" className="bg-white/70 dark:bg-gray-800/60 border-emerald-200 focus-visible:ring-emerald-300" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-xs">State</Label>
                      <Input id="state" name="address.state" type="text" required value={formData.address?.state} onChange={handleChange} disabled={isLoading} placeholder="State" className="bg-white/70 dark:bg-gray-800/60 border-sky-200 focus-visible:ring-sky-300" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode" className="text-xs">Pincode</Label>
                      <Input id="pincode" name="address.pincode" type="text" required value={formData.address?.pincode} onChange={handleChange} disabled={isLoading} placeholder="123456" className="bg-white/70 dark:bg-gray-800/60 border-emerald-200 focus-visible:ring-emerald-300" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="country" className="text-xs">Country</Label>
                      <Input id="country" name="address.country" type="text" required value={formData.address?.country} onChange={handleChange} disabled={isLoading} placeholder="Country" className="bg-white/70 dark:bg-gray-800/60 border-sky-200 focus-visible:ring-sky-300" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seller-password">Password</Label>
                    <div className="relative">
                      <Input id="seller-password" name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleChange} disabled={isLoading} placeholder="Create a password" className="pr-10 bg-white/70 dark:bg-gray-800/60 border-emerald-200 focus-visible:ring-emerald-300" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                        {showPassword ? (<Icons.eyeOff className="h-4 w-4" />) : (<Icons.eye className="h-4 w-4" />)}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller-confirmPassword">Confirm Password</Label>
                    <Input id="seller-confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} required value={formData.confirmPassword} onChange={handleChange} disabled={isLoading} placeholder="Confirm your password" className="bg-white/70 dark:bg-gray-800/60 border-sky-200 focus-visible:ring-sky-300" />
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>By creating a seller account, you agree to our <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</p>
                  <p className="mt-2">Your shop will be reviewed by our team before activation. You'll receive an email once approved.</p>
                </div>

                <Button type="submit" className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-sky-500 text-white hover:from-emerald-600 hover:to-sky-600" disabled={isLoading}>
                  {isLoading && (<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />)}
                  Apply as Seller
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
