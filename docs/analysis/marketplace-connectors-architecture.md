# Marketplace Connectors Architecture

## Goal

Build real marketplace connectors so analysis can return verified offers, prices, links, ratings, and risk signals from Amazon, eBay, Allegro, and later Alibaba/AliExpress.

## Current State

- Public research and provided links are already used in the analysis flow.
- Admin integration settings already track enabled lanes like Amazon, eBay, Allegro, Alibaba, Shopify, and WooCommerce.
- The new recommendation layers now expose:
  - product sourcing shortlist
  - service setup plan
  - concrete research links

## Target Capability

For each connected marketplace, the platform should be able to:

1. search listings by keyword, country, and category
2. fetch listing details: title, price, currency, image, review count, stock, seller proof, shipping clues
3. save normalized offers in one shared storage layer
4. rank offers for sourcing or benchmarking
5. feed the ranked results into the analysis engine

## Recommended Connector Layers

### 1. Credentials Layer

Store all secrets server-side only.

Use environment variables for app-level credentials:

- Amazon SP-API:
  - AMAZON_SELLER_PARTNER_APP_ID
  - AMAZON_SELLER_PARTNER_CLIENT_ID
  - AMAZON_SELLER_PARTNER_CLIENT_SECRET
  - AMAZON_MARKETPLACE_ID
- eBay:
  - EBAY_APP_ID
  - EBAY_DEV_ID
  - EBAY_CERT_ID
  - EBAY_ENVIRONMENT
  - EBAY_SITE_ID
- Allegro:
  - ALLEGRO_CLIENT_ID
  - ALLEGRO_CLIENT_SECRET
  - ALLEGRO_REDIRECT_URI
  - ALLEGRO_ENVIRONMENT

User or tenant tokens should live in Supabase tables, encrypted at rest.

Recommended table:

- marketplace_oauth_tokens
  - id
  - user_id
  - provider
  - access_token_encrypted
  - refresh_token_encrypted
  - expires_at
  - scope_json
  - account_id
  - region_code
  - created_at
  - updated_at

## 2. Provider Adapter Layer

Create one adapter per provider with a shared interface.

Recommended interface:

```ts
type MarketplaceSearchParams = {
  query: string;
  country: string;
  category?: string;
  maxResults?: number;
};

type MarketplaceOffer = {
  provider: 'amazon' | 'ebay' | 'allegro';
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
  rawJson: unknown;
};

interface MarketplaceAdapter {
  searchOffers(params: MarketplaceSearchParams): Promise<MarketplaceOffer[]>;
  getOfferById(id: string, country: string): Promise<MarketplaceOffer | null>;
  refreshTokenIfNeeded(userId: string): Promise<void>;
}
```

Suggested files:

- lib/marketplace-adapters/amazon.ts
- lib/marketplace-adapters/ebay.ts
- lib/marketplace-adapters/allegro.ts
- lib/marketplace-adapters/types.ts
- lib/marketplace-adapters/index.ts

## 3. Normalized Storage Layer

Save raw offers and normalized offers separately.

Recommended tables:

- marketplace_search_cache
  - id
  - provider
  - query_hash
  - country_code
  - request_json
  - response_json
  - expires_at
  - created_at

- marketplace_offers
  - id
  - provider
  - external_id
  - country_code
  - title
  - url
  - price
  - currency
  - review_count
  - rating
  - availability
  - seller_name
  - seller_score
  - shipping_note
  - image_url
  - source_confidence
  - raw_json
  - fetched_at
  - created_at
  - updated_at

## 4. Ranking Layer

Add ranking logic on top of normalized offers.

Recommended scoring dimensions:

- price attractiveness
- review proof
- seller trust
- stock/availability
- shipping friction
- relevance to user query
- region fit

Suggested output:

```ts
type RankedMarketplaceOffer = MarketplaceOffer & {
  rankScore: number;
  risk: 'low' | 'medium' | 'high';
  whyItFits: string;
};
```

## 5. Analysis Integration Layer

The analysis route should call a sourcing orchestrator:

- if a real connector is active and credentials are valid:
  - search real marketplace data
  - normalize and rank offers
  - attach top offers to decision.productSourcing
- if not:
  - fall back to public research and provided links

Suggested orchestrator:

- lib/marketplace-sourcing.ts

## OAuth Flow Notes

### Amazon

- Use Login with Amazon + Selling Partner API flow.
- Token refresh is mandatory.
- Region and marketplace mapping must be explicit.

### eBay

- Use OAuth authorization code flow.
- Support browse/search first before heavier seller sync.

### Allegro

- Use OAuth authorization code flow.
- Country/market mapping should be tied to locale and currency.

## Jobs and Sync

Recommended background jobs:

- refresh expired OAuth tokens
- refresh hot query caches
- nightly benchmark sync for saved watchlists
- fetch details for shortlisted products after search

Recommended task names:

- sync:marketplace-tokens
- sync:marketplace-search-cache
- sync:marketplace-offers
- sync:marketplace-benchmarks

## Security Rules

- Never expose provider secrets or refresh tokens to the client.
- Encrypt stored OAuth tokens.
- Log provider errors without logging secrets.
- Add per-provider rate-limit protection.
- Cache search results to reduce API cost and throttling risk.

## Rollout Order

1. eBay browse/search connector
2. Allegro search connector
3. Amazon SP-API search/offer connector
4. saved shortlist persistence
5. background sync and watchlists

## Why This Order

- eBay and Allegro are simpler and give faster value for product sourcing and benchmarking.
- Amazon is more powerful, but implementation and auth complexity are higher.
- The current public-research fallback already gives partial value, so the first real connector should optimize time-to-market.