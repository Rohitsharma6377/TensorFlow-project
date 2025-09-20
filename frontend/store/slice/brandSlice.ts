import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { BrandsAPI, type BrandDTO } from '@/lib/api'

export interface BrandState {
  items: BrandDTO[]
  status: 'idle' | 'loading' | 'error'
  error?: string
}

const initialState: BrandState = {
  items: [],
  status: 'idle',
}

export const fetchBrands = createAsyncThunk('brands/list', async (shopId?: string) => {
  const res = await BrandsAPI.list(shopId)
  return res.brands
})

export const createBrand = createAsyncThunk('brands/create', async (payload: Omit<BrandDTO, '_id' | 'logo'> & { logoFile?: File }) => {
  const res = await BrandsAPI.create(payload)
  return res.brand
})

export const updateBrand = createAsyncThunk('brands/update', async ({ id, payload }: { id: string; payload: Partial<Omit<BrandDTO, 'shop'>> & { logoFile?: File } }) => {
  const res = await BrandsAPI.update(id, payload)
  return res.brand
})

export const deleteBrand = createAsyncThunk('brands/delete', async (id: string) => {
  await BrandsAPI.remove(id)
  return id
})

const slice = createSlice({
  name: 'brands',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchBrands.pending, (s) => { s.status = 'loading'; s.error = undefined })
      .addCase(fetchBrands.fulfilled, (s, a: PayloadAction<BrandDTO[]>) => { s.status = 'idle'; s.items = a.payload })
      .addCase(fetchBrands.rejected, (s, a) => { s.status = 'error'; s.error = a.error.message })

      .addCase(createBrand.fulfilled, (s, a: PayloadAction<BrandDTO>) => { s.items.unshift(a.payload) })
      .addCase(updateBrand.fulfilled, (s, a: PayloadAction<BrandDTO>) => {
        const idx = s.items.findIndex(x => x._id === a.payload._id)
        if (idx !== -1) s.items[idx] = a.payload
      })
      .addCase(deleteBrand.fulfilled, (s, a: PayloadAction<string>) => { s.items = s.items.filter(x => x._id !== a.payload) })
  },
})

export default slice.reducer
