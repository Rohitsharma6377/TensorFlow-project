import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { ProductAPI, type ProductDTO } from '@/lib/api'

export interface ProductsState {
  items: ProductDTO[]
  current?: ProductDTO | null
  status: 'idle' | 'loading' | 'error'
  error?: string
}

const initialState: ProductsState = {
  items: [],
  current: null,
  status: 'idle',
}

export const fetchProducts = createAsyncThunk('products/list', async (params: Record<string, any> | undefined) => {
  const res = await ProductAPI.list(params)
  return res.products
})

export const fetchProduct = createAsyncThunk('products/get', async (id: string) => {
  const res = await ProductAPI.get(id)
  return res.product
})

export const createProduct = createAsyncThunk('products/create', async (payload: ProductDTO) => {
  const res = await ProductAPI.create(payload)
  return res.product
})

export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, payload }: { id: string; payload: Partial<ProductDTO> }) => {
    const res = await ProductAPI.update(id, payload)
    return res.product
  }
)

export const deleteProduct = createAsyncThunk('products/delete', async (id: string) => {
  await ProductAPI.remove(id)
  return id
})

const slice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchProducts.pending, (s) => { s.status = 'loading'; s.error = undefined })
      .addCase(fetchProducts.fulfilled, (s, a: PayloadAction<ProductDTO[]>) => { s.status = 'idle'; s.items = a.payload })
      .addCase(fetchProducts.rejected, (s, a) => { s.status = 'error'; s.error = a.error.message })

      .addCase(fetchProduct.pending, (s) => { s.status = 'loading'; s.error = undefined; s.current = null })
      .addCase(fetchProduct.fulfilled, (s, a: PayloadAction<ProductDTO>) => { s.status = 'idle'; s.current = a.payload })
      .addCase(fetchProduct.rejected, (s, a) => { s.status = 'error'; s.error = a.error.message })

      .addCase(createProduct.fulfilled, (s, a: PayloadAction<ProductDTO>) => { s.items.unshift(a.payload) })
      .addCase(updateProduct.fulfilled, (s, a: PayloadAction<ProductDTO>) => {
        const idx = s.items.findIndex(x => x._id === a.payload._id)
        if (idx !== -1) s.items[idx] = a.payload
        if (s.current && s.current._id === a.payload._id) s.current = a.payload
      })
      .addCase(deleteProduct.fulfilled, (s, a: PayloadAction<string>) => {
        s.items = s.items.filter(x => x._id !== a.payload)
        if (s.current && s.current._id === a.payload) s.current = null
      })
  },
})

export default slice.reducer
