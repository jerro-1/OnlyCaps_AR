import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import StatusBadge from '../../components/Admin/StatusBadge';
import Button from '../../components/Admin/Button';
import SearchInput from '../../components/Admin/SearchInput';
import supabase from '../../utils/supabase';

const INK = '#16181D';
const ACCENT = '#00BFFF';
const BORDER = '#E5E5E1';
const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
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
      .select(`id, order_number, total, status, payment_method, payment_status, user_id, full_name, phone, courier_name, tracking_number, created_at, order_items(*), profiles(email)`)
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
      return String(o.order_number || '').toLowerCase().includes(q) ||
        String(o.id).toLowerCase().includes(q) ||
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
      <h1 className="text-xl font-semibold" style={{ color: INK }}>Order Management</h1>
      <p className="text-sm text-gray-500 mb-6">Track and move orders through their lifecycle.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border" style={{ borderColor: BORDER }}>
          <p className="text-xs text-gray-500 font-medium">Orders in view</p>
          <p className="text-2xl font-semibold mt-1" style={{ color: INK }}>{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border" style={{ borderColor: BORDER }}>
          <p className="text-xs text-gray-500 font-medium">Total value</p>
          <p className="text-2xl font-semibold mt-1" style={{ color: INK }}>₱{totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border" style={{ borderColor: BORDER }}>
          <p className="text-xs text-gray-500 font-medium">Pending</p>
          <p className="text-2xl font-semibold mt-1" style={{ color: '#B8720A' }}>{counts.pending || 0}</p>
        </div>
      </div>

      <SearchInput
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search by name, phone, or order ID..."
        className="mb-4 w-full max-w-sm"
      />

              <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => { setTab('all'); setPage(1); }}
            className={`btn btn-sm ${tab === 'all' ? 'btn-neutral' : 'btn-outline'}`}
          >
            All {orders.length}
          </button>
          {STATUSES.map(s => {
            const activeClass = {
              pending: 'btn-warning',
              confirmed: 'btn-neutral',
              processing: 'btn-accent',
              shipped: 'btn-primary',
              delivered: 'btn-info',
              completed: 'btn-success',
              cancelled: 'btn-error',
            }[s];
            return (
              <button
                key={s}
                onClick={() => { setTab(s); setPage(1); }}
                className={`btn btn-sm capitalize ${tab === s ? activeClass : 'btn-outline'}`}
              >
                {s} {counts[s] || 0}
              </button>
            );
          })}
        </div>

      {loading ? <p>Loading...</p> : filtered.length === 0 ? <p className="text-gray-500 text-sm">No orders found.</p> : (
        <>
          <div className="bg-white rounded-xl border overflow-x-auto mb-4" style={{ borderColor: BORDER }}>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b" style={{ borderColor: BORDER }}>
                <tr>
                  {['Order ID', 'Customer', 'Contact', 'Total', 'Payment', 'Placed', 'Status'].map(h => (
                    <th key={h} className="p-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                  ))}
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {paged.map(order => (
                  <tr key={order.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: '#F0F0EE' }}>
                    <td className="p-3 text-gray-500 font-mono text-xs">#{order.order_number}</td>
                    <td className="p-3 font-medium" style={{ color: INK }}>{order.full_name || order.profiles?.email}</td>
                    <td className="p-3 text-gray-500">{order.phone || 'N/A'}</td>
                    <td className="p-3 font-medium" style={{ color: INK }}>₱{order.total}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : order.payment_status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                        {order.payment_status === 'unpaid' ? (order.payment_method === 'cod' ? 'COD · unpaid' : 'Awaiting payment') : order.payment_status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">{order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}</td>
                    <td className="p-3"><StatusBadge status={order.status} /></td>
                    <td className="p-3">
                      <select
                        value={order.status}
                        onChange={e => updateOrder(order.id, { status: e.target.value })}
                        disabled={savingId === order.id}
                        className="border rounded-lg px-2 py-1 text-xs capitalize focus:outline-none focus:ring-2"
                        style={{ borderColor: BORDER, '--tw-ring-color': ACCENT }}
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
              <div key={`courier-${order.id}`} className="bg-white rounded-xl border p-4 grid sm:grid-cols-2 gap-3" style={{ borderColor: BORDER }}>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Courier (Order #{order.order_number})</label>
                  <input
                    defaultValue={order.courier_name || ''}
                    onBlur={e => updateOrder(order.id, { courier_name: e.target.value })}
                    placeholder="e.g. LBC, J&T"
                    className="w-full border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: BORDER, '--tw-ring-color': ACCENT }}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Tracking Number</label>
                  <input
                    defaultValue={order.tracking_number || ''}
                    onBlur={e => updateOrder(order.id, { tracking_number: e.target.value })}
                    placeholder="Tracking #"
                    className="w-full border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: BORDER, '--tw-ring-color': ACCENT }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                style={n === page ? { backgroundColor: INK, color: '#fff' } : { border: `1px solid ${BORDER}`, color: '#5A5A55' }}
              >
                {n}
              </button>
            ))}
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
            <div className="flex items-center gap-1.5 ml-3">
              <span className="text-xs text-gray-500">Go to page:</span>
              <input
                value={goToPage}
                onChange={e => setGoToPage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGoToPage()}
                className="w-14 border rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-2"
                style={{ borderColor: BORDER, '--tw-ring-color': ACCENT }}
              />
              <Button variant="accent" onClick={handleGoToPage} className="text-xs px-3 py-1">Go</Button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}