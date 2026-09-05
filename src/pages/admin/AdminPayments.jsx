import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import supabase from '../../utils/supabase';

export default function AdminPayments() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('999999');

  useEffect(() => {
    supabase.from('orders')
      .select('id, total, payment_method, payment_status, full_name, profiles(email), created_at')
      .then(({ data, error }) => {
        if (error) console.error(error);
        setOrders(data || []);
        setLoading(false);
      });
  }, []);

  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const avg = orders.length ? Math.round(revenue / orders.length) : 0;

  const visible = orders.filter(o => {
    const q = search.toLowerCase();
    const matchesSearch = (o.full_name || '').toLowerCase().includes(q) ||
      (o.payment_method || '').toLowerCase().includes(q) ||
      String(o.id).toLowerCase().includes(q);
    const inRange = o.total >= Number(minPrice || 0) && o.total <= Number(maxPrice || 999999);
    return matchesSearch && inRange;
  });

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black uppercase tracking-wide text-[#0D0D0D] mb-1">Payment Transactions</h1>
      <p className="text-sm text-[#4A4536] mb-6">Every transaction that flowed through the store.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Total Revenue</p>
          <p className="text-2xl font-bold">₱{revenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Transactions</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Avg. Payment</p>
          <p className="text-2xl font-bold">₱{avg.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input placeholder="Search by name, method, or ID..." value={search} onChange={e => setSearch(e.target.value)} className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]" />
        <input type="number" placeholder="Min price" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-28" />
        <input type="number" placeholder="Max price" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-28" />
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr><th className="p-3">Trans. ID</th><th className="p-3">Customer</th><th className="p-3">Amount</th><th className="p-3">Method</th><th className="p-3">Date</th></tr>
            </thead>
            <tbody>
              {visible.map(o => (
                <tr key={o.id} className="border-t">
                  <td className="p-3 text-gray-500">#{o.id}</td>
                  <td className="p-3 font-medium">{o.full_name || o.profiles?.email}</td>
                  <td className="p-3 font-semibold">₱{o.total}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 capitalize">
                      {o.payment_status === 'unpaid' ? 'Pending Payment' : o.payment_method}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">{o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}