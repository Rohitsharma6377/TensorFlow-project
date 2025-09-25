import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'
import authReducer from './slice/authSlice'
import productsReducer from './slice/productSlice'
import cartReducer from './slice/cartSlice'
import feedReducer from './slice/feedSlice'
import wishlistReducer from './slice/wishlistSlice'
import userReducer from './slice/userSlice'
import brandReducer from './slice/brandSlice'
import categoryReducer from './slice/categorySlice'
import tagReducer from './slice/tagSlice'
import taxReducer from './slice/taxSlice'
import couponReducer from './slice/couponSlice'
import shopReducer from './slice/shopSlice'
import postsReducer from './slice/postSlice'
import analyticsReducer from './slice/analyticsSlice'
import shopsReducer from './slice/shopsSlice'
import exploreReducer from './slice/exploreSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    feed: feedReducer,
    wishlist: wishlistReducer,
    user: userReducer,
    brands: brandReducer,
    categories: categoryReducer,
    tags: tagReducer,
    taxes: taxReducer,
    coupons: couponReducer,
    shop: shopReducer,
    posts: postsReducer,
    analytics: analyticsReducer,
    shops: shopsReducer,
    explore: exploreReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
