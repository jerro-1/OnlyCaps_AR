# OnlyCaps AR — Project Tracking

**Last Updated:** 2026-10-15  
**Branch:** `onlycaps-full-rebuild`  
**Status:** Active development

---

## Legend

| Status | Meaning |
|--------|---------|
| 🟢 Done | Completed and verified |
| 🟡 In Progress | Currently being worked on |
| 🔵 Blocked | Waiting on dependency/approval |
| 🔴 Not Started | Not yet begun |
| ⚪ On Hold | Deferred intentionally |

| Owner | Meaning |
|-------|---------|
| **BE** | Backend (Supabase, Edge Functions, SQL) — *I can do with approval* |
| **FE** | Frontend (React, UI, client logic) — *You confirm* |
| **ACCT** | Account/Infra (Vercel, PayMongo, Supabase Auth) — *Only you can do* |
| **DOC** | Documentation (ERD, DFD, thesis chapters, deck) |
| **TEST** | Testing/QA |

---

## Backend (BE) — I can do with your approval

| # | Task | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 1 | Deploy weekly-backup function, schedule it, run once | 🔴 Not Started | BE | No backup function or scheduled job exists yet. See [Supabase Cron](https://supabase.com/docs/guides/database/database-cron-jobs) or pg_cron. |
| 14 | One sandbox GCash payment: order → confirmed, stock ↓, payment_events row | 🔴 Not Started | TEST | Stock deduction is live. Need to verify webhook flips order to "confirmed" and creates payment_events row. |
| 15 | Register → verify email → login → MFA, end to end | 🔴 Not Started | TEST | |
| 17 | Customer-vs-admin security check | 🔴 Not Started | TEST | RLS policies in place; verify no privilege escalation. |

---

## Your Accounts (ACCT) — Only you can do these

| # | Task | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 2 | Register PayMongo webhook + add `PAYMONGO_WEBHOOK_SECRET` | 🔴 Not Started | ACCT | Required for GCash/card order confirmation. Webhook URL: `https://<project>.supabase.co/functions/v1/paymongo-webhook` |
| 3 | Turn on leaked-password protection in Supabase Auth | 🔴 Not Started | ACCT | Supabase Dashboard → Authentication → Settings → "Check for leaked passwords" |
| 4 | Create a regular customer account (all 4 current profiles are admins) | 🔴 Not Started | ACCT | Needed for survey testing and customer-flow verification. |
| 5 | Deploy site to Vercel/Netlify + set env vars | 🔴 Not Started | ACCT | Current Vercel account only has EventHub project. |

---

## Frontend Code (FE) — Lives in React app

| # | Task | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 6 | Chatbot UI wired to `recommend_caps` | 🔴 Not Started | FE | No chatbot-related DB tables; likely client-only or not built. |
| 7 | AR fixes: head-tilt tracking, photo-upload fallback, "no face detected" state, size chart (S/M/L/XL), estimate disclaimer, logging to `size_estimates` | 🔴 Not Started | FE | Core AR functionality; verify `size_estimates` table exists. |
| 8 | Admin reports page with PDF export and print | 🔴 Not Started | FE | PDF generation (jspdf/pdfmake) + print styles. |
| 9 | Admin orders: courier & tracking inputs + tracking link on customer Orders page | 🔴 Not Started | FE | `courier_name`, `tracking_number` columns exist on `orders`. |
| 10 | Admin inventory page: add/edit/delete + low-stock flag | 🔴 Not Started | FE | Stock deduction logic is live; UI needed. |
| 11 | "Back up now" button | 🔴 Not Started | FE | Calls the weekly-backup function (once #1 is done). |
| 12 | Check guests can browse without logging in | 🔴 Not Started | FE/TEST | Verified at DB level (public read on products); confirm UI allows it. |
| 13 | Mobile and UI polish on all customer pages | 🔴 Not Started | FE | Responsive, touch targets, load states, error handling. |

---

## Documentation & Defense (DOC)

| # | Task | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 18 | Update ERD: no Shipment table; tracking on orders. Add payments, payment_events, size_estimates, backup_log | 🔴 Not Started | DOC | Current ERD outdated. Use dbdiagram.io, Mermaid, or draw.io. |
| 19 | Update DFD & architecture diagrams; get adviser sign-off (panel #26) | 🔴 Not Started | DOC | Reflect Supabase, PayMongo, Vercel, AR, chatbot. |
| 20 | Run survey with 30 respondents; tabulate results | 🔴 Not Started | DOC | Design survey (Google Forms/Typeform), collect, analyze. |
| 21 | Write Chapters 4 & 5; proofread | 🔴 Not Started | DOC | Chapter 4 = Results, Chapter 5 = Discussion/Conclusion. |
| 22 | Build defense deck; rehearse; print sample reports | 🔴 Not Started | DOC | Slides + demo script + printed artifacts. |

---

## Testing Checklist (TEST) — Formal test cases

| # | Test Case | Status | Owner | Notes |
|---|-----------|--------|-------|-------|
| 14 | Sandbox GCash payment → order confirmed, stock drops, payment_events row | 🔴 Not Started | TEST | See BE #14. |
| 15 | Register → verify email → login → MFA (full flow) | 🔴 Not Started | TEST | See BE #15. |
| 16 | AR on Android Chrome + iOS Safari | 🔴 Not Started | TEST | Head tracking, photo fallback, size estimate, logging. |
| 17 | Security: customer vs admin access control | 🔴 Not Started | TEST | See BE #17. |

---

## Verified Complete ✅

| # | Task | Verified |
|---|------|----------|
| 21 | GCash & credit card via PayMongo hosted checkout | ✅ Real paid orders exist; server-side pricing; secrets safe |
| 20 | Courier/tracking columns on orders | ✅ `courier_name`, `tracking_number` exist; one order has tracking |
| 23 | Browse without login | ✅ Products publicly readable at DB level |
| 24 | Cloud (Supabase, Postgres 17, Tokyo) | ✅ Document in manuscript |
| — | RLS: customers see own orders; admins edit products/orders; trigger blocks self-promotion | ✅ |
| — | **Stock deduction on paid orders** | ✅ Live & tested: per-size + total sync; COD reserves on confirm/ship/deliver; cancel/refund restores; `stock_deducted` flag prevents double-count; legacy orders untouched; floor at 0 |

---

## Priority Order (from your list)

1. **Stock deduction** → ✅ DONE
2. **Test PayMongo webhook end-to-end** (sandbox GCash) → #14
3. **Set up weekly backup + run once** → #1
4. **Deploy to live URL** → #5
5. **Test with customer account** → #4 + #15
6. **Finish/confirm chatbot, AI sizing, PDF reports** → #6, #7, #8
7. **Run survey → write Chapters 4 & 5** → #20, #21
8. **Update diagrams → adviser sign-off → defense deck** → #18, #19, #22

---

## Quick Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/<project-id>
- **Vercel Dashboard:** https://vercel.com/dashboard
- **PayMongo Dashboard:** https://dashboard.paymongo.com/
- **GitHub Repo:** https://github.com/jerro-1/OnlyCaps_AR
- **Live Branch:** `onlycaps-full-rebuild`

---

## Notes / Blockers

- **Webhook URL for PayMongo:** `https://<project-ref>.supabase.co/functions/v1/paymongo-webhook` — set in PayMongo dashboard + add `PAYMONGO_WEBHOOK_SECRET` to Supabase Edge Function env vars.
- **Weekly backup:** Consider `pg_dump` via Edge Function + cron, or Supabase's built-in backup (Pro plan). Store in Supabase Storage or S3.
- **Customer test account:** Create via Supabase Auth UI or signup flow; ensure not admin.
- **AR logging:** Confirm `size_estimates` table exists with columns: `id`, `user_id`, `session_id`, `head_circumference_cm`, `recommended_size`, `confidence`, `created_at`.
- **Chatbot:** If `recommend_caps` is a Postgres function or Edge Function, wire UI to call it. If not built, decide scope (rule-based vs. LLM).

---

*Update this file as tasks progress. Commit changes to track history.*