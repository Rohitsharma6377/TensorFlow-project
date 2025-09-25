import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { api } from '@/lib/api'

export interface ShopState {
  shop: any | null
  loading: boolean
  error: string | null
}

const initialState: ShopState = {
  shop: null,
  loading: false,
  error: null,
}

export const fetchMyShop = createAsyncThunk('shop/fetchMy', async (_, thunkAPI) => {
  try {
    const res = await api<any>('/api/v1/shops/my', { method: 'GET' })
    return res.shop
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.message || 'Failed to load shop')
  }
})

export const createShop = createAsyncThunk('shop/create', async (payload: any, thunkAPI) => {
  try {
    const res = await api<any>('/api/v1/shops', { method: 'POST', body: JSON.stringify(payload) })
    return res.shop
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.message || 'Failed to create shop')
  }
})

export const updateShop = createAsyncThunk('shop/update', async ({ id, payload }: { id: string; payload: any }, thunkAPI) => {
  try {
    const res = await api<any>(`/api/v1/shops/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
    return res.shop
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.message || 'Failed to update shop')
  }
})

const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    clearShop(state) {
      state.shop = null
      state.error = null
      state.loading = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyShop.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyShop.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false
        state.shop = action.payload
      })
      .addCase(fetchMyShop.rejected, (state, action: any) => {
        state.loading = false
        state.error = action.payload || 'Failed to load shop'
      })

      .addCase(createShop.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createShop.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false
        state.shop = action.payload
      })
      .addCase(createShop.rejected, (state, action: any) => {
        state.loading = false
        state.error = action.payload || 'Failed to create shop'
      })

      .addCase(updateShop.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateShop.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false
        state.shop = action.payload
      })
      .addCase(updateShop.rejected, (state, action: any) => {
        state.loading = false
        state.error = action.payload || 'Failed to update shop'
      })
  }
})

export const { clearShop } = shopSlice.actions
export default shopSlice.reducer
