import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { AdminAPI } from '@/lib/api'

export type Payout = {
  id: string
  shop: string
  amount: number
  status: 'pending' | 'processing' | 'paid' | 'failed'
  date: string
  method?: 'razorpay' | 'bank' | 'other'
}

interface PayoutAdminState {
  items: Payout[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error?: string | null
  page: number
  limit: number
  total: number
  q: string
  statusFilter: '' | 'pending' | 'processing' | 'paid' | 'failed'
  from?: string
  to?: string
}

const initialState: PayoutAdminState = {
  items: [],
  status: 'idle',
  error: null,
  page: 1,
  limit: 20,
  total: 0,
  q: '',
  statusFilter: '',
}

export const fetchPayouts = createAsyncThunk<{ items: Payout[]; total?: number; page: number; limit: number }, { page?: number; limit?: number; q?: string; status?: string; from?: string; to?: string } | undefined>(
  'payouts/fetchAll',
  async (payload, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any
      const page = payload?.page ?? state.payouts.page ?? 1
      const limit = payload?.limit ?? state.payouts.limit ?? 20
      const q = payload?.q ?? state.payouts.q ?? ''
      const status = payload?.status ?? (state.payouts.statusFilter || undefined)
      const from = payload?.from ?? state.payouts.from
      const to = payload?.to ?? state.payouts.to
      const res: any = await AdminAPI.payouts.list({ page, limit, q, status, from, to })
      return { items: res?.payouts || [], total: res?.total ?? 0, page: res?.page ?? page, limit: res?.limit ?? limit }
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to load payouts') as any
    }
  }
)

const payoutAdminSlice = createSlice({
  name: 'payouts',
  initialState,
  reducers: {
    seedPayouts(state, action: PayloadAction<Payout[]>) {
      state.items = action.payload
      state.status = 'succeeded'
      state.error = null
    },
    setPayoutQuery(state, action: PayloadAction<string>) { state.q = action.payload },
    setPayoutPage(state, action: PayloadAction<number>) { state.page = action.payload },
    setPayoutLimit(state, action: PayloadAction<number>) { state.limit = action.payload },
    setPayoutStatus(state, action: PayloadAction<PayoutAdminState['statusFilter']>) { state.statusFilter = action.payload },
    setPayoutRange(state, action: PayloadAction<{ from?: string; to?: string }>) { state.from = action.payload.from; state.to = action.payload.to },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayouts.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(fetchPayouts.fulfilled, (state, action: PayloadAction<{ items: Payout[]; total?: number; page: number; limit: number }>) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.total = action.payload.total ?? state.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchPayouts.rejected, (state, action: any) => { state.status = 'failed'; state.error = action.payload })
  }
})

export const { seedPayouts, setPayoutQuery, setPayoutPage, setPayoutLimit, setPayoutStatus, setPayoutRange } = payoutAdminSlice.actions
export default payoutAdminSlice.reducer
