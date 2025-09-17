import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { FeedAPI, type PostDTO } from '@/lib/api'

interface FeedState {
  items: PostDTO[]
  status: 'idle' | 'loading' | 'error'
  error?: string
}

const initialState: FeedState = {
  items: [],
  status: 'idle',
}

export const fetchFeed = createAsyncThunk('feed/list', async () => {
  const res = await FeedAPI.list()
  return res.posts
})

const slice = createSlice({
  name: 'feed',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchFeed.pending, (s) => { s.status = 'loading'; s.error = undefined })
      .addCase(fetchFeed.fulfilled, (s, a: PayloadAction<PostDTO[]>) => { s.status = 'idle'; s.items = a.payload })
      .addCase(fetchFeed.rejected, (s, a) => { s.status = 'error'; s.error = a.error.message })
  },
})

export default slice.reducer
