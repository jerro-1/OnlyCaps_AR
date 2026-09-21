// paymongo-webhook: the ONLY path (besides the verified 'sync' action) that can
// mark an online payment as paid.
//
//   1. Verify the Paymongo-Signature HMAC-SHA256 over "<timestamp>.<raw body>"
//      with our webhook secret (constant-time compare, 5 minute replay window).
//   2. Skip events we've already processed (idempotency).
//   3. Apply the result through record_payment_result(), which re-checks that the
//      amount paid equals the amount we asked for.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { extractPaid } from '../_shared/paymongo.ts';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const TOLERANCE_SECONDS = 300;
const MAX_BODY = 200_000;

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const reply = (status: number, body: string) => new Response(body, { status });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply(405, 'Method not allowed');

  const secret = Deno.env.get('PAYMONGO_WEBHOOK_SECRET');
  if (!secret) {
    console.error('PAYMONGO_WEBHOOK_SECRET is not configured');
    return reply(500, 'Not configured');
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY) return reply(413, 'Too large');

  // ---- 1. signature
  const parts: Record<string, string> = {};
  for (const piece of (req.headers.get('paymongo-signature') ?? '').split(',')) {
    const i = piece.indexOf('=');
    if (i > 0) parts[piece.slice(0, i).trim()] = piece.slice(i + 1).trim();
  }
  const timestamp = Number(parts.t);
  if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) return reply(400, 'Stale or missing timestamp');

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return reply(400, 'Bad JSON');
  }

  const livemode = event?.data?.attributes?.livemode === true;
  const expected = livemode ? parts.li : parts.te; // PayMongo sends a test (te) and live (li) signature
  const actual = await hmacHex(secret, `${parts.t}.${raw}`);
  if (!expected || !timingSafeEqual(actual, expected)) return reply(401, 'Invalid signature');

  // ---- 2. idempotency
  const eventId: string = event?.data?.id;
  const type: string = event?.data?.attributes?.type;
  const resource = event?.data?.attributes?.data;
  if (!eventId || !type || !resource) return reply(400, 'Malformed event');

  const { data: seen } = await admin.from('payment_events').select('event_id').eq('event_id', eventId).maybeSingle();
  if (seen) return reply(200, 'duplicate');

  // ---- 3. apply
  let result = 'ignored';
  let summary: Record<string, unknown> = { resource_id: resource.id };

  try {
    if (type === 'checkout_session.payment.paid') {
      const paid = extractPaid(resource);
      if (paid) {
        const { data, error } = await admin.rpc('record_payment_result', {
          p_ref: resource.id,
          p_outcome: 'paid',
          p_paymongo_payment_id: paid.paymentId,
          p_payment_intent_id: paid.paymentIntentId,
          p_amount_centavos: paid.amountCentavos,
          p_card_brand: paid.cardBrand,
          p_card_last4: paid.cardLast4,
        });
        if (error) throw new Error(error.message);
        result = data;
        summary = { ...summary, amount: paid.amountCentavos, result };
      }
    } else if (type === 'payment.failed') {
      const ref = resource?.attributes?.payment_intent_id;
      if (ref) {
        const { data, error } = await admin.rpc('record_payment_result', {
          p_ref: ref,
          p_outcome: 'failed',
          p_failure: resource?.attributes?.failed_message ?? resource?.attributes?.failed_code ?? 'Payment failed',
        });
        if (error) throw new Error(error.message);
        result = data;
        summary = { ...summary, result };
      }
    } else if (type === 'payment.refunded') {
      const ref = resource?.attributes?.payment_intent_id;
      if (ref) {
        const { data, error } = await admin.rpc('record_payment_result', { p_ref: ref, p_outcome: 'refunded' });
        if (error) throw new Error(error.message);
        result = data;
        summary = { ...summary, result };
      }
    }
  } catch (err) {
    console.error('webhook processing failed', type, eventId, err);
    return reply(500, 'Processing failed'); // PayMongo retries on non-2xx
  }

  await admin
    .from('payment_events')
    .upsert({ event_id: eventId, event_type: type, livemode, summary }, { onConflict: 'event_id' });

  return reply(200, result);
});
