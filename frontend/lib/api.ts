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
  const isFormData = (typeof FormData !== 'undefined') && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
    // Send both usernameOrEmail and email to satisfy different backends
    const payload = { usernameOrEmail, email: usernameOrEmail, password } as any;
    const raw = await api<any>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
    const mapped: LoginResponse = {
      accessToken: raw?.token || raw?.accessToken || raw?.data?.token || '',
      refreshToken: raw?.refreshToken || raw?.data?.refreshToken || '',
      user: raw?.user || raw?.data?.user || raw?.profile || raw,
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

// Unified Search API
export const SearchAPI = {
  async products(params: { q?: string; limit?: number; page?: number; shopId?: string; category?: string; price_min?: number; price_max?: number; sort?: string } = {}) {
    const qp = new URLSearchParams();
    if (params.q) qp.set('q', params.q);
    if (params.limit) qp.set('limit', String(params.limit));
    if (params.page) qp.set('page', String(params.page));
    if (params.shopId) qp.set('shopId', params.shopId);
    if (params.category) qp.set('category', params.category);
    if (params.price_min !== undefined) qp.set('price_min', String(params.price_min));
    if (params.price_max !== undefined) qp.set('price_max', String(params.price_max));
    if (params.sort) qp.set('sort', params.sort);
    const q = qp.toString();
    return api<{ success: boolean; products: ProductDTO[] }>(`/api/v1/search/products${q ? `?${q}` : ''}`, { method: 'GET', skipAuth: true });
  },
  async posts(params: { q?: string; limit?: number; page?: number; shopId?: string } = {}) {
    const qp = new URLSearchParams();
    if (params.q) qp.set('q', params.q);
    if (params.limit) qp.set('limit', String(params.limit));
    if (params.page) qp.set('page', String(params.page));
    if (params.shopId) qp.set('shopId', params.shopId);
    const q = qp.toString();
    return api<{ success: boolean; posts: PostDTO[] }>(`/api/v1/search/posts${q ? `?${q}` : ''}`, { method: 'GET', skipAuth: true });
  },
};

export type VariantDTO = {
  sku?: string;
  attributes?: Record<string, any>;
  price: number;
  mrp?: number;
  stock?: number;
  images?: string[];
  mainImage?: string;
  status?: 'active' | 'archived';
};

export interface ProductDTO {
  _id?: string;
  shopId: string;
  title: string;
  sku?: string;
  description?: string;
  price: number;
  mrp?: number;
  currency?: string;
  taxRate?: number;
  stock?: number;
  images?: string[];
  mainImage?: string;
  // legacy text fields
  brand?: string;
  category?: string;
  tags?: string[];
  // new relational refs
  brandId?: string;
  categoryId?: string;
  tagIds?: string[];
  attributes?: Record<string, any>;
  options?: Record<string, any>;
  variants?: VariantDTO[];
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
  // Create with files using multipart/form-data. Matches backend products route using multer and attachUploads.
  async createMultipart(payload: ProductDTO & {
    mainFile?: File | null;
    galleryFiles?: File[];
    variantFiles?: (File[] | undefined)[]; // array index corresponds to variants index
    discount?: { type: 'percent' | 'fixed'; value: number; expiry?: string; usageLimit?: number };
  }) {
    const fd = new FormData();
    // Optional folder hint for backend uploads
    fd.append('folder', 'products');
    if (payload.shopId) fd.append('shopId', payload.shopId);
    if (payload.title) fd.append('title', payload.title);
    if (payload.sku) fd.append('sku', payload.sku);
    if (payload.description) fd.append('description', payload.description);
    if (payload.price !== undefined) fd.append('price', String(payload.price));
    if (payload.mrp !== undefined) fd.append('mrp', String(payload.mrp));
    if (payload.taxRate !== undefined) fd.append('taxRate', String(payload.taxRate));
    if (payload.stock !== undefined) fd.append('stock', String(payload.stock));
    if (payload.currency) fd.append('currency', payload.currency);
    if (payload.brand) fd.append('brand', payload.brand);
    if (payload.category) fd.append('category', payload.category);
    if (payload.tags && payload.tags.length) payload.tags.forEach(t => fd.append('tags', t));
    if (payload.brandId) fd.append('brandId', payload.brandId);
    if (payload.categoryId) fd.append('categoryId', payload.categoryId);
    if (payload.tagIds && payload.tagIds.length) fd.append('tagIds', JSON.stringify(payload.tagIds));
    if (payload.attributes) fd.append('attributes', JSON.stringify(payload.attributes));
    if (payload.options) fd.append('options', JSON.stringify(payload.options));
    if (payload.status) fd.append('status', payload.status);
    if (payload.discount) fd.append('discount', JSON.stringify(payload.discount));

    // Files: main and gallery, using field name 'file' for consistency with upload middleware
    if (payload.mainFile) fd.append('file', payload.mainFile);
    if (payload.galleryFiles && payload.galleryFiles.length) {
      payload.galleryFiles.forEach((f) => fd.append('file', f));
    }

    // Variants and their files
    if (payload.variants) {
      fd.append('variants', JSON.stringify(payload.variants));
      if (payload.variantFiles && payload.variantFiles.length) {
        payload.variantFiles.forEach((files, idx) => {
          if (files && files.length) {
            files.forEach((f) => fd.append(`variantFiles[${idx}]`, f));
          }
        });
      }
    }

    return api<{ success: boolean; product: ProductDTO }>(`/api/v1/products`, {
      method: 'POST',
      body: fd as any,
    });
  },
  // Update with files using multipart/form-data. Sends only provided fields.
  async updateMultipart(id: string, payload: Partial<ProductDTO> & {
    mainFile?: File | null;
    galleryFiles?: File[];
    variantFiles?: (File[] | undefined)[];
    discount?: { type: 'percent' | 'fixed'; value: number; expiry?: string; usageLimit?: number };
  }) {
    const fd = new FormData();
    // Optional folder hint
    fd.append('folder', 'products');
    if (payload.title) fd.append('title', payload.title);
    if (payload.sku) fd.append('sku', payload.sku);
    if (payload.description !== undefined) fd.append('description', payload.description || '');
    if (payload.price !== undefined) fd.append('price', String(payload.price));
    if (payload.mrp !== undefined) fd.append('mrp', String(payload.mrp));
    if (payload.taxRate !== undefined) fd.append('taxRate', String(payload.taxRate));
    if (payload.stock !== undefined) fd.append('stock', String(payload.stock));
    if (payload.currency) fd.append('currency', payload.currency);
    if (payload.brand) fd.append('brand', payload.brand);
    if (payload.category) fd.append('category', payload.category);
    if (payload.tags && payload.tags.length) payload.tags.forEach(t => fd.append('tags', t));
    if (payload.brandId) fd.append('brandId', payload.brandId);
    if (payload.categoryId) fd.append('categoryId', payload.categoryId);
    if (payload.tagIds && payload.tagIds.length) fd.append('tagIds', JSON.stringify(payload.tagIds));
    if (payload.attributes) fd.append('attributes', JSON.stringify(payload.attributes));
    if (payload.options) fd.append('options', JSON.stringify(payload.options));
    if (payload.status) fd.append('status', payload.status);
    if (payload.discount) fd.append('discount', JSON.stringify(payload.discount));

    // Files
    if (payload.mainFile) fd.append('file', payload.mainFile);
    if (payload.galleryFiles && payload.galleryFiles.length) {
      payload.galleryFiles.forEach((f) => fd.append('file', f));
    }
    if (payload.variants) {
      fd.append('variants', JSON.stringify(payload.variants));
    }
    if (payload.variantFiles && payload.variantFiles.length) {
      payload.variantFiles.forEach((files, idx) => {
        if (files && files.length) {
          files.forEach((f) => fd.append(`variantFiles[${idx}]`, f));
        }
      });
    }

    return api<{ success: boolean; product: ProductDTO }>(`/api/v1/products/${id}`, {
      method: 'PUT',
      body: fd as any,
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
  shop: string | { _id: string; name: string; slug: string; logo?: { url?: string } | string; isVerified?: boolean; isFollowing?: boolean };
  product?: string | { _id: string; title?: string; mainImage?: string; images?: string[]; price?: number };
  caption?: string;
  media?: string[];
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  createdAt?: string;
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

export const PostsAPI = {
  async list() {
    return api<{ success: boolean; posts: PostDTO[] }>(`/api/v1/posts`, { method: 'GET' });
  },
  async like(id: string) {
    return api<{ success: boolean }>(`/api/v1/posts/${id}/like`, { method: 'POST' });
  },
  async comment(id: string, text: string, parent?: string) {
    return api<{ success: boolean; comment: { _id: string; text: string } }>(
      `/api/v1/posts/${id}/comment`,
      { method: 'POST', body: JSON.stringify({ text, parent }) }
    );
  },
  async createMultipart(payload: {
    shop: string;
    product?: string;
    caption?: string;
    hashtags?: string[];
    type?: 'product' | 'lifestyle';
    mediaFiles?: File[]; // images/videos
    audioFile?: File | null; // optional audio file
  }) {
    const fd = new FormData();
    fd.append('shop', payload.shop);
    if (payload.product) fd.append('product', payload.product);
    if (payload.caption) fd.append('caption', payload.caption);
    if (payload.type) fd.append('type', payload.type);
    if (payload.hashtags && payload.hashtags.length) fd.append('hashtags', JSON.stringify(payload.hashtags));
    // Optional folder for organization
    fd.append('folder', 'posts');
    if (payload.mediaFiles && payload.mediaFiles.length) {
      payload.mediaFiles.forEach((f) => fd.append('file', f));
    }
    if (payload.audioFile) {
      fd.append('audio', payload.audioFile);
    }
    return api<{ success: boolean; post: PostDTO }>(`/api/v1/posts`, {
      method: 'POST',
      body: fd as any,
    });
  },
  async updateMultipart(id: string, payload: {
    shop?: string;
    product?: string;
    caption?: string;
    hashtags?: string[];
    type?: 'product' | 'lifestyle';
    status?: 'draft' | 'active' | 'archived';
    mediaFiles?: File[]; // to append
    audioFile?: File | null; // replace audio
    mediaReset?: boolean; // if true, replace media with provided
    media?: string[]; // existing URLs to keep/replace with
  }) {
    const fd = new FormData();
    if (payload.shop) fd.append('shop', payload.shop);
    if (payload.product) fd.append('product', payload.product);
    if (payload.caption !== undefined) fd.append('caption', payload.caption);
    if (payload.type) fd.append('type', payload.type);
    if (payload.status) fd.append('status', payload.status);
    if (payload.hashtags && payload.hashtags.length) fd.append('hashtags', JSON.stringify(payload.hashtags));
    if (payload.mediaReset) fd.append('mediaReset', 'true');
    if (payload.media && payload.media.length) payload.media.forEach((m) => fd.append('media', m));
    if (payload.mediaFiles && payload.mediaFiles.length) payload.mediaFiles.forEach((f) => fd.append('file', f));
    if (payload.audioFile) fd.append('audio', payload.audioFile);
    return api<{ success: boolean; post: PostDTO }>(`/api/v1/posts/${id}`, { method: 'PUT', body: fd as any });
  },
  async setStatus(id: string, status: 'draft' | 'active' | 'archived') {
    return api<{ success: boolean; post: PostDTO }>(`/api/v1/posts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  async remove(id: string) {
    return api<{ success: boolean }>(`/api/v1/posts/${id}`, { method: 'DELETE' });
  },
};

// Brand/Category/Tag DTOs and APIs
export interface BrandDTO {
  _id?: string;
  shop: string;
  name: string;
  description?: string;
  logo?: string; // URL returned by server
  active?: boolean;
}

export const BrandsAPI = {
  async list(shop?: string) {
    const q = shop ? `?shop=${shop}` : '';
    return api<{ success: boolean; brands: BrandDTO[] }>(`/api/v1/brands${q}`, { method: 'GET' });
  },
  async get(id: string) {
    return api<{ success: boolean; brand: BrandDTO }>(`/api/v1/brands/${id}`, { method: 'GET' });
  },
  async create(payload: Omit<BrandDTO, '_id' | 'logo'> & { logoFile?: File }) {
    const fd = new FormData();
    fd.append('shop', payload.shop);
    fd.append('name', payload.name);
    if (payload.description) fd.append('description', payload.description);
    if (typeof payload.active === 'boolean') fd.append('active', String(payload.active));
    if (payload.logoFile) fd.append('file', payload.logoFile);
    return api<{ success: boolean; brand: BrandDTO }>(`/api/v1/brands`, { method: 'POST', body: fd as any });
  },
  async update(id: string, payload: Partial<Omit<BrandDTO, '_id'>> & { logoFile?: File }) {
    const fd = new FormData();
    if (payload.name) fd.append('name', payload.name);
    if (payload.description !== undefined) fd.append('description', payload.description);
    if (payload.active !== undefined) fd.append('active', String(payload.active));
    if (payload.logoFile) fd.append('file', payload.logoFile);
    return api<{ success: boolean; brand: BrandDTO }>(`/api/v1/brands/${id}`, { method: 'PUT', body: fd as any });
  },
  async remove(id: string) {
    return api<{ success: boolean }>(`/api/v1/brands/${id}`, { method: 'DELETE' });
  },
};

export interface CategoryDTO {
  _id?: string;
  shop: string;
  name: string;
  description?: string;
  parent?: string; // id
  active?: boolean;
}

export const CategoriesAPI = {
  async list(shop?: string) {
    const q = shop ? `?shop=${shop}` : '';
    return api<{ success: boolean; categories: CategoryDTO[] }>(`/api/v1/categories${q}`, { method: 'GET' });
  },
  async get(id: string) {
    return api<{ success: boolean; category: CategoryDTO }>(`/api/v1/categories/${id}`, { method: 'GET' });
  },
  async create(payload: Omit<CategoryDTO, '_id'>) {
    return api<{ success: boolean; category: CategoryDTO }>(`/api/v1/categories`, { method: 'POST', body: JSON.stringify(payload) });
  },
  async update(id: string, payload: Partial<Omit<CategoryDTO, '_id' | 'shop'>>) {
    return api<{ success: boolean; category: CategoryDTO }>(`/api/v1/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async remove(id: string) {
    return api<{ success: boolean }>(`/api/v1/categories/${id}`, { method: 'DELETE' });
  },
};

export interface TagDTO {
  _id?: string;
  shop: string;
  name: string;
  description?: string;
  active?: boolean;
}

export const TagsAPI = {
  async list(shop?: string) {
    const q = shop ? `?shop=${shop}` : '';
    return api<{ success: boolean; tags: TagDTO[] }>(`/api/v1/tags${q}`, { method: 'GET' });
  },
  async get(id: string) {
    return api<{ success: boolean; tag: TagDTO }>(`/api/v1/tags/${id}`, { method: 'GET' });
  },
  async create(payload: Omit<TagDTO, '_id'>) {
    return api<{ success: boolean; tag: TagDTO }>(`/api/v1/tags`, { method: 'POST', body: JSON.stringify(payload) });
  },
  async update(id: string, payload: Partial<Omit<TagDTO, '_id' | 'shop'>>) {
    return api<{ success: boolean; tag: TagDTO }>(`/api/v1/tags/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async remove(id: string) {
    return api<{ success: boolean }>(`/api/v1/tags/${id}`, { method: 'DELETE' });
  },
};

// Taxes API
export interface TaxDTO {
  _id?: string;
  shop: string;
  name: string;
  percent: number;
  active?: boolean;
}

export const TaxesAPI = {
  async list(shop?: string) {
    const q = shop ? `?shop=${shop}` : '';
    return api<{ success: boolean; taxes: TaxDTO[] }>(`/api/v1/taxes${q}`, { method: 'GET' });
  },
  async get(id: string) {
    return api<{ success: boolean; tax: TaxDTO }>(`/api/v1/taxes/${id}`, { method: 'GET' });
  },
  async create(payload: Omit<TaxDTO, '_id'>) {
    return api<{ success: boolean; tax: TaxDTO }>(`/api/v1/taxes`, { method: 'POST', body: JSON.stringify(payload) });
  },
  async update(id: string, payload: Partial<Omit<TaxDTO, '_id' | 'shop'>>) {
    return api<{ success: boolean; tax: TaxDTO }>(`/api/v1/taxes/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async remove(id: string) {
    return api<{ success: boolean }>(`/api/v1/taxes/${id}`, { method: 'DELETE' });
  },
};

// Coupons API
export interface CouponDTO {
  _id?: string;
  shop: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  expiry?: string;
  usageLimit?: number;
  active?: boolean;
}

export const CouponsAPI = {
  async list(shop?: string) {
    const q = shop ? `?shop=${shop}` : '';
    return api<{ success: boolean; coupons: CouponDTO[] }>(`/api/v1/coupons${q}`, { method: 'GET' });
  },
  async get(id: string) {
    return api<{ success: boolean; coupon: CouponDTO }>(`/api/v1/coupons/${id}`, { method: 'GET' });
  },
  async create(payload: Omit<CouponDTO, '_id'>) {
    return api<{ success: boolean; coupon: CouponDTO }>(`/api/v1/coupons`, { method: 'POST', body: JSON.stringify(payload) });
  },
  async update(id: string, payload: Partial<Omit<CouponDTO, '_id' | 'shop'>>) {
    return api<{ success: boolean; coupon: CouponDTO }>(`/api/v1/coupons/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async remove(id: string) {
    return api<{ success: boolean }>(`/api/v1/coupons/${id}`, { method: 'DELETE' });
  },
};

// Orders analytics API
export const OrdersAnalyticsAPI = {
  async stats(shop: string, sinceHours: number = 720) {
    return api<{ success: boolean; stats: { totalOrders: number; totalItems: number; revenue: number; delivered: number } }>(
      `/api/v1/orders/seller/stats?shop=${encodeURIComponent(shop)}&sinceHours=${sinceHours}`,
      { method: 'GET' }
    );
  },
  async series(shop: string, windowHours: number = 24, intervalMinutes: number = 60) {
    return api<{ success: boolean; points: Array<{ t: string; orders: number; revenue: number }> }>(
      `/api/v1/orders/seller/series?shop=${encodeURIComponent(shop)}&windowHours=${windowHours}&intervalMinutes=${intervalMinutes}`,
      { method: 'GET' }
    );
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
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
    };
  };
  walletBalance?: number;
}

export const UsersAPI = {
  async updateProfile(userId: string, payload: UpdateUserPayload) {
    const path = userId === 'me' ? '/api/v1/users/me' : `/api/v1/users/${userId}`;
    return api<{ success: boolean; user: User }>(path, {
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

// Social API (follow/unfollow shops)
export const SocialAPI = {
  async follow(shopId: string) {
    return api<{ success: boolean }>(`/api/v1/social/follow/${shopId}`, { method: 'POST' });
  },
  async unfollow(shopId: string) {
    return api<{ success: boolean }>(`/api/v1/social/follow/${shopId}`, { method: 'DELETE' });
  },
  async following() {
    return api<{ success: boolean; shops: string[] }>(`/api/v1/social/following`, { method: 'GET' });
  },
};

// Shops API (public list)
export interface ShopListItemDTO {
  _id: string;
  name: string;
  slug: string;
  logo?: { url?: string } | string;
  isVerified?: boolean;
}

export const ShopsAPI = {
  async list(params: { featured?: boolean; limit?: number } = {}) {
    const qp = new URLSearchParams();
    if (params.featured) qp.set('featured', 'true');
    if (params.limit) qp.set('limit', String(params.limit));
    const q = qp.toString();
    const path = `/api/v1/shops${q ? `?${q}` : ''}`;
    return api<{ success: boolean; shops: ShopListItemDTO[] }>(path, { method: 'GET', skipAuth: true });
  },
};
