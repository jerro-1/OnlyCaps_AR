import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import BgImg from '../components/BgImg';
import Footer2 from '../components/Footer2';
import supabase from '../utils/supabase';
import { callCheckout } from '../utils/checkoutApi';
import { SessionContext } from '../context/SessionContext';

// A customer can still change their mind about an order that hasn't started
// being prepared yet. Once it's confirmed/processing/shipped, cancelling or
// re-addressing it needs a human (support), not a self-service button.
const CANCELLABLE = ['pending', 'confirmed'];
const EDITABLE_ADDRESS = ['pending', 'confirmed'];

const ORDER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Same green/amber/red status language used everywhere else in the system
// (see the order status colors on the admin Orders page), re-themed to sit on
// this cream account-area background instead of a white admin table.
const STATUS_TONE = {
  pending: { bg: '#FBEFDD', text: '#92400E', dot: '#F59E0B' },
  confirmed: { bg: '#DCEAFE', text: '#1D4ED8', dot: '#3B82F6' },
  processing: { bg: '#DCEAFE', text: '#1D4ED8', dot: '#3B82F6' },
  shipped: { bg: '#DCEAFE', text: '#1D4ED8', dot: '#3B82F6' },
  delivered: { bg: '#DCFCE7', text: '#15803D', dot: '#22C55E' },
  completed: { bg: '#DCFCE7', text: '#15803D', dot: '#22C55E' },
  cancelled: { bg: '#FBE2E1', text: '#E10600', dot: '#E10600' },
};

function StatusPill({ status }) {
  const tone = STATUS_TONE[status] || { bg: '#F0ECE1', text: '#6B6558', dot: '#9CA3AF' };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-body text-xs font-semibold capitalize whitespace-nowrap"
      style={{ backgroundColor: tone.bg, color: tone.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tone.dot }} />
      {status}
    </span>
  );
}

function EditAddressModal({ order, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: order.full_name || '',
    phone: order.phone || '',
    address_line1: order.address_line1 || '',
    address_line2: order.address_line2 || '',
    city: order.city || '',
    province: order.province || '',
    postal_code: order.postal_code || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const field = (name, label, extra = {}) => (
    <div>
      <label className="block font-body text-xs text-[#6B6558] mb-2">{label}</label>
      <input
        value={form[name]}
        onChange={e => setForm({ ...form, [name]: e.target.value })}
        className="w-full bg-transparent border-0 border-b border-[#D8D2C4] py-2 font-body text-[#14110D] text-sm placeholder:text-[#B8B2A3] focus:outline-none focus:border-[#A9824C] transition-colors"
        {...extra}
      />
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { error: rpcError } = await supabase.rpc('update_own_order_address', {
      p_order_id: order.id,
      p_full_name: form.full_name,
      p_phone: form.phone,
      p_address_line1: form.address_line1,
      p_address_line2: form.address_line2,
      p_city: form.city,
      p_province: form.province,
      p_postal_code: form.postal_code,
    });
    setSaving(false);
    if (rpcError) return setError(rpcError.message);
    onSaved(form);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-80 px-4">
      <div className="bg-[#FAF8F4] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="font-heading text-xl uppercase tracking-wide text-[#14110D] mb-1">Edit delivery details</h2>
        <p className="font-body text-xs text-[#6B6558] mb-6">Order #{order.order_number}</p>

        {error && (
          <div className="bg-[#F5E9E7] border border-[#E0B6AF] text-[#943D35] font-body text-sm px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {field('full_name', 'Full name')}
          {field('phone', 'Phone number', { type: 'tel' })}
          {field('address_line1', 'Street, building or landmark')}
          {field('address_line2', 'Apartment, unit (optional)')}
          <div className="grid grid-cols-2 gap-4">
            {field('city', 'City')}
            {field('province', 'Province')}
          </div>
          {field('postal_code', 'Postal code')}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#14110D] text-[#FAF8F4] font-body text-sm font-medium py-3 sm:py-2.5 rounded-full hover:bg-[#2A241C] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-transparent border border-[#D8D2C4] text-[#14110D] font-body text-sm font-medium py-3 sm:py-2.5 rounded-full hover:bg-[#F0ECE1] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="bg-[#FAF8F4] rounded-2xl overflow-hidden animate-pulse">
          <div className="h-14 bg-[#F0ECE1]" />
          <div className="p-5 space-y-4">
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-lg bg-[#F0ECE1] shrink-0" />
              <div className="flex-1 space-y-2 py-2">
                <div className="h-3 bg-[#F0ECE1] rounded w-1/3" />
                <div className="h-3 bg-[#F0ECE1] rounded w-1/4" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const Orders = () => {
  const session = useContext(SessionContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);

  useEffect(() => {
    if (session) fetchOrders();
    else setLoading(false);
  }, [session]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, total, status, payment_method, payment_status, shipping_fee,
          courier_name, tracking_number, created_at,
          full_name, phone, address_line1, address_line2, city, province, postal_code,
          order_items (*)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (order) => {
    if (!window.confirm(`Cancel order #${order.order_number}? This can't be undone.`)) return;
    setBusyId(order.id);
    const { error } = await supabase.rpc('cancel_own_order', { p_order_id: order.id });
    setBusyId(null);
    if (error) return alert(error.message);
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o));
  };

  const payNow = async (order) => {
    setBusyId(order.id);
    try {
      const { checkout_url } = await callCheckout({ action: 'pay', order_id: order.id });
      window.location.assign(checkout_url);
    } catch (err) {
      alert(err.message);
      setBusyId(null);
    }
  };

  const counts = ORDER_TABS.reduce((acc, t) => ({
    ...acc, [t.value]: t.value === 'all' ? orders.length : orders.filter(o => o.status === t.value).length,
  }), {});

  const filtered = orders
    .filter(o => tab === 'all' || o.status === tab)
    .filter(o => !search || String(o.order_number || '').toLowerCase().includes(search.toLowerCase()));

  const addressLine = (o) => [o.address_line1, o.address_line2, o.city, o.province, o.postal_code].filter(Boolean).join(', ');

  return (
    <>
      <BgImg>
        <Header />

        <div className="pt-28 pb-16 px-6 lg:px-20 flex flex-col lg:flex-row gap-8 min-h-screen">
          <SideBar />

          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold text-white font-heading uppercase tracking-wide mb-6">
              Orders
            </h1>

            {!session ? (
              <div className="bg-[#FAF8F4] rounded-2xl p-8 text-center">
                <p className="font-body text-[#6B6558]">Sign in to view your orders.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                  <div className="flex flex-wrap gap-2">
                    {ORDER_TABS.map(t => {
                      const isActive = tab === t.value;
                      const color = t.value === 'all' ? '#A9824C' : (STATUS_TONE[t.value]?.dot || '#A9824C');
                      return (
                        <button
                          key={t.value}
                          onClick={() => setTab(t.value)}
                          className="px-3 py-1.5 rounded-full font-body text-xs font-medium border transition-colors flex items-center gap-1.5 whitespace-nowrap"
                          style={isActive
                            ? { background: `${color}26`, borderColor: color, color }
                            : { background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)', color: '#F2F2F3' }}
                        >
                          {t.label} <span className="opacity-70">{counts[t.value]}</span>
                        </button>
                      );
                    })}
                  </div>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search order number..."
                    className="sm:ml-auto w-full sm:w-56 bg-[#FAF8F4] border border-[#D8D2C4] rounded-full px-4 py-2 font-body text-sm text-[#14110D] placeholder:text-[#B8B2A3] focus:outline-none focus:border-[#A9824C]"
                  />
                </div>

                {loading ? (
                  <OrdersSkeleton />
                ) : filtered.length === 0 ? (
                  <div className="bg-[#FAF8F4] rounded-2xl p-10 text-center">
                    <p className="font-body text-[#6B6558] mb-4">
                      {orders.length === 0 ? "You haven't placed any orders yet." : 'No orders match this filter.'}
                    </p>
                    {orders.length === 0 && (
                      <Link to="/fitted-caps" className="inline-block bg-[#14110D] text-[#FAF8F4] font-body text-sm font-medium px-6 py-2.5 rounded-full hover:bg-[#2A241C] transition-colors">
                        Start shopping
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filtered.map(order => {
                      const canCancel = CANCELLABLE.includes(order.status);
                      const canEditAddress = EDITABLE_ADDRESS.includes(order.status);
                      const needsPayment = order.payment_method !== 'cod' && order.payment_status === 'unpaid' && order.status !== 'cancelled';
                      const isBusy = busyId === order.id;

                      return (
                        <div key={order.id} className="bg-[#FAF8F4] rounded-2xl overflow-hidden shadow-[0_10px_30px_-15px_rgba(0,0,0,0.3)]">
                          <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-4 bg-[#F0ECE1]">
                            <div>
                              <p className="font-body font-semibold text-[#14110D] text-sm">
                                Order #{order.order_number}
                              </p>
                              <p className="font-body text-xs text-[#6B6558]">
                                {order.created_at ? new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                              </p>
                            </div>
                            <StatusPill status={order.status} />
                          </div>

                          <div className="divide-y divide-[#EDE8DC]">
                            {order.order_items.map(item => (
                              <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0">
                                  <img src={item.image} alt={item.name} className="size-full object-cover rounded-lg" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-body text-[#14110D] text-sm font-medium truncate">{item.name}</p>
                                  <p className="font-body text-xs text-[#6B6558]">Size: {item.size} · Qty: {item.quantity}</p>
                                </div>
                                <p className="font-body font-semibold text-[#14110D] text-sm whitespace-nowrap">₱{item.price}</p>
                              </div>
                            ))}
                          </div>

                          <div className="px-5 py-4 border-t border-[#EDE8DC] space-y-3">
                            <div className="flex justify-between items-start gap-4">
                              <div className="min-w-0">
                                <p className="font-body text-[11px] uppercase tracking-wider text-[#6B6558] mb-1">Delivering to</p>
                                <p className="font-body text-sm text-[#14110D] truncate">{order.full_name}</p>
                                <p className="font-body text-xs text-[#6B6558] truncate">{addressLine(order)}</p>
                                {order.courier_name && (
                                  <p className="font-body text-xs text-[#6B6558] mt-1">
                                    {order.courier_name}{order.tracking_number ? ` · Tracking: ${order.tracking_number}` : ''}
                                  </p>
                                )}
                              </div>
                              {canEditAddress && (
                                <button
                                  onClick={() => setEditingOrder(order)}
                                  className="shrink-0 font-body text-xs font-medium text-[#A9824C] hover:text-[#8A6A3C] underline underline-offset-2"
                                >
                                  Edit address
                                </button>
                              )}
                            </div>

                            <div className="flex justify-between items-center">
                              <p className="font-body text-xs text-[#6B6558]">
                                {order.payment_method === 'cod' ? 'Cash on delivery' : (order.payment_status === 'paid' ? 'Paid online' : 'Awaiting payment')}
                              </p>
                              <p className="font-body font-semibold text-[#14110D]">Total: ₱{order.total}</p>
                            </div>
                          </div>

                          {(needsPayment || canCancel) && (
                            <div className="flex flex-col sm:flex-row gap-3 px-5 py-4 border-t border-[#EDE8DC]">
                              {needsPayment && (
                                <button
                                  onClick={() => payNow(order)}
                                  disabled={isBusy}
                                  className="flex-1 bg-[#A9824C] text-[#FAF8F4] font-body text-sm font-medium py-3 sm:py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                  {isBusy ? 'Opening…' : 'Pay now'}
                                </button>
                              )}
                              {canCancel && (
                                <button
                                  onClick={() => cancelOrder(order)}
                                  disabled={isBusy}
                                  className="flex-1 border border-[#D8D2C4] text-[#943D35] font-body text-sm font-medium py-3 sm:py-2.5 rounded-full hover:bg-[#F5E9E7] transition-colors disabled:opacity-50"
                                >
                                  Cancel order
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </BgImg>
      <Footer2 />

      {editingOrder && (
        <EditAddressModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSaved={(fields) => {
            setOrders(prev => prev.map(o => o.id === editingOrder.id ? { ...o, ...fields } : o));
            setEditingOrder(null);
          }}
        />
      )}
    </>
  );
};

export default Orders;
