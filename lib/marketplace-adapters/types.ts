export type MarketplaceProvider = 'ebay' | 'allegro';

export type MarketplaceSearchParams = {
  query: string;
  country: string;
  maxResults?: number;
};

export type MarketplaceAdapterOffer = {
  provider: MarketplaceProvider;
  externalId: string;
  title: string;
  url: string;
  price: number | null;
  currency: string | null;
  reviewCount: number | null;
  rating: number | null;
  availability: string | null;
  sellerName: string | null;
  sellerScore: number | null;
  shippingNote: string | null;
  imageUrl: string | null;
  sourceConfidence: 'high' | 'medium' | 'low';
  rawJson?: unknown;
};

export interface MarketplaceAdapter {
  isConfigured(): boolean;
  searchOffers(params: MarketplaceSearchParams): Promise<MarketplaceAdapterOffer[]>;
}