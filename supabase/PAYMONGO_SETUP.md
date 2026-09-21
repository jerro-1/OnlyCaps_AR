# PayMongo setup

How payments work:

```
Checkout page ──► checkout (edge function) ──► creates order + PayMongo checkout session
                                                 (prices come from the products table)
Shopper pays on PayMongo's hosted page (GCash / card) ── card data never touches our site
PayMongo ──► paymongo-webhook (edge function, HMAC-verified) ──► payments + orders marked paid
Admin dashboard ──► reads `payments` (live via Realtime)
```

Cash on delivery skips PayMongo: the order stays `unpaid` until an admin presses
**Mark collected** on the Payments page.

## 1. Database
Apply `migrations/20260922000000_paymongo_payments.sql` (SQL editor, `supabase db push`, or the Supabase MCP).

## 2. Deploy the edge functions
```
supabase functions deploy checkout --no-verify-jwt
supabase functions deploy paymongo-webhook --no-verify-jwt
```

## 3. Register the webhook in PayMongo (Dashboard → Developers → Webhooks)
- URL: `https://dayrvhcxlveadhvrfnhe.supabase.co/functions/v1/paymongo-webhook`
- Events: `checkout_session.payment.paid`, `payment.failed`, `payment.refunded`
- Copy the webhook's **secret key** (`whsk_...`).

## 4. Set the secrets (never commit these, never put them in `.env` / Vercel env for the frontend)
```
supabase secrets set PAYMONGO_SECRET_KEY=sk_test_...
supabase secrets set PAYMONGO_WEBHOOK_SECRET=whsk_...
supabase secrets set ALLOWED_ORIGINS=https://YOUR-SITE.vercel.app,http://localhost:5173
```
Use `sk_test_` keys until you are ready to go live, then swap in `sk_live_` and a live webhook.

## 5. Test
Use PayMongo's test GCash / test card (e.g. `4343 4343 4343 4345`, any future expiry, any CVC)
and watch the payment appear on **Admin → Payments**.
