import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { AuthAPI } from '@/lib/api'

export type Role = 'customer' | 'seller' | 'admin' | 'superadmin' | 'delivery'

export interface AuthState {
  token: string | null
  user: any | null
  status: 'idle' | 'loading' | 'error'
  error?: string
}

const initialState: AuthState = {
  token: null,
  user: null,
  status: 'idle',
}

export const loginThunk = createAsyncThunk('auth/login', async (payload: { email: string; password: string }) => {
  const res = await AuthAPI.login(payload)
  if (typeof window !== 'undefined') localStorage.setItem('token', res.token)
  return res
})

export const signupThunk = createAsyncThunk(
  'auth/signup',
  async (payload: { username: string; email: string; password: string; role?: string }) => {
    const res = await AuthAPI.signup(payload)
    if (typeof window !== 'undefined') localStorage.setItem('token', res.token)
    return res
  }
)

export const meThunk = createAsyncThunk('auth/me', async () => {
  const me = await AuthAPI.me()
  return me
})

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null
      state.user = null
      if (typeof window !== 'undefined') localStorage.removeItem('token')
    },
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loginThunk.pending, (s) => {
        s.status = 'loading'
        s.error = undefined
      })
      .addCase(loginThunk.fulfilled, (s, a) => {
        s.status = 'idle'
        s.token = a.payload.token
        s.user = a.payload.user
      })
      .addCase(loginThunk.rejected, (s, a) => {
        s.status = 'error'
        s.error = a.error.message
      })
      .addCase(signupThunk.fulfilled, (s, a) => {
        s.status = 'idle'
        s.token = a.payload.token
        s.user = a.payload.user
      })
      .addCase(meThunk.fulfilled, (s, a) => {
        // backend returns { success, user }
        if ((a.payload as any)?.user) s.user = (a.payload as any).user
      })
  },
})

export const { logout, setToken } = slice.actions
export default slice.reducer
