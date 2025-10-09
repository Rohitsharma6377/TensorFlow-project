import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { AdminAPI, api } from '@/lib/api'

export type AdminSeller = {
  _id: string
  name: string
  slug?: string
  owner?: {
    _id: string
    email: string
    username?: string
  } | string
  isActive?: boolean
  isApproved?: boolean
  wallet?: {
    balance: number
    currency: string
  }
  plan?: {
    type: string
    limits: {
      order_limit?: number
      product_limit?: number
      monthly_revenue_limit?: number
    }
    currentUsage?: {
      orders?: number
      products?: number
      monthly_revenue?: number
    }
  }
  createdAt?: string
}

export type WalletTransaction = {
  id: string
  type: 'add' | 'deduct'
  amount: number
  reason: string
  timestamp: string
  adminId?: string
}

interface AdminSellersState {
  sellers: AdminSeller[]
  selectedSeller: AdminSeller | null
  walletTransactions: WalletTransaction[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  walletStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  planStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  error?: string | null
  walletError?: string | null
  planError?: string | null
  page: number
  limit: number
  total: number
  q: string
}

const initialState: AdminSellersState = {
  sellers: [],
  selectedSeller: null,
  walletTransactions: [],
  status: 'idle',
  walletStatus: 'idle',
  planStatus: 'idle',
  error: null,
  walletError: null,
  planError: null,
  page: 1,
  limit: 20,
  total: 0,
  q: '',
}

// Fetch all sellers/shops
export const fetchAdminSellers = createAsyncThunk<
  { sellers: AdminSeller[]; total?: number; page: number; limit: number },
  { page?: number; limit?: number; q?: string; status?: string } | undefined
>(
  'adminSellers/fetchAll',
  async (payload, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any
      const page = payload?.page ?? state.adminSellers.page ?? 1
      const limit = payload?.limit ?? state.adminSellers.limit ?? 20
      const q = payload?.q ?? state.adminSellers.q ?? ''
      const status = payload?.status
      
      const res = await AdminAPI.shops.list({ page, limit, q, status })
      const sellers = (res as any).shops || []
      
      return { 
        sellers, 
        total: (res as any).total ?? 0, 
        page: (res as any).page ?? page, 
        limit: (res as any).limit ?? limit 
      }
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to load sellers') as any
    }
  }
)

// Manage seller wallet (add/deduct money)
export const manageSellerWallet = createAsyncThunk<
  { sellerId: string; type: 'add' | 'deduct'; amount: number; reason: string; newBalance?: number },
  { sellerId: string; type: 'add' | 'deduct'; amount: number; reason: string }
>(
  'adminSellers/manageWallet',
  async ({ sellerId, type, amount, reason }, thunkAPI) => {
    try {
      // Call backend API instead of Next.js API route
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      console.log('[WALLET] API_BASE:', API_BASE);
      console.log('[WALLET] Request:', { sellerId, type, amount, reason });
      console.log('[WALLET] sellerId type:', typeof sellerId);
      console.log('[WALLET] sellerId length:', sellerId?.length);
      
      const token = localStorage.getItem('token');
      console.log('[WALLET] Token exists:', !!token);
      
      const res = await fetch(`${API_BASE}/api/v1/admin/wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        credentials: 'include',
        body: JSON.stringify({ sellerId, type, amount, reason })
      });

      console.log('[WALLET] Response status:', res.status);
      console.log('[WALLET] Response ok:', res.ok);

      if (!res.ok) {
        const errorText = await res.text();
        console.log('[WALLET] Error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || 'Network error' };
        }
        
        throw new Error(errorData.message || `HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log('[WALLET] Success response:', data);
      return { sellerId, type, amount, reason, newBalance: data?.data?.newBalance }
    } catch (e: any) {
      console.error('[WALLET] Error:', e);
      return thunkAPI.rejectWithValue(e?.message || 'Failed to manage wallet') as any
    }
  }
)

// Set seller plan limits
export const setSellerPlanLimit = createAsyncThunk<
  { sellerId: string; type: string; limit: number },
  { sellerId: string; type: string; limit: number }
>(
  'adminSellers/setPlanLimit',
  async ({ sellerId, type, limit }, thunkAPI) => {
    try {
      // Call backend API instead of Next.js API route
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const res = await fetch(`${API_BASE}/api/v1/admin/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify({ sellerId, type, limit })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      return { sellerId, type, limit }
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to set plan limit') as any
    }
  }
)

// Get seller wallet details
export const fetchSellerWallet = createAsyncThunk<
  { sellerId: string; balance: number; transactions: WalletTransaction[] },
  { sellerId: string }
>(
  'adminSellers/fetchWallet',
  async ({ sellerId }, thunkAPI) => {
    try {
      // Call backend API instead of Next.js API route
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const res = await fetch(`${API_BASE}/api/v1/admin/wallet?sellerId=${sellerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      return { 
        sellerId, 
        balance: data?.data?.balance || 0, 
        transactions: data?.data?.transactions || [] 
      }
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to fetch wallet') as any
    }
  }
)

// Get seller plan details
export const fetchSellerPlan = createAsyncThunk<
  { sellerId: string; plan: any },
  { sellerId: string }
>(
  'adminSellers/fetchPlan',
  async ({ sellerId }, thunkAPI) => {
    try {
      // Call backend API instead of Next.js API route
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const res = await fetch(`${API_BASE}/api/v1/admin/plan?sellerId=${sellerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      return { sellerId, plan: data?.data }
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e?.message || 'Failed to fetch plan') as any
    }
  }
)

const adminSellersSlice = createSlice({
  name: 'adminSellers',
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) { 
      state.q = action.payload 
    },
    setPage(state, action: PayloadAction<number>) { 
      state.page = action.payload 
    },
    setLimit(state, action: PayloadAction<number>) { 
      state.limit = action.payload 
    },
    setSelectedSeller(state, action: PayloadAction<AdminSeller | null>) {
      state.selectedSeller = action.payload
    },
    clearWalletError(state) {
      state.walletError = null
    },
    clearPlanError(state) {
      state.planError = null
    },
    clearErrors(state) {
      state.error = null
      state.walletError = null
      state.planError = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch sellers
      .addCase(fetchAdminSellers.pending, (state) => { 
        state.status = 'loading'; 
        state.error = null 
      })
      .addCase(fetchAdminSellers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.sellers = action.payload.sellers;
        state.total = action.payload.total ?? state.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchAdminSellers.rejected, (state, action: any) => { 
        state.status = 'failed'; 
        state.error = action.payload 
      })
      
      // Manage wallet
      .addCase(manageSellerWallet.pending, (state) => { 
        state.walletStatus = 'loading'; 
        state.walletError = null 
      })
      .addCase(manageSellerWallet.fulfilled, (state, action) => {
        state.walletStatus = 'succeeded';
        // Update seller wallet balance if available
        const seller = state.sellers.find(s => s._id === action.payload.sellerId);
        if (seller && action.payload.newBalance !== undefined) {
          if (!seller.wallet) seller.wallet = { balance: 0, currency: 'USD' };
          seller.wallet.balance = action.payload.newBalance;
        }
      })
      .addCase(manageSellerWallet.rejected, (state, action: any) => { 
        state.walletStatus = 'failed'; 
        state.walletError = action.payload 
      })
      
      // Set plan limit
      .addCase(setSellerPlanLimit.pending, (state) => { 
        state.planStatus = 'loading'; 
        state.planError = null 
      })
      .addCase(setSellerPlanLimit.fulfilled, (state, action) => {
        state.planStatus = 'succeeded';
        // Update seller plan limits
        const seller = state.sellers.find(s => s._id === action.payload.sellerId);
        if (seller) {
          if (!seller.plan) seller.plan = { type: 'standard', limits: {} };
          if (!seller.plan.limits) seller.plan.limits = {};
          (seller.plan.limits as any)[action.payload.type] = action.payload.limit;
        }
      })
      .addCase(setSellerPlanLimit.rejected, (state, action: any) => { 
        state.planStatus = 'failed'; 
        state.planError = action.payload 
      })
      
      // Fetch wallet
      .addCase(fetchSellerWallet.fulfilled, (state, action) => {
        state.walletTransactions = action.payload.transactions;
        const seller = state.sellers.find(s => s._id === action.payload.sellerId);
        if (seller) {
          if (!seller.wallet) seller.wallet = { balance: 0, currency: 'USD' };
          seller.wallet.balance = action.payload.balance;
        }
      })
      
      // Fetch plan
      .addCase(fetchSellerPlan.fulfilled, (state, action) => {
        const seller = state.sellers.find(s => s._id === action.payload.sellerId);
        if (seller) {
          seller.plan = action.payload.plan;
        }
      })
  }
})

export const { 
  setQuery, 
  setPage, 
  setLimit, 
  setSelectedSeller, 
  clearWalletError, 
  clearPlanError, 
  clearErrors 
} = adminSellersSlice.actions

export default adminSellersSlice.reducer
