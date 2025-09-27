"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
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
  IconButton,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Container,
} from "@mui/material"
import {
  Add,
  Delete,
  CloudUpload,
  ExpandMore,
  Inventory,
  AttachMoney,
  Category,
  LocalOffer,
  Image,
  Palette,
  Description,
} from "@mui/icons-material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import dayjs from "dayjs"
import ClassicEditor from "@ckeditor/ckeditor5-build-classic"
import { CKEditor } from "@ckeditor/ckeditor5-react"
import { CouponsAPI, ProductAPI, TaxesAPI, type CouponDTO, type TaxDTO } from "@/lib/api"
import { useAppSelector, useAppDispatch } from "@/store"
import { fetchMyShop } from "@/store/slice/shopSlice"
import { fetchBrands } from "@/store/slice/brandSlice"
import { fetchCategories } from "@/store/slice/categorySlice"
import { fetchTags } from "@/store/slice/tagSlice"

const CURRENCIES = ["INR", "USD", "EUR", "GBP"]
const PRODUCT_STATUS = ["draft", "active", "archived"]
const DISCOUNT_TYPES = ["percent", "fixed"]

// Data from Redux store
// Brands, Categories, Tags are fetched per shop and selected from store

export default function EnhancedProductForm() {
  const router = useRouter()
  const shop = useAppSelector((s: any) => s.shop?.shop)
  const shopId = shop?._id || shop?.id || shop?.shop?._id || ""
  const dispatch = useAppDispatch()
  const brands = useAppSelector((s: any) => s.brands?.items || [])
  const categories = useAppSelector((s: any) => s.categories?.items || [])
  const tags = useAppSelector((s: any) => s.tags?.items || [])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Basic product fields
  const [title, setTitle] = useState("")
  const [sku, setSku] = useState("")
  const [price, setPrice] = useState<number>(0)
  const [mrp, setMrp] = useState<number | "">("")
  const [currency, setCurrency] = useState("INR")
  const [taxRate, setTaxRate] = useState<number | "">("")
  const [stock, setStock] = useState<number>(0)
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<"draft" | "active" | "archived">("active")
  const [brandId, setBrandId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [tagIds, setTagIds] = useState<string[]>([])

  // Enhanced fields for better e-commerce
  const [weight, setWeight] = useState<number | "">("")
  const [dimensions, setDimensions] = useState({
    length: "",
    width: "",
    height: "",
  })
  const [color, setColor] = useState("")
  const [size, setSize] = useState("")
  const [material, setMaterial] = useState("")
  const [warranty, setWarranty] = useState("")
  const [returnPolicy, setReturnPolicy] = useState("")
  const [shippingInfo, setShippingInfo] = useState("")

  // Images
  const [mainFile, setMainFile] = useState<File | null>(null)
  const [gallery, setGallery] = useState<File[]>([])

  // Variants
  const [variants, setVariants] = useState<
    Array<{
      sku?: string
      price: number
      stock?: number
      color?: string
      size?: string
    }>
  >([])

  // Discount
  const [applyDiscount, setApplyDiscount] = useState(false)
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent")
  const [discountValue, setDiscountValue] = useState<number | "">("")
  const [discountExpiry, setDiscountExpiry] = useState<any | null>(null)
  const [usageLimit, setUsageLimit] = useState<number | "">("")

  // Tax and Coupon
  const [taxes, setTaxes] = useState<TaxDTO[]>([])
  const [coupons, setCoupons] = useState<CouponDTO[]>([])
  const [selectedCouponId, setSelectedCouponId] = useState<string>("")

  // Files and previews
  const [mainPreview, setMainPreview] = useState<string | null>(null)
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])

  // Variant files and previews parallel to variants
  const [variantFiles, setVariantFiles] = useState<(File[] | undefined)[]>([])
  const [variantPreviews, setVariantPreviews] = useState<string[][]>([])

  // Product type and dynamic attributes per category
  const [productType, setProductType] = useState<string>("")
  const [attributes, setAttributes] = useState<Record<string, any>>({})

  const canSave = title.trim().length > 1 && price > 0 && !loading

  const addVariant = () => {
    setVariants((v) => [...v, { sku: "", price: 0, stock: 0, color: "", size: "" }])
    setVariantFiles((vf) => [...vf, undefined])
    setVariantPreviews((vp) => [...vp, []])
  }

  const updateVariant = (i: number, patch: Partial<(typeof variants)[0]>) => {
    setVariants((v) => v.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
  }

  const removeVariant = (i: number) => {
    setVariants((v) => v.filter((_, idx) => idx !== i))
    setVariantFiles((vf) => vf.filter((_, idx) => idx !== i))
    setVariantPreviews((vp) => vp.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return

    setLoading(true)
    setError(null)

    try {
      const variantsPayload = variants.map((v) => ({
        sku: v.sku || undefined,
        price: v.price,
        stock: v.stock ?? 0,
        attributes: {
          ...(v.color ? { color: v.color } : {}),
          ...(v.size ? { size: v.size } : {}),
        },
      }))

      const discount = applyDiscount && discountValue !== "" ? {
        type: discountType,
        value: Number(discountValue),
        expiry: discountExpiry ? dayjs(discountExpiry).toISOString() : undefined,
        usageLimit: usageLimit === "" ? undefined : Number(usageLimit),
      } : undefined

      const resp = await ProductAPI.createMultipart({
        shopId,
        title,
        sku,
        description,
        price,
        mrp: mrp === "" ? undefined : Number(mrp),
        currency,
        taxRate: taxRate === "" ? undefined : Number(taxRate),
        stock,
        brandId: brandId || undefined,
        categoryId: categoryId || undefined,
        tagIds: tagIds.length ? tagIds : undefined,
        attributes: { ...attributes, productType },
        variants: variantsPayload,
        status,
        mainFile,
        galleryFiles: gallery,
        variantFiles,
        discount,
      })
      if (resp?.success) {
        setSuccess("Product created successfully!")
        setTimeout(() => router.push("/seller/products"), 1500)
      } else {
        setError("Failed to create product. Please try again.")
      }
    } catch (err: any) {
      setError("Failed to create product. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Ensure we have current shop loaded; required to fetch shop-scoped taxes/coupons
  useEffect(() => {
    if (!shopId) {
      dispatch(fetchMyShop())
    }
  }, [shopId, dispatch])

  // Load brands, categories, tags when shop is available
  useEffect(() => {
    if (!shopId) return
    dispatch(fetchBrands(shopId))
    dispatch(fetchCategories(shopId))
    dispatch(fetchTags(shopId))
  }, [shopId, dispatch])

  // Load taxes and coupons for current shop
  useEffect(() => {
    if (!shopId) return
    ;(async () => {
      try {
        const [t, c] = await Promise.all([
          TaxesAPI.list(shopId),
          CouponsAPI.list(shopId),
        ])
        setTaxes(t.taxes || [])
        setCoupons(c.coupons || [])
      } catch (e) {
        console.warn("Failed to load taxes/coupons", e)
      }
    })()
  }, [shopId])

  // Coupon mapping: when user selects a coupon, apply to discount UI
  useEffect(() => {
    const coupon = coupons.find((x) => x._id === selectedCouponId)
    if (coupon) {
      setApplyDiscount(true)
      setDiscountType(coupon.type)
      setDiscountValue(coupon.value)
      setDiscountExpiry(coupon.expiry ? dayjs(coupon.expiry) : null)
      setUsageLimit(coupon.usageLimit ?? "")
    }
  }, [selectedCouponId, coupons])

  // Previews for main and gallery
  useEffect(() => {
    if (mainFile) setMainPreview(URL.createObjectURL(mainFile))
    else setMainPreview(null)
    return () => { if (mainPreview) URL.revokeObjectURL(mainPreview) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainFile])
  useEffect(() => {
    const urls = gallery.map((f) => URL.createObjectURL(f))
    setGalleryPreviews(urls)
    return () => { urls.forEach((u) => URL.revokeObjectURL(u)) }
  }, [gallery])

  const handleVariantFiles = (i: number, files: FileList | null) => {
    const arr = files ? Array.from(files) : []
    setVariantFiles((prev) => {
      const next = [...prev]
      next[i] = arr
      return next
    })
    const urls = arr.map((f) => URL.createObjectURL(f))
    setVariantPreviews((prev) => {
      const next = [...prev]
      next[i] = urls
      return next
    })
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
                  Create New Product
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Add a new product to your inventory
                </Typography>
              </Box>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!canSave}
                sx={{
                  px: 4,
                  py: 1.5,
                  backgroundColor: "primary.main",
                  fontWeight: "bold",
                }}
              >
                {loading ? "Creating..." : "Create Product"}
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

            <Box component="form" onSubmit={handleSubmit}>
              <div className="grid gap-4 lg:grid-cols-12">
                {/* Left Column - Basic Information */}
                <div className="lg:col-span-8">
                  <Stack spacing={4}>
                    {/* Basic Details */}
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Description color="primary" />
                          Basic Information
                        </Typography>
                        <div className="grid gap-3 md:grid-cols-12">
                          <div className="md:col-span-12">
                            <TextField
                              fullWidth
                              label="Product Title"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              required
                              placeholder="Enter product title"
                            />
                          </div>
                          <div className="md:col-span-6">
                            <TextField
                              fullWidth
                              label="SKU (Optional)"
                              value={sku}
                              onChange={(e) => setSku(e.target.value)}
                              placeholder="Product SKU"
                            />
                          </div>
                          <div className="md:col-span-6">
                            <FormControl fullWidth>
                              <InputLabel>Status</InputLabel>
                              <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value as any)}>
                                {PRODUCT_STATUS.map((s) => (
                                  <MenuItem key={s} value={s}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </div>
                          <div className="md:col-span-12">
                            <Typography variant="subtitle1" gutterBottom>
                              Description
                            </Typography>
                            <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1 }}>
                              <CKEditor
                                editor={ClassicEditor as any}
                                data={description}
                                onChange={(_evt: any, editor: any) => {
                                  const data = editor.getData?.() || ""
                                  setDescription(data)
                                }}
                              />
                            </Box>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pricing & Inventory */}
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <AttachMoney color="primary" />
                          Pricing & Inventory
                        </Typography>
                        <div className="grid gap-3 md:grid-cols-12">
                          <div className="md:col-span-4">
                            <TextField
                              fullWidth
                              label="Price"
                              type="number"
                              value={price}
                              onChange={(e) => setPrice(Number(e.target.value))}
                              required
                              InputProps={{
                                startAdornment: currency === "INR" ? "₹" : "$",
                              }}
                            />
                          </div>
                          <div className="md:col-span-4">
                            <TextField
                              fullWidth
                              label="MRP (Optional)"
                              type="number"
                              value={mrp}
                              onChange={(e) => setMrp(e.target.value === "" ? "" : Number(e.target.value))}
                              InputProps={{
                                startAdornment: currency === "INR" ? "₹" : "$",
                              }}
                            />
                          </div>
                          <div className="md:col-span-4">
                            <FormControl fullWidth>
                              <InputLabel>Currency</InputLabel>
                              <Select value={currency} label="Currency" onChange={(e) => setCurrency(e.target.value)}>
                                {CURRENCIES.map((c) => (
                                  <MenuItem key={c} value={c}>
                                    {c}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </div>
                          <div className="md:col-span-6">
                            <TextField
                              fullWidth
                              label="Stock Quantity"
                              type="number"
                              value={stock}
                              onChange={(e) => setStock(Number(e.target.value))}
                              InputProps={{
                                startAdornment: <Inventory color="action" />,
                              }}
                            />
                          </div>
                          <div className="md:col-span-6">
                            <TextField
                              fullWidth
                              label="Tax Rate (%)"
                              type="number"
                              value={taxRate}
                              onChange={(e) => setTaxRate(e.target.value === "" ? "" : Number(e.target.value))}
                            />
                          </div>
                          <div className="md:col-span-6">
                            <FormControl fullWidth>
                              <InputLabel>Tax</InputLabel>
                              <Select
                                value={taxRate === "" ? "" : String(taxRate)}
                                label="Tax"
                                onChange={(e) => setTaxRate(e.target.value === "" ? "" : Number(e.target.value))}
                              >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {taxes.map((t) => (
                                  <MenuItem key={t._id} value={String(t.percent)}>
                                    {t.name} — {t.percent}%
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Product Details */}
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Palette color="primary" />
                          Product Details
                        </Typography>
                        <div className="grid gap-3 md:grid-cols-12">
                          <div className="md:col-span-6">
                            <TextField
                              fullWidth
                              label="Color"
                              value={color}
                              onChange={(e) => setColor(e.target.value)}
                              placeholder="e.g., Red, Blue, Black"
                            />
                          </div>
                          <div className="md:col-span-6">
                            <TextField
                              fullWidth
                              label="Size"
                              value={size}
                              onChange={(e) => setSize(e.target.value)}
                              placeholder="e.g., S, M, L, XL"
                            />
                          </div>
                          <div className="md:col-span-6">
                            <TextField
                              fullWidth
                              label="Material"
                              value={material}
                              onChange={(e) => setMaterial(e.target.value)}
                              placeholder="e.g., Cotton, Polyester"
                            />
                          </div>
                          <div className="md:col-span-6">
                            <TextField
                              fullWidth
                              label="Weight (kg)"
                              type="number"
                              value={weight}
                              onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                            />
                          </div>
                          <div className="md:col-span-4">
                            <TextField
                              fullWidth
                              label="Length (cm)"
                              value={dimensions.length}
                              onChange={(e) => setDimensions((prev) => ({ ...prev, length: e.target.value }))}
                            />
                          </div>
                          <div className="md:col-span-4">
                            <TextField
                              fullWidth
                              label="Width (cm)"
                              value={dimensions.width}
                              onChange={(e) => setDimensions((prev) => ({ ...prev, width: e.target.value }))}
                            />
                          </div>
                          <div className="md:col-span-4">
                            <TextField
                              fullWidth
                              label="Height (cm)"
                              value={dimensions.height}
                              onChange={(e) => setDimensions((prev) => ({ ...prev, height: e.target.value }))}
                            />
                          </div>
                          <div className="md:col-span-6">
                            <TextField
                              fullWidth
                              label="Warranty"
                              value={warranty}
                              onChange={(e) => setWarranty(e.target.value)}
                              placeholder="e.g., 1 year manufacturer warranty"
                            />
                          </div>
                          <div className="md:col-span-6">
                            <TextField
                              fullWidth
                              label="Return Policy"
                              value={returnPolicy}
                              onChange={(e) => setReturnPolicy(e.target.value)}
                              placeholder="e.g., 30 days return policy"
                            />
                          </div>
                          <div className="md:col-span-12">
                            <TextField
                              fullWidth
                              label="Shipping Information"
                              value={shippingInfo}
                              onChange={(e) => setShippingInfo(e.target.value)}
                              placeholder="Special shipping instructions..."
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Product Variants */}
                    <Accordion elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Category color="primary" />
                          Product Variants ({variants.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          {variants.map((variant, i) => (
                            <Card key={i} variant="outlined">
                              <CardContent>
                                <div className="grid gap-2 md:grid-cols-12 items-center">
                                  <div className="md:col-span-2">
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="SKU"
                                      value={variant.sku || ""}
                                      onChange={(e) => updateVariant(i, { sku: e.target.value })}
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="Price"
                                      type="number"
                                      value={variant.price}
                                      onChange={(e) => updateVariant(i, { price: Number(e.target.value) })}
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="Stock"
                                      type="number"
                                      value={variant.stock ?? 0}
                                      onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="Color"
                                      value={variant.color || ""}
                                      onChange={(e) => updateVariant(i, { color: e.target.value })}
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="Size"
                                      value={variant.size || ""}
                                      onChange={(e) => updateVariant(i, { size: e.target.value })}
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <IconButton color="error" onClick={() => removeVariant(i)}>
                                      <Delete />
                                    </IconButton>
                                  </div>
                                  <div className="md:col-span-12">
                                    <Button component="label" variant="outlined" startIcon={<CloudUpload />} size="small">
                                      Upload Variant Images
                                      <input
                                        hidden
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => handleVariantFiles(i, e.target.files)}
                                      />
                                    </Button>
                                    {variantPreviews[i] && variantPreviews[i].length > 0 && (
                                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                                        {variantPreviews[i].map((src, idx) => (
                                          <img key={idx} src={src} alt={`Var ${i + 1}-${idx + 1}`} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6 }} />
                                        ))}
                                      </Box>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={addVariant}
                            sx={{ alignSelf: "flex-start" }}
                          >
                            Add Variant
                          </Button>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  </Stack>
                </div>

                {/* Right Column - Categories, Images, Discount */}
                <div className="lg:col-span-4">
                  <Stack spacing={4}>
                    {/* Categories & Tags */}
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <LocalOffer color="primary" />
                          Categories & Tags
                        </Typography>
                        <Stack spacing={3}>
                          <FormControl fullWidth>
                            <InputLabel>Brand</InputLabel>
                            <Select value={brandId} label="Brand" onChange={(e) => setBrandId(e.target.value)}>
                              <MenuItem value="">
                                <em>None</em>
                              </MenuItem>
                              {brands.map((b: any) => (
                                <MenuItem key={b._id} value={b._id}>
                                  {b.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <FormControl fullWidth>
                            <InputLabel>Category</InputLabel>
                            <Select value={categoryId} label="Category" onChange={(e) => setCategoryId(e.target.value)}>
                              <MenuItem value="">
                                <em>None</em>
                              </MenuItem>
                              {categories.map((c: any) => (
                                <MenuItem key={c._id} value={c._id}>
                                  {c.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <FormControl fullWidth>
                            <InputLabel>Tags</InputLabel>
                            <Select
                              multiple
                              value={tagIds}
                              label="Tags"
                              onChange={(e) =>
                                setTagIds(
                                  typeof e.target.value === "string"
                                    ? e.target.value.split(",")
                                    : (e.target.value as string[]),
                                )
                              }
                              renderValue={(selected) => (
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                  {(selected as string[]).map((id) => {
                                    const tag = tags.find((t: any) => t._id === id)
                                    return <Chip key={id} label={tag?.name || id} size="small" />
                                  })}
                                </Box>
                              )}
                            >
                              {tags.map((t: any) => (
                                <MenuItem key={t._id} value={t._id}>
                                  {t.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Images */}
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Image color="primary" />
                          Product Images
                        </Typography>
                        <Stack spacing={2}>
                          <Button component="label" variant="outlined" startIcon={<CloudUpload />} fullWidth>
                            Upload Main Image
                            <input
                              hidden
                              type="file"
                              accept="image/*"
                              onChange={(e) => setMainFile(e.target.files?.[0] || null)}
                            />
                          </Button>
                          {mainFile && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                              <img src={mainPreview || ""} alt="Main" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} />
                              <Chip label={mainFile.name} onDelete={() => setMainFile(null)} color="primary" variant="outlined" />
                            </Box>
                          )}

                          <Button component="label" variant="outlined" startIcon={<CloudUpload />} fullWidth>
                            Upload Gallery Images
                            <input
                              hidden
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => setGallery(Array.from(e.target.files || []))}
                            />
                          </Button>
                          {gallery.length > 0 && (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                              {galleryPreviews.map((src, i) => (
                                <img key={i} src={src} alt={`Gallery ${i + 1}`} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6 }} />
                              ))}
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Discount */}
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Discount Settings
                        </Typography>
                        <Stack spacing={2}>
                          <FormControlLabel
                            control={
                              <Switch checked={applyDiscount} onChange={(e) => setApplyDiscount(e.target.checked)} />
                            }
                            label="Apply Discount"
                          />

                          {applyDiscount && (
                            <>
                              <FormControl fullWidth>
                                <InputLabel>Discount Type</InputLabel>
                                <Select
                                  value={discountType}
                                  label="Discount Type"
                                  onChange={(e) => setDiscountType(e.target.value as any)}
                                >
                                  <MenuItem value="percent">Percentage</MenuItem>
                                  <MenuItem value="fixed">Fixed Amount</MenuItem>
                                </Select>
                              </FormControl>

                              <TextField
                                fullWidth
                                label={discountType === "percent" ? "Discount (%)" : "Discount Amount"}
                                type="number"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value === "" ? "" : Number(e.target.value))}
                              />

                              <TextField
                                fullWidth
                                label="Usage Limit"
                                type="number"
                                value={usageLimit}
                                onChange={(e) => setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))}
                                placeholder="Leave empty for unlimited"
                              />

                              <DatePicker
                                label="Expiry Date"
                                value={discountExpiry}
                                onChange={(date) => setDiscountExpiry(date)}
                                minDate={dayjs()}
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                    placeholder: "Select expiry date",
                                  },
                                }}
                              />
                            </>
                          )}

                          {/* Coupon quick apply */}
                          <FormControl fullWidth>
                            <InputLabel>Apply Coupon</InputLabel>
                            <Select
                              value={selectedCouponId}
                              label="Apply Coupon"
                              onChange={(e) => setSelectedCouponId(e.target.value)}
                            >
                              <MenuItem value=""><em>None</em></MenuItem>
                              {coupons.map((c) => (
                                <MenuItem key={c._id} value={c._id!}>
                                  {c.code} — {c.type === "percent" ? `${c.value}%` : `₹${c.value}`}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                </div>
              </div>

              {/* Action Buttons */}
              <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
                <Button variant="outlined" onClick={() => router.back()} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!canSave}
                  sx={{
                    px: 4,
                    backgroundColor: "primary.main",
                    fontWeight: "bold",
                  }}
                >
                  {loading ? "Creating..." : "Create Product"}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </LocalizationProvider>
  )
}
