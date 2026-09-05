import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import supabase from '../../utils/supabase';

const LOW_STOCK = 5;

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) console.error(error);
    setProducts(data || []);
    setLoading(false);
  };

  const adjustStock = async (p, delta) => {
    const newQty = Math.max(0, (p.stock_quantity || 0) + delta);
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, stock_quantity: newQty } : x)); // optimistic
    const { error } = await supabase.from('products').update({ stock_quantity: newQty }).eq('id', p.id);
    if (error) { alert(error.message); fetchProducts(); }
  };

  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= LOW_STOCK).length;
  const outOfStockCount = products.filter(p => p.stock_quantity <= 0).length;
  const visible = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const statusFor = (qty) => qty <= 0
    ? { label: 'Out of stock', cls: 'bg-red-100 text-red-700' }
    : qty <= LOW_STOCK
    ? { label: 'Low stock', cls: 'bg-amber-100 text-amber-700' }
    : { label: 'In stock', cls: 'bg-green-100 text-green-700' };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black uppercase tracking-wide text-[#0D0D0D] mb-1">Inventory Management</h1>
      <p className="text-sm text-[#4A4536] mb-6">Stock levels and availability at a glance.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Total Products</p>
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-amber-300">
          <p className="text-xs text-gray-500 uppercase">Low Stock</p>
          <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-red-300">
          <p className="text-xs text-gray-500 uppercase">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
        </div>
      </div>

      <input placeholder="Search inventory..." value={search} onChange={e => setSearch(e.target.value)} className="border rounded-lg px-3 py-2 text-sm mb-4 w-full max-w-sm" />

      {loading ? <p>Loading...</p> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3">Adjust</th></tr>
            </thead>
            <tbody>
              {visible.map(p => {
                const status = statusFor(p.stock_quantity || 0);
                return (
                  <tr key={p.id} className="border-t">
                    <td className="p-3">{p.name}</td>
                    <td className="p-3 capitalize">{p.category}</td>
                    <td className="p-3 font-semibold">{p.stock_quantity}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.cls}`}>{status.label}</span></td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => adjustStock(p, -1)} className="w-7 h-7 border rounded-full hover:bg-gray-100">−</button>
                        <button onClick={() => adjustStock(p, 1)} className="w-7 h-7 border rounded-full hover:bg-gray-100">+</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}