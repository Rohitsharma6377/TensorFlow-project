import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { api } from '@/lib/api'

export type AdminUser = {
  _id: string
  name: string
  email: string
  role: 'user' | 'seller' | 'admin' | 'superadmin'
  status: 'active' | 'deactivated' | 'fraud_check'
  premiumUntil?: string | null
}

interface AdminUsersState {
  items: AdminUser[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error?: string | null
}

const initialState: AdminUsersState = {
  items: [],
  status: 'idle',
  error: null,
}

export const fetchAdminUsers = createAsyncThunk<AdminUser[]>(
  'adminUsers/fetchAll',
  async (_, thunkAPI) => {
    try {
      const res = await api<{ users: AdminUser[] }>("/api/v1/users", { method: 'GET' })
      return res.users || []
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to load users') as any
    }
  }
)

export const deactivateUser = createAsyncThunk<{ id: string; until?: string } , { id: string; until?: string }>(
  'adminUsers/deactivate',
  async ({ id, until }, thunkAPI) => {
    try {
      await api(`/api/v1/admin/users/${id}/ban`, { method: 'POST', body: JSON.stringify({ ban: true, until }) })
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
      await api(`/api/v1/admin/users/${id}/notify`, { method: 'POST', body: JSON.stringify({ channel, message }) })
      return { id, channel, message }
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to notify') as any
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminUsers.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(fetchAdminUsers.fulfilled, (state, action: PayloadAction<AdminUser[]>) => { state.status = 'succeeded'; state.items = action.payload })
      .addCase(fetchAdminUsers.rejected, (state, action: any) => { state.status = 'failed'; state.error = action.payload })
      .addCase(deactivateUser.fulfilled, (state, action) => {
        const u = state.items.find(x => x._id === action.payload.id)
        if (u) { u.status = 'deactivated' }
      })
  }
})

export const { seedAdminUsers } = adminUsersSlice.actions
export default adminUsersSlice.reducer
