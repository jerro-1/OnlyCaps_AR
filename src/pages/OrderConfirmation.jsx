import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import supabase from '../utils/supabase';
import Header from '../components/Header';
import BgImg from '../components/BgImg';
import Footer from '../components/Footer';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('orders')
      .select('id, total, status, created_at')
      .eq('id', orderId)
      .single()
      .then(({ data }) => {
        setOrder(data);
        setLoading(false);
      });
  }, [orderId]);

  return (
    <BgImg>
      <Header />
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-[#FAF8F4] rounded-2xl px-10 py-10 text-center max-w-md w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]">
          <div className="w-14 h-14 rounded-full bg-[#F0ECE1] flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[#A9824C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-heading text-2xl uppercase tracking-wide text-[#14110D] mb-2">
            Order placed
          </h1>
          {!loading && order && (
            <>
              <p className="font-body text-sm text-[#6B6558] mb-6">
                Order #{order.id} · ₱{order.total}
              </p>
              <p className="font-body text-xs text-[#6B6558] mb-8">
                You can track its status anytime from your order history.
              </p>
            </>
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