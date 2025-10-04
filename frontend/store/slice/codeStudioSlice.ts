import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ShopsAdminAPI } from '@/lib/api'

export type CodeFiles = Record<string, string>

export interface CodeStudioState {
  sessionId: string | null
  files: CodeFiles
  meta: Record<string, any>
  loading: boolean
  saving: boolean
  error: string | null
  lastSavedAt?: string
}

const initialState: CodeStudioState = {
  sessionId: null,
  files: {},
  meta: {},
  loading: false,
  saving: false,
  error: null,
}

export const loadCodeSession = createAsyncThunk(
  'codeStudio/load',
  async ({ shopId, sessionId }: { shopId: string; sessionId: string }, thunkAPI) => {
    try {
      const res = await ShopsAdminAPI.getCode(shopId, sessionId)
      const code = (res as any)?.code || {}
      return { sessionId, files: code.files || {}, meta: code.meta || {} }
    } catch (err: any) {
      console.error('[codeStudio] loadCodeSession error:', err)
      return thunkAPI.rejectWithValue(err?.message || 'Failed to load code session')
    }
  }
)

export const saveCodeSession = createAsyncThunk(
  'codeStudio/save',
  async (_: { shopId: string }, thunkAPI) => {
    try {
      const state = (thunkAPI.getState() as any).codeStudio as CodeStudioState
      if (!state.sessionId) throw new Error('No sessionId')
      await ShopsAdminAPI.saveCode(_.shopId, state.sessionId, { files: state.files, meta: state.meta })
      return { ok: true }
    } catch (err: any) {
      console.error('[codeStudio] saveCodeSession error:', err)
      return thunkAPI.rejectWithValue(err?.message || 'Failed to save code session')
    }
  }
)

const codeStudioSlice = createSlice({
  name: 'codeStudio',
  initialState,
  reducers: {
    createNewSession(state, action: PayloadAction<{ sessionId?: string } | undefined>) {
      const id = action?.payload?.sessionId || Math.random().toString(36).slice(2, 10)
      state.sessionId = id
      state.files = {}
      state.meta = {}
      state.error = null
    },
    setFile(state, action: PayloadAction<{ path: string; content: string }>) {
      state.files[action.payload.path] = action.payload.content
    },
    removeFile(state, action: PayloadAction<{ path: string }>) {
      delete state.files[action.payload.path]
    },
    setMeta(state, action: PayloadAction<Record<string, any>>) {
      state.meta = { ...state.meta, ...action.payload }
    },
    reset(state) {
      Object.assign(state, initialState)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCodeSession.pending, (state) => {
        state.loading = true
        state.error = null
        try { console.log('[codeStudio] loadCodeSession.pending') } catch {}
      })
      .addCase(loadCodeSession.fulfilled, (state, action: any) => {
        state.loading = false
        state.sessionId = action.payload.sessionId
        state.files = action.payload.files
        state.meta = action.payload.meta
        try { console.log('[codeStudio] loadCodeSession.fulfilled', { sessionId: state.sessionId, fileCount: Object.keys(state.files||{}).length }) } catch {}
      })
      .addCase(loadCodeSession.rejected, (state, action: any) => {
        state.loading = false
        state.error = action.payload || 'Failed to load code session'
        try { console.error('[codeStudio] loadCodeSession.rejected', action.payload) } catch {}
      })
      .addCase(saveCodeSession.pending, (state) => {
        state.saving = true
        state.error = null
        try { console.log('[codeStudio] saveCodeSession.pending') } catch {}
      })
      .addCase(saveCodeSession.fulfilled, (state) => {
        state.saving = false
        state.lastSavedAt = new Date().toISOString()
        try { console.log('[codeStudio] saveCodeSession.fulfilled', { lastSavedAt: state.lastSavedAt }) } catch {}
      })
      .addCase(saveCodeSession.rejected, (state, action: any) => {
        state.saving = false
        state.error = action.payload || 'Failed to save code session'
        try { console.error('[codeStudio] saveCodeSession.rejected', action.payload) } catch {}
      })
  },
})

export const { createNewSession, setFile, removeFile, setMeta, reset } = codeStudioSlice.actions
export default codeStudioSlice.reducer
