"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { DatePicker } from 'antd';
import { useAppSelector } from '@/store';
import { BrandsAPI, CategoriesAPI, TagsAPI, type BrandDTO, type CategoryDTO, type TagDTO } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api/v1';

export default function NewProductPage() {
  const router = useRouter();

  const brandsState = useAppSelector(s=>s.brands.items);
  const categoriesState = useAppSelector(s=>s.categories.items);
  const tagsState = useAppSelector(s=>s.tags.items);

  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // form fields
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [mrp, setMrp] = useState<number | ''>('');
  const [currency, setCurrency] = useState('INR');
  const [taxRate, setTaxRate] = useState<number | ''>('');
  const [stock, setStock] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>('active');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);

  // Images
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [gallery, setGallery] = useState<File[]>([]);

  // Variants
  const [variants, setVariants] = useState<Array<{ sku?: string; price: number; stock?: number }>>([]);
  const [variantFiles, setVariantFiles] = useState<Record<number, File[]>>({});

  // Discount
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<'percent'|'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number | ''>('');
  const [discountExpiry, setDiscountExpiry] = useState<any | null>(null);
  const [usageLimit, setUsageLimit] = useState<number | ''>('');

  const canSave = !!shopId && title.trim().length > 1 && price > 0 && !loading;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/shops/my`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setShopId(data.shop?._id || null);
        }
      } catch {}
    })();
  }, []);

  function addVariant() {
    setVariants(v=> [...v, { sku: '', price: 0, stock: 0 }]);
  }
  function updateVariant(i: number, patch: Partial<{ sku?: string; price: number; stock?: number }>) {
    setVariants(v=> v.map((row, idx)=> idx===i ? { ...row, ...patch } : row));
  }
  function removeVariant(i: number) {
    setVariants(v=> v.filter((_, idx)=> idx!==i));
    setVariantFiles(prev=> {
      const next = { ...prev };
      delete next[i];
      // reindex keys to keep mapping stable after removal
      const reindexed: Record<number, File[]> = {};
      const entries = Object.entries(next).sort((a,b)=> Number(a[0]) - Number(b[0]));
      let k = 0;
      for (const [, files] of entries) reindexed[k++] = files;
      return reindexed;
    });
  }
  function onVariantFiles(i: number, files: File[]) {
    setVariantFiles(prev=> ({ ...prev, [i]: files }));
  }

  async function onSubmit() {
    if (!canSave) return;
    setLoading(true);
    try {
      const payload: any = {
        shopId,
        title: title.trim(),
        sku: sku.trim() || undefined,
        price,
        mrp: mrp === '' ? undefined : mrp,
        currency,
        taxRate: taxRate === '' ? undefined : taxRate,
        stock,
        description: description.trim() || undefined,
        status,
        brandId: brandId || undefined,
        categoryId: categoryId || undefined,
        tagIds: tagIds.length ? tagIds : undefined,
        variants: variants.filter(v=> (v.price ?? 0) > 0).map(v=> ({ sku: v.sku, price: v.price, stock: v.stock })),
        discount: applyDiscount ? {
          type: discountType,
          value: discountValue === '' ? 0 : discountValue,
          expiry: discountExpiry ? discountExpiry.toDate() : undefined,
          usageLimit: usageLimit === '' ? undefined : usageLimit,
        } : undefined,
      };

      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (Array.isArray(v) || typeof v === 'object') fd.append(k, JSON.stringify(v));
        else fd.append(k, String(v));
      });
      if (mainFile) fd.append('file', mainFile);
      for (const f of gallery) fd.append('file', f);
      // append variant files, index-based keys variantFiles[<i>]
      Object.entries(variantFiles).forEach(([idx, files])=> {
        for (const f of files) fd.append(`variantFiles[${idx}]`, f);
      });

      const res = await fetch(`${API_BASE}/products`, { method: 'POST', body: fd, credentials: 'include' });
      if (res.ok) {
        router.push('/seller/products');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Paper sx={{ maxWidth: 1200, mx: 'auto', p: 3, borderRadius: 3, border: '1px solid #dbeafe' }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Create Product</Typography>
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
          <Box>
            <Stack spacing={2}>
              <TextField label="Title" value={title} onChange={(e)=>setTitle(e.target.value)} autoFocus required sx={{ bgcolor: 'white' }}/>
              <TextField label="SKU (optional)" value={sku} onChange={(e)=>setSku(e.target.value)} sx={{ bgcolor: 'white' }}/>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="Price" type="number" value={price} onChange={(e)=>setPrice(Number(e.target.value))} required sx={{ flex: 1, bgcolor: 'white' }}/>
                <TextField label="MRP (optional)" type="number" value={mrp} onChange={(e)=>setMrp(e.target.value === '' ? '' : Number(e.target.value))} sx={{ flex: 1, bgcolor: 'white' }}/>
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="Currency" value={currency} onChange={(e)=>setCurrency(e.target.value)} sx={{ flex: 1, bgcolor: 'white' }}/>
                <TextField label="Tax Rate (%)" type="number" value={taxRate} onChange={(e)=>setTaxRate(e.target.value === '' ? '' : Number(e.target.value))} sx={{ flex: 1, bgcolor: 'white' }}/>
                <TextField label="Stock" type="number" value={stock} onChange={(e)=>setStock(Number(e.target.value))} sx={{ flex: 1, bgcolor: 'white' }}/>
              </Stack>
              <TextField label="Description" value={description} onChange={(e)=>setDescription(e.target.value)} multiline minRows={4} sx={{ bgcolor: 'white' }}/>

              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select labelId="status-label" label="Status" value={status} onChange={(e)=> setStatus(e.target.value as any)}>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="brand-label">Brand</InputLabel>
                <Select labelId="brand-label" label="Brand" value={brandId} onChange={(e)=> setBrandId(e.target.value as string)}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {brandsState.map(b=> <MenuItem key={b._id} value={String(b._id)}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="category-label">Category</InputLabel>
                <Select labelId="category-label" label="Category" value={categoryId} onChange={(e)=> setCategoryId(e.target.value as string)}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {categoriesState.map(c=> <MenuItem key={c._id} value={String(c._id)}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="tags-label">Tags</InputLabel>
                <Select multiple labelId="tags-label" label="Tags" value={tagIds} onChange={(e)=> setTagIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])} renderValue={(selected)=> (
                  <Stack direction="row" spacing={1} flexWrap="wrap">{(selected as string[]).map(id=> {
                    const t = tagsState.find(x=> String(x._id)===String(id));
                    return <Chip key={id} size="small" label={t?.name || id} />
                  })}</Stack>
                )}>
                  {tagsState.map(t=> <MenuItem key={t._id} value={String(t._id)}>{t.name}</MenuItem>)}
                </Select>
              </FormControl>

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Images</Typography>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                  <Button component="label" variant="outlined">Upload Main Image
                    <input hidden type="file" accept="image/*" onChange={(e)=> setMainFile((e.target.files && e.target.files[0]) || null)} />
                  </Button>
                  {mainFile && <Chip label={mainFile.name} />}
                  <Button component="label" variant="outlined">Upload Gallery Images
                    <input hidden type="file" accept="image/*" multiple onChange={(e)=> setGallery(Array.from(e.target.files || []))} />
                  </Button>
                  {gallery.length>0 && (
                    <Stack direction="row" spacing={1} flexWrap="wrap">{gallery.map((f,i)=>(<Chip key={i} label={f.name}/>))}</Stack>
                  )}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Variants</Typography>
                <Stack spacing={1}>
                  {variants.map((v,i)=> (
                    <Stack key={i} direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center">
                      <TextField size="small" label="SKU" value={v.sku || ''} onChange={(e)=>updateVariant(i, { sku: e.target.value })} sx={{ minWidth: 160 }}/>
                      <TextField size="small" label="Price" type="number" value={v.price} onChange={(e)=>updateVariant(i, { price: Number(e.target.value) })} sx={{ minWidth: 140 }}/>
                      <TextField size="small" label="Stock" type="number" value={v.stock ?? 0} onChange={(e)=>updateVariant(i, { stock: Number(e.target.value) })} sx={{ minWidth: 120 }}/>
                      <Button component="label" size="small" variant="outlined">Upload Variant Images
                        <input hidden type="file" accept="image/*" multiple onChange={(e)=> onVariantFiles(i, Array.from(e.target.files || []))} />
                      </Button>
                      {variantFiles[i]?.length ? <Chip size="small" label={`${variantFiles[i].length} files`} /> : null}
                      <Button size="small" color="error" onClick={()=>removeVariant(i)}>Remove</Button>
                    </Stack>
                  ))}
                  <Button variant="outlined" size="small" onClick={addVariant}>Add Variant</Button>
                </Stack>
              </Box>
            </Stack>
          </Box>

          <Box>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Discount</Typography>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="apply-discount">Apply</InputLabel>
                  <Select labelId="apply-discount" label="Apply" value={applyDiscount ? 'yes' : 'no'} onChange={(e)=> setApplyDiscount((e.target.value as string) === 'yes')}>
                    <MenuItem value="no">No</MenuItem>
                    <MenuItem value="yes">Yes</MenuItem>
                  </Select>
                </FormControl>
                {applyDiscount && (
                  <>
                    <FormControl fullWidth>
                      <InputLabel id="discount-type">Type</InputLabel>
                      <Select labelId="discount-type" label="Type" value={discountType} onChange={(e)=> setDiscountType(e.target.value as any)}>
                        <MenuItem value="percent">Percent</MenuItem>
                        <MenuItem value="fixed">Fixed Amount</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField label={discountType==='percent' ? 'Percent (%)' : 'Amount'} type="number" value={discountValue} onChange={(e)=> setDiscountValue(e.target.value === '' ? '' : Number(e.target.value))} sx={{ bgcolor: 'white' }} />
                    <TextField label="Usage Limit (optional)" type="number" value={usageLimit} onChange={(e)=> setUsageLimit(e.target.value === '' ? '' : Number(e.target.value))} sx={{ bgcolor: 'white' }} />
                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>Expiry (optional)</Typography>
                      <DatePicker style={{ width: '100%' }} value={discountExpiry} onChange={(d)=> setDiscountExpiry(d)} disabledDate={(d)=> Boolean(d && d.isBefore && d.isBefore((window as any).dayjs ? (window as any).dayjs().startOf('day') : undefined))} />
                    </Box>
                  </>
                )}
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" onClick={()=>router.back()}>Cancel</Button>
                  <Button variant="contained" onClick={onSubmit} disabled={!canSave}>Create</Button>
                </Stack>
              </Stack>
            </Paper>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
