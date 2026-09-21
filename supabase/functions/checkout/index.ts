// checkout: creates orders and PayMongo checkout sessions.
//
// Security model
//   * The caller must be a signed-in user (JWT verified here with the auth server).
//   * Prices, totals and shipping are computed HERE from the products table.
//     Nothing money-related from the browser is trusted.
//   * Card / GCash details never touch our site: the shopper pays on PayMongo's
//     hosted page and PayMongo confirms to us through a signed webhook.
//   * Redirect URLs come from an allow-list, not from request data.
//
// Actions: 'create' (new order), 'pay' (retry payment on an existing order),
//          'sync' (ask PayMongo whether a pending order was actually paid).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, resolveReturnOrigin } from '../_shared/cors.ts';
import { createCheckoutSession, extractPaid, getCheckoutSession, type LineItem } from '../_shared/paymongo.ts';

const SHIPPING_FEE = 75;
const MAX_LINES = 30;
const MAX_QTY = 20;
const METHODS = ['gcash', 'card', 'cod'] as const;
type Method = (typeof METHODS)[number];

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

async function authenticate(req: Request) {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Please sign in to continue.');
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Your session has expired. Please sign in again.');
  return data.user;
}

function toPaymentMethodTypes(method: Method) {
  return method === 'gcash' ? ['gcash'] : ['card'];
}

async function startPaymongoSession(opts: {
  order: { id: number; order_number: string; full_name: string; phone: string | null };
  items: { name: string; size: string; price: number; quantity: number; image: string | null }[];
  shippingFee: number;
  method: Method;
  email?: string;
  origin: string;
}) {
  const lineItems: LineItem[] = opts.items.map((i) => {
    const li: LineItem = {
      name: `${i.name} (${i.size})`.slice(0, 250),
      amount: Math.round(Number(i.price) * 100),
      quantity: i.quantity,
    };
    if (i.image && /^https:\/\//.test(i.image)) li.images = [i.image];
    return li;
  });
  lineItems.push({ name: 'Shipping', amount: Math.round(opts.shippingFee * 100), quantity: 1 });

  return await createCheckoutSession({
    lineItems,
    paymentMethodTypes: toPaymentMethodTypes(opts.method),
    successUrl: `${opts.origin}/order-confirmation/${opts.order.id}?payment=success`,
    cancelUrl: `${opts.origin}/order-confirmation/${opts.order.id}?payment=cancelled`,
    description: `OnlyCaps order #${opts.order.order_number}`,
    reference: opts.order.order_number,
    billing: { name: opts.order.full_name, email: opts.email, phone: opts.order.phone ?? undefined },
    metadata: { order_id: String(opts.order.id) },
  });
}

// ---------------------------------------------------------------- create
async function createOrder(req: Request, body: any) {
  const user = await authenticate(req);

  const method = body.payment_method as Method;
  if (!METHODS.includes(method)) throw new HttpError(400, 'Please choose a payment method.');

  const s = body.shipping ?? {};
  const shipping = {
    full_name: str(s.full_name, 120),
    phone: str(s.phone, 30),
    address_line1: str(s.address_line1, 200),
    address_line2: str(s.address_line2, 200),
    city: str(s.city, 100),
    province: str(s.province, 100),
    postal_code: str(s.postal_code, 12),
  };
  if (!shipping.full_name || !shipping.address_line1 || !shipping.city || !shipping.province || !shipping.postal_code) {
    throw new HttpError(400, 'Please complete your delivery information.');
  }
  if (!/^[0-9+()\-\s]{7,20}$/.test(shipping.phone)) throw new HttpError(400, 'Please enter a valid phone number.');

  // ---- validate the cart lines (identifiers + quantity only)
  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0 || rawItems.length > MAX_LINES) throw new HttpError(400, 'Your cart is empty.');

  const lines = rawItems.map((it: any) => {
    const id = String(it?.id ?? '');
    const size = str(it?.size, 20);
    const quantity = Number(it?.quantity);
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id) || !size || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
      throw new HttpError(400, 'One of the items in your cart is invalid.');
    }
    return { id, size, quantity };
  });

  // ---- load authoritative product data
  const textIds = [...new Set(lines.map((l: any) => l.id))] as string[];
  const numericIds = textIds.filter((id) => /^\d+$/.test(id)).map(Number);
  const [byText, byNumber] = await Promise.all([
    admin.from('products').select('*').in('product_id', textIds),
    numericIds.length ? admin.from('products').select('*').in('id', numericIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (byText.error || byNumber.error) throw new Error('Could not load products');
  const products = new Map<string, any>();
  for (const p of [...(byNumber.data ?? []), ...(byText.data ?? [])]) {
    products.set(String(p.id), p);
    if (p.product_id) products.set(String(p.product_id), p);
  }

  const wanted = new Map<string, number>(); // product row id|size -> total qty (for the stock check)
  const orderLines = lines.map((l: any) => {
    const p = products.get(l.id);
    if (!p || p.active === false) throw new HttpError(400, 'An item in your cart is no longer available.');
    const key = `${p.id}|${l.size}`;
    wanted.set(key, (wanted.get(key) ?? 0) + l.quantity);
    return { product: p, ...l };
  });

  for (const [key, qty] of wanted) {
    const [pid, size] = key.split('|');
    const p = [...products.values()].find((x) => String(x.id) === pid);
    const perSize = p.sizes_stock && Object.keys(p.sizes_stock).length > 0;
    const available = perSize ? Number(p.sizes_stock[size] ?? 0) : Number(p.stock_quantity ?? 0);
    if (qty > available) {
      throw new HttpError(409, `${p.full_name ?? p.name} (${size}) doesn't have enough stock left.`);
    }
  }

  const subtotal = orderLines.reduce((sum: number, l: any) => sum + Number(l.product.price) * l.quantity, 0);
  const total = subtotal + SHIPPING_FEE;

  // ---- write the order (service role: browsers can no longer do this)
  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      total,
      status: 'pending',
      payment_method: method,
      payment_status: 'unpaid',
      shipping_fee: SHIPPING_FEE,
      ...shipping,
    })
    .select('id, order_number, full_name, phone')
    .single();
  if (orderError || !order) throw new Error(`Order insert failed: ${orderError?.message}`);

  const itemRows = orderLines.map((l: any) => ({
    order_id: order.id,
    user_id: user.id,
    product_id: String(l.product.product_id ?? l.product.id),
    name: l.product.full_name ?? l.product.name,
    size: l.size,
    price: Number(l.product.price),
    quantity: l.quantity,
    image: l.product.image,
  }));

  const cleanup = async () => {
    await admin.from('order_items').delete().eq('order_id', order.id);
    await admin.from('orders').update({ status: 'cancelled', payment_status: 'failed' }).eq('id', order.id);
  };

  const { error: itemsError } = await admin.from('order_items').insert(itemRows);
  if (itemsError) {
    await cleanup();
    throw new Error(`Order items insert failed: ${itemsError.message}`);
  }

  const { data: payment, error: paymentError } = await admin
    .from('payments')
    .insert({
      order_id: order.id,
      user_id: user.id,
      provider: method === 'cod' ? 'cod' : 'paymongo',
      method,
      amount: total,
      status: 'pending',
    })
    .select('id')
    .single();
  if (paymentError || !payment) {
    await cleanup();
    throw new Error(`Payment insert failed: ${paymentError?.message}`);
  }

  if (method === 'cod') return { order_id: order.id, checkout_url: null };

  try {
    const session = await startPaymongoSession({
      order,
      items: itemRows,
      shippingFee: SHIPPING_FEE,
      method,
      email: user.email,
      origin: resolveReturnOrigin(body.return_origin),
    });
    await admin
      .from('payments')
      .update({
        paymongo_checkout_session_id: session.id,
        paymongo_payment_intent_id: session.paymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);
    return { order_id: order.id, checkout_url: session.checkoutUrl };
  } catch (err) {
    console.error('PayMongo session failed', err);
    await admin.from('payments').update({ status: 'failed', failure_reason: 'Could not start PayMongo checkout' }).eq('id', payment.id);
    await cleanup();
    throw new HttpError(502, "We couldn't start the payment. Please try again in a moment.");
  }
}

// ---------------------------------------------------------------- shared lookups
async function loadOwnOrder(userId: string, orderId: unknown) {
  const id = Number(orderId);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid order.');
  const { data: order } = await admin
    .from('orders')
    .select('id, order_number, user_id, full_name, phone, payment_method, payment_status, shipping_fee, status')
    .eq('id', id)
    .maybeSingle();
  if (!order || order.user_id !== userId) throw new HttpError(404, 'Order not found.'); // same answer for "not yours"
  const { data: payment } = await admin
    .from('payments')
    .select('*')
    .eq('order_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return { order, payment };
}

async function reconcile(sessionId: string) {
  const session = await getCheckoutSession(sessionId);
  const paid = extractPaid(session);
  if (!paid) return false;
  const { error } = await admin.rpc('record_payment_result', {
    p_ref: sessionId,
    p_outcome: 'paid',
    p_paymongo_payment_id: paid.paymentId,
    p_payment_intent_id: paid.paymentIntentId,
    p_amount_centavos: paid.amountCentavos,
    p_card_brand: paid.cardBrand,
    p_card_last4: paid.cardLast4,
  });
  if (error) throw new Error(error.message);
  return true;
}

// ---------------------------------------------------------------- sync
async function syncOrder(req: Request, body: any) {
  const user = await authenticate(req);
  const { order, payment } = await loadOwnOrder(user.id, body.order_id);
  if (order.payment_method !== 'cod' && payment?.status === 'pending' && payment.paymongo_checkout_session_id) {
    await reconcile(payment.paymongo_checkout_session_id);
  }
  const { data: fresh } = await admin.from('orders').select('payment_status').eq('id', order.id).single();
  return { order_id: order.id, payment_status: fresh?.payment_status ?? order.payment_status };
}

// ---------------------------------------------------------------- pay (retry)
async function payOrder(req: Request, body: any) {
  const user = await authenticate(req);
  const { order, payment } = await loadOwnOrder(user.id, body.order_id);

  if (order.payment_method === 'cod') throw new HttpError(400, 'This order is cash on delivery.');
  if (order.status === 'cancelled') throw new HttpError(400, 'This order was cancelled.');
  if (!payment) throw new HttpError(404, 'Payment not found.');

  // If the shopper actually paid and we just haven't heard yet, don't charge twice.
  if (payment.paymongo_checkout_session_id && (await reconcile(payment.paymongo_checkout_session_id))) {
    throw new HttpError(409, 'This order has already been paid.');
  }
  if (order.payment_status === 'paid' || payment.status === 'paid') throw new HttpError(409, 'This order has already been paid.');

  const { data: items } = await admin
    .from('order_items')
    .select('name, size, price, quantity, image')
    .eq('order_id', order.id);
  if (!items?.length) throw new HttpError(400, 'This order has no items.');

  let session;
  try {
    session = await startPaymongoSession({
      order,
      items,
      shippingFee: Number(order.shipping_fee ?? SHIPPING_FEE),
      method: order.payment_method as Method,
      email: user.email,
      origin: resolveReturnOrigin(body.return_origin),
    });
  } catch (err) {
    console.error('PayMongo session failed', err);
    throw new HttpError(502, "We couldn't start the payment. Please try again in a moment.");
  }

  await admin
    .from('payments')
    .update({
      paymongo_checkout_session_id: session.id,
      paymongo_payment_intent_id: session.paymentIntentId,
      status: 'pending',
      failure_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id);
  await admin.from('orders').update({ payment_status: 'unpaid' }).eq('id', order.id);

  return { order_id: order.id, checkout_url: session.checkoutUrl };
}

// ---------------------------------------------------------------- entry
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    switch (body?.action) {
      case 'create':
        return json(req, await createOrder(req, body));
      case 'pay':
        return json(req, await payOrder(req, body));
      case 'sync':
        return json(req, await syncOrder(req, body));
      default:
        return json(req, { error: 'Unknown action' }, 400);
    }
  } catch (err) {
    if (err instanceof HttpError) return json(req, { error: err.message }, err.status);
    console.error('checkout error', err); // details stay in server logs, never sent to the browser
    return json(req, { error: 'Something went wrong. Please try again.' }, 500);
  }
});
