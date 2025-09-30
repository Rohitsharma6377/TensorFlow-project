import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { api } from '@/lib/api'

export interface NotificationItem {
  _id: string
  type: string
  actor?: string | any
  shop?: string | any
  post?: string | any
  story?: string | any
  message?: string
  readAt?: string
  createdAt?: string
}

export interface NotificationsState {
  items: NotificationItem[]
  total: number
  page: number
  limit: number
  status: 'idle' | 'loading' | 'error'
  error?: string
  // When true, indicates in-memory seeded data is active; skip auto fetches
  seeded?: boolean
}

const initialState: NotificationsState = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
  status: 'idle',
}

export const listNotifications = createAsyncThunk(
  'notifications/list',
  async (payload: { page?: number; limit?: number } | undefined) => {
    const page = payload?.page ?? 1
    const limit = payload?.limit ?? 20
    const res = await api<{ success: boolean; items: NotificationItem[]; total: number; page: number; limit: number }>(
      `/api/v1/notifications?page=${page}&limit=${limit}`,
      { method: 'GET' }
    )
    return res
  },
  {
    // Skip fetch when seeded notifications are active
    condition: (_, { getState }) => {
      const state = getState() as any
      return !state?.notifications?.seeded
    },
  }
)

export const markRead = createAsyncThunk(
  'notifications/markRead',
  async (id: string) => {
    const res = await api<{ success: boolean; notification: NotificationItem }>(`/api/v1/notifications/mark-read`, {
      method: 'POST',
      body: JSON.stringify({ id }),
    })
    return res.notification
  }
)

export const markAllRead = createAsyncThunk(
  'notifications/markAllRead',
  async () => {
    await api<{ success: boolean }>(`/api/v1/notifications/mark-all-read`, { method: 'POST' })
    return true
  }
)

const slice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Replace current list with provided mock notifications
    seed(state, action: PayloadAction<NotificationItem[]>) {
      state.items = action.payload
      state.total = action.payload.length
      state.page = 1
      state.limit = Math.max(20, action.payload.length)
      state.status = 'idle'
      state.error = undefined
      state.seeded = true
    },
  },
  extraReducers(builder) {
    builder
      .addCase(listNotifications.pending, (s) => { s.status = 'loading'; s.error = undefined })
      .addCase(listNotifications.fulfilled, (s, a) => {
        s.status = 'idle'
        s.items = a.payload.items
        s.total = a.payload.total
        s.page = a.payload.page
        s.limit = a.payload.limit
      })
      .addCase(listNotifications.rejected, (s, a) => { s.status = 'error'; s.error = a.error.message })

      .addCase(markRead.fulfilled, (s, a: PayloadAction<NotificationItem>) => {
        const idx = s.items.findIndex(i => i._id === a.payload._id)
        if (idx >= 0) s.items[idx] = a.payload
      })
      .addCase(markAllRead.fulfilled, (s) => {
        s.items = s.items.map(i => ({ ...i, readAt: i.readAt || new Date().toISOString() }))
      })
  },
})

export const { seed: seedNotifications } = slice.actions
export default slice.reducer
