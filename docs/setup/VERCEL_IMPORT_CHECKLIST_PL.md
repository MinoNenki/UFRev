# Vercel import - checklista 1:1

Ta checklista jest pod swiezy import repo do Vercel.

## 1. Import projektu
- Wejdz do Vercel i wybierz `Add New -> Project`.
- Podlacz repo `UFRev`.
- Upewnij sie, ze branch produkcyjny to `main`.

## 2. Environment Variables (Production)
Dodaj ponizsze zmienne przed pierwszym publicznym deployem:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_SCALE`
- `STRIPE_PRICE_PACK_9`
- `STRIPE_PRICE_PACK_19`
- `STRIPE_PRICE_PACK_39`
- `REWARD_TOKEN_SECRET_CURRENT`
- `REWARD_TOKEN_KID_CURRENT`
- `SIGNED_LINK_SECRET_CURRENT`
- `SIGNED_LINK_KID_CURRENT`

Dla testow preview skopiuj ten sam zestaw do `Preview`.

## 3. Krytyczne warunki poprawnosci
- Stripe key (`STRIPE_SECRET_KEY`) i webhook secret (`STRIPE_WEBHOOK_SECRET`) musza pochodzic z tego samego konta Stripe.
- `NEXT_PUBLIC_SITE_URL` dla produkcji ustaw na docelowa domene, np. `https://ufrev.com`.
- Sekrety podpisujace (`REWARD_TOKEN_SECRET_CURRENT`, `SIGNED_LINK_SECRET_CURRENT`) powinny miec min. 32 bajty.

## 4. Deploy
- Po zapisaniu env wybierz `Redeploy`.
- W logach deploymentu sprawdz, czy nie ma `prerender-error`.

## 5. Weryfikacja po deployu
- Otworz `/setup` i sprawdz statusy konfiguracji.
- Otworz `/pricing` i sprawdz, czy checkout startuje.
- Potwierdz, ze webhook Stripe trafia na: `/api/stripe/webhook`.

## 6. Gdyby nadal byl blad
- Wejdz w `Inspect Deployment`.
- Sprawdz, czy blad jest z fazy `Build` czy z runtime po uruchomieniu.
- Jesli to runtime, zwykle przyczyna to brak lub niespojne env.
