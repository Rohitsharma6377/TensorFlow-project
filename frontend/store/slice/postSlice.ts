import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface PostItem {
  _id?: string
  shop: string
  product?: string
  caption?: string
  media?: string[]
  audio?: string
  hashtags?: string[]
  type?: 'product' | 'lifestyle'
  status?: 'draft' | 'active' | 'archived'
  likesCount?: number
  commentsCount?: number
  createdAt?: string
}

export interface PostsState {
  items: PostItem[]
  status: 'idle' | 'loading' | 'error'
  error?: string
}

const initialState: PostsState = {
  items: [],
  status: 'idle',
}

function getApiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000') as string
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const fetchPosts = createAsyncThunk('posts/list', async (params?: { shop?: string; status?: string; limit?: number }) => {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params || {}).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v as any)]))
  ).toString()
  const res = await fetch(`${getApiBase()}/api/v1/posts${q ? `?${q}` : ''}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return (data.posts || []) as PostItem[]
})

export const createPostMultipart = createAsyncThunk(
  'posts/createMultipart',
  async (payload: {
    shop: string
    product?: string
    caption?: string
    hashtags?: string[]
    type?: 'product' | 'lifestyle'
    mediaFiles?: File[]
    audioFile?: File | null
    status?: 'draft' | 'active' | 'archived'
  }) => {
    const fd = new FormData()
    fd.append('shop', payload.shop)
    if (payload.product) fd.append('product', payload.product)
    if (payload.caption) fd.append('caption', payload.caption)
    if (payload.type) fd.append('type', payload.type)
    if (payload.status) fd.append('status', payload.status)
    if (payload.hashtags && payload.hashtags.length) fd.append('hashtags', JSON.stringify(payload.hashtags))
    fd.append('folder', 'posts')
    if (payload.mediaFiles && payload.mediaFiles.length) payload.mediaFiles.forEach((f) => fd.append('file', f))
    if (payload.audioFile) fd.append('audio', payload.audioFile)

    const res = await fetch(`${getApiBase()}/api/v1/posts`, {
      method: 'POST',
      body: fd,
      credentials: 'include',
      headers: {
        ...getAuthHeader(),
      },
    })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    return data.post as PostItem
  }
)

export const updatePostMultipart = createAsyncThunk(
  'posts/updateMultipart',
  async ({ id, payload }: { id: string; payload: Partial<{
    shop: string
    product: string
    caption: string
    hashtags: string[]
    type: 'product' | 'lifestyle'
    status: 'draft' | 'active' | 'archived'
    mediaFiles: File[]
    audioFile: File | null
    mediaReset: boolean
    media: string[]
  }> }) => {
    const fd = new FormData()
    if (payload.shop) fd.append('shop', payload.shop)
    if (payload.product) fd.append('product', payload.product)
    if (payload.caption !== undefined) fd.append('caption', payload.caption)
    if (payload.type) fd.append('type', payload.type)
    if (payload.status) fd.append('status', payload.status)
    if (payload.hashtags && payload.hashtags.length) fd.append('hashtags', JSON.stringify(payload.hashtags))
    if (payload.mediaReset) fd.append('mediaReset', 'true')
    if (payload.media && payload.media.length) payload.media.forEach((m) => fd.append('media', m))
    if (payload.mediaFiles && payload.mediaFiles.length) payload.mediaFiles.forEach((f) => fd.append('file', f))
    if (payload.audioFile) fd.append('audio', payload.audioFile)

    const res = await fetch(`${getApiBase()}/api/v1/posts/${id}`, {
      method: 'PUT',
      body: fd,
      credentials: 'include',
      headers: { ...getAuthHeader() },
    })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    return data.post as PostItem
  }
)

export const setPostStatus = createAsyncThunk(
  'posts/setStatus',
  async ({ id, status }: { id: string; status: 'draft' | 'active' | 'archived' }) => {
    const res = await fetch(`${getApiBase()}/api/v1/posts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    return data.post as PostItem
  }
)

export const deletePost = createAsyncThunk(
  'posts/delete',
  async (id: string) => {
    const res = await fetch(`${getApiBase()}/api/v1/posts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { ...getAuthHeader() },
    })
    if (!res.ok) throw new Error(await res.text())
    return id
  }
)

const slice = createSlice({
  name: 'posts',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchPosts.pending, (s) => { s.status = 'loading'; s.error = undefined })
      .addCase(fetchPosts.fulfilled, (s, a: PayloadAction<PostItem[]>) => { s.status = 'idle'; s.items = a.payload })
      .addCase(fetchPosts.rejected, (s, a) => { s.status = 'error'; s.error = a.error.message })

      .addCase(createPostMultipart.pending, (s) => { s.status = 'loading'; s.error = undefined })
      .addCase(createPostMultipart.fulfilled, (s, a: PayloadAction<PostItem>) => { s.status = 'idle'; s.items.unshift(a.payload) })
      .addCase(createPostMultipart.rejected, (s, a) => { s.status = 'error'; s.error = a.error.message })

      .addCase(updatePostMultipart.fulfilled, (s, a: PayloadAction<PostItem>) => {
        s.status = 'idle'
        const idx = s.items.findIndex(p => p._id === a.payload._id)
        if (idx >= 0) s.items[idx] = a.payload
      })
      .addCase(setPostStatus.fulfilled, (s, a: PayloadAction<PostItem>) => {
        const idx = s.items.findIndex(p => p._id === a.payload._id)
        if (idx >= 0) s.items[idx] = a.payload
      })
      .addCase(deletePost.fulfilled, (s, a: PayloadAction<string>) => {
        s.items = s.items.filter(p => p._id !== a.payload)
      })
  },
})

export default slice.reducer
