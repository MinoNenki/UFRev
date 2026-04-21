# V2 Safety Upgrade

This version focuses on protecting budget, margin, and listing safety.

## Added
- risk guardrails in `lib/decision-engine.ts`
- admin controls for confidence and budget limits
- integration dry-run mode and manual approval flags
- connector safety defaults in `supabase/schema.sql`

## Core rule
A high score alone is no longer enough for BUY.
BUY is allowed only when your safety conditions are also satisfied.
