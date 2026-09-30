// ai-tryon: takes a customer's selfie + a product, and returns an AI-generated
// photo of them wearing that product's cap.
//
// Per the panel's request: the customer never types or sees a prompt. The
// prompt below is the ONLY one ever sent, fixed here on the server, with the
// product's real name and photo filled in automatically -- a customer just
// taps "Take Selfie" and gets a result.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const GEMINI_MODEL = 'gemini-2.5-flash-image';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

class HttpError extends Error {
  constructor(public status: number, message: string) {
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
  if (error || !data.user) throw new HttpError(401, 'Your session has expired. Please sign in again.');
  return data.user;
}

// "data:image/jpeg;base64,/9j/4AAQ..." -> { mimeType, data }
function parseDataUrl(dataUrl: unknown): { mimeType: string; data: string } {
  if (typeof dataUrl !== 'string') throw new HttpError(400, 'Please retake the photo and try again.');
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new HttpError(400, 'Please retake the photo and try again.');
  const [, mimeType, data] = match;
  if (!ALLOWED_MIME.has(mimeType)) throw new HttpError(400, 'Please use a JPEG, PNG or WebP photo.');
  if (data.length * 0.75 > MAX_IMAGE_BYTES) throw new HttpError(400, 'That photo is too large -- please retake it.');
  return { mimeType, data };
}

async function fetchProductImageBase64(imageUrl: string): Promise<{ mimeType: string; data: string } | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    const buf = new Uint8Array(await res.arrayBuffer());
    let binary = '';
    for (const b of buf) binary += String.fromCharCode(b);
    return { mimeType, data: btoa(binary) };
  } catch {
    return null;
  }
}

async function generateTryOnImage(opts: {
  selfie: { mimeType: string; data: string };
  productImage: { mimeType: string; data: string } | null;
  productName: string;
}) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new HttpError(500, "AI try-on isn't configured yet.");

  // The one and only prompt this feature ever sends. A customer never sees
  // or edits this -- only the product name changes, filled in automatically.
  const prompt = [
    `Edit the first photo (a person) so they are wearing the baseball cap shown in the second photo ("${opts.productName}").`,
    "Match the cap's color, logo, and design exactly as shown in the reference photo.",
    "Keep the person's face, skin tone, hair, pose, and background completely unchanged.",
    'The cap should sit naturally on their head with realistic size, angle, and lighting that matches the original photo.',
    'Return only the edited photo, photorealistic, no text or watermark.',
  ].join(' ');

  const parts: Record<string, unknown>[] = [
    { text: prompt },
    { inlineData: { mimeType: opts.selfie.mimeType, data: opts.selfie.data } },
  ];
  if (opts.productImage) {
    parts.push({ inlineData: { mimeType: opts.productImage.mimeType, data: opts.productImage.data } });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    },
  );

  if (!res.ok) {
    console.error('Gemini request failed', res.status, await res.text().catch(() => ''));
    throw new HttpError(502, "We couldn't generate that image. Please try again.");
  }

  const payload = await res.json();
  const imagePart = payload?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
  if (!imagePart) {
    console.error('Gemini returned no image', JSON.stringify(payload).slice(0, 500));
    throw new HttpError(502, "We couldn't generate that image. Please try a clearer, front-facing photo.");
  }

  return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
}

async function handleTryOn(req: Request, body: any) {
  await authenticate(req); // must be signed in; the selfie/result are never stored server-side

  const selfie = parseDataUrl(body.selfie);

  const productId = String(body.product_id ?? '');
  if (!productId) throw new HttpError(400, 'Missing product.');

  const isNumeric = /^\d+$/.test(productId);
  const { data: product, error } = await admin
    .from('products')
    .select('full_name, name, image')
    .eq(isNumeric ? 'id' : 'product_id', isNumeric ? Number(productId) : productId)
    .maybeSingle();
  if (error || !product) throw new HttpError(404, 'Product not found.');

  const productImage = product.image ? await fetchProductImageBase64(product.image) : null;

  const image = await generateTryOnImage({
    selfie,
    productImage,
    productName: product.full_name ?? product.name ?? 'this cap',
  });

  return { image };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    return json(req, await handleTryOn(req, body));
  } catch (err) {
    if (err instanceof HttpError) return json(req, { error: err.message }, err.status);
    console.error('ai-tryon error', err);
    return json(req, { error: 'Something went wrong. Please try again.' }, 500);
  }
});
