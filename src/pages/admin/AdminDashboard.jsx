import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import supabase from '../../utils/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0, pendingOrders: 0, revenue: 0, totalUsers: 0, totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    const [{ data: orders }, { data: products }, { count: userCount }] = await Promise.all([
      supabase.from('orders').select('id, total, status'),
      supabase.from('products').select('id'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
    ]);

    setStats({
      totalOrders: orders?.length || 0,
      pendingOrders: orders?.filter(o => o.status === 'pending').length || 0,
      revenue: orders?.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0) || 0,
      totalUsers: userCount || 0,
      totalProducts: products?.length || 0,
    });
    setLoading(false);
  };

  const cards = [
    { label: 'Total Revenue', value: `₱${stats.revenue.toLocaleString()}` },
    { label: 'Total Orders', value: stats.totalOrders },
    { label: 'Pending Orders', value: stats.pendingOrders, alert: stats.pendingOrders > 0 },
    { label: 'Total Users', value: stats.totalUsers },
    { label: 'Total Products', value: stats.totalProducts },
  ];

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black uppercase tracking-wide text-[#0D0D0D] mb-1">Data Analytics</h1>
      <p className="text-sm text-[#4A4536] mb-6">A live look at how the store is performing.</p>

      {loading ? <p>Loading...</p> : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {cards.map(c => (
            <div key={c.label} className={`bg-white rounded-xl p-5 shadow-sm border ${c.alert ? 'border-amber-300' : 'border-gray-200'}`}>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
              <p className={`text-2xl font-bold mt-1 ${c.alert ? 'text-amber-600' : 'text-gray-900'}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
        <p className="font-semibold">Detailed charts coming soon</p>
        <p className="text-sm mt-1">Sales trend, top products, and revenue by category.</p>
        <p className="text-xs mt-3 text-gray-300">
          (Profit isn't shown yet — it needs a cost-price field on products, which doesn't exist yet. Say the word and I'll add it.)
        </p>
      </div>
    </AdminLayout>
  );
}