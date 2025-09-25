"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Camera, 
  Star, 
  TrendingUp, 
  Package, 
  DollarSign,
  Calendar,
  Globe,
  Award,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setUser, updateProfileThunk, addAddressThunk } from "@/store/slice/userSlice";
import { fetchMyShop, updateShop } from "@/store/slice/shopSlice";
import { AuthAPI } from "@/lib/api";
import { fetchSellerStats, fetchProductCount } from "@/store/slice/analyticsSlice";

export default function SellerProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s=>s.user.user);
  const shop = useAppSelector(s=>s.shop.shop);
  const userId = user?.id || (user as any)?._id || "";
  const shopId = shop?._id || shop?.id || "";
  const { stats, productCount } = useAppSelector(s=>s.analytics);

  // Local form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address1, setAddress1] = useState("");
  const [storeName, setStoreName] = useState("");
  const [businessSince, setBusinessSince] = useState<string>("");
  const [businessDesc, setBusinessDesc] = useState("");
  const [saving, setSaving] = useState(false);

  // Load current user + shop on mount
  useEffect(() => {
    (async () => {
      try {
        if (!userId) {
          const res = await AuthAPI.getCurrentUser();
          if (res?.user) dispatch(setUser(res.user as any));
        }
      } catch {}
      if (!shopId) dispatch(fetchMyShop());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load analytics when shopId becomes available
  useEffect(() => {
    if (!shopId) return;
    dispatch(fetchSellerStats({ shop: shopId, sinceHours: 720 }));
    dispatch(fetchProductCount({ shop: shopId }));
  }, [dispatch, shopId]);

  // Initialize form fields from store
  useEffect(() => {
    if (user) {
      setFullName(user.profile?.fullName || "");
      setPhone((user as any)?.profile?.phone || (user as any)?.phone || "");
      setEmail((user as any)?.email || "");
      const addr: any = (user as any)?.profile?.address || {};
      setAddress1(addr?.line1 || "");
    }
  }, [user]);

  useEffect(() => {
    if (shop) {
      setStoreName((shop as any)?.name || (shop as any)?.storeName || "");
      setBusinessSince(((shop as any)?.since || (shop as any)?.establishedYear || "") + "");
      setBusinessDesc((shop as any)?.description || (shop as any)?.about || "");
    }
  }, [shop]);

  async function onSave() {
    if (saving) return;
    setSaving(true);
    try {
      let currentUserId = userId;
      let currentShopId = shopId;
      // Ensure we have IDs before calling APIs
      if (!currentUserId) {
        try {
          const me = await AuthAPI.getCurrentUser();
          if (me?.user) {
            currentUserId = (me.user as any).id || (me.user as any)._id;
            dispatch(setUser(me.user as any));
          }
        } catch (err) { console.warn('Failed to fetch current user before save', err); }
      }
      if (!currentShopId) {
        try {
          const r = await dispatch(fetchMyShop()).unwrap();
          currentShopId = (r as any)?._id || (r as any)?.id;
        } catch (err) { console.warn('Failed to fetch shop before save', err); }
      }

      console.log('[Profile] onSave using', { currentUserId, currentShopId });

      // Update user profile (name, phone, bio, and address in one call)
      if (currentUserId) {
        const profileUpdates: any = { fullName, bio: businessDesc || undefined };
        if (phone) profileUpdates.phone = phone;
        if (address1.trim()) profileUpdates.address = { line1: address1 };
        // Use the 'me' endpoint to avoid Forbidden when IDs mismatch
        await dispatch(updateProfileThunk({ userId: 'me', updates: { profile: profileUpdates } })).unwrap();
      }
      // Update shop info
      if (currentShopId) {
        const payload: any = { name: storeName };
        if (businessSince) payload.since = Number(businessSince);
        if (businessDesc) payload.description = businessDesc;
        await dispatch(updateShop({ id: String(currentShopId), payload })).unwrap();
      }
      // Optional: toast success
      // toast.success('Profile updated');
    } catch (e) {
      // toast.error('Failed to save');
      console.error('[Profile] Save failed', e);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-sky-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-blue-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center overflow-hidden">
                  <User className="w-16 h-16 text-white/80" />
                </div>
                <button className="absolute bottom-2 right-2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30 hover:bg-white/30 transition-all duration-200">
                  <Camera className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-4xl font-bold mb-2">{fullName || "Your Name"}</h1>
                <p className="text-xl text-white/90 mb-4">Premium Seller</p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    <Star className="w-4 h-4 mr-1" />
                    4.9 Rating
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    <Package className="w-4 h-4 mr-1" />
                    {(productCount ?? 0).toLocaleString()} Products
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    <Users className="w-4 h-4 mr-1" />
                    15k Followers
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Total Sales</p>
                  <p className="text-3xl font-bold">₹{Number(stats?.revenue || 0).toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-sky-500 to-sky-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sky-100 text-sm font-medium">Orders</p>
                  <p className="text-3xl font-bold">{Number(stats?.totalOrders || 0).toLocaleString()}</p>
                </div>
                <Package className="w-8 h-8 text-sky-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Delivered</p>
                  <p className="text-3xl font-bold">{Number(stats?.delivered || 0).toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Rating</p>
                  <p className="text-3xl font-bold">4.9</p>
                </div>
                <Star className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Personal Information */}
          <Card className="bg-white/80 backdrop-blur-sm border-emerald-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-sky-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-emerald-100">
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-emerald-700 font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </Label>
                    <Input value={fullName} onChange={(e)=>setFullName(e.target.value)} placeholder="John Doe" className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"/>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sky-700 font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="+1 (555) 123-4567" className="border-sky-200 focus:border-sky-500 focus:ring-sky-500/20"/>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-blue-700 font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="john.doe@example.com" type="email" className="border-blue-200 focus:border-blue-500 focus:ring-blue-500/20"/>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-purple-700 font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </Label>
                  <Input value={address1} onChange={(e)=>setAddress1(e.target.value)} placeholder="123 Main St, City, State 12345" className="border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"/>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Business Information
              </CardTitle>
              <CardDescription className="text-sky-100">
                Manage your business profile and store details
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-emerald-700 font-medium flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Store Name
                  </Label>
                  <Input value={storeName} onChange={(e)=>setStoreName(e.target.value)} placeholder="John's Premium Store" className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"/>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sky-700 font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Business Since
                  </Label>
                  <Input value={businessSince} onChange={(e)=>setBusinessSince(e.target.value)} placeholder="2020" type="number" className="border-sky-200 focus:border-sky-500 focus:ring-sky-500/20"/>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-blue-700 font-medium">Business Description</Label>
                  <textarea value={businessDesc} onChange={(e)=>setBusinessDesc(e.target.value)} placeholder="Tell customers about your business, specialties, and what makes you unique..." className="w-full min-h-[100px] px-3 py-2 border border-blue-200 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"/>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-purple-700 font-medium">Specialties</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Electronics</Badge>
                    <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-200">Fashion</Badge>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Home & Garden</Badge>
                    <Button variant="outline" size="sm" className="h-6 text-xs border-dashed">
                      + Add Specialty
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={onSave} className="bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button 
            variant="outline" 
            className="border-2 border-sky-300 text-sky-700 hover:bg-sky-50 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Preview Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
