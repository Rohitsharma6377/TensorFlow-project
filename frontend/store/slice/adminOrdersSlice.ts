import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { AdminAPI } from '@/lib/api'

export type AdminOrder = {
  _id: string
  shop?: { _id: string; name?: string } | string
  amount?: number
  status?: string
  createdAt?: string
}

interface AdminOrdersState {
  items: AdminOrder[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error?: string | null
  page: number
  limit: number
  total: number
  q: string
  statusFilter: string
  from?: string
  to?: string
  sum?: number
}

const initialState: AdminOrdersState = {
  items: [],
  status: 'idle',
  error: null,
  page: 1,
  limit: 20,
  total: 0,
  q: '',
  statusFilter: '',
  sum: 0,
}

export const fetchAdminOrders = createAsyncThunk<{ items: AdminOrder[]; total?: number; page: number; limit: number; sum?: number }, { page?: number; limit?: number; q?: string; status?: string; from?: string; to?: string } | undefined>(
  'adminOrders/fetchAll',
  async (payload, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any
      const page = payload?.page ?? state.adminOrders.page ?? 1
      const limit = payload?.limit ?? state.adminOrders.limit ?? 20
      const q = payload?.q ?? state.adminOrders.q ?? ''
      const status = payload?.status ?? (state.adminOrders.statusFilter || undefined)
      const from = payload?.from ?? state.adminOrders.from
      const to = payload?.to ?? state.adminOrders.to
      const res: any = await AdminAPI.orders.list({ page, limit, q, status, from, to })
      return { items: res?.orders || [], total: res?.total ?? 0, page: res?.page ?? page, limit: res?.limit ?? limit, sum: res?.sum }
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to load orders') as any
    }
  }
)

const adminOrdersSlice = createSlice({
  name: 'adminOrders',
  initialState,
  reducers: {
    setOrdersQuery(state, action: PayloadAction<string>) { state.q = action.payload },
    setOrdersPage(state, action: PayloadAction<number>) { state.page = action.payload },
    setOrdersLimit(state, action: PayloadAction<number>) { state.limit = action.payload },
    setOrdersStatus(state, action: PayloadAction<string>) { state.statusFilter = action.payload },
    setOrdersRange(state, action: PayloadAction<{ from?: string; to?: string }>) { state.from = action.payload.from; state.to = action.payload.to },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminOrders.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(fetchAdminOrders.fulfilled, (state, action: PayloadAction<{ items: AdminOrder[]; total?: number; page: number; limit: number; sum?: number }>) => {
        state.status = 'succeeded'
        state.items = action.payload.items
        state.total = action.payload.total ?? state.total
        state.page = action.payload.page
        state.limit = action.payload.limit
        state.sum = action.payload.sum ?? state.sum
      })
      .addCase(fetchAdminOrders.rejected, (state, action: any) => { state.status = 'failed'; state.error = action.payload })
  }
})

export const { setOrdersQuery, setOrdersPage, setOrdersLimit, setOrdersStatus, setOrdersRange } = adminOrdersSlice.actions
export default adminOrdersSlice.reducer
