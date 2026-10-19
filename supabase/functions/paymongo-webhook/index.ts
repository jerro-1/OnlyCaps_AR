import { createClient } from 'npm:@supabase/supabase-js@2';
import { extractPaid, getCheckoutSession } from '../_shared/paymongo.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const TOLERANCE_SECONDS = 300;
const MAX_BODY = 200_000;

type JsonObject = Record<string, any>;

function reply(status: number, message: string) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));

  return Array.from(new Uint8Array(signature))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let difference = 0;

  for (let i = 0; i < a.length; i++) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return difference === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return reply(405, 'Method not allowed');
  }

  const secret = Deno.env.get('PAYMONGO_WEBHOOK_SECRET');

  if (!secret) {
    console.error('PAYMONGO_WEBHOOK_SECRET is not configured');
    return reply(500, 'Webhook secret is not configured');
  }

  // Read the raw body because signature verification depends on its exact bytes.
  const raw = await req.text();

  if (new TextEncoder().encode(raw).length > MAX_BODY) {
    return reply(413, 'Request body too large');
  }

  // 1. Verify the PayMongo signature.
  const signatureHeader = req.headers.get('paymongo-signature');

  if (!signatureHeader) {
    return reply(401, 'Missing PayMongo signature');
  }

  const signatureParts: Record<string, string> = {};

  for (const part of signatureHeader.split(',')) {
    const separator = part.indexOf('=');

    if (separator > 0) {
      const key = part.slice(0, separator).trim();
      const value = part.slice(separator + 1).trim();
      signatureParts[key] = value;
    }
  }

  const timestamp = Number(signatureParts.t);

  if (
    !Number.isFinite(timestamp) ||
    timestamp <= 0 ||
    Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS
  ) {
    return reply(400, 'Stale or missing signature timestamp');
  }

  let event: JsonObject;

  try {
    event = JSON.parse(raw);
  } catch {
    return reply(400, 'Invalid JSON');
  }

  const attributes = event?.data?.attributes;
  const eventId = event?.data?.id;
  const type = attributes?.type;
  const resource = attributes?.data;
  const livemode = attributes?.livemode === true;

  if (
    typeof eventId !== 'string' ||
    typeof type !== 'string' ||
    !resource ||
    typeof resource.id !== 'string'
  ) {
    return reply(400, 'Malformed webhook event');
  }

  // PayMongo uses "te" for test signatures and "li" for live signatures.
  const expectedSignature = livemode ? signatureParts.li : signatureParts.te;

  if (!expectedSignature) {
    return reply(401, 'Missing signature for payment mode');
  }

  const actualSignature = await hmacHex(secret, `${signatureParts.t}.${raw}`);

  if (!timingSafeEqual(actualSignature, expectedSignature)) {
    return reply(401, 'Invalid webhook signature');
  }

  // 2. Check whether this event has already been processed.
  const { data: existingEvent, error: lookupError } = await admin
    .from('payment_events')
    .select('event_id')
    .eq('event_id', eventId)
    .maybeSingle();

  if (lookupError) {
    console.error('Could not check payment event:', { eventId, error: lookupError.message });
    return reply(500, 'Could not check event history');
  }

  if (existingEvent) {
    console.log('Duplicate webhook event ignored:', { eventId, type });
    return reply(200, 'Duplicate event');
  }

  console.log('Processing webhook event:', { eventId, type, livemode, resourceId: resource.id });

  // 3. Process supported payment events.
  let result = 'ignored';
  let summary: JsonObject = { resource_id: resource.id };

  try {
    if (type === 'checkout_session.payment.paid' || type === 'payment.paid') {
      let paid = null;
      let ref = resource.id;

      if (type === 'checkout_session.payment.paid') {
        console.log('extractPaid input:', {
          resourceId: resource.id,
          hasAttributes: !!resource?.attributes,
          payments: resource?.attributes?.payments?.map((p: any) => ({
            id: p?.id,
            status: p?.attributes?.status,
            amount: p?.attributes?.amount,
            sourceType: p?.attributes?.source?.type,
          })),
        });
        paid = extractPaid(resource);
        console.log('extractPaid returned:', paid ? { paymentId: paid.paymentId, amountCentavos: paid.amountCentavos, method: paid.method } : null);
        
        // Fallback: if webhook payload is incomplete (test mode), fetch full session from PayMongo API
        if (!paid) {
          console.log('Webhook payload incomplete, fetching full session from PayMongo API...', { sessionId: resource.id });
          try {
            const fullSession = await getCheckoutSession(resource.id);
            console.log('Fetched full session:', { 
              sessionId: fullSession?.id, 
              paymentsCount: fullSession?.attributes?.payments?.length ?? 0,
              paymentIntentId: fullSession?.attributes?.payment_intent?.id ?? null,
              paymentsSample: fullSession?.attributes?.payments?.slice(0, 1).map((p: any) => ({
                id: p?.id,
                status: p?.attributes?.status,
                amount: p?.attributes?.amount,
                sourceType: p?.attributes?.source?.type,
              })),
            });
            paid = extractPaid(fullSession);
            console.log('extractPaid from full session returned:', paid ? { paymentId: paid.paymentId, amountCentavos: paid.amountCentavos, method: paid.method } : null);
          } catch (fetchError) {
            console.error('Failed to fetch full session:', { 
              error: fetchError instanceof Error ? fetchError.message : String(fetchError),
              sessionId: resource.id 
            });
          }
        }
        
        if (!paid) {
          throw new Error('Could not extract verified payment details from Checkout Session');
        }
      } else if (type === 'payment.paid') {
        const a = resource?.attributes;
        if (!a || a.status !== 'paid') {
          throw new Error('Payment resource not paid');
        }
        paid = {
          paymentId: resource.id,
          amountCentavos: Number(a.amount),
          method: a.source?.type ?? null,
          cardBrand: a.source?.type === 'card' ? (a.source?.brand ?? null) : null,
          cardLast4: a.source?.type === 'card' ? (a.source?.last4 ?? null) : null,
          paymentIntentId: a.payment_intent_id ?? null,
        };
        ref = a.payment_intent_id ?? resource.id;
      }

      if (!paid) {
        throw new Error('Could not extract payment details');
      }

      const { data, error } = await admin.rpc('record_payment_result', {
        p_ref: ref,
        p_outcome: 'paid',
        p_paymongo_payment_id: paid.paymentId,
        p_payment_intent_id: paid.paymentIntentId,
        p_amount_centavos: paid.amountCentavos,
        p_card_brand: paid.cardBrand,
        p_card_last4: paid.cardLast4,
      });

      if (error) throw new Error(error.message);

      result = String(data);
      summary = {
        resource_id: resource.id,
        amount_centavos: paid.amountCentavos,
        result,
        event_type: type,
      };
    } else if (type === 'payment.failed') {
      const paymentIntentId = resource?.attributes?.payment_intent_id;

      if (typeof paymentIntentId === 'string' && paymentIntentId) {
        const failure =
          resource?.attributes?.failed_message ??
          resource?.attributes?.failed_code ??
          'Payment failed';

        const { data, error } = await admin.rpc('record_payment_result', {
          p_ref: paymentIntentId,
          p_outcome: 'failed',
          p_failure: String(failure),
        });

        if (error) throw new Error(error.message);

        result = String(data);
      }

      summary = { resource_id: resource.id, result };
    }

    // Other event types are intentionally ignored.
    // Refund events are not handled by this function.
  } catch (error) {
    console.error('Webhook processing failed:', {
      type,
      eventId,
      resourceId: resource.id,
      error: error instanceof Error ? error.message : String(error),
    });

    // Non-2xx tells PayMongo to retry.
    return reply(500, 'Webhook processing failed');
  }

  console.log('Webhook processed successfully:', { eventId, type, result });

  // 4. Record the processed event for duplicate detection.
  const { error: saveEventError } = await admin.from('payment_events').upsert(
    {
      event_id: eventId,
      event_type: type,
      livemode,
      summary,
    },
    { onConflict: 'event_id' },
  );

  if (saveEventError) {
    console.error('Could not save payment event:', saveEventError.message);
    return reply(500, 'Could not record processed event');
  }

  return reply(200, result);
});
