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
- Events: `checkout_session.payment.paid`, `payment.paid`, `payment.failed`, `payment.refunded`
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

## Troubleshooting payment_status stuck at 'unpaid'

| Symptom | Check |
|---------|-------|
| Webhook never fires | 1. Function deployed? `supabase functions list`<br>2. URL correct in PayMongo dashboard?<br>3. Events selected: `checkout_session.payment.paid`, `payment.paid` |
| Webhook returns 401 | `PAYMONGO_WEBHOOK_SECRET` in Supabase secrets ≠ PayMongo signing secret |
| Webhook returns 500 | Check Edge Function logs: `supabase functions logs paymongo-webhook` |
| Webhook succeeds but order not updated | 1. `payment_events` table has the event?<br>2. `payments` table has `paymongo_checkout_session_id` matching webhook `resource.id`?<br>3. `record_payment_result` returned 'paid' (not 'unknown_reference' or 'flagged') |
| Amount mismatch flagged | Order total × 100 must equal PayMongo `amount` in centavos |

**Manual sync (fallback):**
```bash
# In browser console on /order-confirmation/<id> page:
callCheckout({ action: 'sync', order_id: <ORDER_ID> })
```
This queries PayMongo directly via the `checkout` edge function's `sync` action.
