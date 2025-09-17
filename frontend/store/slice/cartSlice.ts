import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface CartItem {
  productId: string
  title: string
  price: number
  qty: number
  image?: string
}

export interface CartState {
  items: CartItem[]
}

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('cart')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem('cart', JSON.stringify(items)) } catch {}
}

const initialState: CartState = {
  items: [],
}

const slice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<{items: CartItem[]}>) {
      state.items = action.payload.items;
    },
    addItem(state, action: PayloadAction<CartItem>) {
      const i = state.items.findIndex(x => x.productId === action.payload.productId)
      if (i !== -1) {
        state.items[i].qty += action.payload.qty
      } else {
        state.items.push(action.payload)
      }
      saveCart(state.items)
    },
    updateQty(state, action: PayloadAction<{ productId: string; qty: number }>) {
      const i = state.items.findIndex(x => x.productId === action.payload.productId)
      if (i !== -1) {
        state.items[i].qty = Math.max(1, action.payload.qty)
        saveCart(state.items)
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter(x => x.productId !== action.payload)
      saveCart(state.items)
    },
    clear(state) {
      state.items = []
      saveCart(state.items)
    }
  }
})

export const { addItem, updateQty, removeItem, clear, hydrate } = slice.actions
export default slice.reducer
