// Thin PayMongo REST client. The secret key only ever exists in the edge
// function environment (Supabase secret), never in the browser bundle.

const API = 'https://api.paymongo.com/v1';

async function request(path: string, init: RequestInit = {}) {
  const key = Deno.env.get('PAYMONGO_SECRET_KEY');
  if (!key) throw new Error('PAYMONGO_SECRET_KEY is not configured');

  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Basic ${btoa(`${key}:`)}`,
    },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = json?.errors?.map((e: { detail?: string }) => e.detail).join('; ');
    throw new Error(`PayMongo ${res.status}: ${detail ?? 'request failed'}`);
  }
  return json;
}

export type LineItem = { name: string; amount: number; quantity: number; images?: string[] };

export async function createCheckoutSession(input: {
  lineItems: LineItem[];
  paymentMethodTypes: string[];
  successUrl: string;
  cancelUrl: string;
  description: string;
  reference: string;
  billing: { name: string; email?: string; phone?: string };
  metadata: Record<string, string>;
}) {
  const json = await request('/checkout_sessions', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        attributes: {
          billing: input.billing,
          line_items: input.lineItems.map((li) => ({ currency: 'PHP', ...li })),
          payment_method_types: input.paymentMethodTypes,
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          description: input.description,
          reference_number: input.reference,
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          metadata: input.metadata,
        },
      },
    }),
  });
  const attrs = json?.data?.attributes;
  return {
    id: json?.data?.id as string,
    checkoutUrl: attrs?.checkout_url as string,
    paymentIntentId: (attrs?.payment_intent?.id ?? null) as string | null,
  };
}

// Extracts what we need from a PayMongo checkout session resource (used by the
// webhook payload and by the on-demand sync).
export function extractPaid(session: any) {
  const payments: any[] = session?.attributes?.payments ?? [];
  const paid = payments.find((p) => p?.attributes?.status === 'paid');
  if (!paid) return null;
  const a = paid.attributes;
  return {
    paymentId: paid.id as string,
    amountCentavos: Number(a.amount),
    cardBrand: (a.source?.type === 'card' ? a.source?.brand : null) ?? null,
    cardLast4: (a.source?.type === 'card' ? a.source?.last4 : null) ?? null,
    paymentIntentId: (session?.attributes?.payment_intent?.id ?? null) as string | null,
  };
}

export async function getCheckoutSession(id: string) {
  const json = await request(`/checkout_sessions/${encodeURIComponent(id)}`);
  return json?.data;
}
