import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import SearchInput from '../../components/Admin/SearchInput';
import supabase from '../../utils/supabase';

const CATEGORIES = ['fitted', 'aframe', 'trucker', 'more'];
const SIZES = ['6 7/8', '7', '7 1/8', '7 1/4', '7 3/8', '7 1/2'];
const EMPTY_FORM = { name: '', category: 'fitted', price: '', image: '', description: '', sizes_stock: {} };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [viewingProduct, setViewingProduct] = useState(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('id');
    if (error) console.error(error);
    setProducts(data || []);
    setLoading(false);
  };

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); };

  const toggleSize = (size) => {
    setForm(prev => {
      const next = { ...prev.sizes_stock };
      if (size in next) {
        delete next[size];
      } else {
        next[size] = 0;
      }
      return { ...prev, sizes_stock: next };
    });
  };

  const setSizeStock = (size, value) => {
    setForm(prev => ({
      ...prev,
      sizes_stock: { ...prev.sizes_stock, [size]: Math.max(0, parseInt(value) || 0) },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalStock = Object.values(form.sizes_stock).reduce((sum, n) => sum + (n || 0), 0);

    const payload = {
      name: form.name,
      category: form.category,
      price: parseFloat(form.price) || 0,
      image: form.image,
      description: form.description,
      sizes_stock: form.sizes_stock,
      stock_quantity: totalStock,
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
      name: p.name || '',
      category: p.category || 'fitted',
      price: p.price ?? '',
      image: p.image || '',
      description: p.description || '',
      sizes_stock: p.sizes_stock || {},
    });
    setEditingId(p.id);
  };

  const toggleActive = async (p) => {
  const newActive = !p.active;

  // Update local state immediately so the toggle animates right away,
  // instead of waiting on the database round-trip and re-fetching everything
  setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: newActive } : x));

  const { error } = await supabase.from('products').update({ active: newActive }).eq('id', p.id);

  if (error) {
    alert(error.message);
    // Revert if the save actually failed, so the UI doesn't lie about what's saved
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: p.active } : x));
  }
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
      <div className="mb-6">
        <h1 className="text-3xl font-black uppercase tracking-wide text-[#247ad7]">Product Management</h1>
        <p className="text-sm text-[#1a9ed2]">Curate the items shoppers can buy.</p>
      </div>

      {/* Form card */}
      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6" data-theme="light">
        <div className="card-body">
          <h2 className="card-title text-base">
            {editingId ? 'Edit product' : 'Add a new product'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid sm:grid-cols-3 gap-3">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Product name</legend>
                <input
                  required
                  placeholder="e.g. New York Yankees"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input input-bordered w-full"
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Category</legend>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="select select-bordered w-full capitalize"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Price (₱)</legend>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="500"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  className="input input-bordered w-full"
                />
              </fieldset>
            </div>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Image URL</legend>
              <input
                placeholder="https://..."
                value={form.image}
                onChange={e => setForm({ ...form, image: e.target.value })}
                className="input input-bordered w-full"
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Description</legend>
              <textarea
                placeholder="Short product description shown to customers..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows="3"
                className="textarea textarea-bordered w-full resize-none"
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Available sizes &amp; stock</legend>
              <div className="flex flex-wrap gap-2">
                {SIZES.map(size => {
                  const selected = size in (form.sizes_stock || {});
                  return (
                    <div key={size} className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`btn btn-sm ${selected ? 'btn-primary' : 'btn-outline btn-primary'}`}
                      >
                        {size}
                      </button>
                      {selected && (
                        <input
                          type="number"
                          min="0"
                          value={form.sizes_stock[size]}
                          onChange={e => setSizeStock(size, e.target.value)}
                          placeholder="Qty"
                          className="input input-bordered input-sm w-16"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              {Object.keys(form.sizes_stock || {}).length === 0 && (
                <p className="text-xs text-base-content/50 mt-2">Click a size above to make it available, then set its stock.</p>
              )}
            </fieldset>

            <div className="card-actions justify-start pt-2">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Save changes' : 'Save product'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn btn-ghost">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('all')}
            className={`btn btn-sm ${category === 'all' ? 'btn-primary' : 'btn-outline btn-outline-black'}`}
          >
            All
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`btn btn-sm capitalize ${category === c ? 'btn-primary' : 'btn-outline btn-outline-black'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
        />
      </div>

      {/* Table card -- Sizes column removed, name is now clickable */}
      <div className="card bg-base-100 shadow-sm border border-base-300" data-theme="light">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-5 text-sm text-base-content/60">Loading...</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Total stock</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map(p => (
                  <tr key={p.id} className="hover">
                    <td>
                      <button
                        onClick={() => setViewingProduct(p)}
                        className="font-medium text-primary hover:underline text-left"
                      >
                        {p.name}
                      </button>
                    </td>
                    <td className="capitalize">{p.category}</td>
                    <td>₱{p.price}</td>
                    <td className="font-medium">{p.stock_quantity ?? 0}</td>
                    <td>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!p.active}
                          onChange={() => toggleActive(p)}
                          className="toggle toggle-success toggle-sm"
                        />
                        <span
  className="badge badge-sm font-medium"
  style={p.active
    ? { backgroundColor: '#86EFAC', color: '#065F46' }
    : { backgroundColor: '#FCD34D', color: '#78350F' }
  }
>
  {p.active ? 'Active' : 'Inactive'}
</span>
                      </label>
                    </td>
                    <td className="text-right space-x-1">
                      <button onClick={() => handleEdit(p)} className="btn btn-ghost btn-xs">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="btn btn-ghost btn-xs text-error">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Product detail modal -- shows full info incl. per-size stock */}
      <div className={`modal ${viewingProduct ? 'modal-open' : ''}`} data-theme="light">
        {viewingProduct && (
          <div className="modal-box max-w-2xl">
            <button
              onClick={() => setViewingProduct(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
            >
              ✕
            </button>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-base-200 rounded-xl overflow-hidden aspect-square flex items-center justify-center">
                {viewingProduct.image ? (
                  <img src={viewingProduct.image} alt={viewingProduct.name} className="w-full h-full object-contain p-4" />
                ) : (
                  <span className="text-base-content/40 text-sm">No image</span>
                )}
              </div>

              <div>
                <span className="badge badge-outline capitalize mb-2">{viewingProduct.category}</span>
                <h3 className="text-xl font-bold">{viewingProduct.name}</h3>
                <p className="text-2xl font-bold text-primary mt-1">₱{viewingProduct.price}</p>

                {viewingProduct.description && (
                  <p className="text-sm text-base-content/70 mt-3">{viewingProduct.description}</p>
                )}

                <div className="mt-4">
                  <p className="text-xs font-medium text-base-content/50 uppercase tracking-wide mb-2">
                    Sizes &amp; stock
                  </p>
                  {Object.keys(viewingProduct.sizes_stock || {}).length === 0 ? (
                    <p className="text-sm text-base-content/40">No sizes configured yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {SIZES.map(size => {
                        const qty = viewingProduct.sizes_stock?.[size];
                        if (qty === undefined) return null;
                        const outOfStock = qty <= 0;
                        return (
                          <div
                            key={size}
                            className={`badge ${outOfStock ? 'badge-ghost opacity-50' : 'badge-primary badge-outline'}`}
                          >
                            {size}: {qty}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-base-content/50">Total stock:</span>
                  <span className="font-semibold">{viewingProduct.stock_quantity ?? 0}</span>
                  <span
                    className="badge badge-sm ml-2 font-medium"
                    style={viewingProduct.active
                      ? { backgroundColor: '#86EFAC', color: '#065F46' }
                      : { backgroundColor: '#FCD34D', color: '#78350F' }
                    }
                  >
                    {viewingProduct.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="card-actions mt-6">
                  <button
                    onClick={() => { handleEdit(viewingProduct); setViewingProduct(null); }}
                    className="btn btn-primary btn-sm"
                  >
                    Edit this product
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="modal-backdrop" onClick={() => setViewingProduct(null)} />
      </div>
    </AdminLayout>
  );
}