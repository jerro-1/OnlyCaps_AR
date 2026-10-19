<<<<<<< HEAD
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

console.log("Hello from Functions!");

// This endpoint uses 'publishable' | 'secret' access, apiKey is required.
// Use publishable for Client-facing, key-validated endpoints
// Use secret for Server-to-server, internal calls
export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    // Called by another service with a secret key
    // ctx.supabaseAdmin bypasses RLS — use for privileged operations
    /*
    if (ctx.authMode === "secret") {
      const { user_id } = await req.json();
      const { data } = await ctx.supabaseAdmin.auth.admin.getUserById(user_id);

      return Response.json({
        email: data?.user?.email,
      });
    }
    */

    const { name } = await req.json();

    return Response.json({
      message: `Hello ${name}!`,
    });
  }),
};

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/paymongo-webhook2' \
    --header 'apiKey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH' \
    --data '{"name":"Functions"}'

*/
=======
import { createClient } from 'npm:@supabase/supabase-js@2';

const enc = new TextEncoder();

async function validSignature(raw: string, header: string) {
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')));
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(Deno.env.get('PAYMONGO_WEBHOOK_SECRET')!),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const buf = await crypto.subtle.sign('HMAC', key, enc.encode(`${parts.t}.${raw}`));
  const expected = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  const sig = parts.te || parts.li; // te = test mode, li = live mode
  return !!sig && sig === expected;
}

Deno.serve(async req => {
  const raw = await req.text(); // raw body is required for the signature check

  if (!(await validSignature(raw, req.headers.get('paymongo-signature') ?? ''))) {
    return new Response('Bad signature', { status: 400 });
  }

  const event = JSON.parse(raw);
  const type = event.data.attributes.type;
  const payment = event.data.attributes.data?.attributes;
  const intentId = payment?.payment_intent_id;
  console.log('PayMongo webhook:', type, intentId);

  if (intentId && (type === 'payment.paid' || type === 'payment.failed')) {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const paid = type === 'payment.paid';
    await admin
      .from('orders')
      .update({
        status: paid ? 'paid' : 'failed',
        paid_at: paid ? new Date().toISOString() : null,
      })
      .eq('paymongo_intent_id', intentId)
      .neq('status', 'paid'); // never downgrade an order that's already paid
  }

  return new Response('ok', { status: 200 });
});
>>>>>>> a934041 (add default model)
