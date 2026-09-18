import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import StatusBadge from '../../components/admin/StatusBadge';
import supabase from '../../utils/supabase';

const CYAN = '#9CE1F0';
const BLACK = '#000000';
const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAGE_SIZE = 10;

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [goToPage, setGoToPage] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`id, total, status, user_id, full_name, phone, courier_name, tracking_number, created_at, order_items(*), profiles(email)`)
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
        (o.phone || '').toLowerCase().includes(q) ||
        (o.profiles?.email || '').toLowerCase().includes(q);
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalValue = filtered.reduce((s, o) => s + (o.total || 0), 0);

  const handleGoToPage = () => {
    const n = parseInt(goToPage, 10);
    if (n >= 1 && n <= totalPages) setPage(n);
    setGoToPage('');
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold uppercase text-black">Order Management</h1>
      <p className="text-sm text-gray-500 mb-6">Track and move orders through their lifecycle.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border-t-4 border-black shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold">Orders in view</p>
          <p className="text-2xl font-bold text-black">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border-t-4 border-black shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total value</p>
          <p className="text-2xl font-bold text-black">₱{totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border-t-4 shadow-sm" style={{ borderColor: CYAN }}>
          <p className="text-xs text-gray-500 uppercase font-semibold">Pending</p>
          <p className="text-2xl font-bold text-black">{counts.pending || 0}</p>
        </div>
      </div>

      <input
        placeholder="Search by name, phone, or order ID..."
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        className="border-2 border-black rounded-full px-4 py-2 text-sm mb-4 w-full max-w-sm"
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => { setTab('all'); setPage(1); }}
          className="px-3 py-1.5 rounded-full text-xs font-bold"
          style={tab === 'all' ? { backgroundColor: BLACK, color: '#fff' } : { backgroundColor: '#fff', border: '2px solid black', color: BLACK }}
        >
          All {orders.length}
        </button>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setTab(s); setPage(1); }}
            className="px-3 py-1.5 rounded-full text-xs font-bold capitalize"
            style={tab === s ? { backgroundColor: BLACK, color: '#fff' } : { backgroundColor: '#fff', border: '2px solid black', color: BLACK }}
          >
            {s} {counts[s] || 0}
          </button>
        ))}
      </div>

      {loading ? <p>Loading...</p> : filtered.length === 0 ? <p>No orders found.</p> : (
        <>
          <div className="bg-white rounded-xl border-2 border-black overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: BLACK }}>
                <tr>
                  {['Order ID', 'Customer', 'Contact', 'Total', 'Placed', 'Status'].map(h => (
                    <th key={h} className="p-3 text-left font-bold text-xs uppercase" style={{ color: CYAN }}>{h}</th>
                  ))}
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {paged.map(order => (
                  <tr key={order.id} className="border-t border-gray-100 hover:bg-[#F0FBFD]">
                    <td className="p-3 text-gray-500">#{order.id}</td>
                    <td className="p-3 font-medium">{order.full_name || order.profiles?.email}</td>
                    <td className="p-3 text-gray-500">{order.phone || 'N/A'}</td>
                    <td className="p-3 font-semibold">₱{order.total}</td>
                    <td className="p-3 text-gray-500">{order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}</td>
                    <td className="p-3"><StatusBadge status={order.status} /></td>
                    <td className="p-3">
                      <select
                        value={order.status}
                        onChange={e => updateOrder(order.id, { status: e.target.value })}
                        disabled={savingId === order.id}
                        className="border-2 border-black rounded-lg px-2 py-1 text-xs capitalize"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 mb-6">
            {paged.map(order => (
              <div key={`courier-${order.id}`} className="bg-white rounded-xl border border-gray-200 p-4 grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Courier (Order #{order.id})</label>
                  <input
                    defaultValue={order.courier_name || ''}
                    onBlur={e => updateOrder(order.id, { courier_name: e.target.value })}
                    placeholder="e.g. LBC, J&T"
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Tracking Number</label>
                  <input
                    defaultValue={order.tracking_number || ''}
                    onBlur={e => updateOrder(order.id, { tracking_number: e.target.value })}
                    placeholder="Tracking #"
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-full text-sm border-2 border-black disabled:opacity-40"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className="w-8 h-8 rounded-full text-sm font-bold"
                style={n === page ? { backgroundColor: BLACK, color: '#fff' } : { border: '2px solid black', color: BLACK }}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-full text-sm border-2 border-black disabled:opacity-40"
            >
              Next
            </button>
            <div className="flex items-center gap-1 ml-3">
              <span className="text-xs text-gray-500">Go to page:</span>
              <input
                value={goToPage}
                onChange={e => setGoToPage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGoToPage()}
                className="w-14 border-2 border-black rounded-full px-2 py-1 text-xs text-center"
              />
              <button onClick={handleGoToPage} className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: CYAN, color: BLACK }}>Go</button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}