"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
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
import Grid from "@mui/material/Grid"
import {
  Add,
  Delete,
  CloudUpload,
  ExpandMore,
  Inventory,
  AttachMoney,
  Category as CategoryIcon,
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
import { CouponsAPI, ProductAPI, TaxesAPI, type CouponDTO, type ProductDTO, type TaxDTO } from "@/lib/api"
import { useAppSelector, useAppDispatch } from "@/store"
import { fetchMyShop } from "@/store/slice/shopSlice"
import { fetchBrands } from "@/store/slice/brandSlice"
import { fetchCategories } from "@/store/slice/categorySlice"
import { fetchTags } from "@/store/slice/tagSlice"

const CURRENCIES = ["INR", "USD", "EUR", "GBP"]
const PRODUCT_STATUS = ["draft", "active", "archived"]
const DISCOUNT_TYPES = ["percent", "fixed"]

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams() as { id?: string }
  const productId = params?.id || ""

  const shop = useAppSelector((s: any) => s.shop?.shop)
  const storeShopId = shop?._id || shop?.id || shop?.shop?._id || ""
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

  // Enhanced fields
  const [weight, setWeight] = useState<number | "">("")
  const [dimensions, setDimensions] = useState({ length: "", width: "", height: "" })
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
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([])

  // Variants files & previews
  const [variantFiles, setVariantFiles] = useState<(File[] | undefined)[]>([])
  const [variantPreviews, setVariantPreviews] = useState<string[][]>([])

  // Dynamic attributes
  const [productType, setProductType] = useState<string>("")
  const [attributes, setAttributes] = useState<Record<string, any>>({})

  const shopId = storeShopId // prefer store shop id
  const canSave = title.trim().length > 1 && price > 0 && !loading

  // Load product details for edit
  useEffect(() => {
    if (!productId) return
    ;(async () => {
      try {
        const resp = await ProductAPI.get(productId)
        const p = resp?.product as any as ProductDTO
        if (!p) return
        setTitle(p.title || "")
        setSku(p.sku || "")
        setPrice(p.price || 0)
        setMrp(p.mrp ?? "")
        setCurrency(p.currency || "INR")
        setTaxRate(p.taxRate ?? "")
        setStock(p.stock || 0)
        setDescription(p.description || "")
        setStatus((p.status as any) || "active")
        setBrandId((p as any).brandId || "")
        setCategoryId((p as any).categoryId || "")
        setTagIds(((p as any).tagIds as string[]) || [])
        setAttributes(p.attributes || {})
        setProductType((p.attributes as any)?.productType || "")
        // Initialize previews from existing images
        setMainPreview((p as any).mainImage || null)
        setExistingGalleryUrls(Array.isArray(p.images) ? (p.images as string[]) : [])
        setVariants(
          (p.variants || []).map((v: any) => ({
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            color: v.attributes?.color,
            size: v.attributes?.size,
          }))
        )
        // discount
        const d = (p as any).discount
        if (d?.type && d?.value !== undefined) {
          setApplyDiscount(true)
          setDiscountType(d.type)
          setDiscountValue(d.value)
          setDiscountExpiry(d.expiry ? dayjs(d.expiry) : null)
          setUsageLimit(d.usageLimit ?? "")
        }
      } catch (e) {
        console.warn("Failed to load product", e)
      }
    })()
  }, [productId])

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

      const payload: Partial<ProductDTO> & { discount?: any; variants?: any[] } = {
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
        // images update not handled here; separate endpoint if needed
        discount,
      }

      // Choose multipart update when any files are provided
      const hasFiles = !!mainFile || (gallery && gallery.length > 0) || (variantFiles && variantFiles.some((x) => x && x.length))
      const resp = hasFiles
        ? await ProductAPI.updateMultipart(productId, {
            ...payload,
            mainFile: mainFile || undefined,
            galleryFiles: gallery,
            variantFiles,
          })
        : await ProductAPI.update(productId, payload)
      if (resp?.success) {
        setSuccess("Product updated successfully!")
        setTimeout(() => router.push("/seller/products"), 1200)
      } else {
        setError("Failed to update product. Please try again.")
      }
    } catch (err: any) {
      setError("Failed to update product. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Ensure we have current shop loaded; then fetch dictionaries
  useEffect(() => {
    if (!storeShopId) dispatch(fetchMyShop())
  }, [storeShopId, dispatch])

  useEffect(() => {
    const sid = storeShopId
    if (!sid) return
    dispatch(fetchBrands(sid))
    dispatch(fetchCategories(sid))
    dispatch(fetchTags(sid))
  }, [storeShopId, dispatch])

  // Load taxes and coupons for current shop
  useEffect(() => {
    const sid = storeShopId
    if (!sid) return
    ;(async () => {
      try {
        const [t, c] = await Promise.all([
          TaxesAPI.list(sid),
          CouponsAPI.list(sid),
        ])
        setTaxes(t.taxes || [])
        setCoupons(c.coupons || [])
      } catch (e) {
        console.warn("Failed to load taxes/coupons", e)
      }
    })()
  }, [storeShopId])

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
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa", py: 4 }}>
        <Container maxWidth="xl">
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid", borderColor: "divider", backgroundColor: "background.paper", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
                  Edit Product
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Update product details
                </Typography>
              </Box>
              <Button variant="contained" onClick={handleSubmit} disabled={!canSave} sx={{ px: 4, py: 1.5, backgroundColor: "primary.main", fontWeight: "bold" }}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </Box>

            {error && (<Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>)}
            {success && (<Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>)}

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={4}>
                <Grid item xs={12} lg={8}>
                  <Stack spacing={4}>
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Description color="primary" />
                          Basic Information
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid item xs={12}>
                            <TextField fullWidth label="Product Title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Enter product title" />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField fullWidth label="SKU (Optional)" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Product SKU" />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                              <InputLabel>Status</InputLabel>
                              <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value as any)}>
                                {PRODUCT_STATUS.map((s) => (<MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>Description</Typography>
                            <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1 }}>
                              <CKEditor editor={ClassicEditor as any} data={description} onChange={(_evt: any, editor: any) => {
                                const data = editor.getData?.() || ""
                                setDescription(data)
                              }} />
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>

                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <AttachMoney color="primary" />
                          Pricing & Inventory
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={4}>
                            <TextField fullWidth label="Price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField fullWidth label="MRP (Optional)" type="number" value={mrp} onChange={(e) => setMrp(e.target.value === "" ? "" : Number(e.target.value))} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                              <InputLabel>Currency</InputLabel>
                              <Select value={currency} label="Currency" onChange={(e) => setCurrency(e.target.value)}>
                                {CURRENCIES.map((c) => (<MenuItem key={c} value={c}>{c}</MenuItem>))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField fullWidth label="Stock Quantity" type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField fullWidth label="Tax Rate (%)" type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value === "" ? "" : Number(e.target.value))} />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                              <InputLabel>Tax</InputLabel>
                              <Select value={taxRate === "" ? "" : String(taxRate)} label="Tax" onChange={(e) => setTaxRate(e.target.value === "" ? "" : Number(e.target.value))}>
                                <MenuItem value=""><em>None</em></MenuItem>
                                {taxes.map((t) => (<MenuItem key={t._id} value={String(t.percent)}>{t.name} — {t.percent}%</MenuItem>))}
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>

                    <Accordion elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CategoryIcon color="primary" />
                          Product Variants ({variants.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          {variants.map((variant, i) => (
                            <Card key={i} variant="outlined">
                              <CardContent>
                                <Grid container spacing={2} alignItems="center">
                                  <Grid item xs={12} md={2}>
                                    <TextField fullWidth size="small" label="SKU" value={variant.sku || ""} onChange={(e) => updateVariant(i, { sku: e.target.value })} />
                                  </Grid>
                                  <Grid item xs={12} md={2}>
                                    <TextField fullWidth size="small" label="Price" type="number" value={variant.price} onChange={(e) => updateVariant(i, { price: Number(e.target.value) })} />
                                  </Grid>
                                  <Grid item xs={12} md={2}>
                                    <TextField fullWidth size="small" label="Stock" type="number" value={variant.stock ?? 0} onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })} />
                                  </Grid>
                                  <Grid item xs={12} md={2}>
                                    <TextField fullWidth size="small" label="Color" value={variant.color || ""} onChange={(e) => updateVariant(i, { color: e.target.value })} />
                                  </Grid>
                                  <Grid item xs={12} md={2}>
                                    <TextField fullWidth size="small" label="Size" value={variant.size || ""} onChange={(e) => updateVariant(i, { size: e.target.value })} />
                                  </Grid>
                                  <Grid item xs={12} md={2}>
                                    <IconButton color="error" onClick={() => removeVariant(i)}>
                                      <Delete />
                                    </IconButton>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Button component="label" variant="outlined" startIcon={<CloudUpload />} size="small">
                                      Upload Variant Images
                                      <input hidden type="file" accept="image/*" multiple onChange={(e) => handleVariantFiles(i, e.target.files)} />
                                    </Button>
                                    {variantPreviews[i] && variantPreviews[i].length > 0 && (
                                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                                        {variantPreviews[i].map((src, idx) => (
                                          <img key={idx} src={src} alt={`Var ${i + 1}-${idx + 1}`} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6 }} />
                                        ))}
                                      </Box>
                                    )}
                                  </Grid>
                                </Grid>
                              </CardContent>
                            </Card>
                          ))}
                          <Button variant="outlined" startIcon={<Add />} onClick={addVariant} sx={{ alignSelf: "flex-start" }}>
                            Add Variant
                          </Button>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  </Stack>
                </Grid>

                {/* Right column */}
                <Grid item xs={12} lg={4}>
                  <Stack spacing={4}>
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
                                <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
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
                                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <FormControl fullWidth>
                            <InputLabel>Tags</InputLabel>
                            <Select
                              multiple
                              value={tagIds}
                              label="Tags"
                              onChange={(e) => setTagIds(typeof e.target.value === "string" ? e.target.value.split(",") : (e.target.value as string[]))}
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
                                <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>
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
                          Product Images (edit: upload to replace)
                        </Typography>
                        <Stack spacing={2}>
                          <Button component="label" variant="outlined" startIcon={<CloudUpload />}>
                            Upload Main Image
                            <input hidden type="file" accept="image/*" onChange={(e) => setMainFile(e.target.files?.[0] || null)} />
                          </Button>
                          {mainPreview && (
                            <img src={mainPreview} alt="Main" style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }} />
                          )}
                          <Button component="label" variant="outlined" startIcon={<CloudUpload />}>
                            Upload Gallery Images
                            <input hidden type="file" accept="image/*" multiple onChange={(e) => setGallery(e.target.files ? Array.from(e.target.files) : [])} />
                          </Button>
                          {(galleryPreviews.length > 0 || existingGalleryUrls.length > 0) && (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                              {existingGalleryUrls.map((src, i) => (
                                <img key={`e-${i}`} src={src} alt={`Existing-${i}`} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6 }} />
                              ))}
                              {galleryPreviews.map((src, i) => (
                                <img key={`n-${i}`} src={src} alt={`G-${i}`} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6 }} />
                              ))}
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Discount */}
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <LocalOffer color="primary" />
                          Discount & Coupon
                        </Typography>
                        <Stack spacing={2}>
                          <FormControlLabel control={<Switch checked={applyDiscount} onChange={(e) => setApplyDiscount(e.target.checked)} />} label="Apply Discount" />
                          {applyDiscount && (
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                  <InputLabel>Type</InputLabel>
                                  <Select value={discountType} label="Type" onChange={(e) => setDiscountType(e.target.value as any)}>
                                    {DISCOUNT_TYPES.map((t) => (<MenuItem key={t} value={t}>{t}</MenuItem>))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField fullWidth label="Value" type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value === "" ? "" : Number(e.target.value))} />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <DatePicker label="Expiry" value={discountExpiry} onChange={(v) => setDiscountExpiry(v)} />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField fullWidth label="Usage Limit" type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))} />
                              </Grid>
                              <Grid item xs={12}>
                                <FormControl fullWidth>
                                  <InputLabel>Select Coupon</InputLabel>
                                  <Select value={selectedCouponId} label="Select Coupon" onChange={(e) => setSelectedCouponId(String(e.target.value))}>
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {coupons.map((c) => (<MenuItem key={c._id} value={c._id!}>{c.code} — {c.type} {c.value}</MenuItem>))}
                                  </Select>
                                </FormControl>
                              </Grid>
                            </Grid>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Container>
      </Box>
    </LocalizationProvider>
  )
}
