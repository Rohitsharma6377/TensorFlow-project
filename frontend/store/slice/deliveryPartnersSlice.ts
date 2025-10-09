import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { AdminAPI } from '@/lib/api'

export type DeliveryPartner = {
  _id: string
  name: string
  region?: string
  sla?: string
  status?: string
}

interface DeliveryPartnersState {
  items: DeliveryPartner[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error?: string | null
  page: number
  limit: number
  total: number
  q: string
}

const initialState: DeliveryPartnersState = {
  items: [],
  status: 'idle',
  error: null,
  page: 1,
  limit: 20,
  total: 0,
  q: '',
}

export const fetchDeliveryPartners = createAsyncThunk<{ items: DeliveryPartner[]; total?: number; page: number; limit: number }, { page?: number; limit?: number; q?: string } | undefined>(
  'deliveryPartners/fetchAll',
  async (payload, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any
      const page = payload?.page ?? state.deliveryPartners.page ?? 1
      const limit = payload?.limit ?? state.deliveryPartners.limit ?? 20
      const q = payload?.q ?? state.deliveryPartners.q ?? ''
      const res: any = await AdminAPI.delivery.partners({ page, limit, q })
      return { items: res?.partners || [], total: res?.total ?? 0, page: res?.page ?? page, limit: res?.limit ?? limit }
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to load partners') as any
    }
  }
)

const deliveryPartnersSlice = createSlice({
  name: 'deliveryPartners',
  initialState,
  reducers: {
    setPartnerQuery(state, action: PayloadAction<string>) { state.q = action.payload },
    setPartnerPage(state, action: PayloadAction<number>) { state.page = action.payload },
    setPartnerLimit(state, action: PayloadAction<number>) { state.limit = action.payload },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeliveryPartners.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(fetchDeliveryPartners.fulfilled, (state, action: PayloadAction<{ items: DeliveryPartner[]; total?: number; page: number; limit: number }>) => {
        state.status = 'succeeded'
        state.items = action.payload.items
        state.total = action.payload.total ?? state.total
        state.page = action.payload.page
        state.limit = action.payload.limit
      })
      .addCase(fetchDeliveryPartners.rejected, (state, action: any) => { state.status = 'failed'; state.error = action.payload })
  }
})

export const { setPartnerQuery, setPartnerPage, setPartnerLimit } = deliveryPartnersSlice.actions
export default deliveryPartnersSlice.reducer
