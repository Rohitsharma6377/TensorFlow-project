import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { WishlistCollectionsAPI } from '@/lib/api'

export interface WishlistCollectionItem { product: string }
export interface WishlistCollection { _id: string; name: string; items: WishlistCollectionItem[] }

interface State {
  collections: WishlistCollection[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error?: string
}

const initialState: State = { collections: [], status: 'idle' }

export const listCollections = createAsyncThunk('wlCollections/list', async () => {
  const res = await WishlistCollectionsAPI.list()
  return res.collections as WishlistCollection[]
})

export const createCollection = createAsyncThunk('wlCollections/create', async (name: string) => {
  const res = await WishlistCollectionsAPI.create(name)
  return res.collection as WishlistCollection
})

export const addToCollection = createAsyncThunk(
  'wlCollections/addItem',
  async (payload: { collectionId: string; productId: string }) => {
    const res = await WishlistCollectionsAPI.addItem(payload.collectionId, payload.productId)
    return res.collection as WishlistCollection
  }
)

export const removeFromCollection = createAsyncThunk(
  'wlCollections/removeItem',
  async (payload: { collectionId: string; productId: string }) => {
    const res = await WishlistCollectionsAPI.removeItem(payload.collectionId, payload.productId)
    return res.collection as WishlistCollection
  }
)

const slice = createSlice({
  name: 'wishlistCollections',
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<{ collections: WishlistCollection[] }>) {
      state.collections = action.payload.collections
    },
  },
  extraReducers(builder) {
    builder
      .addCase(listCollections.pending, (s) => { s.status = 'loading' })
      .addCase(listCollections.fulfilled, (s, a) => { s.status = 'succeeded'; s.collections = a.payload })
      .addCase(listCollections.rejected, (s, a: any) => { s.status = 'failed'; s.error = a.error?.message })
      .addCase(createCollection.fulfilled, (s, a) => { s.collections.push(a.payload) })
      .addCase(addToCollection.fulfilled, (s, a) => {
        const i = s.collections.findIndex(c => c._id === a.payload._id)
        if (i !== -1) s.collections[i] = a.payload
      })
      .addCase(removeFromCollection.fulfilled, (s, a) => {
        const i = s.collections.findIndex(c => c._id === a.payload._id)
        if (i !== -1) s.collections[i] = a.payload
      })
  }
})

export const { hydrate } = slice.actions
export default slice.reducer
