export type BuilderBlockType =
  | 'Header'
  | 'Hero'
  | 'Banner'
  | 'ProductSlider'
  | 'RichText'
  | 'Footer';

export type BuilderBlockBase<TType extends BuilderBlockType = BuilderBlockType, TProps = any> = {
  id: string;
  type: TType;
  props?: TProps;
};

export type HeaderProps = {
  logoUrl?: string;
  menu?: Array<{ label: string; href: string; children?: Array<{ label: string; href: string }> }>;
};
export type HeroProps = { image?: string; heading?: string; subheading?: string; ctaText?: string; ctaHref?: string };
export type BannerProps = { image: string; href?: string; alt?: string };
export type ProductSliderProps = { title?: string; productIds?: string[]; limit?: number };
export type RichTextProps = { html: string };
export type FooterProps = { copyright?: string; links?: Array<{ label: string; href: string }> };

export type BuilderBlock =
  | BuilderBlockBase<'Header', HeaderProps>
  | BuilderBlockBase<'Hero', HeroProps>
  | BuilderBlockBase<'Banner', BannerProps>
  | BuilderBlockBase<'ProductSlider', ProductSliderProps>
  | BuilderBlockBase<'RichText', RichTextProps>
  | BuilderBlockBase<'Footer', FooterProps>;

export type BuilderPage = {
  blocks: BuilderBlock[];
};

export type ShopBuilder = {
  home?: BuilderPage;
  about?: BuilderPage;
  pages?: Record<string, BuilderPage>; // handle -> builder
};
