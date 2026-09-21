import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import supabase from '../utils/supabase';
import { callCheckout } from '../utils/checkoutApi';
import Header from '../components/Header';
import BgImg from '../components/BgImg';
import Footer from '../components/Footer';

const SYNC_ATTEMPTS = 4;
const SYNC_DELAY_MS = 2500;

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const cancelled = searchParams.get('payment') === 'cancelled';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  // Start in the 'confirming' state so a fresh return from PayMongo never flashes "not completed"
  const [confirming, setConfirming] = useState(!cancelled);
  const [retrying, setRetrying] = useState(false);

  const loadOrder = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, total, status, payment_method, payment_status, created_at')
      .eq('id', orderId)
      .single();
    setOrder(data);
    return data;
  }, [orderId]);

  useEffect(() => {
    let stop = false;

    (async () => {
      let current = await loadOrder();
      setLoading(false);

      // Coming back from PayMongo: the webhook usually lands within seconds. Ask the
      // server to double-check with PayMongo (it never trusts this page) and re-read.
      const waitingOnPayment = current && current.payment_method !== 'cod' && current.payment_status !== 'paid';
      if (!waitingOnPayment || cancelled) { setConfirming(false); return; }

      for (let i = 0; i < SYNC_ATTEMPTS && !stop; i++) {
        try { await callCheckout({ action: 'sync', order_id: current.id }); } catch { /* keep polling */ }
        current = await loadOrder();
        if (current?.payment_status === 'paid') break;
        await new Promise(r => setTimeout(r, SYNC_DELAY_MS));
      }
      if (!stop) setConfirming(false);
    })();

    return () => { stop = true; };
  }, [loadOrder, cancelled]);

  const payNow = async () => {
    setRetrying(true);
    try {
      const { checkout_url } = await callCheckout({ action: 'pay', order_id: order.id });
      window.location.assign(checkout_url);
    } catch (err) {
      alert(err.message);
      setRetrying(false);
    }
  };

  const isCod = order?.payment_method === 'cod';
  const isPaid = order?.payment_status === 'paid';
  const needsPayment = order && !isCod && !isPaid && !confirming;

  let title = 'Order placed';
  let message = 'You can track its status anytime from your order history.';
  if (order) {
    if (isCod) message = `Please have ₱${order.total} ready in cash when your order arrives.`;
    else if (isPaid) { title = 'Payment received'; message = 'Thank you! Your order is confirmed and being prepared.'; }
    else if (confirming) { title = 'Confirming payment'; message = 'Hang tight while we confirm your payment with PayMongo…'; }
    else { title = 'Payment not completed'; message = cancelled ? 'You left the payment page before finishing. Your order is saved and waiting.' : "We haven't received your payment yet. If you just paid, it can take a minute to show up."; }
  }

  return (
    <BgImg>
      <Header />
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-[#FAF8F4] rounded-2xl px-10 py-10 text-center max-w-md w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] page-fade-in">
          <div className="w-14 h-14 rounded-full bg-[#F0ECE1] flex items-center justify-center mx-auto mb-5">
            {confirming ? (
              <div className="w-7 h-7 rounded-full border-[3px] border-[#D8D2C4] border-t-[#A9824C] animate-spin" />
            ) : needsPayment ? (
              <svg className="w-7 h-7 text-[#B8720A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-[#A9824C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <h1 className="font-heading text-2xl uppercase tracking-wide text-[#14110D] mb-2">{title}</h1>
          {!loading && order && (
            <>
              <p className="font-body text-sm text-[#6B6558] mb-3">
                Order #{order.order_number} · ₱{order.total}
              </p>
              <p className="font-body text-xs text-[#6B6558] mb-8">{message}</p>
            </>
          )}

          {needsPayment && (
            <button
              onClick={payNow}
              disabled={retrying}
              className="w-full bg-[#A9824C] text-[#FAF8F4] font-body text-sm py-3 rounded-full mb-3 hover:opacity-90 transition-opacity disabled:opacity-50 border-none cursor-pointer"
            >
              {retrying ? 'Opening payment…' : 'Pay now'}
            </button>
          )}

          <div className="flex gap-3">
            <Link
              to="/orders"
              className="flex-1 bg-[#14110D] text-[#FAF8F4] font-body text-sm py-2.5 rounded-full hover:bg-[#2A241C] transition-colors"
            >
              View orders
            </Link>
            <Link
              to="/"
              className="flex-1 border border-[#D8D2C4] text-[#14110D] font-body text-sm py-2.5 rounded-full hover:bg-[#F0ECE1] transition-colors"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </BgImg>
  );
}
