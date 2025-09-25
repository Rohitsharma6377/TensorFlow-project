"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchBrands, createBrand, updateBrand, deleteBrand } from '@/store/slice/brandSlice';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '@/store/slice/categorySlice';
import { fetchTags, createTag, updateTag, deleteTag } from '@/store/slice/tagSlice';
import { TaxesAPI, CouponsAPI } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api/v1';

type Product = {
  _id: string;
  title: string;
  price: number;
  stock: number;
  status: 'active' | 'archived' | 'draft';
};

export default function SellerProductsPage() {
  const router = useRouter();

  // shop + products
  const [shopId, setShopId] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // local state for other tabs
  const [taxes, setTaxes] = useState<Array<{ id: string; name: string; percent: number; active: boolean }>>([]);
  const [coupons, setCoupons] = useState<Array<{ id: string; code: string; type: 'percent' | 'fixed'; value: number; expiry?: string; active: boolean }>>([]);
  const dispatch = useAppDispatch();
  const categories = useAppSelector(s=>s.categories.items);
  const tagsList = useAppSelector(s=>s.tags.items);
  const brands = useAppSelector(s=>s.brands.items);
  const [reviews, setReviews] = useState<Array<{ id: string; user: string; product: string; rating: number; comment?: string; active: boolean }>>([]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch(`${API_BASE}/shops/my`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setShopId(data.shop?._id || null);
        }
      } catch {}
    }
    init();
  }, []);

  // Load managed dictionaries when shopId becomes available
  useEffect(() => {
    if (!shopId) return;
    dispatch(fetchBrands(shopId));
    dispatch(fetchCategories(shopId));
    dispatch(fetchTags(shopId));
  }, [shopId, dispatch]);

  useEffect(() => {
    if (!shopId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/products?shopId=${shopId}&page=${page}&limit=${limit}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          // backend list doesn't return total, approximate with page size
          setItems(data.products || []);
          setTotal((data.products || []).length < limit && page === 1 ? (data.products || []).length : page * limit + 1); // naive
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [shopId, page, limit]);

  // Load taxes and coupons from backend
  useEffect(() => {
    if (!shopId) return;
    (async () => {
      try {
        const [tRes, cRes] = await Promise.all([
          TaxesAPI.list(shopId),
          CouponsAPI.list(shopId),
        ]);
        setTaxes((tRes.taxes || []).map((t: any) => ({ id: t._id || t.id, name: t.name, percent: t.percent, active: !!t.active })));
        setCoupons((cRes.coupons || []).map((c: any) => ({ id: c._id || c.id, code: c.code, type: c.type, value: c.value, expiry: c.expiry ? String(c.expiry).slice(0,10) : undefined, active: !!c.active })));
      } catch (e) {
        console.warn('Failed to load taxes/coupons', e);
      }
    })();
  }, [shopId]);

  async function toggleStatus(id: string, current: Product['status']) {
    try {
      const status = current === 'active' ? 'archived' : 'active';
      const res = await fetch(`${API_BASE}/products/${id}`, { method: 'PUT', credentials: 'include', body: (()=>{const fd=new FormData(); fd.append('status', status); return fd;})() });
      if (res.ok) {
        setItems(items.map(it => it._id === id ? { ...it, status } : it));
      }
    } catch {}
  }

type DeliveryZones = { allIndia?: boolean; allPincodesInStates?: boolean; pincodes?: string[]; states?: string[]; districts?: string[] };
function DeliveryZonesDialog({ productId, onSaved }: { productId: string; onSaved: (zones: DeliveryZones) => void }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [allIndia, setAllIndia] = useState(false);
  const [allPincodesInStates, setAllPincodesInStates] = useState(false);
  const [statesArr, setStatesArr] = useState<string[]>([]);
  const [districtsArr, setDistrictsArr] = useState<string[]>([]);
  const [pincodesArr, setPincodesArr] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<any>({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products/${productId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const opt = data?.product?.options || {};
        setOptions(opt);
        const dz: DeliveryZones = opt.deliveryZones || {};
        setAllIndia(!!dz.allIndia);
        setAllPincodesInStates(!!dz.allPincodesInStates);
        setStatesArr(Array.isArray(dz.states) ? dz.states : []);
        setDistrictsArr(Array.isArray(dz.districts) ? dz.districts : []);
        setPincodesArr(Array.isArray(dz.pincodes) ? dz.pincodes.map(String) : []);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleOpen = async () => { setOpen(true); await load(); };
  const handleSave = async () => {
    const nextOptions = {
      ...(options || {}),
      deliveryZones: {
        allIndia: allIndia || undefined,
        allPincodesInStates: allPincodesInStates || undefined,
        states: statesArr.length ? statesArr : undefined,
        districts: districtsArr.length ? districtsArr : undefined,
        pincodes: (allPincodesInStates ? undefined : (pincodesArr.length ? pincodesArr : undefined)),
      }
    };
    const res = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options: nextOptions }),
    });
    if (res.ok) {
      onSaved(nextOptions.deliveryZones);
      setOpen(false);
    }
  };

  return (
    <>
      <Button size="small" variant="outlined" onClick={handleOpen}>🚚 Delivery Zones</Button>
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Delivery Zones</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControlLabel control={<Switch checked={allIndia} onChange={(e)=>setAllIndia(e.target.checked)} />} label="All India Delivery" />
            <Box sx={{ color: 'text.secondary', fontSize: 13, mt: -1 }}>
              When All India is enabled, specific regions and pincodes will be ignored.
            </Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1 }}>
              <Tabs value={tab} onChange={(_, v)=>setTab(v)}>
                <Tab label="Regions" />
                <Tab label="Pincodes" disabled={allPincodesInStates} />
              </Tabs>
            </Box>
            {tab === 0 && (
              <Stack spacing={2} sx={{ pt: 2 }}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={statesArr}
                  onChange={(_, v)=> setStatesArr(v as string[])}
                  renderInput={(params)=> <TextField {...params} label="States" placeholder="Type and press Enter to add"/>}
                />
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={districtsArr}
                  onChange={(_, v)=> setDistrictsArr(v as string[])}
                  renderInput={(params)=> <TextField {...params} label="Districts" placeholder="Type and press Enter to add"/>}
                />
                <FormControlLabel control={<Switch checked={allPincodesInStates} onChange={(e)=> setAllPincodesInStates(e.target.checked)} />} label="All pincodes in selected states" />
              </Stack>
            )}
            {tab === 1 && (
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={pincodesArr}
                onChange={(_, v)=> setPincodesArr((v as string[]).map(s=>s.replace(/\D/g,'')).filter(Boolean))}
                renderInput={(params)=> <TextField {...params} label="Pincodes" placeholder="110001, 560001, ..."/>}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={loading} onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

  async function removeProduct(id: string) {
    if (!confirm('Delete this product?')) return;
    const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) setItems(items.filter(it => it._id !== id));
  }

  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="space-y-6">
      <Card sx={{ background: 'rgba(255,255,255,0.95)', borderRadius: 3, border: '1px solid #dbeafe' }}>
        <CardHeader title={<Box component="div" sx={{ pb: 0 }}>
          <Box component="h2" sx={{ fontSize: 20, fontWeight: 600, color: '#0f172a', m: 0 }}>Catalog</Box>
          <Box component="p" sx={{ color: 'text.secondary', m: 0 }}>Manage your products and merchandising</Box>
        </Box>} sx={{ borderBottom: '1px solid #dbeafe' }} />
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(_, v)=>setActiveTab(v)} textColor="primary" indicatorColor="primary">
              <Tab label="Products" />
              <Tab label="Tax" />
              <Tab label="Coupons" />
              <Tab label="Categories" />
              <Tab label="Brands" />
              <Tab label="Reviews" />
            </Tabs>
          </Box>

          {activeTab === 0 && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" onClick={()=> router.push('/seller/products/new')} disabled={!shopId}>Add Product</Button>
              </Box>
              <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Name</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5} align="center">Loading...</TableCell></TableRow>
                    ) : items.length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center">No products found.</TableCell></TableRow>
                    ) : (
                      items.map((p)=> (
                        <TableRow key={p._id} hover>
                          <TableCell>{p.title}</TableCell>
                          <TableCell>₹{p.price}</TableCell>
                          <TableCell>{p.stock ?? 0}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Switch color="primary" checked={p.status === 'active'} onChange={()=>toggleStatus(p._id, p.status)} />
                              <span>{p.status === 'active' ? 'Active' : 'Inactive'}</span>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <Button size="small" variant="outlined" onClick={()=>router.push(`/seller/products/${p._id}`)}>✏️ Edit</Button>
                              <Button size="small" variant="outlined" color="error" onClick={()=>removeProduct(p._id)}>🗑 Delete</Button>
                              <Button size="small" variant="outlined" color="primary" onClick={()=>toggleStatus(p._id, p.status)}>✅ Toggle</Button>
                              <DeliveryZonesDialog productId={p._id} onSaved={(zones)=>{/* no-op UI */}} />
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, pt: 2 }}>
                <Button variant="outlined" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</Button>
                <Box component="span" sx={{ color: 'text.secondary', fontSize: 14 }}>Page {page} / {totalPages}</Box>
                <Button variant="outlined" onClick={()=>setPage(p=>p+1)}>Next</Button>
              </Box>
            </Box>
          )}

          {activeTab === 1 && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <EditTaxDialog onSave={async (tax)=> {
                  if (!shopId) return;
                  const res = await TaxesAPI.create({ shop: shopId, name: tax.name, percent: tax.percent });
                  const t: any = (res as any).tax;
                  setTaxes(prev => [{ id: String(t._id), name: t.name, percent: t.percent, active: !!t.active }, ...prev]);
                }} />
              </Box>
              <SimpleTable
                headers={["Tax Name","Percentage","Status","Actions"]}
                rows={taxes.map(t=> [
                  t.name,
                  `${t.percent}%`,
                  t.active ? 'Active' : 'Inactive',
                  <RowActions key={t.id}
                    onEdit={()=> {}}
                    editRenderer={<EditTaxDialog initial={{ name: t.name, percent: t.percent }} onSave={async (val)=> {
                      const res = await TaxesAPI.update(t.id, val);
                      const nt: any = (res as any).tax;
                      setTaxes(taxes.map(x=> x.id===t.id? { id: t.id, name: nt.name, percent: nt.percent, active: !!nt.active }: x))
                    }} small />}
                    onToggle={async ()=>{
                      const res = await TaxesAPI.update(t.id, { active: !t.active });
                      const nt: any = (res as any).tax;
                      setTaxes(taxes.map(x=> x.id===t.id? { id: t.id, name: nt.name, percent: nt.percent, active: !!nt.active }: x))
                    }}
                    onDelete={async ()=>{
                      await TaxesAPI.remove(t.id);
                      setTaxes(taxes.filter(x=>x.id!==t.id))
                    }}
                  />
                ])}
              />
            </Box>
          )}

          {activeTab === 2 && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <EditCouponDialog onSave={async (cp)=> {
                  if (!shopId) return;
                  const res = await CouponsAPI.create({ shop: shopId, code: cp.code, type: cp.type, value: cp.value, expiry: cp.expiry });
                  const c = res.coupon as any;
                  setCoupons(prev => [{ id: String(c._id || c.id), code: c.code, type: c.type, value: c.value, expiry: c.expiry ? String(c.expiry).slice(0,10) : undefined, active: !!c.active }, ...prev]);
                }} />
              </Box>
              <SimpleTable
                headers={["Coupon Code","Discount Type","Value","Expiry Date","Status","Actions"]}
                rows={coupons.map(c=> [
                  c.code,
                  c.type,
                  String(c.value),
                  c.expiry || '-',
                  c.active ? 'Active' : 'Inactive',
                  <RowActions key={c.id}
                    onEdit={()=> {}}
                    editRenderer={<EditCouponDialog initial={{ code: c.code, type: c.type, value: c.value, expiry: c.expiry }} onSave={async (val)=> {
                      const res = await CouponsAPI.update(c.id, val);
                      const u: any = res.coupon;
                      setCoupons(coupons.map(x=> x.id===c.id? { id: c.id, code: u.code, type: u.type, value: u.value, expiry: u.expiry ? String(u.expiry).slice(0,10) : undefined, active: !!u.active }: x))
                    }} small />}
                    onToggle={async ()=>{
                      const res = await CouponsAPI.update(c.id, { active: !c.active });
                      const u: any = res.coupon;
                      setCoupons(coupons.map(x=> x.id===c.id? { id: c.id, code: u.code, type: u.type, value: u.value, expiry: u.expiry ? String(u.expiry).slice(0,10) : undefined, active: !!u.active }: x))
                    }}
                    onDelete={async ()=>{
                      await CouponsAPI.remove(c.id);
                      setCoupons(coupons.filter(x=>x.id!==c.id))
                    }}
                  />
                ])}
              />
            </Box>
          )}

          {activeTab === 3 && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mb: 1 }}>
                <AddCategoryDialog
                  disabled={!shopId}
                  onSave={(cat)=> shopId && dispatch(createCategory({ shop: shopId, name: cat.name, description: cat.description, parent: cat.parent }))}
                />
                <AddTagDialog
                  disabled={!shopId}
                  onSave={(tag)=> shopId && dispatch(createTag({ shop: shopId, name: tag.name, description: tag.description }))}
                />
              </Box>
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box>
                  <Box component="h4" sx={{ fontWeight: 600, mb: 1 }}>Categories</Box>
                  <SimpleTable
                    headers={["Category Name","Description","Parent","Status","Actions"]}
                    rows={categories.map(c=> [
                      c.name,
                      c.description || '-',
                      c.parent || '-',
                      c.active ? 'Active' : 'Inactive',
                      <RowActions key={c._id || c.name}
                        onEdit={()=>{}}
                        editRenderer={<EditCategoryDialog initial={{ name: c.name, description: c.description, parent: typeof c.parent === 'string' ? c.parent : '' }} onSave={(val)=> dispatch(updateCategory({ id: String(c._id), payload: val }))} small />}
                        onToggle={()=> dispatch(updateCategory({ id: String(c._id), payload: { active: !c.active } }))}
                        onDelete={()=> dispatch(deleteCategory(String(c._id)))}
                      />
                    ])}
                  />
                </Box>
                <Box>
                  <Box component="h4" sx={{ fontWeight: 600, mb: 1 }}>Tags</Box>
                  <SimpleTable
                    headers={["Tag Name","Description","Status","Actions"]}
                    rows={tagsList.map(t=> [
                      t.name,
                      t.description || '-',
                      t.active ? 'Active' : 'Inactive',
                      <RowActions key={t._id || t.name}
                        onEdit={()=>{}}
                        editRenderer={<EditTagDialog initial={{ name: t.name, description: t.description }} onSave={(val)=> dispatch(updateTag({ id: String(t._id), payload: val }))} small />}
                        onToggle={()=> dispatch(updateTag({ id: String(t._id), payload: { active: !t.active } }))}
                        onDelete={()=> dispatch(deleteTag(String(t._id)))}
                      />
                    ])}
                  />
                </Box>
              </Box>
            </Box>
          )}

          {activeTab === 4 && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <AddBrandDialog
                  disabled={!shopId}
                  onSave={(brand)=> { if (!shopId) return; dispatch(createBrand({ shop: shopId, name: brand.name, description: brand.description, logoFile: brand.logoFile })); }}
                />
              </Box>
              <SimpleTable
                headers={["Brand Name","Logo","Description","Status","Actions"]}
                rows={brands.map(b=> [
                  b.name,
                  b.logo ? <img key={`l-${b._id}`} src={b.logo} alt="logo" className="h-8 rounded"/> : '-',
                  b.description || '-',
                  b.active ? 'Active' : 'Inactive',
                  <RowActions key={b._id || b.name} onToggle={()=> dispatch(updateBrand({ id: String(b._id), payload: { active: !b.active } }))} onDelete={()=> dispatch(deleteBrand(String(b._id)))} />
                ])}
              />
            </Box>
          )}

          {activeTab === 5 && (
            <TabPanelAdd
              title="Add Review"
              onAdd={(name)=> setReviews([...reviews, { id: crypto.randomUUID(), user: name, product: '-', rating: 5, active: true } as any])}
              headers={["Reviewer Name","Product","Rating","Comment","Status","Actions"]}
              rows={reviews.map(r=> [r.user, r.product, '⭐'.repeat(r.rating || 0), r.comment || '-', r.active ? 'Active' : 'Inactive',
                <RowActions key={r.id} onToggle={()=>setReviews(reviews.map(x=>x.id===r.id?{...x,active:!x.active}:x))} onDelete={()=>setReviews(reviews.filter(x=>x.id!==r.id))} />])}
            />
          )}
        </CardContent>
      </Card>

      <Fab color="primary" sx={{ position: 'fixed', right: 24, bottom: 24 }} onClick={()=>router.push('/seller/products/new')}>
        <AddIcon />
      </Fab>
    </div>
  );
}

function InlineAdd({ buttonLabel, onAdd }: { buttonLabel: string; onAdd: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
      <Button variant="contained" onClick={()=>setOpen(true)}>{buttonLabel}</Button>
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Name" fullWidth value={value} onChange={(e)=>setValue(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button onClick={()=>{ if(value.trim()){ onAdd(value.trim()); setValue(''); setOpen(false); } }} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: any[][] }) {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', mt: 1 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {headers.map((h)=> <TableCell key={h}>{h}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={headers.length} align="center">No records</TableCell></TableRow>
          ) : rows.map((cols, i)=> (
            <TableRow key={i} hover>
              {cols.map((c, j)=> <TableCell key={j}>{c}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function TabPanelAdd({ title, onAdd, headers, rows }: { title: string; onAdd: (value: string) => void; headers: string[]; rows: any[][] }) {
  return (
    <Box sx={{ pt: 2 }}>
      <InlineAdd buttonLabel={`➕ ${title}`} onAdd={onAdd} />
      <SimpleTable headers={headers} rows={rows} />
    </Box>
  );
}

type CategoryInput = { name: string; description?: string; parent?: string };
type TagInput = { name: string; description?: string };
type BrandInput = { name: string; description?: string; logo?: string; logoFile?: File };

function AddCategoryDialog({ disabled, onSave }: { disabled?: boolean; onSave: (cat: CategoryInput) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parent, setParent] = useState('');
  const canSave = name.trim().length > 0;
  return (
    <>
      <Button variant="contained" disabled={disabled} onClick={()=>setOpen(true)}>➕ Add Category</Button>
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Category</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField label="Name" value={name} onChange={(e)=>setName(e.target.value)} autoFocus required/>
            <TextField label="Description" value={description} onChange={(e)=>setDescription(e.target.value)} multiline minRows={2}/>
            <TextField label="Parent (optional)" value={parent} onChange={(e)=>setParent(e.target.value)}/>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!canSave} onClick={()=>{
            const trimmedParent = parent.trim();
            const looksLikeId = /^[a-fA-F0-9]{24}$/.test(trimmedParent);
            onSave({ name: name.trim(), description: description.trim() || undefined, parent: looksLikeId ? trimmedParent : undefined });
            setOpen(false); setName(''); setDescription(''); setParent('');
          }}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function AddTagDialog({ disabled, onSave }: { disabled?: boolean; onSave: (tag: TagInput) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const canSave = name.trim().length > 0;
  return (
    <>
      <Button variant="outlined" disabled={disabled} onClick={()=>setOpen(true)}>➕ Add Tag</Button>
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add Tag</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField label="Name" value={name} onChange={(e)=>setName(e.target.value)} autoFocus required/>
            <TextField label="Description" value={description} onChange={(e)=>setDescription(e.target.value)} multiline minRows={2}/>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!canSave} onClick={()=>{ onSave({ name: name.trim(), description: description.trim() || undefined }); setOpen(false); setName(''); setDescription(''); }}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function AddBrandDialog({ disabled, onSave }: { disabled?: boolean; onSave: (brand: BrandInput) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [logoFile, setLogoFile] = useState<File | undefined>(undefined);
  const canSave = name.trim().length > 0;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setLogoFile(f);
    const url = URL.createObjectURL(f);
    setLogo(url);
  }

  return (
    <>
      <Button variant="contained" disabled={disabled} onClick={()=>setOpen(true)}>➕ Add Brand</Button>
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Brand</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField label="Name" value={name} onChange={(e)=>setName(e.target.value)} autoFocus required/>
            <TextField label="Description" value={description} onChange={(e)=>setDescription(e.target.value)} multiline minRows={2}/>
            <Box>
              <Button component="label" variant="outlined">Upload Logo
                <input hidden type="file" accept="image/*" onChange={onFile} />
              </Button>
              {logo && <img src={logo} alt="logo preview" className="mt-2 h-16 rounded border" />}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!canSave} onClick={()=>{ onSave({ name: name.trim(), description: description.trim() || undefined, logo, logoFile }); setOpen(false); setName(''); setDescription(''); setLogo(undefined); setLogoFile(undefined); }}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function RowActions({ onToggle, onDelete, onEdit, editRenderer }: { onToggle: () => void; onDelete: () => void; onEdit?: () => void; editRenderer?: React.ReactNode }) {
  return (
    <Stack direction="row" justifyContent="flex-end" spacing={1}>
      {editRenderer ? editRenderer : (
        onEdit ? (
          <IconButton size="small" onClick={onEdit} aria-label="edit"><EditIcon fontSize="small"/></IconButton>
        ) : null
      )}
      <Button size="small" variant="outlined" onClick={onToggle}>✅ Toggle</Button>
      <Button size="small" variant="outlined" color="error" onClick={onDelete}>🗑 Delete</Button>
    </Stack>
  );
}

// Dialogs
type TaxInput = { name: string; percent: number };
function EditTaxDialog({ initial, onSave, small }: { initial?: TaxInput; onSave: (t: TaxInput) => void; small?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name || '');
  const [percent, setPercent] = useState<number>(initial?.percent ?? 0);
  const canSave = name.trim().length > 0 && percent >= 0;
  const trigger = small ? (
    <IconButton size="small" onClick={()=>setOpen(true)} aria-label="edit"><EditIcon fontSize="small"/></IconButton>
  ) : (
    <Button variant="contained" onClick={()=>setOpen(true)}>➕ Add Tax</Button>
  );
  return (
    <>
      {trigger}
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{initial ? 'Edit Tax' : 'Add Tax'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Name" value={name} onChange={(e)=>setName(e.target.value)} autoFocus required/>
            <TextField label="Percent" type="number" value={percent} onChange={(e)=>setPercent(Number(e.target.value))}/>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!canSave} onClick={()=>{ onSave({ name: name.trim(), percent }); setOpen(false); }}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

type CouponInput = { code: string; type: 'percent' | 'fixed'; value: number; expiry?: string };
function EditCouponDialog({ initial, onSave, small }: { initial?: CouponInput; onSave: (c: CouponInput) => void; small?: boolean }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(initial?.code || '');
  const [type, setType] = useState<CouponInput['type']>(initial?.type || 'percent');
  const [value, setValue] = useState<number>(initial?.value ?? 0);
  const [expiry, setExpiry] = useState(initial?.expiry ? String(initial.expiry).slice(0,10) : '');
  const canSave = code.trim().length > 0 && value >= 0;
  const trigger = small ? (
    <IconButton size="small" onClick={()=>setOpen(true)} aria-label="edit"><EditIcon fontSize="small"/></IconButton>
  ) : (
    <Button variant="contained" onClick={()=>setOpen(true)}>➕ Add Coupon</Button>
  );
  return (
    <>
      {trigger}
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{initial ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Code" value={code} onChange={(e)=>setCode(e.target.value)} autoFocus required/>
            <FormControl>
              <InputLabel id="discount-type">Discount Type</InputLabel>
              <Select labelId="discount-type" label="Discount Type" value={type} onChange={(e)=> setType(e.target.value as any)}>
                <MenuItem value="percent">Percent</MenuItem>
                <MenuItem value="fixed">Fixed Amount</MenuItem>
              </Select>
            </FormControl>
            <TextField label={type === 'percent' ? 'Percent (%)' : 'Amount'} type="number" value={value} onChange={(e)=>setValue(Number(e.target.value))}/>
            <TextField label="Expiry (optional)" type="date" value={expiry} onChange={(e)=>setExpiry(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!canSave} onClick={()=>{ onSave({ code: code.trim(), type, value, expiry: expiry.trim() || undefined }); setOpen(false); }}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function EditCategoryDialog({ initial, onSave, small }: { initial?: CategoryInput; onSave: (val: Partial<CategoryInput>) => void; small?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [parent, setParent] = useState(initial?.parent || '');
  const canSave = name.trim().length > 0;
  const trigger = small ? (
    <IconButton size="small" onClick={()=>setOpen(true)} aria-label="edit"><EditIcon fontSize="small"/></IconButton>
  ) : (
    <Button variant="contained" onClick={()=>setOpen(true)}>Edit Category</Button>
  );
  return (
    <>
      {trigger}
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{initial ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Name" value={name} onChange={(e)=>setName(e.target.value)} autoFocus required/>
            <TextField label="Description" value={description} onChange={(e)=>setDescription(e.target.value)} multiline minRows={2}/>
            <TextField label="Parent (optional)" value={parent} onChange={(e)=>setParent(e.target.value)}/>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!canSave} onClick={()=>{
            const trimmedParent = parent.trim();
            const looksLikeId = /^[a-fA-F0-9]{24}$/.test(trimmedParent);
            onSave({ name: name.trim(), description: description.trim() || undefined, parent: looksLikeId ? trimmedParent : undefined });
            setOpen(false);
          }}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function EditTagDialog({ initial, onSave, small }: { initial?: TagInput; onSave: (val: Partial<TagInput>) => void; small?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const canSave = name.trim().length > 0;
  const trigger = small ? (
    <IconButton size="small" onClick={()=>setOpen(true)} aria-label="edit"><EditIcon fontSize="small"/></IconButton>
  ) : (
    <Button variant="contained" onClick={()=>setOpen(true)}>Edit Tag</Button>
  );
  return (
    <>
      {trigger}
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{initial ? 'Edit Tag' : 'Add Tag'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Name" value={name} onChange={(e)=>setName(e.target.value)} autoFocus required/>
            <TextField label="Description" value={description} onChange={(e)=>setDescription(e.target.value)} multiline minRows={2}/>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!canSave} onClick={()=>{ onSave({ name: name.trim(), description: description.trim() || undefined }); setOpen(false); }}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function NewProductDialogEx({ shopId, onCreated, taxes }: { shopId: string | null; onCreated: (p: any) => void; taxes: Array<{ id: string; name: string; percent: number; active: boolean }> }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [mrp, setMrp] = useState<number | ''>('');
  const [currency, setCurrency] = useState('INR');
  const [taxRate, setTaxRate] = useState<number | ''>('');
  const [stock, setStock] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>('active');
  const brandsState = useAppSelector(s=>s.brands.items);
  const categoriesState = useAppSelector(s=>s.categories.items);
  const tagsState = useAppSelector(s=>s.tags.items);
  const [brandId, setBrandId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [imagesCsv, setImagesCsv] = useState('');
  const [variants, setVariants] = useState<Array<{ sku?: string; price: number; stock?: number }>>([]);
  const [variantImageUrls, setVariantImageUrls] = useState<Record<number, string>>({});
  const [applyCoupon, setApplyCoupon] = useState(false);
  const [couponType, setCouponType] = useState<'percent' | 'fixed'>('percent');
  const [couponValue, setCouponValue] = useState<number | ''>('');
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const saving = false;
  const canSave = !!shopId && title.trim().length > 1 && price > 0;
  function addVariant() {
    setVariants(v=> [...v, { sku: '', price: 0, stock: 0 }]);
  }
  function updateVariant(i: number, patch: Partial<{ sku?: string; price: number; stock?: number }>) {
    setVariants(v=> v.map((row, idx)=> idx===i ? { ...row, ...patch } : row));
  }
  function removeVariant(i: number) { setVariants(v=> v.filter((_, idx)=> idx!==i)); }
  return (
    <>
      <Button variant="contained" onClick={()=>setOpen(true)} disabled={!shopId}>➕ Add Product</Button>
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Product</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Title" value={title} onChange={(e)=>setTitle(e.target.value)} autoFocus required sx={{ bgcolor: 'white' }}/>
            <TextField label="SKU (optional)" value={sku} onChange={(e)=>setSku(e.target.value)} sx={{ bgcolor: 'white' }}/>
            <Stack direction="row" spacing={2}>
              <TextField label="Price" type="number" value={price} onChange={(e)=>setPrice(Number(e.target.value))} required sx={{ flex: 1, bgcolor: 'white' }}/>
              <TextField label="MRP (optional)" type="number" value={mrp} onChange={(e)=>setMrp(e.target.value === '' ? '' : Number(e.target.value))} sx={{ flex: 1, bgcolor: 'white' }}/>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Currency" value={currency} onChange={(e)=>setCurrency(e.target.value)} sx={{ flex: 1, bgcolor: 'white' }}/>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel id="tax-select">Tax</InputLabel>
                <Select labelId="tax-select" label="Tax" value={String(taxRate === '' ? '' : taxRate)} onChange={(e)=>{
                  const v = e.target.value as string; if (v==='') setTaxRate(''); else setTaxRate(Number(v));
                }}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {taxes.map((t) => <MenuItem key={t.id} value={String(t.percent)}>{t.name} ({t.percent}%)</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Stock" type="number" value={stock} onChange={(e)=>setStock(Number(e.target.value))} sx={{ flex: 1, bgcolor: 'white' }}/>
            </Stack>
            <TextField label="Description" value={description} onChange={(e)=>setDescription(e.target.value)} multiline minRows={3} sx={{ bgcolor: 'white' }} helperText="We can integrate CKEditor here if you want rich text."/>

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

            <Button component="label" variant="outlined">Upload Main Image
              <input hidden type="file" accept="image/*" onChange={(e)=> setMainFile((e.target.files && e.target.files[0]) || null)} />
            </Button>
            {mainFile && (
              <Stack direction="row" spacing={1}><Chip label={mainFile.name} /></Stack>
            )}
            <Button component="label" variant="outlined">Upload Gallery Images
              <input hidden type="file" accept="image/*" multiple onChange={(e)=> setGalleryFiles(Array.from(e.target.files || []))} />
            </Button>
            {galleryFiles.length>0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {galleryFiles.map((f, idx)=> <Chip key={idx} label={f.name} />)}
              </Stack>
            )}

            <Box>
              <Box component="h4" sx={{ fontSize: 16, fontWeight: 600, mb: 1 }}>Variants</Box>
              <Stack spacing={1}>
                {variants.map((v, i)=> (
                  <Stack key={i} direction="row" spacing={1} alignItems="center">
                    <TextField size="small" label="SKU" value={v.sku || ''} onChange={(e)=>updateVariant(i, { sku: e.target.value })} sx={{ width: 160 }}/>
                    <TextField size="small" label="Price" type="number" value={v.price} onChange={(e)=>updateVariant(i, { price: Number(e.target.value) })} sx={{ width: 140 }}/>
                    <TextField size="small" label="Stock" type="number" value={v.stock ?? 0} onChange={(e)=>updateVariant(i, { stock: Number(e.target.value) })} sx={{ width: 120 }}/>
                    <TextField size="small" label="Image URL (optional)" value={variantImageUrls[i] || ''} onChange={(e)=> setVariantImageUrls({ ...variantImageUrls, [i]: e.target.value })} sx={{ width: 240 }}/>
                    <Button size="small" color="error" onClick={()=>removeVariant(i)}>Remove</Button>
                  </Stack>
                ))}
                <Button variant="outlined" size="small" onClick={addVariant}>Add Variant</Button>
              </Stack>
            </Box>

            <Box>
              <Box component="h4" sx={{ fontSize: 16, fontWeight: 600, mb: 1 }}>Discount (optional)</Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <FormControl>
                  <InputLabel id="apply-coupon">Apply</InputLabel>
                  <Select labelId="apply-coupon" label="Apply" value={applyCoupon ? 'yes' : 'no'} onChange={(e)=> setApplyCoupon((e.target.value as string) === 'yes')} sx={{ minWidth: 120 }}>
                    <MenuItem value="no">No</MenuItem>
                    <MenuItem value="yes">Yes</MenuItem>
                  </Select>
                </FormControl>
                {applyCoupon && (
                  <>
                    <FormControl>
                      <InputLabel id="coupon-type">Type</InputLabel>
                      <Select labelId="coupon-type" label="Type" value={couponType} onChange={(e)=> setCouponType(e.target.value as any)} sx={{ minWidth: 140 }}>
                        <MenuItem value="percent">Percent</MenuItem>
                        <MenuItem value="fixed">Fixed Amount</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField label={couponType==='percent' ? 'Percent (%)' : 'Amount'} type="number" value={couponValue} onChange={(e)=> setCouponValue(e.target.value === '' ? '' : Number(e.target.value))} sx={{ width: 180, bgcolor: 'white' }} />
                  </>
                )}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!canSave || saving} onClick={async()=>{
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
                // image URLs removed; files will be uploaded via FormData
                variants: variants.filter(v=> (v.price ?? 0) > 0).map((v, i)=> ({ ...v, mainImage: (variantImageUrls[i] || '').trim() || undefined })),
                discount: applyCoupon ? { type: couponType, value: couponValue === '' ? 0 : couponValue } : undefined,
              };
              let res: Response;
              if (galleryFiles.length > 0 || mainFile) {
                const fd = new FormData();
                Object.entries(payload).forEach(([k, v])=>{
                  if (v === undefined || v === null) return;
                  if (Array.isArray(v) || typeof v === 'object') fd.append(k, JSON.stringify(v));
                  else fd.append(k, String(v));
                });
                if (mainFile) fd.append('file', mainFile); // first file becomes mainImage on backend
                for (const file of galleryFiles) fd.append('file', file);
                res = await fetch(`${API_BASE}/products`, { method: 'POST', body: fd, credentials: 'include' });
              } else {
                res = await fetch(`${API_BASE}/products`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify(payload)
                });
              }
              if (res.ok) {
                const data = await res.json();
                onCreated(data.product);
                setOpen(false);
                setTitle(''); setSku(''); setPrice(0); setMrp(''); setCurrency('INR'); setTaxRate(''); setStock(0);
                setDescription(''); setStatus('active'); setBrandId(''); setCategoryId(''); setTagIds([]); setImagesCsv(''); setVariants([]); setVariantImageUrls({}); setApplyCoupon(false); setCouponValue(''); setGalleryFiles([]); setMainFile(null);
              }
            } catch {}
          }}>Create</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
