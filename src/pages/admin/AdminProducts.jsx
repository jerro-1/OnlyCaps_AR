import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import supabase from '../../utils/supabase';

const CATEGORIES = ['fitted', 'aframe', 'trucker', 'more'];
const EMPTY_FORM = { name: '', category: 'fitted', size: '', price: '', stock_quantity: '', image: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('id');
    if (error) console.error(error);
    setProducts(data || []);
    setLoading(false);
  };

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      stock_quantity: parseInt(form.stock_quantity) || 0,
    };
    const { error } = editingId
      ? await supabase.from('products').update(payload).eq('id', editingId)
      : await supabase.from('products').insert({ ...payload, active: true });
    if (error) return alert(error.message);
    resetForm();
    fetchProducts();
  };

  const handleEdit = (p) => {
    setForm({
      name: p.name || '', category: p.category || 'fitted', size: p.size || '',
      price: p.price ?? '', stock_quantity: p.stock_quantity ?? '', image: p.image || '',
    });
    setEditingId(p.id);
  };

  const toggleActive = async (p) => {
    const { error } = await supabase.from('products').update({ active: !p.active }).eq('id', p.id);
    if (error) return alert(error.message);
    fetchProducts();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product permanently?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return alert(error.message);
    fetchProducts();
  };

  const visible = products.filter(p =>
    (category === 'all' || p.category === category) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-wide text-[#0D0D0D]">Product Management</h1>
          <p className="text-sm text-[#4A4536]">Curate the items shoppers can buy.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 mb-6 grid sm:grid-cols-3 gap-3">
        <input required placeholder="Product name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Size" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <input required type="number" step="0.01" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <input required type="number" placeholder="Stock" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Image URL" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <div className="sm:col-span-3 flex gap-2">
          <button type="submit" className="bg-black text-white px-5 py-2 rounded-lg text-sm">
            {editingId ? 'Save changes' : 'Save product'}
          </button>
          {editingId && <button type="button" onClick={resetForm} className="px-5 py-2 rounded-lg text-sm border">Cancel</button>}
        </div>
      </form>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setCategory('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium ${category === 'all' ? 'bg-black text-white' : 'bg-white border'}`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${category === c ? 'bg-black text-white' : 'bg-white border'}`}>{c}</button>
        ))}
      </div>
      <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="border rounded-lg px-3 py-2 text-sm mb-4 w-full max-w-sm" />

      {loading ? <p>Loading...</p> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr><th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {visible.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3 capitalize">{p.category}</td>
                  <td className="p-3">₱{p.price}</td>
                  <td className="p-3">{p.stock_quantity}</td>
                  <td className="p-3">
                    <button onClick={() => toggleActive(p)} className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {p.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => handleEdit(p)} className="text-blue-600 text-xs font-medium">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 text-xs font-medium">Delete</button>
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