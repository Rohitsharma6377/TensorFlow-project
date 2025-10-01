import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { api } from '@/lib/api'

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
}

const initialState: PayoutAdminState = {
  items: [],
  status: 'idle',
  error: null,
}

export const fetchPayouts = createAsyncThunk<Payout[]>(
  'payouts/fetchAll',
  async (_, thunkAPI) => {
    try {
      const res = await api<{ payouts: Payout[] }>("/api/v1/admin/payouts", { method: 'GET' })
      return res.payouts || []
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayouts.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(fetchPayouts.fulfilled, (state, action: PayloadAction<Payout[]>) => { state.status = 'succeeded'; state.items = action.payload })
      .addCase(fetchPayouts.rejected, (state, action: any) => { state.status = 'failed'; state.error = action.payload })
  }
})

export const { seedPayouts } = payoutAdminSlice.actions
export default payoutAdminSlice.reducer
