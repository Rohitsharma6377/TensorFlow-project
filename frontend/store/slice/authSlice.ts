import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { AuthAPI } from '@/lib/api'

export type Role = 'customer' | 'seller' | 'admin' | 'superadmin' | 'delivery'

export interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: any | null
  status: 'idle' | 'loading' | 'error'
  error?: string
}

const initialState: AuthState = {
  accessToken: (typeof window !== 'undefined' && localStorage.getItem('token')) || null,
  refreshToken: (typeof window !== 'undefined' && localStorage.getItem('refreshToken')) || null,
  user: null,
  status: 'idle',
}

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (payload: { usernameOrEmail: string; password: string }) => {
    console.log('[loginThunk] Logging in...')
    const res = await AuthAPI.login(payload.usernameOrEmail, payload.password)
    console.log('[loginThunk] Login response:', res)
    // Keep localStorage as backup for cookies
    if (typeof window !== 'undefined' && res.accessToken) {
      localStorage.setItem('token', res.accessToken)
      localStorage.setItem('refreshToken', res.refreshToken)
      console.log('[loginThunk] Stored tokens in localStorage as backup')
    }
    return res
  }
)

export const signupThunk = createAsyncThunk(
  'auth/signup',
  async (payload: { username: string; email: string; password: string; role?: 'customer' | 'seller'; shopName?: string; phone?: string; address?: any }) => {
    console.log('[signupThunk] Registering...')
    const res = await AuthAPI.register(payload)
    console.log('[signupThunk] Register response:', res)
    // Cookies are set by the server, no need to store in localStorage
    if (typeof window !== 'undefined' && res.accessToken) {
      localStorage.setItem('token', res.accessToken)
      localStorage.setItem('refreshToken', res.refreshToken)
    }
    return res
  }
)

export const meThunk = createAsyncThunk('auth/me', async () => {
  console.log('[meThunk] Calling AuthAPI.getCurrentUser()...')
  try {
    const me = await AuthAPI.getCurrentUser()
    console.log('[meThunk] Success:', me)
    return me
  } catch (error) {
    console.log('[meThunk] Error:', error)
    throw error
  }
})

export const guestLoginThunk = createAsyncThunk('auth/guest', async () => {
  console.log('[guestLoginThunk] Logging in as guest...')
  const res = await AuthAPI.loginAsGuest()
  console.log('[guestLoginThunk] Guest login response:', res)
  // Cookies are set by the server, no need to store in localStorage
  if (typeof window !== 'undefined' && res.accessToken) {
    localStorage.setItem('token', res.accessToken)
    localStorage.setItem('refreshToken', res.refreshToken)
  }
  return res
})

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.accessToken = null
      state.refreshToken = null
      state.user = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
      }
    },
    setToken(state, action: PayloadAction<string | null>) {
      state.accessToken = action.payload
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
        s.accessToken = a.payload.accessToken
        s.refreshToken = a.payload.refreshToken
        s.user = a.payload.user
      })
      .addCase(loginThunk.rejected, (s, a) => {
        s.status = 'error'
        s.error = a.error.message
      })
      .addCase(signupThunk.fulfilled, (s, a) => {
        s.status = 'idle'
        s.accessToken = a.payload.accessToken
        s.refreshToken = a.payload.refreshToken
        s.user = a.payload.user
      })
      .addCase(meThunk.fulfilled, (s, a) => {
        console.log('[authSlice] meThunk.fulfilled with payload:', a.payload)
        s.status = 'idle'
        // backend returns { success, user }
        if ((a.payload as any)?.user) {
          s.user = (a.payload as any).user
          console.log('[authSlice] User set in state:', s.user)
        }
      })
      .addCase(meThunk.pending, (s) => {
        s.status = 'loading'
        s.error = undefined
      })
      .addCase(meThunk.rejected, (s, a) => {
        console.log('[authSlice] meThunk.rejected with error:', a.error)
        s.status = 'error'
        s.error = a.error.message
        s.user = null
      })
      .addCase(guestLoginThunk.fulfilled, (s, a) => {
        s.status = 'idle'
        s.accessToken = a.payload.accessToken
        s.refreshToken = a.payload.refreshToken
        s.user = { ...a.payload.user, isGuest: true }
      })
  },
})

export const { logout, setToken } = slice.actions
export default slice.reducer
