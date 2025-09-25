import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { CouponsAPI, type CouponDTO } from '@/lib/api'

export interface CouponState {
  items: CouponDTO[]
  status: 'idle' | 'loading' | 'error'
  error?: string
}

const initialState: CouponState = { items: [], status: 'idle' }

export const fetchCoupons = createAsyncThunk('coupons/list', async (shop?: string) => {
  const res = await CouponsAPI.list(shop)
  return res.coupons
})

export const createCoupon = createAsyncThunk('coupons/create', async (payload: Omit<CouponDTO, '_id'>) => {
  const res = await CouponsAPI.create(payload)
  return res.coupon
})

export const updateCoupon = createAsyncThunk('coupons/update', async ({ id, payload }: { id: string; payload: Partial<Omit<CouponDTO, 'shop'>> }) => {
  const res = await CouponsAPI.update(id, payload)
  return res.coupon
})

export const deleteCoupon = createAsyncThunk('coupons/delete', async (id: string) => {
  await CouponsAPI.remove(id)
  return id
})

const slice = createSlice({
  name: 'coupons',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchCoupons.pending, (s) => { s.status = 'loading'; s.error = undefined })
      .addCase(fetchCoupons.fulfilled, (s, a: PayloadAction<CouponDTO[]>) => { s.status = 'idle'; s.items = a.payload })
      .addCase(fetchCoupons.rejected, (s, a) => { s.status = 'error'; s.error = a.error.message })
      .addCase(createCoupon.fulfilled, (s, a: PayloadAction<CouponDTO>) => { s.items.unshift(a.payload) })
      .addCase(updateCoupon.fulfilled, (s, a: PayloadAction<CouponDTO>) => {
        const idx = s.items.findIndex(x => x._id === a.payload._id)
        if (idx !== -1) s.items[idx] = a.payload
      })
      .addCase(deleteCoupon.fulfilled, (s, a: PayloadAction<string>) => {
        s.items = s.items.filter(x => x._id !== a.payload)
      })
  },
})

export default slice.reducer
