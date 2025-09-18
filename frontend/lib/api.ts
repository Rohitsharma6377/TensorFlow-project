export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

// Get authentication token from localStorage
function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

// Get refresh token from localStorage
function getRefreshToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('refreshToken') || '';
}

// Store tokens in localStorage
function setAuthTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

// Clear authentication tokens
function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

// Token refresh is disabled by default as backend doesn't issue refresh tokens.
// If you later add refresh tokens, set ENABLE_REFRESH to true and implement mappings below.
const ENABLE_REFRESH = false;

// Main API function with enhanced error handling and token refresh
interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
  isRetry?: boolean;
}

export async function api<T = any>(
  path: string, 
  options: ApiOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  // Add auth header if not skipped
  if (!options.skipAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('[API] Using Bearer token for request to', path)
    } else {
      console.log('[API] No Bearer token, relying on cookies for request to', path)
    }
  }

  console.log('[API] Making request to', `${API_BASE}${path}`, 'with credentials: include')

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    // Handle 401 Unauthorized - optional refresh flow disabled
    if (res.status === 401 && !options.skipAuth && !options.isRetry) {
      console.log('[API] Received 401 Unauthorized for', path)
      if (ENABLE_REFRESH) {
        // Placeholder for future refresh-token implementation
        // For now, fall through to error handling
      }
      // Do not clear tokens or redirect automatically; let caller decide
      const error: ApiError = new Error('Unauthorized');
      error.status = 401;
      throw error;
    }

    // Handle other error statuses
    if (!res.ok) {
      let errorData;
      const contentType = res.headers.get('content-type');
      
      try {
        errorData = contentType?.includes('application/json') 
          ? await res.json() 
          : await res.text();
      } catch (e) {
        errorData = res.statusText;
      }
      
      let message: string | undefined;
      if (typeof errorData === 'string') {
        message = errorData;
      } else if (errorData?.message) {
        message = errorData.message;
      } else if (Array.isArray(errorData?.errors) && errorData.errors.length > 0) {
        message = errorData.errors[0]?.msg || 'Validation failed';
      } else {
        message = 'An error occurred';
      }
      const error: ApiError = new Error(message);
      
      error.status = res.status;
      error.code = errorData.code;
      error.details = errorData.details;
      
      throw error;
    }

    // Parse successful response
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res.json();
    }
    
    return res.text() as any;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Auth API methods
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'customer' | 'seller' | 'admin' | 'superadmin';
  isGuest?: boolean;
  profile?: {
    fullName?: string;
    avatarUrl?: string;
    phone?: string;
    address?: any;
  };
  shop?: {
    id: string;
    name: string;
    isActive: boolean;
  };
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  role?: 'customer' | 'seller';
  shopName?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}

export const AuthAPI = {
  // Register a new user (customer or seller)
  async register(payload: RegisterPayload): Promise<LoginResponse> {
    const endpoint = payload.role === 'seller' 
      ? '/api/v1/auth/register/seller' 
      : '/api/v1/auth/register/customer';
      
    const raw = await api<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
    const mapped: LoginResponse = {
      accessToken: raw.token || raw.accessToken,
      refreshToken: raw.refreshToken ?? '',
      user: raw.user,
    };
    return mapped;
  },

  // Login with email/username and password
  async login(usernameOrEmail: string, password: string): Promise<LoginResponse> {
    const raw = await api<any>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail, password }),
      skipAuth: true,
    });
    const mapped: LoginResponse = {
      accessToken: raw.token,
      refreshToken: '',
      user: raw.user,
    };
    return mapped;
  },

  // Login as guest
  async loginAsGuest(): Promise<LoginResponse> {
    const raw = await api<any>('/api/v1/auth/guest', {
      method: 'POST',
      skipAuth: true,
    });
    const mapped: LoginResponse = {
      accessToken: raw.token,
      refreshToken: '',
      user: raw.user,
    };
    return mapped;
  },

  // Get current user
  async getCurrentUser(): Promise<{ user: User }> {
    console.log('[AuthAPI] getCurrentUser() called')
    const res = await api<any>('/api/v1/auth/me');
    console.log('[AuthAPI] getCurrentUser() response:', res)
    // ensure we always have a user.id
    if (res?.user && !res.user.id && res.user._id) {
      res.user.id = res.user._id;
      delete res.user._id;
    }
    return res as { user: User };
  },

  // Logout
  async logout(): Promise<{ success: boolean }> {
    try {
      // Try to invalidate the token on the server
      await api('/api/v1/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local tokens
      clearAuthTokens();
    }
    return { success: true };
  },

  // Request password reset
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    return api('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    });
  },

  // Reset password with token
  async resetPassword(
    token: string, 
    newPassword: string,
    confirmPassword: string
  ): Promise<{ success: boolean; message: string }> {
    return api('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword, confirmPassword }),
      skipAuth: true,
    });
  },

  // Verify email with token
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    return api(`/api/v1/auth/verify-email?token=${token}`, {
      method: 'GET',
      skipAuth: true,
    });
  },

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return api('/api/v1/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuth: true,
    });
  },
};

export interface ProductDTO {
  _id?: string;
  shopId: string;
  title: string;
  sku?: string;
  description?: string;
  price: number;
  stock?: number;
  images?: string[];
  status?: 'draft' | 'active' | 'archived';
}

export const ProductAPI = {
  async list(params: Record<string, string | number | undefined> = {}) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
    ).toString();
    const q = query ? `?${query}` : '';
    return api<{ success: boolean; products: ProductDTO[] }>(`/api/v1/products${q}`, { method: 'GET' });
  },
  async get(id: string) {
    return api<{ success: boolean; product: ProductDTO }>(`/api/v1/products/${id}`, { method: 'GET' });
  },
  async create(payload: ProductDTO) {
    return api<{ success: boolean; product: ProductDTO }>(`/api/v1/products`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async update(id: string, payload: Partial<ProductDTO>) {
    return api<{ success: boolean; product: ProductDTO }>(`/api/v1/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  async remove(id: string) {
    return api<{ success: boolean }>(`/api/v1/products/${id}`, { method: 'DELETE' });
  },
};

// Feed posts DTO and API
export interface PostDTO {
  _id: string;
  shop: string;
  product?: string;
  caption?: string;
  media?: string[];
  likesCount?: number;
  commentsCount?: number;
}

export const FeedAPI = {
  async list() {
    return api<{ success: boolean; posts: PostDTO[] }>(`/api/v1/feed`, { method: 'GET' });
  },
};

// Wishlist API
export const WishlistAPI = {
  async add(productId: string) {
    return api<{ success: boolean }>(`/api/v1/products/${productId}/wishlist`, { method: 'POST' });
  },
};

// Users API (profile and addresses)
export interface AddressDTO {
  id?: string;
  label?: string;
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface UpdateUserPayload {
  profilePic?: string;
  profile?: {
    fullName?: string;
    bio?: string;
  };
  walletBalance?: number;
}

export const UsersAPI = {
  async updateProfile(userId: string, payload: UpdateUserPayload) {
    return api<{ success: boolean; user: User }>(`/api/v1/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  async addAddress(userId: string, address: AddressDTO) {
    return api<{ success: boolean; user: User }>(`/api/v1/users/${userId}/address`, {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  },
  async updateAddress(userId: string, addressId: string, address: AddressDTO) {
    return api<{ success: boolean; user: User }>(`/api/v1/users/${userId}/address/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify({ address }),
    });
  },
  async deleteAddress(userId: string, addressId: string) {
    return api<{ success: boolean; user: User }>(`/api/v1/users/${userId}/address/${addressId}`, {
      method: 'DELETE',
    });
  },
};
