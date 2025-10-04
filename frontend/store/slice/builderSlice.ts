import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ShopsAdminAPI } from '@/lib/api'

export interface BuilderState {
  saving: boolean
  error: string | null
  lastSavedAt?: string
}

const initialState: BuilderState = {
  saving: false,
  error: null,
}

export const saveBuilderDesign = createAsyncThunk(
  'builder/save',
  async ({ shopId, builder }: { shopId: string; builder: any }, thunkAPI) => {
    try {
      await ShopsAdminAPI.saveBuilder(shopId, builder)
      return { ok: true }
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err?.message || 'Failed to save builder to backend')
    }
  }
)

const builderSlice = createSlice({
  name: 'builder',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(saveBuilderDesign.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(saveBuilderDesign.fulfilled, (state) => {
        state.saving = false
        state.lastSavedAt = new Date().toISOString()
      })
      .addCase(saveBuilderDesign.rejected, (state, action: any) => {
        state.saving = false
        state.error = action.payload || 'Failed to save builder to backend'
      })
  },
})

export default builderSlice.reducer
