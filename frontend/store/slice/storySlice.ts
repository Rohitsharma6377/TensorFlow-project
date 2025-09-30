import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { api, type StoryDTO } from '@/lib/api'

export interface StoryItem extends StoryDTO {}

export interface StoriesState {
  items: StoryItem[]
  status: 'idle' | 'loading' | 'error'
  error?: string
  // When true, indicates UI is using in-memory seeded data; skip auto-fetches
  seeded?: boolean
}

const initialState: StoriesState = {
  items: [],
  status: 'idle',
}

export const fetchStoriesByShop = createAsyncThunk(
  'stories/listByShop',
  async (shopId: string) => {
    const res = await api<{ success: boolean; stories: StoryDTO[] }>(`/api/v1/stories/${shopId}`, { method: 'GET' })
    return res.stories || []
  },
  {
    // Do not fetch if stories are seeded (prevents overwriting in-memory mock data)
    condition: (_, { getState }) => {
      const state = getState() as any
      return !state?.stories?.seeded
    },
  }
)

export const createStoryMultipart = createAsyncThunk(
  'stories/createMultipart',
  async (payload: { shop: string; file: File; product?: string; cta?: string; expiresAt?: string }) => {
    const fd = new FormData()
    fd.append('file', payload.file)
    fd.append('folder', 'stories')
    const uploaded = await api<{ success: boolean; url?: string; location?: string; path?: string }>(`/api/v1/uploads`, {
      method: 'POST',
      body: fd as any,
    })
    const mediaUrl = (uploaded as any).url || (uploaded as any).location || (uploaded as any).path
    const body: any = { shop: payload.shop, media: mediaUrl }
    if (payload.product) body.product = payload.product
    if (payload.cta) body.cta = payload.cta
    if (payload.expiresAt) body.expiresAt = payload.expiresAt
    const res = await api<{ success: boolean; story: StoryDTO }>(`/api/v1/stories`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return res.story
  }
)

export const toggleStoryLike = createAsyncThunk(
  'stories/toggleLike',
  async (storyId: string) => {
    const res = await api<{ success: boolean; liked: boolean; story: StoryDTO }>(`/api/v1/stories/${storyId}/like`, { method: 'POST' })
    return res.story
  }
)

export const addStoryView = createAsyncThunk(
  'stories/addView',
  async (storyId: string) => {
    const res = await api<{ success: boolean; story: StoryDTO }>(`/api/v1/stories/${storyId}/view`, { method: 'POST' })
    return res.story
  }
)

const slice = createSlice({
  name: 'stories',
  initialState,
  reducers: {
    seed(state, action: PayloadAction<StoryItem[]>) {
      state.items = action.payload
      state.status = 'idle'
      state.error = undefined
      state.seeded = true
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchStoriesByShop.pending, (s) => { s.status = 'loading'; s.error = undefined })
      .addCase(fetchStoriesByShop.fulfilled, (s, a: PayloadAction<StoryItem[]>) => { s.status = 'idle'; s.items = a.payload })
      .addCase(fetchStoriesByShop.rejected, (s, a) => { s.status = 'error'; s.error = a.error.message })

      .addCase(createStoryMultipart.pending, (s) => { s.status = 'loading'; s.error = undefined })
      .addCase(createStoryMultipart.fulfilled, (s, a: PayloadAction<StoryItem>) => { s.status = 'idle'; s.items.unshift(a.payload) })
      .addCase(createStoryMultipart.rejected, (s, a) => { s.status = 'error'; s.error = a.error.message })

      // Update story likes if present in our list
      .addCase(toggleStoryLike.fulfilled, (s, a: PayloadAction<StoryItem>) => {
        const idx = s.items.findIndex(it => String(it._id) === String((a.payload as any)._id))
        if (idx >= 0) s.items[idx] = a.payload
      })

      // Update story views if present
      .addCase(addStoryView.fulfilled, (s, a: PayloadAction<StoryItem>) => {
        const idx = s.items.findIndex(it => String(it._id) === String((a.payload as any)._id))
        if (idx >= 0) s.items[idx] = a.payload
      })
  },
})

export const { seed: seedStories } = slice.actions
export default slice.reducer

