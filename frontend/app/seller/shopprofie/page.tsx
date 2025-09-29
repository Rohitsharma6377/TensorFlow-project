"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector, type RootState } from "@/store"
import { fetchMyShop, createShop, updateShop } from "@/store/slice/shopSlice"
import { api } from "@/lib/api"
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  Switch,
  FormControlLabel,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
} from "@mui/material"
import {
  Store,
  Email,
  Phone,
  Language,
  Facebook,
  Instagram,
  Twitter,
  YouTube,
  LocationOn,
  Payment,
  CloudUpload,
  ExpandMore,
  QrCode,
  AccountBalance,
  LocalShipping,
} from "@mui/icons-material"

const SHOP_CATEGORIES = [
  "electronics",
  "clothing",
  "home",
  "beauty",
  "grocery",
  "sports",
  "books",
  "toys",
  "automotive",
  "other",
]

export default function EnhancedShopProfile() {
  const dispatch = useAppDispatch()
  const { shop, loading: shopLoading, error: shopError } = useAppSelector((s: RootState) => s.shop)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [shopId, setShopId] = useState<string | null>(null)

  // Basic shop info
  const [shopName, setShopName] = useState("")
  const [description, setDescription] = useState("")
  const [themeColor, setThemeColor] = useState("#000000")
  const [categories, setCategories] = useState<string[]>([])
  const [tags, setTags] = useState("")

  // Contact info
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [social, setSocial] = useState({
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
  })

  // Address
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  })

  // Business details
  const [businessType, setBusinessType] = useState("")
  const [gstNumber, setGstNumber] = useState("")
  const [panNumber, setPanNumber] = useState("")
  const [businessHours, setBusinessHours] = useState({
    open: "09:00",
    close: "18:00",
    closedDays: [] as string[],
  })

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState({
    razorpay: { enabled: false, keyId: "", keySecret: "" },
    stripe: { enabled: false, publishableKey: "", secretKey: "" },
    payu: { enabled: false, merchantKey: "", merchantSalt: "" },
    phonepe: { enabled: false, merchantId: "", saltKey: "", saltIndex: "" },
    upi: { id: "", qrCode: null as File | null },
    cod: { enabled: true, minOrder: 0 },
  })

  // Delivery partners
  const [deliveryPartners, setDeliveryPartners] = useState({
    shiprocket: { enabled: false, email: "", password: "", apiKey: "" },
    delhivery: { enabled: false, token: "" },
    bluedart: { enabled: false, licenseKey: "", loginId: "" },
    fedex: { enabled: false, clientId: "", clientSecret: "", accountNumber: "" },
  })

  // Files
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [upiQrPreview, setUpiQrPreview] = useState<string | null>(null)

  // Generate and cleanup preview URLs when files change
  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile)
      setLogoPreview(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setLogoPreview(null)
    }
  }, [logoFile])

  useEffect(() => {
    if (bannerFile) {
      const url = URL.createObjectURL(bannerFile)
      setBannerPreview(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setBannerPreview(null)
    }
  }, [bannerFile])

  useEffect(() => {
    if (paymentMethods.upi.qrCode) {
      const url = URL.createObjectURL(paymentMethods.upi.qrCode)
      setUpiQrPreview(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setUpiQrPreview(null)
    }
  }, [paymentMethods.upi.qrCode])

  // Load my shop and prefill when available
  useEffect(() => {
    dispatch(fetchMyShop() as any)
  }, [dispatch])

  useEffect(() => {
    if (!shop) return
    try {
      setShopId(shop._id || shop.id || null)
      setShopName(shop.name || '')
      setDescription(shop.description || '')
      setThemeColor(shop.metadata?.themeColor || themeColor)
      setCategories(Array.isArray(shop.categories) ? shop.categories : [])
      setTags(Array.isArray(shop.tags) ? shop.tags.join(', ') : '')
      setContactEmail(shop.contact?.email || '')
      setContactPhone(shop.contact?.phone || '')
      setWebsite(shop.contact?.website || '')
      setSocial({
        facebook: shop.contact?.social?.facebook || '',
        instagram: shop.contact?.social?.instagram || '',
        twitter: shop.contact?.social?.twitter || '',
        youtube: shop.contact?.social?.youtube || '',
      })
      if (shop.address) {
        setAddress({
          street: shop.address.street || '',
          city: shop.address.city || '',
          state: shop.address.state || '',
          country: shop.address.country || 'India',
          pincode: shop.address.pincode || '',
        })
      }
      if (Array.isArray(shop.businessHours) && shop.businessHours.length) {
        const anyOpen = shop.businessHours.find((h: any) => h?.openTime && h?.closeTime)
        if (anyOpen) setBusinessHours({ open: anyOpen.openTime, close: anyOpen.closeTime, closedDays: [] })
      }
      if (shop.metadata?.payments) {
        setPaymentMethods((prev) => ({
          ...prev,
          razorpay: {
            enabled: !!shop.metadata.payments.razorpay?.enabled,
            keyId: shop.metadata.payments.razorpay?.keyId || '',
            keySecret: shop.metadata.payments.razorpay?.keySecret || '',
          },
          stripe: {
            enabled: !!shop.metadata.payments.stripe?.enabled,
            publishableKey: shop.metadata.payments.stripe?.publishableKey || '',
            secretKey: shop.metadata.payments.stripe?.secretKey || '',
          },
          payu: {
            enabled: !!shop.metadata.payments.payu?.enabled,
            merchantKey: shop.metadata.payments.payu?.merchantKey || '',
            merchantSalt: shop.metadata.payments.payu?.merchantSalt || '',
          },
          phonepe: {
            enabled: !!shop.metadata.payments.phonepe?.enabled,
            merchantId: shop.metadata.payments.phonepe?.merchantId || '',
            saltKey: shop.metadata.payments.phonepe?.saltKey || '',
            saltIndex: shop.metadata.payments.phonepe?.saltIndex || '',
          },
          upi: {
            id: shop.metadata.payments.upi?.id || '',
            qrCode: null,
          },
          cod: shop.metadata.payments.cod || { enabled: true, minOrder: 0 },
        }))
      }
      if (shop.metadata?.deliveryPartners) {
        const dp = shop.metadata.deliveryPartners
        setDeliveryPartners((prev) => ({
          ...prev,
          shiprocket: { enabled: !!dp.shiprocket?.enabled, email: dp.shiprocket?.email || '', password: '', apiKey: dp.shiprocket?.apiKey || '' },
          delhivery: { enabled: !!dp.delhivery?.enabled, token: dp.delhivery?.token || '' },
          bluedart: { enabled: !!dp.bluedart?.enabled, licenseKey: dp.bluedart?.licenseKey || '', loginId: dp.bluedart?.loginId || '' },
          fedex: { enabled: !!dp.fedex?.enabled, clientId: dp.fedex?.clientId || '', clientSecret: '', accountNumber: dp.fedex?.accountNumber || '' },
        }))
      }
    } catch {}
  }, [shop])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!shopName.trim()) throw new Error('Please enter a shop name')
      if (!contactEmail.trim()) throw new Error('Please enter a contact email')
      if (!contactPhone.trim()) throw new Error('Please enter a contact phone')

      // Only include address if it's complete enough to pass backend validators
      const addressComplete = address.street && address.city && address.state && address.pincode && address.country
      const addressPayload = addressComplete
        ? { ...address }
        : undefined

      // Map tags string to array
      const tagsArr = (tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      // Map simple business hours to 7-day schedule
      const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const
      const bh = days.map((d) => ({ day: d, isOpen: true, openTime: businessHours.open, closeTime: businessHours.close }))

      // Build metadata with payments and delivery partners
      const metadata: any = {
        themeColor,
        payments: {
          razorpay: paymentMethods.razorpay,
          stripe: paymentMethods.stripe,
          payu: paymentMethods.payu,
          phonepe: paymentMethods.phonepe,
          upi: { id: paymentMethods.upi.id },
          cod: paymentMethods.cod,
        },
        deliveryPartners,
      }

      // Upload helper
      const uploadSingle = async (file: File, folder: string) => {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('folder', folder)
        const res = await api<any>('/api/v1/uploads', { method: 'POST', body: fd as any })
        return res?.url || res?.secure_url || res?.location || res?.path
      }

      // Upload files if selected
      const logoUrl = logoFile ? await uploadSingle(logoFile, 'shops') : undefined
      const bannerUrl = bannerFile ? await uploadSingle(bannerFile, 'shops') : undefined
      const upiQrUrl = paymentMethods.upi.qrCode ? await uploadSingle(paymentMethods.upi.qrCode, 'payments') : undefined

      const payload: any = {
        name: shopName,
        description,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        website: website || undefined,
        contact: { social },
        address: addressPayload,
        categories,
        tags: tagsArr,
        businessHours: bh,
        metadata,
        ...(logoUrl ? { logo: logoUrl } : {}),
        ...(bannerUrl ? { banner: bannerUrl } : {}),
      }

      if (upiQrUrl) {
        payload.metadata = {
          ...payload.metadata,
          payments: {
            ...payload.metadata?.payments,
            upi: {
              id: paymentMethods.upi.id,
              qr: upiQrUrl,
            }
          }
        }
      }

      if (!shopId) {
        const res = await dispatch(createShop(payload) as any)
        if (res.error) throw new Error(res.payload || 'Failed to create shop')
        setSuccess('Shop created')
        setShopId(res.payload?._id || res.payload?.id || null)
      } else {
        const res = await dispatch(updateShop({ id: shopId, payload }) as any)
        if (res.error) throw new Error(res.payload || 'Failed to update shop')
        setSuccess('Shop updated')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save shop')
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (category: string) => {
    setCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]))
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Box>
              <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
                Shop Profile
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your shop details and settings
                {shopLoading ? ' · Loading…' : ''}
              </Typography>
            </Box>
            <Button
              variant="contained"
              type="submit"
              form="shop-form"
              disabled={loading || shopLoading}
              sx={{
                px: 4,
                py: 1.5,
                backgroundColor: "primary.main",
                fontWeight: "bold",
              }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </Box>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}
          {shopError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {String(shopError)}
            </Alert>
          )}

          <Box component="form" id="shop-form" onSubmit={handleSubmit}>
            <div className="grid gap-4 lg:grid-cols-12">
              {/* Left Column */}
              <div className="lg:col-span-8">
                <Stack spacing={4}>
                  {/* Basic Information */}
                  <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Store color="primary" />
                        Basic Information
                      </Typography>
                      <div className="grid gap-3 md:grid-cols-12">
                        <div className="md:col-span-12">
                          <TextField
                            fullWidth
                            label="Shop Name"
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            required
                            placeholder="Enter your shop name"
                          />
                        </div>
                        <div className="md:col-span-12">
                          <TextField
                            fullWidth
                            label="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            multiline
                            rows={4}
                            placeholder="Tell customers about your shop..."
                          />
                        </div>
                        <div className="md:col-span-6">
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Theme Color
                            </Typography>
                            <Box display="flex" alignItems="center" gap={2}>
                              <input
                                type="color"
                                value={themeColor}
                                onChange={(e) => setThemeColor(e.target.value)}
                                style={{
                                  width: 60,
                                  height: 40,
                                  border: "1px solid #e0e0e0",
                                  borderRadius: 8,
                                  cursor: "pointer",
                                }}
                              />
                              <TextField
                                value={themeColor}
                                onChange={(e) => setThemeColor(e.target.value)}
                                size="small"
                                sx={{ flex: 1 }}
                              />
                            </Box>
                          </Box>
                        </div>
                        <div className="md:col-span-6">
                          <TextField
                            fullWidth
                            label="Tags"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="e.g., premium, handmade, organic"
                            helperText="Comma separated tags"
                          />
                        </div>
                      </div>

                      {/* Categories */}
                      <Box mt={3}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Shop Categories
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                          {SHOP_CATEGORIES.map((category) => (
                            <Chip
                              key={category}
                              label={category.charAt(0).toUpperCase() + category.slice(1)}
                              onClick={() => toggleCategory(category)}
                              color={categories.includes(category) ? "primary" : "default"}
                              variant={categories.includes(category) ? "filled" : "outlined"}
                              sx={{ cursor: "pointer" }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Email color="primary" />
                        Contact Information
                      </Typography>
                      <div className="grid gap-3 md:grid-cols-12">
                        <div className="md:col-span-6">
                          <TextField
                            fullWidth
                            label="Contact Email"
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Email color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </div>
                        <div className="md:col-span-6">
                          <TextField
                            fullWidth
                            label="Contact Phone"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Phone color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </div>
                        <div className="md:col-span-12">
                          <TextField
                            fullWidth
                            label="Website"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            placeholder="https://yourwebsite.com"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Language color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </div>
                        <div className="md:col-span-6">
                          <TextField
                            fullWidth
                            label="Facebook"
                            value={social.facebook}
                            onChange={(e) => setSocial((prev) => ({ ...prev, facebook: e.target.value }))}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Facebook color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </div>
                        <div className="md:col-span-6">
                          <TextField
                            fullWidth
                            label="Instagram"
                            value={social.instagram}
                            onChange={(e) => setSocial((prev) => ({ ...prev, instagram: e.target.value }))}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Instagram color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </div>
                        <div className="md:col-span-6">
                          <TextField
                            fullWidth
                            label="Twitter"
                            value={social.twitter}
                            onChange={(e) => setSocial((prev) => ({ ...prev, twitter: e.target.value }))}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Twitter color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </div>
                        <div className="md:col-span-6">
                          <TextField
                            fullWidth
                            label="YouTube"
                            value={social.youtube}
                            onChange={(e) => setSocial((prev) => ({ ...prev, youtube: e.target.value }))}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <YouTube color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Address */}
                  <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LocationOn color="primary" />
                        Shop Address
                      </Typography>
                      <div className="grid gap-3 md:grid-cols-12">
                        <div className="md:col-span-12">
                          <TextField
                            fullWidth
                            label="Street Address"
                            value={address.street}
                            onChange={(e) => setAddress((prev) => ({ ...prev, street: e.target.value }))}
                          />
                        </div>
                        <div className="md:col-span-6">
                          <TextField
                            fullWidth
                            label="City"
                            value={address.city}
                            onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                          />
                        </div>
                        <div className="md:col-span-6">
                          <TextField
                            fullWidth
                            label="State"
                            value={address.state}
                            onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))}
                          />
                        </div>
                        <div className="md:col-span-6">
                          <TextField
                            fullWidth
                            label="Pincode"
                            value={address.pincode}
                            onChange={(e) => setAddress((prev) => ({ ...prev, pincode: e.target.value }))}
                          />
                        </div>
                        <div className="md:col-span-6">
                          <TextField
                            fullWidth
                            label="Country"
                            value={address.country}
                            onChange={(e) => setAddress((prev) => ({ ...prev, country: e.target.value }))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Business Details */}
                  <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <AccountBalance color="primary" />
                        Business Details
                      </Typography>
                      <div className="grid gap-3 md:grid-cols-12">
                        <div className="md:col-span-6">
                          <FormControl fullWidth>
                            <InputLabel>Business Type</InputLabel>
                            <Select
                              value={businessType}
                              label="Business Type"
                              onChange={(e) => setBusinessType(e.target.value)}
                            >
                              <MenuItem value="individual">Individual</MenuItem>
                              <MenuItem value="partnership">Partnership</MenuItem>
                              <MenuItem value="company">Company</MenuItem>
                              <MenuItem value="llp">LLP</MenuItem>
                            </Select>
                          </FormControl>
                        </div>
                        <div className="md:col-span-6">
                          <TextField
                            fullWidth
                            label="GST Number"
                            value={gstNumber}
                            onChange={(e) => setGstNumber(e.target.value)}
                            placeholder="22AAAAA0000A1Z5"
                          />
                        </div>
                        <div className="md:col-span-6">
                          <TextField
                            fullWidth
                            label="PAN Number"
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value)}
                            placeholder="AAAAA0000A"
                          />
                        </div>
                        {/* Logo Upload */}
                        <div className="md:col-span-6">
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Logo
                            </Typography>
                            <Button component="label" variant="outlined" startIcon={<CloudUpload />} fullWidth>
                              Upload Logo
                              <input
                                hidden
                                type="file"
                                accept="image/*"
                                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                              />
                            </Button>
                            {logoFile && <Chip label={logoFile.name} onDelete={() => setLogoFile(null)} sx={{ mt: 1 }} />}
                            {logoPreview && (
                              <Box mt={1}>
                                <img
                                  src={logoPreview}
                                  alt="Logo preview"
                                  style={{ width: "100%", maxHeight: 160, objectFit: "contain", borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)" }}
                                />
                              </Box>
                            )}
                          </Box>
                        </div>

                        {/* Banner Upload */}
                        <div className="md:col-span-6">
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Banner
                            </Typography>
                            <Button component="label" variant="outlined" startIcon={<CloudUpload />} fullWidth>
                              Upload Banner
                              <input
                                hidden
                                type="file"
                                accept="image/*"
                                onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                              />
                            </Button>
                            {bannerFile && (
                              <Chip label={bannerFile.name} onDelete={() => setBannerFile(null)} sx={{ mt: 1 }} />
                            )}
                            {bannerPreview && (
                              <Box mt={1}>
                                <img
                                  src={bannerPreview}
                                  alt="Banner preview"
                                  style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)" }}
                                />
                              </Box>
                            )}
                          </Box>
                        </div>
                        </div>
                      </CardContent>
                      </Card>

                  {/* Payment Methods */}
                  <Accordion elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Payment color="primary" />
                        Payment Methods
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={3}>
                        {/* Razorpay */}
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={paymentMethods.razorpay.enabled}
                                onChange={(e) =>
                                  setPaymentMethods((prev) => ({
                                    ...prev,
                                    razorpay: { ...prev.razorpay, enabled: e.target.checked },
                                  }))
                                }
                              />
                            }
                            label="Razorpay"
                          />
                          {paymentMethods.razorpay.enabled && (
                            <>
                              <TextField
                                fullWidth
                                size="small"
                                label="Razorpay Key ID"
                                value={paymentMethods.razorpay.keyId}
                                onChange={(e) =>
                                  setPaymentMethods((prev) => ({
                                    ...prev,
                                    razorpay: { ...prev.razorpay, keyId: e.target.value },
                                  }))
                                }
                                sx={{ mt: 1 }}
                              />
                              <TextField
                                fullWidth
                                size="small"
                                label="Razorpay Key Secret"
                                type="password"
                                value={paymentMethods.razorpay.keySecret}
                                onChange={(e) =>
                                  setPaymentMethods((prev) => ({
                                    ...prev,
                                    razorpay: { ...prev.razorpay, keySecret: e.target.value },
                                  }))
                                }
                                sx={{ mt: 1 }}
                              />
                            </>
                          )}
                        </Box>

                        {/* Stripe */}
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={paymentMethods.stripe.enabled}
                                onChange={(e) =>
                                  setPaymentMethods((prev) => ({
                                    ...prev,
                                    stripe: { ...prev.stripe, enabled: e.target.checked },
                                  }))
                                }
                              />
                            }
                            label="Stripe"
                          />
                          {paymentMethods.stripe.enabled && (
                            <>
                              <TextField
                                fullWidth
                                size="small"
                                label="Stripe Publishable Key"
                                value={paymentMethods.stripe.publishableKey}
                                onChange={(e) =>
                                  setPaymentMethods((prev) => ({
                                    ...prev,
                                    stripe: { ...prev.stripe, publishableKey: e.target.value },
                                  }))
                                }
                                sx={{ mt: 1 }}
                              />
                              <TextField
                                fullWidth
                                size="small"
                                label="Stripe Secret Key"
                                type="password"
                                value={paymentMethods.stripe.secretKey}
                                onChange={(e) =>
                                  setPaymentMethods((prev) => ({
                                    ...prev,
                                    stripe: { ...prev.stripe, secretKey: e.target.value },
                                  }))
                                }
                                sx={{ mt: 1 }}
                              />
                            </>
                          )}
                        </Box>

                        {/* PayU */}
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={paymentMethods.payu.enabled}
                                onChange={(e) =>
                                  setPaymentMethods((prev) => ({
                                    ...prev,
                                    payu: { ...prev.payu, enabled: e.target.checked },
                                  }))
                                }
                              />
                            }
                            label="PayU"
                          />
                          {paymentMethods.payu.enabled && (
                            <>
                              <TextField
                                fullWidth
                                size="small"
                                label="PayU Merchant Key"
                                value={paymentMethods.payu.merchantKey}
                                onChange={(e) =>
                                  setPaymentMethods((prev) => ({
                                    ...prev,
                                    payu: { ...prev.payu, merchantKey: e.target.value },
                                  }))
                                }
                                sx={{ mt: 1 }}
                              />
                              <TextField
                                fullWidth
                                size="small"
                                label="PayU Merchant Salt"
                                type="password"
                                value={paymentMethods.payu.merchantSalt}
                                onChange={(e) =>
                                  setPaymentMethods((prev) => ({
                                    ...prev,
                                    payu: { ...prev.payu, merchantSalt: e.target.value },
                                  }))
                                }
                                sx={{ mt: 1 }}
                              />
                            </>
                          )}
                        </Box>

                        {/* PhonePe */}
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={paymentMethods.phonepe.enabled}
                                onChange={(e) =>
                                  setPaymentMethods((prev) => ({
                                    ...prev,
                                    phonepe: { ...prev.phonepe, enabled: e.target.checked },
                                  }))
                                }
                              />
                            }
                            label="PhonePe"
                          />
                          {paymentMethods.phonepe.enabled && (
                            <>
                              <TextField
                                fullWidth
                                size="small"
                                label="PhonePe Merchant ID"
                                value={paymentMethods.phonepe.merchantId}
                                onChange={(e) =>
                                  setPaymentMethods((prev) => ({
                                    ...prev,
                                    phonepe: { ...prev.phonepe, merchantId: e.target.value },
                                  }))
                                }
                                sx={{ mt: 1 }}
                              />
                              <TextField
                                fullWidth
                                size="small"
                                label="PhonePe Salt Key"
                                type="password"
                                value={paymentMethods.phonepe.saltKey}
                                onChange={(e) =>
                                  setPaymentMethods((prev) => ({
                                    ...prev,
                                    phonepe: { ...prev.phonepe, saltKey: e.target.value },
                                  }))
                                }
                                sx={{ mt: 1 }}
                              />
                              <TextField
                                fullWidth
                                size="small"
                                label="PhonePe Salt Index"
                                value={paymentMethods.phonepe.saltIndex}
                                onChange={(e) =>
                                  setPaymentMethods((prev) => ({
                                    ...prev,
                                    phonepe: { ...prev.phonepe, saltIndex: e.target.value },
                                  }))
                                }
                                sx={{ mt: 1 }}
                              />
                            </>
                          )}
                        </Box>

                        {/* UPI */}
                        <Box>
                          <Typography variant="body2" fontWeight="medium" gutterBottom>
                            UPI Payment
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            label="UPI ID"
                            value={paymentMethods.upi.id}
                            onChange={(e) =>
                              setPaymentMethods((prev) => ({
                                ...prev,
                                upi: { ...prev.upi, id: e.target.value },
                              }))
                            }
                            placeholder="yourname@bank"
                            sx={{ mb: 1 }}
                          />
                          <Button component="label" variant="outlined" startIcon={<QrCode />} size="small" fullWidth>
                            Upload QR Code
                            <input
                              hidden
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                setPaymentMethods((prev) => ({
                                  ...prev,
                                  upi: { ...prev.upi, qrCode: e.target.files?.[0] || null },
                                }))
                              }
                            />
                          </Button>
                          {upiQrPreview && (
                            <Box mt={1}>
                              <img
                                src={upiQrPreview}
                                alt="UPI QR preview"
                                style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)" }}
                              />
                            </Box>
                          )}
                        </Box>

                        {/* Cash on Delivery */}
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={paymentMethods.cod.enabled}
                                onChange={(e) =>
                                  setPaymentMethods((prev) => ({
                                    ...prev,
                                    cod: { ...prev.cod, enabled: e.target.checked },
                                  }))
                                }
                              />
                            }
                            label="Cash on Delivery"
                          />
                          {paymentMethods.cod.enabled && (
                            <TextField
                              fullWidth
                              size="small"
                              label="Minimum Order Amount"
                              type="number"
                              value={paymentMethods.cod.minOrder}
                              onChange={(e) =>
                                setPaymentMethods((prev) => ({
                                  ...prev,
                                  cod: { ...prev.cod, minOrder: Number(e.target.value) },
                                }))
                              }
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Box>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>

                  {/* Delivery Partners */}
                  <Accordion elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LocalShipping color="primary" />
                        Delivery Partners
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={3}>
                        {/* Shiprocket */}
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={deliveryPartners.shiprocket.enabled}
                                onChange={(e) =>
                                  setDeliveryPartners((prev) => ({
                                    ...prev,
                                    shiprocket: { ...prev.shiprocket, enabled: e.target.checked },
                                  }))
                                }
                              />
                            }
                            label="Shiprocket"
                          />
                          {deliveryPartners.shiprocket.enabled && (
                            <>
                              <TextField
                                fullWidth
                                size="small"
                                label="Email"
                                value={deliveryPartners.shiprocket.email}
                                onChange={(e) =>
                                  setDeliveryPartners((prev) => ({
                                    ...prev,
                                    shiprocket: { ...prev.shiprocket, email: e.target.value },
                                  }))
                                }
                                sx={{ mt: 1 }}
                              />
                              <TextField
                                fullWidth
                                size="small"
                                label="Password"
                                type="password"
                                value={deliveryPartners.shiprocket.password}
                                onChange={(e) =>
                                  setDeliveryPartners((prev) => ({
                                    ...prev,
                                    shiprocket: { ...prev.shiprocket, password: e.target.value },
                                  }))
                                }
                                sx={{ mt: 1 }}
                              />
                              <TextField
                                fullWidth
                                size="small"
                                label="API Key (optional)"
                                value={deliveryPartners.shiprocket.apiKey}
                                onChange={(e) =>
                                  setDeliveryPartners((prev) => ({
                                    ...prev,
                                    shiprocket: { ...prev.shiprocket, apiKey: e.target.value },
                                  }))
                                }
                                sx={{ mt: 1 }}
                              />
                            </>
                          )}
                        </Box>

                        {/* Delhivery */}
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={deliveryPartners.delhivery.enabled}
                                onChange={(e) =>
                                  setDeliveryPartners((prev) => ({
                                    ...prev,
                                    delhivery: { ...prev.delhivery, enabled: e.target.checked },
                                  }))
                                }
                              />
                            }
                            label="Delhivery"
                          />
                          {deliveryPartners.delhivery.enabled && (
                            <TextField
                              fullWidth
                              size="small"
                              label="API Token"
                              value={deliveryPartners.delhivery.token}
                              onChange={(e) =>
                                setDeliveryPartners((prev) => ({
                                  ...prev,
                                  delhivery: { ...prev.delhivery, token: e.target.value },
                                }))
                              }
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Box>

                        {/* BlueDart */}
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={deliveryPartners.bluedart.enabled}
                                onChange={(e) =>
                                  setDeliveryPartners((prev) => ({
                                    ...prev,
                                    bluedart: { ...prev.bluedart, enabled: e.target.checked },
                                  }))
                                }
                              />
                            }
                            label="Blue Dart"
                          />
                          {deliveryPartners.bluedart.enabled && (
                            <>
                              <TextField
                                fullWidth
                                size="small"
                                label="License Key"
                                value={deliveryPartners.bluedart.licenseKey}
                                onChange={(e) =>
                                  setDeliveryPartners((prev) => ({
                                    ...prev,
                                    bluedart: { ...prev.bluedart, licenseKey: e.target.value },
                                  }))
                                }
                                sx={{ mt: 1 }}
                              />
                              <TextField
                                fullWidth
                                size="small"
                                label="Login ID"
                                value={deliveryPartners.bluedart.loginId}
                                onChange={(e) =>
                                  setDeliveryPartners((prev) => ({
                                    ...prev,
                                    bluedart: { ...prev.bluedart, loginId: e.target.value },
                                  }))
                                }
                                sx={{ mt: 1 }}
                              />
                            </>
                          )}
                        </Box>

                        {/* FedEx */}
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={deliveryPartners.fedex.enabled}
                                onChange={(e) =>
                                  setDeliveryPartners((prev) => ({
                                    ...prev,
                                    fedex: { ...prev.fedex, enabled: e.target.checked },
                                  }))
                                }
                              />
                            }
                            label="FedEx"
                          />
                          {deliveryPartners.fedex.enabled && (
                            <>
                              <TextField
                                fullWidth
                                size="small"
                                label="Client ID"
                                value={deliveryPartners.fedex.clientId}
                                onChange={(e) =>
                                  setDeliveryPartners((prev) => ({
                                    ...prev,
                                    fedex: { ...prev.fedex, clientId: e.target.value },
                                  }))
                                }
                                sx={{ mt: 1 }}
                              />
                              <TextField
                                fullWidth
                                size="small"
                                label="Client Secret"
                                type="password"
                                value={deliveryPartners.fedex.clientSecret}
                                onChange={(e) =>
                                  setDeliveryPartners((prev) => ({
                                    ...prev,
                                    fedex: { ...prev.fedex, clientSecret: e.target.value },
                                  }))
                                }
                                sx={{ mt: 1 }}
                              />
                              <TextField
                                fullWidth
                                size="small"
                                label="Account Number"
                                value={deliveryPartners.fedex.accountNumber}
                                onChange={(e) =>
                                  setDeliveryPartners((prev) => ({
                                    ...prev,
                                    fedex: { ...prev.fedex, accountNumber: e.target.value },
                                  }))
                                }
                                sx={{ mt: 1 }}
                              />
                            </>
                          )}
                        </Box>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </Stack>
                </div>
              </div>
            {/* Action Buttons */}
            <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
              <Button variant="outlined" disabled={loading || shopLoading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || shopLoading}
                sx={{
                  px: 4,
                  backgroundColor: "primary.main",
                  fontWeight: "bold",
                }}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
