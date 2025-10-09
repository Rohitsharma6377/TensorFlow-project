import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { AdminAPI } from '@/lib/api'

export type AdminContact = {
  _id: string
  name?: string
  email?: string
  subject?: string
  status?: string
  createdAt?: string
}

interface AdminContactsState {
  items: AdminContact[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error?: string | null
  page: number
  limit: number
  total: number
  q: string
}

const initialState: AdminContactsState = {
  items: [],
  status: 'idle',
  error: null,
  page: 1,
  limit: 20,
  total: 0,
  q: '',
}

export const fetchAdminContacts = createAsyncThunk<{ items: AdminContact[]; total?: number; page: number; limit: number }, { page?: number; limit?: number; q?: string } | undefined>(
  'adminContacts/fetchAll',
  async (payload, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any
      const page = payload?.page ?? state.adminContacts.page ?? 1
      const limit = payload?.limit ?? state.adminContacts.limit ?? 20
      const q = payload?.q ?? state.adminContacts.q ?? ''
      const res: any = await AdminAPI.contacts.list({ page, limit, q })
      return { items: res?.contacts || [], total: res?.total ?? 0, page: res?.page ?? page, limit: res?.limit ?? limit }
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to load contacts') as any
    }
  }
)

const adminContactsSlice = createSlice({
  name: 'adminContacts',
  initialState,
  reducers: {
    setContactsQuery(state, action: PayloadAction<string>) { state.q = action.payload },
    setContactsPage(state, action: PayloadAction<number>) { state.page = action.payload },
    setContactsLimit(state, action: PayloadAction<number>) { state.limit = action.payload },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminContacts.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(fetchAdminContacts.fulfilled, (state, action: PayloadAction<{ items: AdminContact[]; total?: number; page: number; limit: number }>) => {
        state.status = 'succeeded'
        state.items = action.payload.items
        state.total = action.payload.total ?? state.total
        state.page = action.payload.page
        state.limit = action.payload.limit
      })
      .addCase(fetchAdminContacts.rejected, (state, action: any) => { state.status = 'failed'; state.error = action.payload })
  }
})

export const { setContactsQuery, setContactsPage, setContactsLimit } = adminContactsSlice.actions
export default adminContactsSlice.reducer
