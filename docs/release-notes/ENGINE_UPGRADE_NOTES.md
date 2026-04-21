# UFREV Engine Upgrade Notes

## Files changed
- lib/decision-engine.ts
- app/api/analyze/route.ts
- components/DecisionResult.tsx
- components/AnalyzeForm.tsx
- README.md

## What changed
1. Replaced the flat score model with a weighted factor model:
   - demand
   - competitive gap
   - unit economics
   - offer strength
   - evidence quality
   - testing power

2. Added richer output:
   - confidence
   - moatScore
   - why[]
   - marketSignals[]
   - pricing guidance
   - monetization triggers

3. Improved the UI:
   - why AI said this
   - factor cards
   - confidence and moat
   - pricing cards
   - recommended upgrade block

## Honest limitation
The app still does not fetch real live Amazon / Shopify data automatically out of the box.
It is now better prepared for that layer, but it still needs:
- approved APIs / tokens
- connector logic
- sync jobs
- data normalization

## Best next step after this ZIP
Build real market connectors:
- Shopify Admin API
- Amazon SP-API
- eBay Browse / Feed APIs
- Google Trends / SERP signal layer
