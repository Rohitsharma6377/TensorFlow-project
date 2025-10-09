import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { AdminAPI } from '@/lib/api'

export type AdminUser = {
  _id: string
  name: string
  username?: string
  email: string
  role: 'user' | 'seller' | 'admin' | 'superadmin'
  status: 'active' | 'deactivated' | 'fraud_check'
  isBanned?: boolean
  premiumUntil?: string | null
}

interface AdminUsersState {
  items: AdminUser[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error?: string | null
  page: number
  limit: number
  total: number
  q: string
  from?: string
  to?: string
}

const initialState: AdminUsersState = {
  items: [],
  status: 'idle',
  error: null,
  page: 1,
  limit: 20,
  total: 0,
  q: '',
  from: undefined,
  to: undefined,
}

export const fetchAdminUsers = createAsyncThunk<{ users: AdminUser[]; total?: number; page: number; limit: number }, { page?: number; limit?: number; q?: string; from?: string; to?: string } | undefined>(
  'adminUsers/fetchAll',
  async (payload, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any
      const page = payload?.page ?? state.adminUsers.page ?? 1
      const limit = payload?.limit ?? state.adminUsers.limit ?? 20
      const q = payload?.q ?? state.adminUsers.q ?? ''
      const from = payload?.from ?? state.adminUsers.from
      const to = payload?.to ?? state.adminUsers.to
      const res = await AdminAPI.users.list({ page, limit, q, from, to })
      return { users: (res as any).users || [], total: (res as any).total ?? 0, page: (res as any).page ?? page, limit: (res as any).limit ?? limit }
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to load users') as any
    }
  }
)

export const deactivateUser = createAsyncThunk<{ id: string; until?: string } , { id: string; until?: string }>(
  'adminUsers/deactivate',
  async ({ id, until }, thunkAPI) => {
    try {
      await AdminAPI.users.ban(id, true, until)
      return { id, until }
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to deactivate') as any
    }
  }
)

export const notifyUser = createAsyncThunk<{ id: string; channel: 'email' | 'sms'; message: string }, { id: string; channel: 'email' | 'sms'; message: string }>(
  'adminUsers/notify',
  async ({ id, channel, message }, thunkAPI) => {
    try {
      await AdminAPI.users.notify(id, channel, message)
      return { id, channel, message }
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to notify') as any
    }
  }
)

export const unblockUser = createAsyncThunk<{ id: string }, { id: string }>(
  'adminUsers/unblock',
  async ({ id }, thunkAPI) => {
    try {
      await AdminAPI.users.ban(id, false)
      return { id }
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to unblock') as any
    }
  }
)

const adminUsersSlice = createSlice({
  name: 'adminUsers',
  initialState,
  reducers: {
    seedAdminUsers(state, action: PayloadAction<AdminUser[]>) {
      state.items = action.payload
      state.status = 'succeeded'
      state.error = null
    },
    setQuery(state, action: PayloadAction<string>) { state.q = action.payload },
    setPage(state, action: PayloadAction<number>) { state.page = action.payload },
    setLimit(state, action: PayloadAction<number>) { state.limit = action.payload },
    setUserRange(state, action: PayloadAction<{ from?: string; to?: string }>) { state.from = action.payload.from; state.to = action.payload.to },
    setUserStatus(state, action: PayloadAction<{ id: string; status: 'active'|'deactivated' }>) {
      const u = state.items.find(x => x._id === action.payload.id)
      if (u) {
        u.status = action.payload.status
        u.isBanned = action.payload.status !== 'active'
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminUsers.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(fetchAdminUsers.fulfilled, (state, action: PayloadAction<{ users: AdminUser[]; total?: number; page: number; limit: number }>) => {
        state.status = 'succeeded';
        state.items = action.payload.users;
        state.total = action.payload.total ?? state.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchAdminUsers.rejected, (state, action: any) => { state.status = 'failed'; state.error = action.payload })
      .addCase(deactivateUser.fulfilled, (state, action) => {
        const u = state.items.find(x => x._id === action.payload.id)
        if (u) { u.status = 'deactivated'; u.isBanned = true }
      })
      .addCase(unblockUser.fulfilled, (state, action) => {
        const u = state.items.find(x => x._id === action.payload.id)
        if (u) { u.status = 'active'; u.isBanned = false }
      })
  }
})

export const { seedAdminUsers, setQuery, setPage, setLimit, setUserStatus } = adminUsersSlice.actions
export default adminUsersSlice.reducer
