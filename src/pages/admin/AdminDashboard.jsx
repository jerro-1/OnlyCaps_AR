import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import supabase from '../../utils/supabase';
import { SalesTrendChart, TopProductsChart, CategoryRevenueChart, CATEGORY_META } from '../../components/Admin/DashboardCharts';

const TREND_DAYS = 30;

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0, pendingOrders: 0, revenue: 0, totalUsers: 0, totalProducts: 0,
  });
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryRevenue, setCategoryRevenue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    const [{ data: orders }, { data: products }, { count: userCount }, { data: paid }, { data: paidOrders }] = await Promise.all([
      supabase.from('orders').select('id, total, status'),
      supabase.from('products').select('id, product_id, category'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('amount').eq('status', 'paid'),
      // "Confirmed revenue" is only ever what a paid payment says was charged
      // (see the revenue stat below) -- these charts break that same figure
      // down by day/product/category instead of inventing a second definition.
      supabase
        .from('orders')
        .select('created_at, payment_status, order_items(product_id, name, price, quantity)')
        .eq('payment_status', 'paid'),
    ]);

    setStats({
      totalOrders: orders?.length || 0,
      pendingOrders: orders?.filter(o => o.status === 'pending').length || 0,
      // Only money PayMongo (or an admin, for cash on delivery) has actually confirmed
      revenue: paid?.reduce((s, p) => s + Number(p.amount || 0), 0) || 0,
      totalUsers: userCount || 0,
      totalProducts: products?.length || 0,
    });

    buildCharts(paidOrders || [], products || []);
    setLoading(false);
  };

  const buildCharts = (paidOrders, products) => {
    // Sales trend: paid revenue per day, last 30 days, zero-filled so gaps
    // read as "no sales that day" instead of skipping the point entirely.
    const byDay = new Map();
    for (const o of paidOrders) {
      const day = (o.created_at || '').slice(0, 10);
      const dayTotal = (o.order_items || []).reduce((s, it) => s + Number(it.price) * it.quantity, 0);
      byDay.set(day, (byDay.get(day) || 0) + dayTotal);
    }
    const trend = [];
    const today = new Date();
    for (let i = TREND_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      trend.push({ date: key.slice(5), total: byDay.get(key) || 0 });
    }
    setSalesTrend(trend);

    // Map every product identifier order_items might use (numeric id or the
    // human product_id) back to its category, same dual-lookup the checkout
    // function itself relies on.
    const categoryByIdentifier = new Map();
    for (const p of products) {
      if (p.category) {
        categoryByIdentifier.set(String(p.id), p.category);
        if (p.product_id) categoryByIdentifier.set(String(p.product_id), p.category);
      }
    }

    const revenueByProduct = new Map();
    const revenueByCategory = new Map();
    for (const o of paidOrders) {
      for (const it of o.order_items || []) {
        const lineRevenue = Number(it.price) * it.quantity;
        revenueByProduct.set(it.name, (revenueByProduct.get(it.name) || 0) + lineRevenue);
        const category = categoryByIdentifier.get(String(it.product_id));
        if (category) revenueByCategory.set(category, (revenueByCategory.get(category) || 0) + lineRevenue);
      }
    }

    setTopProducts(
      [...revenueByProduct.entries()]
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
    );

    setCategoryRevenue(
      Object.keys(CATEGORY_META)
        .map(category => ({ category, ...CATEGORY_META[category], revenue: revenueByCategory.get(category) || 0 }))
        .filter(c => c.revenue > 0)
    );
  };

  const cards = [
    { label: 'Confirmed Revenue', value: `₱${stats.revenue.toLocaleString()}` },
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
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {cards.map(c => (
              <div key={c.label} className={`bg-white rounded-xl p-5 shadow-sm border ${c.alert ? 'border-amber-300' : 'border-gray-200'}`}>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
                <p className={`text-2xl font-bold mt-1 ${c.alert ? 'text-amber-600' : 'text-gray-900'}`}>{c.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <SalesTrendChart data={salesTrend} />
            <CategoryRevenueChart data={categoryRevenue} />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <TopProductsChart data={topProducts} />
          </div>

          <p className="text-xs mt-4 text-gray-300">
            (Profit isn't shown yet — it needs a cost-price field on products, which doesn't exist yet. Say the word and I'll add it.)
          </p>
        </>
      )}
    </AdminLayout>
  );
}
