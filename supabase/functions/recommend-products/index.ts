import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  buildTasteProfile,
  extractColors,
  normalizeProductKey,
  scoreProducts,
  type Product,
} from '../_shared/recommend.ts';

const HISTORY_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'completed',
];

const MAX_LIMIT = 8;
const MIN_LIMIT = 1;
const DEFAULT_LIMIT = 6;
const CANDIDATE_COUNT = 15;
const DEFAULT_MODEL = 'gemini-3.8-flash';
const FALLBACK_MODEL = 'gemini-3.5-flash-lite';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  {
    auth: { persistSession: false },
  },
);

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

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
  if (error || !data.user) {
    throw new HttpError(401, 'Your session has expired. Please sign in again.');
  }

  return data.user;
}

function clampLimit(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.round(parsed), MIN_LIMIT), MAX_LIMIT);
}

async function loadData(userId: string) {
  const [ordersResult, productsResult] = await Promise.all([
    admin
      .from('orders')
      .select(
        'id, status, payment_status, created_at, order_items(product_id, name, size, price, quantity)',
      )
      .eq('user_id', userId)
      .in('status', HISTORY_STATUSES)
      .order('created_at', { ascending: false })
      .limit(30),
    admin
      .from('products')
      .select(
        'id, product_id, name, full_name, subtitle, description, price, image, images, category, sizes_stock, stock_quantity, active',
      )
      .eq('active', true),
  ]);

  if (ordersResult.error)
    throw new Error(`Could not load order history: ${ordersResult.error.message}`);
  if (productsResult.error)
    throw new Error(`Could not load products: ${productsResult.error.message}`);

  return {
    orders: ordersResult.data || [],
    products: (productsResult.data || []) as Product[],
  };
}

function publicProduct(product: Product) {
  return {
    id: product.id,
    product_id: product.product_id,
    name: product.name,
    full_name: product.full_name,
    subtitle: product.subtitle,
    price: product.price,
    image: product.image,
    images: product.images,
    category: product.category,
    badge: product.badge ?? null,
    stock_quantity: product.stock_quantity,
    sizes_stock: product.sizes_stock,
  };
}

function cleanReason(value: unknown) {
  const reason = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  return reason || 'Picked from your order history.';
}

function buildPrompt(orders: Record<string, any>[], candidates: any[], limit: number) {
  const history = orders
    .flatMap(order =>
      (order.order_items || []).map((item: any) => ({
        name: item.name,
        size: item.size,
        price: item.price,
        quantity: item.quantity,
      })),
    )
    .slice(0, 30);

  const candidatePayload = candidates.map(candidate => ({
    key: normalizeProductKey(candidate.product),
    name: candidate.product.full_name ?? candidate.product.name,
    team: candidate.product.name,
    category: candidate.product.category,
    price: candidate.product.price,
    colors: extractColors(candidate.product),
  }));

  return [
    'You are the OnlyCaps product recommendation assistant.',
    `A signed-in customer has this purchase history: ${JSON.stringify(history)}.`,
    `Choose up to ${limit} products from the candidate list that best match their taste.`,
    'Prefer the same team or title, similar colors, the same category, and a similar price.',
    'Never choose a product the customer already bought.',
    'Use only the exact keys from the candidate list. Do not invent products.',
    'For each pick, write a natural one-sentence reason of at most 12 words that references their history.',
    `Candidates: ${JSON.stringify(candidatePayload)}`,
    'Return JSON only with this shape: { "recommendations": [{ "product_key": "string", "reason": "string" }] }',
  ].join('\n');
}

function parseGeminiJson(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
  return JSON.parse(cleaned);
}

async function askGemini(apiKey: string, model: string, prompt: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 700,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              recommendations: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    product_key: { type: 'STRING' },
                    reason: { type: 'STRING' },
                  },
                  required: ['product_key', 'reason'],
                },
              },
            },
            required: ['recommendations'],
          },
        },
      }),
    },
  );

  if (!res.ok) {
    console.error(
      'Gemini recommendation request failed',
      res.status,
      await res.text().catch(() => ''),
    );
    throw new Error(`Gemini request failed with ${res.status}`);
  }

  const payload = await res.json();
  const text =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part.text ?? '')
      .join('')
      .trim() ?? '';

  if (!text) throw new Error('Gemini returned an empty response');
  return parseGeminiJson(text);
}

async function askGeminiWithFallback(apiKey: string, prompt: string) {
  const primary = Deno.env.get('GEMINI_TEXT_MODEL') || DEFAULT_MODEL;
  const models = [...new Set([primary, FALLBACK_MODEL])];

  for (const model of models) {
    try {
      return await askGemini(apiKey, model, prompt);
    } catch (error) {
      console.error(`Recommendation model ${model} failed`, error);
    }
  }

  return null;
}

function validatePicks(data: any, candidates: any[], limit: number) {
  const byKey = new Map(
    candidates.map(candidate => [normalizeProductKey(candidate.product), candidate]),
  );
  const seen = new Set<string>();
  const picks: { key: string; product: ReturnType<typeof publicProduct>; reason: string }[] = [];

  for (const recommendation of data?.recommendations ?? []) {
    const key = String(
      recommendation?.product_key ?? recommendation?.productKey ?? recommendation?.id ?? '',
    ).trim();
    const candidate = byKey.get(key);

    if (!candidate || seen.has(key)) continue;

    seen.add(key);
    picks.push({
      key,
      product: publicProduct(candidate.product),
      reason: cleanReason(recommendation?.reason),
    });

    if (picks.length >= limit) break;
  }

  return picks;
}

async function handleRecommendations(req: Request, body: any) {
  const user = await authenticate(req);
  const limit = clampLimit(body?.limit);
  const { orders, products } = await loadData(user.id);
  const hasHistory = orders.some(order => (order.order_items || []).length > 0);

  if (!hasHistory) {
    return { source: 'fallback', has_history: false, recommendations: [] };
  }

  const profile = buildTasteProfile(orders, products);
  const candidates = scoreProducts(profile, products).slice(0, CANDIDATE_COUNT);

  if (candidates.length === 0) {
    return { source: 'fallback', has_history: true, recommendations: [] };
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return { source: 'fallback', has_history: true, recommendations: [] };
  }

  const prompt = buildPrompt(orders, candidates, limit);
  const aiData = await askGeminiWithFallback(apiKey, prompt);
  const aiPicks = aiData ? validatePicks(aiData, candidates, limit) : [];

  const picks = [...aiPicks];
  const pickedKeys = new Set(aiPicks.map(pick => pick.key));

  for (const candidate of candidates) {
    if (picks.length >= limit) break;
    const key = normalizeProductKey(candidate.product);
    if (pickedKeys.has(key)) continue;
    pickedKeys.add(key);
    picks.push({
      key,
      product: publicProduct(candidate.product),
      reason: cleanReason(candidate.reason),
    });
  }

  return {
    source: aiPicks.length > 0 ? 'ai' : 'fallback',
    has_history: true,
    recommendations: picks.map(({ key, ...rest }) => rest),
  };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    return json(req, await handleRecommendations(req, body));
  } catch (error) {
    if (error instanceof HttpError) return json(req, { error: error.message }, error.status);
    console.error('recommend-products error', error);
    return json(req, { error: 'Something went wrong. Please try again.' }, 500);
  }
});
