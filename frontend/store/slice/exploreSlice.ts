import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SearchAPI, ShopsAPI, type ProductDTO, type PostDTO, type ShopListItemDTO } from '@/lib/api';

export interface ExploreState {
  query: string;
  loading: boolean;
  error?: string;
  products: ProductDTO[];
  posts: PostDTO[];
  shops: ShopListItemDTO[];
  suggestions: string[];
}

const initialState: ExploreState = {
  query: '',
  loading: false,
  products: [],
  posts: [],
  shops: [],
  suggestions: [],
};

export const fetchExploreInitial = createAsyncThunk('explore/initial', async () => {
  const [shopsRes, productsRes, postsRes] = await Promise.all([
    ShopsAPI.list({ featured: true, limit: 12 }),
    SearchAPI.products({ limit: 16 }),
    SearchAPI.posts({ limit: 24 }),
  ]);
  return {
    shops: shopsRes.shops || [],
    products: productsRes.products || [],
    posts: postsRes.posts || [],
  } as { shops: ShopListItemDTO[]; products: ProductDTO[]; posts: PostDTO[] };
});

export const fetchExploreSearch = createAsyncThunk(
  'explore/search',
  async (q: string) => {
    const [prod, post, shopList] = await Promise.all([
      SearchAPI.products({ q, limit: 24 }),
      SearchAPI.posts({ q, limit: 24 }),
      ShopsAPI.list({ limit: 50 }),
    ]);
    const filteredShops = (shopList.shops || []).filter((s) => (s.name || '').toLowerCase().includes(q.toLowerCase())).slice(0, 24);
    const prodNames = (prod.products || []).map((p) => p.title).filter(Boolean) as string[];
    const shopNames = filteredShops.map((s) => s.name).filter(Boolean) as string[];
    const suggestions = Array.from(new Set([...prodNames, ...shopNames]))
      .filter((s) => s.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 8);
    return {
      q,
      products: prod.products || [],
      posts: post.posts || [],
      shops: filteredShops,
      suggestions,
    } as { q: string; products: ProductDTO[]; posts: PostDTO[]; shops: ShopListItemDTO[]; suggestions: string[] };
  }
);

const exploreSlice = createSlice({
  name: 'explore',
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    clearSuggestions(state) {
      state.suggestions = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExploreInitial.pending, (state) => { state.loading = true; state.error = undefined; })
      .addCase(fetchExploreInitial.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.posts = action.payload.posts;
        state.shops = action.payload.shops;
      })
      .addCase(fetchExploreInitial.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchExploreSearch.pending, (state) => { state.loading = true; state.error = undefined; })
      .addCase(fetchExploreSearch.fulfilled, (state, action) => {
        state.loading = false;
        state.query = action.payload.q;
        state.products = action.payload.products;
        state.posts = action.payload.posts;
        state.shops = action.payload.shops;
        state.suggestions = action.payload.suggestions;
      })
      .addCase(fetchExploreSearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { setQuery, clearSuggestions } = exploreSlice.actions;
export default exploreSlice.reducer;
