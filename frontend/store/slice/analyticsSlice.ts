import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { OrdersAnalyticsAPI, ProductAPI } from '@/lib/api'

export type SellerStats = {
  totalOrders: number
  totalItems: number
  revenue: number
  delivered: number
}

export type SeriesPoint = { t: string; orders: number; revenue: number }

export interface AnalyticsState {
  stats: SellerStats | null
  points: SeriesPoint[]
  productCount: number | null
  loadingStats: boolean
  loadingSeries: boolean
  loadingProducts: boolean
  errorStats?: string
  errorSeries?: string
  errorProducts?: string
  lastUpdatedStats?: number
  lastUpdatedSeries?: number
  lastUpdatedProducts?: number
  sinceHours: number
  windowHours: number
  intervalMinutes: number
}

const initialState: AnalyticsState = {
  stats: null,
  points: [],
  productCount: null,
  loadingStats: false,
  loadingSeries: false,
  loadingProducts: false,
  sinceHours: 720,
  windowHours: 24,
  intervalMinutes: 60,
}

export const fetchSellerStats = createAsyncThunk(
  'analytics/fetchSellerStats',
  async (args: { shop: string; sinceHours?: number }) => {
    const { shop, sinceHours = 720 } = args
    const res = await OrdersAnalyticsAPI.stats(shop, sinceHours)
    return res.stats
  }
)

export const fetchSellerSeries = createAsyncThunk(
  'analytics/fetchSellerSeries',
  async (args: { shop: string; windowHours?: number; intervalMinutes?: number }) => {
    const { shop, windowHours = 24, intervalMinutes = 60 } = args
    const res = await OrdersAnalyticsAPI.series(shop, windowHours, intervalMinutes)
    return res.points
  }
)

// Temporary: compute product count by listing products (backend list doesn't return total; we approximate)
export const fetchProductCount = createAsyncThunk(
  'analytics/fetchProductCount',
  async (args: { shop: string }) => {
    const { shop } = args
    // try to fetch with a large limit to approximate total count
    const res = await ProductAPI.list({ shopId: shop, limit: 1000 })
    return (res.products || []).length
  }
)

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setSinceHours(state, action: PayloadAction<number>) { state.sinceHours = action.payload },
    setWindowHours(state, action: PayloadAction<number>) { state.windowHours = action.payload },
    setIntervalMinutes(state, action: PayloadAction<number>) { state.intervalMinutes = action.payload },
    reset(state) { Object.assign(state, initialState) },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerStats.pending, (state) => { state.loadingStats = true; state.errorStats = undefined })
      .addCase(fetchSellerStats.fulfilled, (state, action) => {
        state.loadingStats = false
        state.stats = action.payload
        state.lastUpdatedStats = Date.now()
      })
      .addCase(fetchSellerStats.rejected, (state, action) => {
        state.loadingStats = false
        state.errorStats = action.error.message || 'Failed to load stats'
      })
      .addCase(fetchSellerSeries.pending, (state) => { state.loadingSeries = true; state.errorSeries = undefined })
      .addCase(fetchSellerSeries.fulfilled, (state, action) => {
        state.loadingSeries = false
        state.points = action.payload || []
        state.lastUpdatedSeries = Date.now()
      })
      .addCase(fetchSellerSeries.rejected, (state, action) => {
        state.loadingSeries = false
        state.errorSeries = action.error.message || 'Failed to load series'
      })
      .addCase(fetchProductCount.pending, (state) => { state.loadingProducts = true; state.errorProducts = undefined })
      .addCase(fetchProductCount.fulfilled, (state, action) => {
        state.loadingProducts = false
        state.productCount = action.payload
        state.lastUpdatedProducts = Date.now()
      })
      .addCase(fetchProductCount.rejected, (state, action) => {
        state.loadingProducts = false
        state.errorProducts = action.error.message || 'Failed to load product count'
      })
  }
})

export const { setSinceHours, setWindowHours, setIntervalMinutes, reset } = analyticsSlice.actions
export default analyticsSlice.reducer
