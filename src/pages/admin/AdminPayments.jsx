import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import SearchInput from '../../components/Admin/SearchInput';
import supabase from '../../utils/supabase';

const METHOD_LABEL = { gcash: 'GCash', card: 'Card', cod: 'Cash on delivery' };
const STATUS_STYLE = {
  paid: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
  flagged: 'bg-purple-50 text-purple-700',
};
const TABS = ['all', 'paid', 'pending', 'failed', 'refunded', 'flagged'];

const peso = (n) => `₱${Number(n || 0).toLocaleString()}`;

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('id, order_id, method, amount, status, card_brand, card_last4, paymongo_payment_id, paymongo_checkout_session_id, failure_reason, paid_at, created_at, orders(order_number, full_name, profiles(email))')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    setPayments(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // New and updated payments (e.g. a PayMongo webhook landing) appear without a refresh
    const channel = supabase
      .channel('admin-payments-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const markCodCollected = async (payment) => {
    if (!window.confirm(`Confirm you collected ${peso(payment.amount)} in cash for order #${payment.orders?.order_number}?`)) return;
    setBusyId(payment.id);
    const { error } = await supabase.rpc('mark_cod_collected', { p_order_id: payment.order_id });
    if (error) alert(error.message);
    else await load();
    setBusyId(null);
  };

  const sum = (status) => payments.filter(p => p.status === status).reduce((s, p) => s + Number(p.amount), 0);
  const count = (status) => payments.filter(p => p.status === status).length;
  const paidRevenue = sum('paid');

  const visible = payments
    .filter(p => tab === 'all' || p.status === tab)
    .filter(p => {
      const q = search.toLowerCase();
      return !q ||
        String(p.orders?.order_number || '').toLowerCase().includes(q) ||
        (p.orders?.full_name || '').toLowerCase().includes(q) ||
        (p.orders?.profiles?.email || '').toLowerCase().includes(q) ||
        (METHOD_LABEL[p.method] || '').toLowerCase().includes(q) ||
        (p.paymongo_payment_id || '').toLowerCase().includes(q);
    });

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black uppercase tracking-wide text-[#0D0D0D] mb-1">Payment Transactions</h1>
      <p className="text-sm text-[#4A4536] mb-6">
        Live from PayMongo. GCash and card payments are confirmed by PayMongo itself; cash on delivery is confirmed by you.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Confirmed revenue</p>
          <p className="text-2xl font-bold">{peso(paidRevenue)}</p>
          <p className="text-xs text-gray-400 mt-1">{count('paid')} paid</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Awaiting payment</p>
          <p className="text-2xl font-bold text-amber-600">{peso(sum('pending'))}</p>
          <p className="text-xs text-gray-400 mt-1">{count('pending')} pending</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Failed / refunded</p>
          <p className="text-2xl font-bold">{count('failed') + count('refunded')}</p>
          <p className="text-xs text-gray-400 mt-1">{count('failed')} failed · {count('refunded')} refunded</p>
        </div>
        <div className={`bg-white rounded-xl p-5 border ${count('flagged') ? 'border-purple-300' : 'border-gray-200'}`}>
          <p className="text-xs text-gray-500 uppercase">Needs review</p>
          <p className={`text-2xl font-bold ${count('flagged') ? 'text-purple-700' : ''}`}>{count('flagged')}</p>
          <p className="text-xs text-gray-400 mt-1">Amount didn't match the order</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`btn btn-sm capitalize ${tab === t ? 'btn-neutral' : 'btn-outline'}`}
          >
            {t} {t === 'all' ? payments.length : count(t)}
          </button>
        ))}
      </div>

      <SearchInput
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by order #, customer, email, method or PayMongo ID..."
        className="mb-4 w-full max-w-md"
      />

      {loading ? <p>Loading...</p> : visible.length === 0 ? (
        <p className="text-gray-500 text-sm">No payments found.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Method</th>
                <th className="p-3">Status</th>
                <th className="p-3">PayMongo ref</th>
                <th className="p-3">Date</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 text-gray-500 font-mono text-xs">#{String(p.orders?.order_number || '').slice(0, 8)}</td>
                  <td className="p-3">
                    <p className="font-medium">{p.orders?.full_name || '—'}</p>
                    <p className="text-xs text-gray-400">{p.orders?.profiles?.email}</p>
                  </td>
                  <td className="p-3 font-semibold">{peso(p.amount)}</td>
                  <td className="p-3">
                    {METHOD_LABEL[p.method] || p.method}
                    {p.card_last4 && (
                      <span className="block text-xs text-gray-400 capitalize">{p.card_brand} •••• {p.card_last4}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[p.status] || 'bg-gray-100'}`}>
                      {p.status}
                    </span>
                    {p.failure_reason && <span className="block text-[11px] text-gray-400 mt-1 max-w-[220px]">{p.failure_reason}</span>}
                  </td>
                  <td className="p-3 text-gray-400 font-mono text-[11px]">
                    {p.paymongo_payment_id || (p.paymongo_checkout_session_id ? `${p.paymongo_checkout_session_id.slice(0, 14)}…` : '—')}
                  </td>
                  <td className="p-3 text-gray-500 whitespace-nowrap">
                    {new Date(p.paid_at || p.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="p-3">
                    {p.method === 'cod' && p.status === 'pending' && (
                      <button
                        onClick={() => markCodCollected(p)}
                        disabled={busyId === p.id}
                        className="btn btn-xs btn-neutral whitespace-nowrap"
                      >
                        Mark collected
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
