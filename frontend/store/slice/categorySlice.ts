import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { CategoriesAPI, type CategoryDTO } from '@/lib/api'

export interface CategoryState {
  items: CategoryDTO[]
  status: 'idle' | 'loading' | 'error'
  error?: string
}

const initialState: CategoryState = {
  items: [],
  status: 'idle',
}

export const fetchCategories = createAsyncThunk('categories/list', async (shopId?: string) => {
  const res = await CategoriesAPI.list(shopId)
  return res.categories
})

export const createCategory = createAsyncThunk('categories/create', async (payload: Omit<CategoryDTO, '_id'>) => {
  const res = await CategoriesAPI.create(payload)
  return res.category
})

export const updateCategory = createAsyncThunk('categories/update', async ({ id, payload }: { id: string; payload: Partial<Omit<CategoryDTO, 'shop'>> }) => {
  const res = await CategoriesAPI.update(id, payload)
  return res.category
})

export const deleteCategory = createAsyncThunk('categories/delete', async (id: string) => {
  await CategoriesAPI.remove(id)
  return id
})

const slice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchCategories.pending, (s) => { s.status = 'loading'; s.error = undefined })
      .addCase(fetchCategories.fulfilled, (s, a: PayloadAction<CategoryDTO[]>) => { s.status = 'idle'; s.items = a.payload })
      .addCase(fetchCategories.rejected, (s, a) => { s.status = 'error'; s.error = a.error.message })

      .addCase(createCategory.fulfilled, (s, a: PayloadAction<CategoryDTO>) => { s.items.unshift(a.payload) })
      .addCase(updateCategory.fulfilled, (s, a: PayloadAction<CategoryDTO>) => {
        const idx = s.items.findIndex(x => x._id === a.payload._id)
        if (idx !== -1) s.items[idx] = a.payload
      })
      .addCase(deleteCategory.fulfilled, (s, a: PayloadAction<string>) => { s.items = s.items.filter(x => x._id !== a.payload) })
  },
})

export default slice.reducer
