"use client";
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { hydrate as hydrateCart, CartItem } from '@/store/slice/cartSlice';
import type { PayloadAction } from '@reduxjs/toolkit';
import { hydrate as hydrateWishlist, WishlistItem } from '@/store/slice/wishlistSlice';
import ThemeProvider from '@/components/theme-provider';
import { NextUIProvider } from "@nextui-org/react";
import { AuthProvider } from '@/contexts/AuthContext';
import { connectSocket } from '@/lib/socket';

// Type guard to validate cart items
const isValidCartItem = (item: any): item is CartItem => {
  return (
    item && 
    typeof item.id === 'string' &&
    typeof item.quantity === 'number' &&
    item.quantity > 0
  );
};

// Type guard to validate wishlist items
const isValidWishlistItem = (item: any): item is WishlistItem => {
  return item && typeof item.id === 'string';
};

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      // Only run on client-side
      if (typeof window !== 'undefined') {
        // Safely get cart and wishlist from localStorage
        const cartRaw = localStorage.getItem('cart');
        const wishlistRaw = localStorage.getItem('wishlist');
        
        // Parse and validate cart
        if (cartRaw) {
          try {
            const parsedCart = JSON.parse(cartRaw);
            if (Array.isArray(parsedCart) && parsedCart.every(isValidCartItem)) {
              store.dispatch(hydrateCart({ items: parsedCart }));
            } else {
              console.warn('Invalid cart data in localStorage');
              localStorage.removeItem('cart');
            }
          } catch (e) {
            console.error('Error parsing cart from localStorage:', e);
            localStorage.removeItem('cart');
          }
        }
        
        // Parse and validate wishlist
        if (wishlistRaw) {
          try {
            const parsedWishlist = JSON.parse(wishlistRaw);
            if (Array.isArray(parsedWishlist) && parsedWishlist.every(isValidWishlistItem)) {
              // The hydrate action doesn't take any parameters, it loads directly from localStorage
              store.dispatch(hydrateWishlist());
            } else {
              console.warn('Invalid wishlist data in localStorage');
              localStorage.removeItem('wishlist');
            }
          } catch (e) {
            console.error('Error parsing wishlist from localStorage:', e);
            localStorage.removeItem('wishlist');
          }
        }
      }
    } catch (error) {
      console.error('Error initializing store from localStorage:', error);
      // Reset localStorage if there's an error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart');
        localStorage.removeItem('wishlist');
      }
    }
  }, []);

  // Pre-warm socket connection when user is authenticated to reduce chat latency
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      connectSocket().catch(() => {});
    }
  }, []);

  return (
    <Provider store={store}>
      <AuthProvider>
        <NextUIProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </NextUIProvider>
      </AuthProvider>
    </Provider>
  );
}
