export type ThemeSectionHero = {
  enabled: boolean;
  image?: string;
  heading?: string;
  subheading?: string;
  ctaText?: string;
  ctaHref?: string;
};

export type ThemeSectionFeaturedCollections = {
  enabled: boolean;
  ids?: string[]; // future
};

export type ThemeSectionFeaturedProducts = {
  enabled: boolean;
  ids?: string[]; // product ids to feature
};

export type ThemeSectionGrid = {
  enabled: boolean;
  columns?: 2 | 3 | 4;
  limit?: number;
};

export type ThemeSettings = {
  preset: string; // "classic" | "minimal" | "bold" | string
  colors: {
    primary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
  sections: {
    hero?: ThemeSectionHero;
    featuredCollections?: ThemeSectionFeaturedCollections;
    featuredProducts?: ThemeSectionFeaturedProducts;
    grid?: ThemeSectionGrid;
  };
};

export type ShopPage = {
  handle: string; // e.g., "about"
  title: string;
  content: string; // HTML string (trusted from seller editor)
  visibility: "public" | "hidden";
  updatedAt?: string;
};
