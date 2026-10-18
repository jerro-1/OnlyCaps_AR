// import { createClient } from 'npm:@supabase/supabase-js@2';

// const cors = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// };
// const reply = (body: unknown, status = 200) =>
//   new Response(JSON.stringify(body), {
//     status,
//     headers: { ...cors, 'Content-Type': 'application/json' },
//   });

// const pmAuth = 'Basic ' + btoa(Deno.env.get('PAYMONGO_SECRET_KEY')! + ':');

// async function pm(path: string, body: unknown) {
//   const res = await fetch(`https://api.paymongo.com/v1${path}`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json', Authorization: pmAuth },
//     body: JSON.stringify(body),
//   });
//   const json = await res.json();
//   if (!res.ok) throw new Error(JSON.stringify(json.errors));
//   return json;
// }

// Deno.serve(async req => {
//   if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

//   try {
//     // Client acting as the logged-in user, so your RLS policies apply
//     const userClient = createClient(
//       Deno.env.get('SUPABASE_URL')!,
//       Deno.env.get('SUPABASE_ANON_KEY')!,
//       { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
//     );

//     const {
//       data: { user },
//     } = await userClient.auth.getUser();
//     if (!user) return reply({ error: 'Unauthorized' }, 401);

//     const { orderId } = await req.json();

//     // The amount comes from YOUR database, never from the browser
//     const { data: order, error } = await userClient
//       .from('orders2')
//       .select('id, total_centavos, status')
//       .eq('id', orderId)
//       .single();
//     if (error || !order) return reply({ error: 'Order not found' }, 404);
//     if (order.status === 'paid') return reply({ error: 'Already paid' }, 400);

//     // 1. Create the Payment Intent
//     const intent = await pm('/payment_intents', {
//       data: {
//         attributes: {
//           amount: order.total_centavos,
//           currency: 'PHP',
//           payment_method_allowed: ['gcash'],
//           description: `Order ${order.id}`,
//           metadata: { order_id: order.id },
//         },
//       },
//     });

//     // 2. Create the GCash Payment Method
//     const method = await pm('/payment_methods', {
//       data: {
//         attributes: {
//           type: 'gcash',
//           billing: {
//             name: user.user_metadata?.full_name ?? 'Customer',
//             email: user.email,
//           },
//         },
//       },
//     });

//     // 3. Attach the method to the intent
//     const attached = await pm(`/payment_intents/${intent.data.id}/attach`, {
//       data: {
//         attributes: {
//           payment_method: method.data.id,
//           return_url: `${Deno.env.get('SITE_URL')}/payment/return?order=${order.id}`,
//         },
//       },
//     });

//     const a = attached.data.attributes;
//     if (a.status !== 'awaiting_next_action') {
//       return reply({ error: `Unexpected status: ${a.status}` }, 400);
//     }

//     // Save the intent id on the order (privileged write)
//     const admin = createClient(
//       Deno.env.get('SUPABASE_URL')!,
//       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
//     );
//     await admin
//       .from('orders2')
//       .update({ paymongo_intent_id: intent.data.id, status: 'awaiting_payment' })
//       .eq('id', order.id);

//     return reply({ redirectUrl: a.next_action.redirect.url });
//   } catch (e) {
//     console.error(e);
//     return reply({ error: (e as Error).message }, 500);
//   }
// });
