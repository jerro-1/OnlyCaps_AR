import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import StatusBadge, { statusDotColor } from '../../components/Admin/StatusBadge';
import Button from '../../components/Admin/Button';
import SearchInput from '../../components/Admin/SearchInput';
import FilterTabs from '../../components/Admin/FilterTabs';
import supabase from '../../utils/supabase';

const INK = '#16181D';
const ACCENT = '#00BFFF';
const BORDER = '#E5E5E1';
const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
const PAGE_SIZE = 10;

const paymentLabel = (order) =>
  order.payment_status === 'unpaid'
    ? (order.payment_method === 'cod' ? 'COD · unpaid' : 'Awaiting payment')
    : order.payment_status;

function OrdersTableSkeleton() {
  return (
    <div className="bg-white rounded-xl border overflow-hidden mb-4" style={{ borderColor: BORDER }}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0 animate-pulse" style={{ borderColor: '#F0F0EE' }}>
          <div className="h-3 bg-gray-100 rounded w-16" />
          <div className="h-3 bg-gray-100 rounded w-28" />
          <div className="h-3 bg-gray-100 rounded w-20" />
          <div className="h-5 bg-gray-100 rounded-full w-24 ml-auto" />
        </div>
      ))}
    </div>
  );
}

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
          <p className="text-2xl font-semibold mt-1" style={{ color: '#f59e0b' }}>{counts.pending || 0}</p>
        </div>
      </div>

      <SearchInput
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search by name, phone, or order ID..."
        className="mb-4 w-full max-w-sm"
      />

      <FilterTabs
        tabs={[
          { value: 'all', label: 'All', count: orders.length },
          ...STATUSES.map(s => ({ value: s, count: counts[s] || 0, color: statusDotColor(s) })),
        ]}
        active={tab}
        onChange={t => { setTab(t); setPage(1); }}
      />
      <div className="mb-4" />

      {loading ? <OrdersTableSkeleton /> : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center mb-4" style={{ borderColor: BORDER }}>
          <p className="text-gray-500 text-sm">No orders found.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border overflow-x-auto mb-4" style={{ borderColor: BORDER }}>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b" style={{ borderColor: BORDER }}>
                <tr>
                  {['Order', 'Customer', 'Contact', 'Total', 'Payment', 'Placed', 'Status', 'Courier', 'Tracking #'].map(h => (
                    <th key={h} className="p-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(order => (
                  <tr
                    key={order.id}
                    className="border-t hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#F0F0EE', borderLeft: `3px solid ${statusDotColor(order.status)}` }}
                  >
                    <td className="p-3 text-gray-500 font-mono text-xs whitespace-nowrap">#{order.order_number}</td>
                    <td className="p-3 font-medium whitespace-nowrap" style={{ color: INK }}>{order.full_name || order.profiles?.email}</td>
                    <td className="p-3 text-gray-500 whitespace-nowrap">{order.phone || 'N/A'}</td>
                    <td className="p-3 font-medium whitespace-nowrap" style={{ color: INK }}>₱{order.total}</td>
                    <td className="p-3"><StatusBadge status={order.payment_status} label={paymentLabel(order)} /></td>
                    <td className="p-3 text-gray-500 whitespace-nowrap">{order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={order.status} />
                        <select
                          value={order.status}
                          onChange={e => updateOrder(order.id, { status: e.target.value })}
                          disabled={savingId === order.id}
                          aria-label={`Change status for order #${order.order_number}`}
                          className="border rounded-lg px-1.5 py-1 text-xs capitalize focus:outline-none focus:ring-2 bg-white text-gray-600 disabled:opacity-50"
                          style={{ borderColor: BORDER, '--tw-ring-color': ACCENT }}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="p-3">
                      <input
                        defaultValue={order.courier_name || ''}
                        onBlur={e => e.target.value !== (order.courier_name || '') && updateOrder(order.id, { courier_name: e.target.value })}
                        placeholder="e.g. LBC, J&T"
                        className="w-28 border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2"
                        style={{ borderColor: BORDER, '--tw-ring-color': ACCENT }}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        defaultValue={order.tracking_number || ''}
                        onBlur={e => e.target.value !== (order.tracking_number || '') && updateOrder(order.id, { tracking_number: e.target.value })}
                        placeholder="Tracking #"
                        className="w-28 border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2"
                        style={{ borderColor: BORDER, '--tw-ring-color': ACCENT }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                className="w-9 h-9 rounded-lg text-sm font-semibold transition-colors hover:bg-gray-100"
                style={n === page ? { border: `1.5px solid ${INK}`, color: INK } : { border: '1.5px solid #C7CBD1', color: '#374151' }}
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
            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:ml-3">
              <span className="text-xs font-medium text-gray-600">Go to page:</span>
              <input
                value={goToPage}
                onChange={e => setGoToPage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGoToPage()}
                className="w-14 h-9 border rounded-lg px-2 text-sm text-center font-medium focus:outline-none focus:ring-2"
                style={{ borderColor: '#C7CBD1', color: INK, '--tw-ring-color': ACCENT }}
              />
              <Button variant="accent" onClick={handleGoToPage} className="h-9! text-sm px-3 py-0!">Go</Button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
