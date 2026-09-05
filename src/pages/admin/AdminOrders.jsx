import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import supabase from '../../utils/supabase';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`id, total, status, user_id, full_name, courier_name, tracking_number, order_items(*), profiles(email)`)
      .order('id', { ascending: false });
    if (error) console.error(error);
    setOrders(data || []);
    setLoading(false);
  };

  const updateOrder = async (id, fields) => {
    setSavingId(id);
    const { error } = await supabase.from('orders').update(fields).eq('id', id);
    if (error) alert(error.message);
    else setOrders(prev => prev.map(o => o.id === id ? { ...o, ...fields } : o));
    setSavingId(null);
  };

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: orders.filter(o => o.status === s).length }), {});
  const filtered = orders
    .filter(o => tab === 'all' || o.status === tab)
    .filter(o => {
      const q = search.toLowerCase();
      return String(o.id).toLowerCase().includes(q) ||
        (o.full_name || '').toLowerCase().includes(q) ||
        (o.profiles?.email || '').toLowerCase().includes(q);
    });

  const totalValue = filtered.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black uppercase tracking-wide text-[#0D0D0D] mb-1">Order Management</h1>
      <p className="text-sm text-[#4A4536] mb-6">Track and move orders through their lifecycle.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Orders in view</p>
          <p className="text-2xl font-bold">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Total value</p>
          <p className="text-2xl font-bold">₱{totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-amber-300">
          <p className="text-xs text-gray-500 uppercase">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{counts.pending || 0}</p>
        </div>
      </div>

      <input placeholder="Search by name, email, or order ID..." value={search} onChange={e => setSearch(e.target.value)} className="border rounded-lg px-3 py-2 text-sm mb-4 w-full max-w-sm" />

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setTab('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium ${tab === 'all' ? 'bg-black text-white' : 'bg-white border'}`}>All {orders.length}</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setTab(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${tab === s ? 'bg-black text-white' : 'bg-white border'}`}>
            {s} {counts[s] || 0}
          </button>
        ))}
      </div>

      {loading ? <p>Loading...</p> : filtered.length === 0 ? <p>No orders found.</p> : (
        <div className="space-y-4">
          {filtered.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex flex-wrap justify-between gap-4 mb-4">
                <div>
                  <p className="font-semibold">Order #{order.id}</p>
                  <p className="text-sm text-gray-500">{order.full_name || order.profiles?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-xl font-bold">₱{order.total}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Status</label>
                  <select value={order.status} onChange={e => updateOrder(order.id, { status: e.target.value })} disabled={savingId === order.id} className="w-full border rounded-lg px-2 py-1.5 text-sm capitalize">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Courier</label>
                  <input defaultValue={order.courier_name || ''} onBlur={e => updateOrder(order.id, { courier_name: e.target.value })} placeholder="e.g. LBC, J&T" className="w-full border rounded-lg px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Tracking Number</label>
                  <input defaultValue={order.tracking_number || ''} onBlur={e => updateOrder(order.id, { tracking_number: e.target.value })} placeholder="Tracking #" className="w-full border rounded-lg px-2 py-1.5 text-sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}