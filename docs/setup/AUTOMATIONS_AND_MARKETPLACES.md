# Automations + Shopify / Amazon / eBay setup

This package now includes a stronger monetization and operations layer designed for max profit.

## What is included
- User-facing **Automations** page
- User-facing **Integrations** page
- Admin **Automations** module
- Admin **Integrations** module
- Default config stored in `app_config`
- Ready placeholders for Shopify, Amazon, and eBay credentials in `.env.example`

## What is already done in code
- The UI, admin settings, and app configuration layer are added.
- The project is prepared for marketplace and automation setup without redesigning the dashboard.
- Shopify / Amazon / eBay are prepared as configurable channels.

## What still requires your real accounts
To make live marketplace sync work, you still need your own:
- Shopify store and Admin API token
- Amazon Seller account / SP-API credentials
- eBay developer credentials

Without those, the app can show the integration center and store settings, but it cannot perform real live sync.

## How to configure locally
1. Copy `.env.example` to `.env.local`
2. Fill marketplace env values
3. Run the SQL from `supabase/schema.sql`
4. Start the app with `npm run dev`
5. Log in as admin
6. Open `/admin/automations`
7. Open `/admin/integrations`
8. Save your preferred settings

## Recommended max-profit defaults
- Keep Shopify as the main brand and checkout center
- Use Amazon and eBay as additional demand channels
- Keep pricing sync enabled, but protect low-margin products with the automation guardrails
- Use reward ads only as a soft unlock path, not as a replacement for subscriptions
- Keep competitor scans enabled to improve conversion and pricing decisions over time

## Pages to review
- `/dashboard`
- `/automations`
- `/integrations`
- `/admin`
- `/admin/automations`
- `/admin/integrations`
