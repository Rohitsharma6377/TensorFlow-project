import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { TagsAPI, type TagDTO } from '@/lib/api'

export interface TagState {
  items: TagDTO[]
  status: 'idle' | 'loading' | 'error'
  error?: string
}

const initialState: TagState = {
  items: [],
  status: 'idle',
}

export const fetchTags = createAsyncThunk('tags/list', async (shopId?: string) => {
  const res = await TagsAPI.list(shopId)
  return res.tags
})

export const createTag = createAsyncThunk('tags/create', async (payload: Omit<TagDTO, '_id'>) => {
  const res = await TagsAPI.create(payload)
  return res.tag
})

export const updateTag = createAsyncThunk('tags/update', async ({ id, payload }: { id: string; payload: Partial<Omit<TagDTO, 'shop'>> }) => {
  const res = await TagsAPI.update(id, payload)
  return res.tag
})

export const deleteTag = createAsyncThunk('tags/delete', async (id: string) => {
  await TagsAPI.remove(id)
  return id
})

const slice = createSlice({
  name: 'tags',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchTags.pending, (s) => { s.status = 'loading'; s.error = undefined })
      .addCase(fetchTags.fulfilled, (s, a: PayloadAction<TagDTO[]>) => { s.status = 'idle'; s.items = a.payload })
      .addCase(fetchTags.rejected, (s, a) => { s.status = 'error'; s.error = a.error.message })

      .addCase(createTag.fulfilled, (s, a: PayloadAction<TagDTO>) => { s.items.unshift(a.payload) })
      .addCase(updateTag.fulfilled, (s, a: PayloadAction<TagDTO>) => {
        const idx = s.items.findIndex(x => x._id === a.payload._id)
        if (idx !== -1) s.items[idx] = a.payload
      })
      .addCase(deleteTag.fulfilled, (s, a: PayloadAction<string>) => { s.items = s.items.filter(x => x._id !== a.payload) })
  },
})

export default slice.reducer
