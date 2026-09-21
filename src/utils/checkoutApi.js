import supabase from './supabase';

// All order creation and payment starts go through the `checkout` edge function.
// The browser only sends identifiers and quantities; the server prices the order.
export async function callCheckout(body) {
  const { data, error } = await supabase.functions.invoke('checkout', {
    body: { ...body, return_origin: window.location.origin },
  });

  if (error) {
    // A response body means the server answered (with a readable reason);
    // no body means we never reached it (offline, blocked, or not deployed).
    let message = "We couldn't reach the payment service. Please check your connection and try again.";
    if (error.context && typeof error.context.json === 'function') {
      message = 'Something went wrong. Please try again.';
      try {
        const payload = await error.context.json();
        if (payload?.error) message = payload.error;
      } catch { /* keep generic message */ }
    }
    throw new Error(message);
  }
  return data;
}
