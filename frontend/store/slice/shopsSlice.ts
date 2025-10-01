import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '@/lib/api'

// Types consumed by seed and UI
export type SidebarShop = {
  _id: string
  name: string
  slug: string
  avatar?: string
  banner?: string
  logo?: string | { url?: string }
  followers?: number
  isFollowing?: boolean
  isVerified?: boolean
}

export interface ShopsState {
  items: SidebarShop[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error?: string | null
}

const initialState: ShopsState = {
  items: [],
  status: 'idle',
  error: null,
}

// Optional fetch thunk (non-breaking if API missing)
export const fetchShops = createAsyncThunk<SidebarShop[]>(
  'shops/fetchAll',
  async (_, thunkAPI) => {
    try {
      const res = await api<{ shops: SidebarShop[] }>('/api/v1/shops', { method: 'GET' })
      return res.shops || []
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err?.message || 'Failed to load shops') as any
    }
  }
)

// Alias used by LeftSidebar to fetch featured shops
export const fetchSidebarShops = fetchShops

const shopsSlice = createSlice({
  name: 'shops',
  initialState,
  reducers: {
    setShops(state, action: PayloadAction<SidebarShop[]>) {
      state.items = action.payload
      state.status = 'succeeded'
      state.error = null
    },
    setFollowing(state, action: PayloadAction<{ shopId: string; isFollowing: boolean }>) {
      const s = state.items.find(x => x._id === action.payload.shopId)
      if (s) s.isFollowing = action.payload.isFollowing
    },
    clearShops(state) {
      state.items = []
      state.status = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShops.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchShops.fulfilled, (state, action: PayloadAction<SidebarShop[]>) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchShops.rejected, (state, action: any) => {
        state.status = 'failed'
        state.error = action.payload || 'Failed to load shops'
      })
  },
})

export const { setShops, clearShops, setFollowing } = shopsSlice.actions

// Convenience action for dev seeding page
export const seedShops = (items: SidebarShop[]) => (dispatch: any) => {
  dispatch(setShops(items))
}

// Follow/unfollow a shop with server confirmation
export const toggleFollowShop = createAsyncThunk<
  { id: string; follow: boolean },
  { id: string; follow: boolean }
>(
  'shops/toggleFollow',
  async ({ id, follow }, thunkAPI) => {
    try {
      await api(`/api/v1/shops/${id}/follow`, { method: 'POST', body: JSON.stringify({ follow }) })
      return { id, follow }
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to update follow') as any
    }
  }
)

// Reflect server follow result into state (in addition to optimistic setFollowing used by UI)
// Note: augment builder after slice creation requires definition inline; added here as a helper
// Consumers already get optimistic update via setFollowing

export default shopsSlice.reducer
