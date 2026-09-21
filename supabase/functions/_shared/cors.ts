// Only the site's own origins may call these functions from a browser.
// ALLOWED_ORIGINS is a comma-separated secret, e.g.
//   https://your-site.vercel.app,http://localhost:5173
const ALLOWED = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

export function isAllowedOrigin(origin: string | null): origin is string {
  return !!origin && ALLOWED.includes(origin.replace(/\/$/, ''));
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : (ALLOWED[0] ?? ''),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

// Where PayMongo sends the shopper back to. Never taken blindly from the client:
// it must be one of our allowed origins, otherwise we fall back to the first one.
export function resolveReturnOrigin(requested: unknown): string {
  if (typeof requested === 'string' && isAllowedOrigin(requested)) {
    return requested.replace(/\/$/, '');
  }
  return ALLOWED[0] ?? '';
}
