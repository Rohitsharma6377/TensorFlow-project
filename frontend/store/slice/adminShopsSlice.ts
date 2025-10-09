import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { AdminAPI } from '@/lib/api'

export type AdminShop = {
  _id: string
  name: string
  owner?: { _id: string; name?: string }
  approved?: boolean
  status?: string
  ordersCount?: number
}

interface AdminShopsState {
  items: AdminShop[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error?: string | null
  page: number
  limit: number
  total: number
  q: string
  filter: '' | 'pending' | 'approved' | 'banned'
  from?: string
  to?: string
}

const initialState: AdminShopsState = {
  items: [],
  status: 'idle',
  error: null,
  page: 1,
  limit: 20,
  total: 0,
  q: '',
  filter: '',
}

export const fetchAdminShops = createAsyncThunk<{ items: AdminShop[]; total?: number; page: number; limit: number }, { page?: number; limit?: number; q?: string; status?: string; from?: string; to?: string } | undefined>(
  'adminShops/fetchAll',
  async (payload, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any
      const page = payload?.page ?? state.adminShops.page ?? 1
      const limit = payload?.limit ?? state.adminShops.limit ?? 20
      const q = payload?.q ?? state.adminShops.q ?? ''
      const status = payload?.status ?? (state.adminShops.filter || undefined)
      const from = payload?.from ?? state.adminShops.from
      const to = payload?.to ?? state.adminShops.to
      const res: any = await AdminAPI.shops.list({ page, limit, q, status, from, to })
      return { items: res?.shops || [], total: res?.total ?? 0, page: res?.page ?? page, limit: res?.limit ?? limit }
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to load shops') as any
    }
  }
)

export const approveShop = createAsyncThunk<{ id: string; approved: boolean }, { id: string; approved: boolean }>(
  'adminShops/approve',
  async ({ id, approved }, thunkAPI) => {
    try { await AdminAPI.shops.approve(id, approved); return { id, approved } } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to update approval') as any
    }
  }
)

export const banShop = createAsyncThunk<{ id: string; banned: boolean }, { id: string; banned: boolean }>(
  'adminShops/ban',
  async ({ id, banned }, thunkAPI) => {
    try { await AdminAPI.shops.ban(id, banned); return { id, banned } } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to update ban') as any
    }
  }
)

const adminShopsSlice = createSlice({
  name: 'adminShops',
  initialState,
  reducers: {
    setShopsQuery(state, action: PayloadAction<string>) { state.q = action.payload },
    setShopsPage(state, action: PayloadAction<number>) { state.page = action.payload },
    setShopsLimit(state, action: PayloadAction<number>) { state.limit = action.payload },
    setShopsFilter(state, action: PayloadAction<AdminShopsState['filter']>) { state.filter = action.payload },
    setShopsRange(state, action: PayloadAction<{ from?: string; to?: string }>) { state.from = action.payload.from; state.to = action.payload.to },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminShops.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(fetchAdminShops.fulfilled, (state, action: PayloadAction<{ items: AdminShop[]; total?: number; page: number; limit: number }>) => {
        state.status = 'succeeded'
        state.items = action.payload.items
        state.total = action.payload.total ?? state.total
        state.page = action.payload.page
        state.limit = action.payload.limit
      })
      .addCase(fetchAdminShops.rejected, (state, action: any) => { state.status = 'failed'; state.error = action.payload })
      .addCase(approveShop.fulfilled, (state, action) => {
        const it = state.items.find(x => x._id === action.payload.id); if (it) { it.approved = action.payload.approved; it.status = action.payload.approved ? 'approved' : 'pending' }
      })
      .addCase(banShop.fulfilled, (state, action) => {
        const it = state.items.find(x => x._id === action.payload.id); if (it) { it.status = action.payload.banned ? 'banned' : (it.approved ? 'approved' : 'pending') }
      })
  }
})

export const { setShopsQuery, setShopsPage, setShopsLimit, setShopsFilter, setShopsRange } = adminShopsSlice.actions
export default adminShopsSlice.reducer
