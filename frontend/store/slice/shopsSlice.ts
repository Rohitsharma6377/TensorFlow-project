import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ShopsAPI, SocialAPI, type ShopListItemDTO } from '@/lib/api'

export interface SidebarShop extends ShopListItemDTO { followers?: number; isFollowing?: boolean }

interface ShopsState {
  items: SidebarShop[]
  status: 'idle' | 'loading' | 'error'
  error?: string
}

const initialState: ShopsState = {
  items: [],
  status: 'idle',
}

export const fetchSidebarShops = createAsyncThunk('shops/sidebarList', async () => {
  // Try featured shops first, fallback to latest
  let shops = (await ShopsAPI.list({ featured: true, limit: 10 })).shops
  if (!shops?.length) shops = (await ShopsAPI.list({ limit: 10 })).shops

  // Best-effort fetch followers for each shop
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
  const enriched: SidebarShop[] = await Promise.all(
    shops.map(async (s) => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/shops/${s._id}/stats`, { credentials: 'include' })
        const data = res.ok ? await res.json() : {}
        return { ...s, followers: data.followers || 0 }
      } catch {
        return { ...s }
      }
    })
  )
  // Fetch followed list to mark isFollowing (ignore errors if unauthenticated)
  try {
    const followingRes = await SocialAPI.following()
    const followingSet = new Set(followingRes.shops || [])
    enriched.forEach((it) => { if (followingSet.has(it._id)) it.isFollowing = true })
  } catch {}
  return enriched
})

export const toggleFollowShop = createAsyncThunk(
  'shops/toggleFollow',
  async (shop: { id: string; follow: boolean }, { rejectWithValue }) => {
    try {
      if (shop.follow) {
        await SocialAPI.follow(shop.id)
      } else {
        await SocialAPI.unfollow(shop.id)
      }
      return shop
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to toggle follow')
    }
  }
)

const shopsSlice = createSlice({
  name: 'shops',
  initialState,
  reducers: {
    setFollowing(state, action: PayloadAction<{ shopId: string; isFollowing: boolean }>) {
      const it = state.items.find((s) => s._id === action.payload.shopId)
      if (it) {
        const wasFollowing = !!it.isFollowing
        it.isFollowing = action.payload.isFollowing
        if (typeof it.followers === 'number') {
          // Adjust follower count optimistically
          if (!wasFollowing && action.payload.isFollowing) it.followers += 1
          if (wasFollowing && !action.payload.isFollowing) it.followers = Math.max(0, it.followers - 1)
        }
      }
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchSidebarShops.pending, (s) => {
        s.status = 'loading'
        s.error = undefined
      })
      .addCase(fetchSidebarShops.fulfilled, (s, a: PayloadAction<SidebarShop[]>) => {
        s.status = 'idle'
        s.items = a.payload
      })
      .addCase(fetchSidebarShops.rejected, (s, a) => {
        s.status = 'error'
        s.error = a.error.message
      })
      .addCase(toggleFollowShop.fulfilled, (s, a) => {
        const { id, follow } = a.payload as { id: string; follow: boolean }
        const it = s.items.find((x) => x._id === id)
        if (it) {
          const was = !!it.isFollowing
          it.isFollowing = follow
          if (typeof it.followers === 'number') {
            if (!was && follow) it.followers += 1
            if (was && !follow) it.followers = Math.max(0, it.followers - 1)
          }
        }
      })
  },
})

export const { setFollowing } = shopsSlice.actions
export default shopsSlice.reducer
