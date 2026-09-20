import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import StatusBadge from '../../components/Admin/StatusBadge';
import SearchInput from '../../components/Admin/SearchInput';
import supabase from '../../utils/supabase';

const CYAN = '#9CE1F0';
const BLACK = '#000000';
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
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, stock_quantity: newQty } : x));
    const { error } = await supabase.from('products').update({ stock_quantity: newQty }).eq('id', p.id);
    if (error) { alert(error.message); fetchProducts(); }
  };

  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= LOW_STOCK).length;
  const outOfStockCount = products.filter(p => p.stock_quantity <= 0).length;
  const visible = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const statusFor = (qty) => qty <= 0 ? 'out of stock' : qty <= LOW_STOCK ? 'low stock' : 'in stock';

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold uppercase text-black">Inventory Management</h1>
      <p className="text-sm text-gray-500 mb-6">Stock levels and availability at a glance.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border-t-4 border-black shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Products</p>
          <p className="text-2xl font-bold text-black">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border-t-4 shadow-sm" style={{ borderColor: CYAN }}>
          <p className="text-xs text-gray-500 uppercase font-semibold">Low Stock</p>
          <p className="text-2xl font-bold text-black">{lowStockCount}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border-t-4 border-black shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold">Out of Stock</p>
          <p className="text-2xl font-bold text-black">{outOfStockCount}</p>
        </div>
      </div>

      <SearchInput
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search inventory..."
        className="mb-4 w-full max-w-sm"
      />

      {loading ? <p>Loading...</p> : (
              <div className="bg-white rounded-xl border overflow-x-auto" style={{ borderColor: '#EBEBE8' }}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b" style={{ borderColor: '#EBEBE8' }}>
            <tr>
              {['Product', 'Category', 'Stock', 'Status', 'Adjust'].map(h => (
                <th key={h} className="p-3 text-left font-medium text-xs uppercase tracking-wide text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map(p => (
              <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-3">{p.name}</td>
                <td className="p-3 capitalize text-gray-500">{p.category}</td>
                <td className="p-3 font-semibold">{p.stock_quantity}</td>
                <td className="p-3"><StatusBadge status={statusFor(p.stock_quantity || 0)} /></td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => adjustStock(p, -1)} className="btn btn-circle btn-sm btn-outline btn-primary">
                      −
                    </button>
                    <button onClick={() => adjustStock(p, 1)} className="btn btn-circle btn-sm btn-primary">
                      +
                    </button>
                  </div>
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