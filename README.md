# UFREV.com / Ultra Future Review

This package contains the branded UFREV.com version of your app, prepared for a more global SaaS presentation.

## What was improved
- Login flow now redirects to **My Account** after sign-in.
- Navigation now changes correctly for authenticated users.
- Added **Log out** button.
- Added **language switcher** with English as the default language and Polish as an optional language.
- Main public pages, pricing, account, support, reviews, and legal pages were rewritten into English-first UI.
- Pricing labels now use **$**.
- OpenAI config now supports `OPENAI_API_KEY` and legacy custom key names.
- Package prepared as a cleaner source archive without `.next`, `node_modules`, or `.env.local`.

## Important security note
Your uploaded ZIP contained real keys in `.env.local`.
Do **not** reuse them as-is.
Rotate the exposed keys in:
- OpenAI
- Supabase anon key / service role key
- any other secret that was bundled before deployment

## Step-by-step local setup
1. Extract the ZIP.
2. Open the project folder in **VS Code**.
3. Open the terminal in VS Code.
4. Run:
   ```bash
   npm install
   ```
5. Copy `.env.example` to `.env.local`.
6. Fill in `.env.local` with your real values:
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `REWARD_TOKEN_SECRET`
   - `STRIPE_PRICE_STARTER_19`
   - `STRIPE_PRICE_GROWTH_49`
   - `STRIPE_PRICE_SCALE_99`
   - `STRIPE_PRICE_COMMAND_149`
   - `STRIPE_PRICE_PACK_9`
   - `STRIPE_PRICE_PACK_19`
   - `STRIPE_PRICE_PACK_39`
7. In Supabase, run the full SQL from:
   ```
   supabase/schema.sql
   ```
   If your project database already existed before the referral system was added and signup fails with "Database error saving new user", also run:
   ```
   supabase/signup_referral_hotfix.sql
   ```
8. Start the app:
   ```bash
   npm run dev
   ```
9. Open:
   ```
   http://localhost:3000
   ```
10. Register a new account.
11. Log in and confirm that the top navigation now shows:
   - **My account**
   - **Log out**
12. Open **My account** and verify your profile loads correctly.
13. To enable admin access, open Supabase and set `role = 'admin'` for your user in the `profiles` table.
14. After that, log in again and open:
   - `/admin`
15. Create the Stripe products and prices for:
   - Starter $19
   - Pro $59
   - Scale $149
   - Micro Pack $9
   - Flex Pack $19
   - Pro Pack $39
16. Paste those Stripe Price IDs into `.env.local`.
17. For local Stripe webhooks run:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
18. Copy the webhook secret into `STRIPE_WEBHOOK_SECRET`.
19. Run a final type check:
   ```bash
   npm run typecheck
   ```
20. When everything works, push to GitHub and deploy on Vercel.

## Google ad provider setup
For live Google monetization and advertiser sync, fill the new variables from `.env.example`:
- `NEXT_PUBLIC_ADSENSE_CLIENT_ID`
- `NEXT_PUBLIC_ADSENSE_SLOT_ID`
- `GOOGLE_ADSENSE_PUBLISHER_ID`
- `GOOGLE_ADSENSE_MANAGEMENT_ACCESS_TOKEN`
- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_REFRESH_TOKEN`
- `GOOGLE_ADS_CUSTOMER_ID`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`

Then open `/admin/monetization`, save the provider configuration, and use the new sync button on the Google AdSense or Google Ads card.

## Private staging / stealth launch mode
If you want to test the app online without exposing it publicly, enable the private preview gate in `.env.local` or in Vercel project variables:

```bash
PRELAUNCH_MODE=true
PRELAUNCH_PASSWORD=your-strong-private-password
PRELAUNCH_COOKIE_NAME=ufrev_preview_access
```

Then:
1. Redeploy or restart the app.
2. Open `/launch-access`.
3. Enter the preview password.
4. Only people with that password will be able to browse the app pages.

## Vercel deployment checklist
1. Push the cleaned project to GitHub.
2. Import the repository into Vercel.
3. Add all environment variables in Vercel Project Settings.
4. Set your production domain in:
   - `NEXT_PUBLIC_SITE_URL`
5. Add Stripe webhook URL for production:
   - `https://ufrev.com/api/stripe/webhook`
6. Redeploy after adding env variables.

## Notes before launch
- Replace placeholder company details in `lib/site.ts`.
- Update the legal pages with your real business data.
- Consider adding full i18n routing later if you want every page and every database-driven message localized dynamically.
- Review the admin area and remaining older internal strings if you want a fully English-only back office.


## New in this version
- Added **Automations** page for users
- Added **Integrations** page for users
- Added admin module: `/admin/automations`
- Added admin module: `/admin/integrations`
- Added placeholders for Shopify, Amazon, and eBay credentials in `.env.example`
- Added default configuration for automation and integration settings in `supabase/schema.sql`
- Added `docs/setup/AUTOMATIONS_AND_MARKETPLACES.md` with setup notes

## Quick walkthrough for the new features
1. Start the project locally
2. Create an account and log in
3. Open `/dashboard`
4. Review the new **Automations** and **Integrations** buttons
5. Promote your user to `admin` in Supabase
6. Open `/admin/automations` and `/admin/integrations`
7. Save your preferred settings

## Important note about live marketplace connections
This package includes the connection layer, settings UI, and environment placeholders for Shopify, Amazon, and eBay.
To make those channels work live, you must still add your own real marketplace accounts, API credentials, and approval where required.


## Hardened security in this version
- request rate limiting for analysis flow
- daily analysis cap
- stricter file and text limits
- estimated AI cost guardrail before model execution
- monthly analysis limit enforced in SQL function
- reward claim cooldown and signed reward token
- new tables: `ai_usage_logs` and `security_events`
- new secret: `REWARD_TOKEN_SECRET`


## Decision engine upgrade in this package
This ZIP now includes a stronger analysis core focused on decision quality, UX clarity, and monetization triggers.

### Added in this upgrade
- Weighted decision engine with factor scoring instead of a flat score bump model
- Confidence score based on evidence quality, URLs, uploaded files, screenshots, and context depth
- Moat score to estimate defensibility / differentiation
- Pricing guidance:
  - estimated margin
  - break-even ROAS
  - suggested test price
  - suggested price range
- "Why AI said this" explanation block in the UI
- Market signals block in the UI
- Verdict-based upgrade trigger and recommended plan payload returned by the API

### Important limitation
This version is **connector-ready**, not fully live-market-data-connected by default.
That means:
- Shopify / Amazon / eBay settings are prepared
- the engine can use manual evidence and uploaded research immediately
- real live marketplace syncing still requires your own credentials, approvals, and connector work

### Updated local launch flow
1. Extract the ZIP and open it in VS Code.
2. Run:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local`.
4. Fill all required variables for:
   - Supabase
   - Stripe
   - OpenAI
   - optional marketplace placeholders
5. In Supabase SQL Editor run:
   ```sql
   supabase/schema.sql
   ```
6. Start locally:
   ```bash
   npm run dev
   ```
7. Open `http://localhost:3000`
8. Test the analysis flow with:
   - price
   - cost
   - demand
   - competition
   - a product URL
   - competitor URLs
   - uploaded files / screenshots
9. Push to GitHub.
10. Import the repo into Vercel and copy the same env variables to Vercel project settings.

### Stripe note
Current plan naming in code is:
- Starter: $19
- Pro: $59
- Scale: $149

Current credit pack naming in code is:
- Micro Pack: $9
- Flex Pack: $19
- Pro Pack: $39

Make sure your Stripe products and Price IDs match `lib/plans.ts`.

## GitHub and Vercel hygiene
- `.env`, `.env.local`, `.env.production`, `.env.*` should stay out of the repository; only `.env.example` should be committed.
- This project does not require a dedicated `vercel.json` for a standard Next.js deploy.
- In Vercel, copy all production env variables before the first public deployment, especially `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `REWARD_TOKEN_SECRET`.
- If `REWARD_TOKEN_SECRET` is missing in production, rewarded ad claims stay disabled by design.


## V2 safety upgrade
This V2 package adds stronger anti-burn and anti-loss protections.

### New safety layers
- BUY verdict can now be downgraded to TEST when guardrails are not met
- minimum confidence threshold for BUY
- minimum profitability guardrail for BUY
- optional requirement for competitor evidence before BUY
- optional requirement for product URL before BUY
- max safe initial ad-test budget
- manual-approval-before-scale mode
- dry-run marketplace mode
- auto-publish disabled by default
- max sync price-change protection
- minimum stock buffer protection

### Recommended safe default
Keep these ON until you have real connector data and clean operational metrics:
- require competitor evidence for BUY
- require product URL for BUY
- require manual approval before scale
- dry run mode
- disable auto-publish


## V3 hard anti-loss upgrade
This version adds hard-stop protections and staged rollout logic.

### New in V3
- kill switch support
- hard daily spend cap
- staged rollout by waves
- cooldown after loss
- refund-rate threshold
- CAC as % of AOV threshold
- connector publish rate limit

### Practical meaning
The engine can now say:
- score is good
- but scale is blocked
- because your anti-loss rules say conditions are unsafe

That is exactly what protects cash and prevents “spalenie budżetu”.


## V4 scale-for-revenue upgrade
This version is focused on turning analysis into stronger monetization.

### Added in V4
- smart paywall settings
- premium gate score threshold
- high-intent confidence trigger
- free analyses before paywall
- credit-pack upsell threshold
- annual discount config
- execution logging table for monetization analytics
- revenue playbook in the decision result

### Revenue scaling logic
- high score + high confidence -> premium gate / Growth or Scale plan
- medium score -> Starter or Growth + credit-pack upsell
- weak score -> retain with ads, referrals, and new analysis loops


## V5 live revenue analytics
This version adds the first real monetization analytics layer.

### Added in V5
- monetization_events table
- checkout intent tracking
- purchase completed tracking
- revenue analytics helper
- monetization funnel snapshot in admin
- recent execution log feed in admin

This gives you the basics for:
- intent -> checkout -> purchase measurement
- smarter paywall tuning
- better plan and credit-pack decisions


## V6 owner KPI dashboard
This version adds the first owner-facing KPI layer.

### Added in V6
- MRR view
- ARR view
- ARPPU view
- LTV proxy
- LTV/CAC proxy
- paid-user cohorts
- more monetization controls for KPI assumptions

Use these as operator metrics to steer the business.
They are practical startup metrics, not audited finance statements.


## V8 pioneer growth stack
This version adds retention, CRM, dynamic pricing, and realtime notification foundations.

### Added in V8
- churn-risk scoring
- retention scan route
- CRM events
- in-app notification queue
- dynamic pricing quote API
- personalization engine
- admin retention page

This is designed to help the product compete globally by improving:
- retention
- personalization
- price experimentation
- lifecycle marketing


## Final strongest build in this cycle
This package adds:
- CRM delivery adapter
- notification dispatch route
- founder command center

External delivery still requires your own provider credentials.
Without those credentials, the system safely queues and marks notifications as ready_no_provider.
