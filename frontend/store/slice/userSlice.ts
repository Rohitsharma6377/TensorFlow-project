import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { UsersAPI, AuthAPI, type User, type AddressDTO, type UpdateUserPayload } from '@/lib/api'

export interface UserState {
  user: User | null
  status: 'idle' | 'loading' | 'error'
  error?: string
}

const initialState: UserState = {
  user: null,
  status: 'idle',
}

export const updateProfileThunk = createAsyncThunk(
  'user/updateProfile',
  async (payload: { userId: string; updates: UpdateUserPayload }) => {
    const res = await UsersAPI.updateProfile(payload.userId, payload.updates)
    return res
  }
)

export const fetchMeThunk = createAsyncThunk('user/fetchMe', async () => {
  const res = await AuthAPI.getCurrentUser()
  return res.user
})

export const addAddressThunk = createAsyncThunk(
  'user/addAddress',
  async (payload: { userId: string; address: AddressDTO }) => {
    const res = await UsersAPI.addAddress(payload.userId, payload.address)
    return res
  }
)

export const updateAddressThunk = createAsyncThunk(
  'user/updateAddress',
  async (payload: { userId: string; addressId: string; address: AddressDTO }) => {
    const res = await UsersAPI.updateAddress(payload.userId, payload.addressId, payload.address)
    return res
  }
)

export const deleteAddressThunk = createAsyncThunk(
  'user/deleteAddress',
  async (payload: { userId: string; addressId: string }) => {
    const res = await UsersAPI.deleteAddress(payload.userId, payload.addressId)
    return res
  }
)

const slice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchMeThunk.pending, (s) => {
        s.status = 'loading'
        s.error = undefined
      })
      .addCase(fetchMeThunk.fulfilled, (s, a) => {
        s.status = 'idle'
        s.user = a.payload
      })
      .addCase(fetchMeThunk.rejected, (s, a) => {
        s.status = 'error'
        s.error = a.error.message
      })
      .addCase(updateProfileThunk.pending, (s) => {
        s.status = 'loading'
        s.error = undefined
      })
      .addCase(updateProfileThunk.fulfilled, (s, a) => {
        s.status = 'idle'
        s.user = a.payload.user
      })
      .addCase(updateProfileThunk.rejected, (s, a) => {
        s.status = 'error'
        s.error = a.error.message
      })
      .addCase(addAddressThunk.fulfilled, (s, a) => {
        s.status = 'idle'
        s.user = a.payload.user
      })
      .addCase(updateAddressThunk.fulfilled, (s, a) => {
        s.status = 'idle'
        s.user = a.payload.user
      })
      .addCase(deleteAddressThunk.fulfilled, (s, a) => {
        s.status = 'idle'
        s.user = a.payload.user
      })
  },
})

export const { setUser } = slice.actions
export default slice.reducer
