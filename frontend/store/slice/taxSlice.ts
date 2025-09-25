import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { TaxesAPI, type TaxDTO } from '@/lib/api'

export interface TaxState {
  items: TaxDTO[]
  status: 'idle' | 'loading' | 'error'
  error?: string
}

const initialState: TaxState = { items: [], status: 'idle' }

export const fetchTaxes = createAsyncThunk('taxes/list', async (shop?: string) => {
  const res = await TaxesAPI.list(shop)
  return res.taxes
})

export const createTax = createAsyncThunk('taxes/create', async (payload: Omit<TaxDTO, '_id'>) => {
  const res = await TaxesAPI.create(payload)
  return res.tax
})

export const updateTax = createAsyncThunk('taxes/update', async ({ id, payload }: { id: string; payload: Partial<Omit<TaxDTO, 'shop'>> }) => {
  const res = await TaxesAPI.update(id, payload)
  return res.tax
})

export const deleteTax = createAsyncThunk('taxes/delete', async (id: string) => {
  await TaxesAPI.remove(id)
  return id
})

const slice = createSlice({
  name: 'taxes',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchTaxes.pending, (s) => { s.status = 'loading'; s.error = undefined })
      .addCase(fetchTaxes.fulfilled, (s, a: PayloadAction<TaxDTO[]>) => { s.status = 'idle'; s.items = a.payload })
      .addCase(fetchTaxes.rejected, (s, a) => { s.status = 'error'; s.error = a.error.message })
      .addCase(createTax.fulfilled, (s, a: PayloadAction<TaxDTO>) => { s.items.unshift(a.payload) })
      .addCase(updateTax.fulfilled, (s, a: PayloadAction<TaxDTO>) => {
        const idx = s.items.findIndex(x => x._id === a.payload._id)
        if (idx !== -1) s.items[idx] = a.payload
      })
      .addCase(deleteTax.fulfilled, (s, a: PayloadAction<string>) => {
        s.items = s.items.filter(x => x._id !== a.payload)
      })
  },
})

export default slice.reducer
