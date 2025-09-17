import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { WishlistAPI } from '@/lib/api'

export interface WishlistItem { productId: string; title: string; price?: number; image?: string }

interface WishlistState {
  items: WishlistItem[]
}

function loadWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('wishlist') || '[]') } catch { return [] }
}
function saveWishlist(items: WishlistItem[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem('wishlist', JSON.stringify(items)) } catch {}
}

const initialState: WishlistState = { items: [] }

export const addToWishlist = createAsyncThunk(
  'wishlist/add',
  async (payload: { productId: string }, { rejectWithValue }) => {
    try {
      await WishlistAPI.add(payload.productId)
      return payload
    } catch (e: any) {
      // If not logged in or API fails, still allow local wishlist
      return rejectWithValue(payload)
    }
  }
)

const slice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    hydrate(state) { state.items = loadWishlist() },
    addLocal(state, action: PayloadAction<WishlistItem>) {
      if (!state.items.find(i => i.productId === action.payload.productId)) {
        state.items.push(action.payload)
        saveWishlist(state.items)
      }
    },
    remove(state, action: PayloadAction<string>) {
      state.items = state.items.filter(i => i.productId !== action.payload)
      saveWishlist(state.items)
    }
  },
  extraReducers(builder) {
    builder
      .addCase(addToWishlist.fulfilled, (s, a: any) => {
        // Server accepted; also ensure local saved
        const pid = a.payload.productId
        if (!s.items.find(i => i.productId === pid)) s.items.push({ productId: pid, title: '' })
        saveWishlist(s.items)
      })
      .addCase(addToWishlist.rejected, (s, a: any) => {
        // Save locally on failure
        const pid = a.payload?.productId
        if (pid && !s.items.find(i => i.productId === pid)) {
          s.items.push({ productId: pid, title: '' })
          saveWishlist(s.items)
        }
      })
  }
})

export const { hydrate, addLocal, remove } = slice.actions
export default slice.reducer
