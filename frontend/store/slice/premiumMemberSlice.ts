import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { api } from '@/lib/api'

export type PremiumMember = {
  id: string
  userId: string
  name: string
  email: string
  tier: 'silver' | 'gold' | 'platinum'
  renewal: string
  status: 'active' | 'expired'
}

interface PremiumMemberState {
  items: PremiumMember[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error?: string | null
}

const initialState: PremiumMemberState = {
  items: [],
  status: 'idle',
  error: null,
}

export const fetchPremiumMembers = createAsyncThunk<PremiumMember[]>(
  'premiumMembers/fetchAll',
  async (_, thunkAPI) => {
    try {
      const res = await api<{ members: PremiumMember[] }>("/api/v1/admin/premium-members", { method: 'GET' })
      return res.members || []
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to load members') as any
    }
  }
)

export const sendRenewalReminder = createAsyncThunk<{ id: string; channel: 'email' | 'sms' } , { id: string; channel: 'email' | 'sms' }>(
  'premiumMembers/reminder',
  async ({ id, channel }, thunkAPI) => {
    try {
      await api(`/api/v1/admin/premium-members/${id}/reminder`, { method: 'POST', body: JSON.stringify({ channel }) })
      return { id, channel }
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to send reminder') as any
    }
  }
)

const premiumMemberSlice = createSlice({
  name: 'premiumMembers',
  initialState,
  reducers: {
    seedPremiumMembers(state, action: PayloadAction<PremiumMember[]>) {
      state.items = action.payload
      state.status = 'succeeded'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPremiumMembers.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(fetchPremiumMembers.fulfilled, (state, action: PayloadAction<PremiumMember[]>) => { state.status = 'succeeded'; state.items = action.payload })
      .addCase(fetchPremiumMembers.rejected, (state, action: any) => { state.status = 'failed'; state.error = action.payload })
  }
})

export const { seedPremiumMembers } = premiumMemberSlice.actions
export default premiumMemberSlice.reducer
