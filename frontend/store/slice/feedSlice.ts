import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { FeedAPI, PostsAPI, type PostDTO, type ApiError } from '@/lib/api'

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
  try {
    const res = await FeedAPI.list()
    if (Array.isArray(res.posts) && res.posts.length > 0) return res.posts
    // Fallback: if personalized feed is empty, show public posts
    const pub = await PostsAPI.list()
    return pub.posts
  } catch (e: any) {
    const err = e as ApiError
    if (err?.status === 401) {
      // Fallback to public posts on unauthorized
      const pub = await PostsAPI.list()
      return pub.posts
    }
    throw e
  }
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
