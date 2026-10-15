import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import SearchInput from '../../components/Admin/SearchInput';
import FilterTabs from '../../components/Admin/FilterTabs';
import { CAP_SIZES } from '../../utils/capSizes';
import supabase from '../../utils/supabase';

const CATEGORIES = ['fitted', 'aframe', 'trucker', 'more'];
const CATEGORY_LABELS = { fitted: 'Fitted Caps', aframe: 'A-Frames', trucker: 'Trucker', more: 'More Stuff' };
const SIZES = CAP_SIZES;
// A-Frames and Truckers are adjustable, one-size-fits-all caps -- they get a
// single stock count instead of the per-hat-size picker fitted caps use.
const ONE_SIZE_CATEGORIES = ['aframe', 'trucker'];
// The .glb files actually present in public/models/CapModels/ -- Try It On
// loads whichever one a product is assigned, and falls back to the first if
// a product has none set.
const MODEL_FILES = ['BLUELA_AFrame.glb', 'DeepBlue_FittedCap.glb', 'FittedCap_BlueLA.glb', 'Pink_FittedCap.glb'];
const EMPTY_FORM = { name: '', category: 'fitted', price: '', image: '', images: [], description: '', sizes_stock: {}, oneSizeStock: '', model_filename: '' };
const STORAGE_BUCKET = 'product-images';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [viewingProduct, setViewingProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('id');
    if (error) console.error(error);
    setProducts(data || []);
    setLoading(false);
  };

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setUploadProgress({}); };

  // Upload multiple images to Supabase Storage
  const uploadImages = useCallback(async (files, productId) => {
    const uploadedUrls = [];
    const progress = {};
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}/${Date.now()}-${i}.${fileExt}`;
      
      progress[fileName] = 0;
      setUploadProgress({ ...progress });
      
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (error) {
        console.error('Upload error:', error);
        alert(`Failed to upload ${file.name}: ${error.message}`);
        continue;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);
      
      uploadedUrls.push(publicUrl);
      progress[fileName] = 100;
      setUploadProgress({ ...progress });
    }
    
    return uploadedUrls;
  }, []);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      let productId = editingId;
      
      // If creating new product, we need to save first to get an ID
      if (!editingId) {
        const name = form.name.trim();
        if (!name) {
          alert('Please enter a product name first');
          setUploading(false);
          return;
        }
        
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        productId = `${slug}-${Date.now().toString(36)}`;
      }
      
      const newUrls = await uploadImages(files, productId);
      setForm(prev => ({
        ...prev,
        images: [...prev.images, ...newUrls],
        // Set first image as main image if none set
        image: prev.image || newUrls[0]
      }));
    } finally {
      setUploading(false);
      setUploadProgress({});
      e.target.value = ''; // Reset input
    }
  };

  const removeImage = (index) => {
    setForm(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages,
        image: newImages[0] || ''
      };
    });
  };

  const setMainImage = (index) => {
    setForm(prev => ({
      ...prev,
      image: prev.images[index],
      images: [
        prev.images[index],
        ...prev.images.slice(0, index),
        ...prev.images.slice(index + 1)
      ]
    }));
  };

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
    const isOneSize = ONE_SIZE_CATEGORIES.includes(form.category);
    const sizesStock = isOneSize ? {} : form.sizes_stock;
    const totalStock = isOneSize
      ? Math.max(0, parseInt(form.oneSizeStock) || 0)
      : Object.values(form.sizes_stock).reduce((sum, n) => sum + (n || 0), 0);

    const name = form.name.trim();
    const payload = {
      name,
      category: form.category,
      price: Math.max(0, parseFloat(form.price) || 0),
      image: form.image, // Main image (first in array)
      images: form.images, // All images array
      description: form.description,
      sizes_stock: sizesStock,
      stock_quantity: totalStock,
      model_filename: form.model_filename || null,
    };

    // The storefront cart and orders key on product_id and full_name, so new
    // products must have them (edits keep whatever the row already has).
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const newProductFields = {
      product_id: `${slug}-${Date.now().toString(36)}`,
      full_name: name,
      active: true,
    };

    const { error } = editingId
      ? await supabase.from('products').update(payload).eq('id', editingId)
      : await supabase.from('products').insert({ ...payload, ...newProductFields });

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
      images: p.images || (p.image ? [p.image] : []),
      description: p.description || '',
      sizes_stock: p.sizes_stock || {},
      oneSizeStock: String(p.stock_quantity ?? 0),
      model_filename: p.model_filename || '',
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
                  min="0"
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

            {/* Multiple Image Upload */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Product Photos <span className="text-xs font-normal text-base-content/50 ml-2">(drag & drop or click to upload multiple)</span></legend>
              
              <div className="mt-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="file-input file-input-bordered w-full hidden"
                    id="image-upload"
                    ref={el => { if (el) el.style.display = 'none'; }}
                  />
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                      uploading ? 'border-base-300 bg-base-200' : 'border-primary hover:border-primary-focus bg-primary/5'
                    }`}
                    onClick={() => document.getElementById('image-upload')?.click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-primary-focus', 'bg-primary/10'); }}
                    onDragLeave={e => { e.currentTarget.classList.remove('border-primary-focus', 'bg-primary/10'); }}
                    onDrop={e => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-primary-focus', 'bg-primary/10');
                      handleImageUpload({ target: { files: e.dataTransfer.files } });
                    }}
                  >
                    {uploading ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <span className="loading loading-spinner loading-lg"></span>
                          <span className="font-medium">Uploading images...</span>
                        </div>
                        {Object.entries(uploadProgress).map(([fileName, progress]) => (
                          <div key={fileName} className="text-xs text-base-content/60 flex items-center gap-2">
                            <span className="truncate max-w-xs">{fileName.split('/').pop()}</span>
                            <div className="w-32 h-1.5 bg-base-300 rounded-full overflow-hidden">
                              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span>{progress}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <svg className="mx-auto h-10 w-10 text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-base-content/70">Drag & drop images here, or click to browse</p>
                        <p className="text-xs text-base-content/50">Supports: JPG, PNG, WebP, GIF • Max 5MB each</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Image Previews */}
              {form.images.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-base-content/50 mb-2">Uploaded Images ({form.images.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {form.images.map((imgUrl, idx) => (
                      <div key={idx} className="relative group" style={{ width: '80px', height: '80px' }}>
                        <div className={`w-full h-full rounded-lg overflow-hidden border-2 ${idx === 0 ? 'border-primary' : 'border-base-300'}`}>
                          <img src={imgUrl} alt={`${form.name} ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                        {form.images.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() => setMainImage(idx)}
                              className="absolute -top-2 -right-2 btn btn-sm btn-circle btn-primary opacity-0 group-hover:opacity-100 transition-opacity"
                              title={idx === 0 ? 'Main image' : 'Set as main image'}
                            >
                              {idx === 0 ? '★' : '↑'}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute -top-2 -left-2 btn btn-sm btn-circle btn-error opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove image"
                            >
                              ✕
                            </button>
                          </>
                        )}
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 badge badge-xs badge-primary">Main</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Try It On model (optional)</legend>
              <select
                value={form.model_filename}
                onChange={e => setForm({ ...form, model_filename: e.target.value })}
                className="select select-bordered w-full"
              >
                <option value="">No 3D model (Try It On uses a default)</option>
                {MODEL_FILES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
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

            {ONE_SIZE_CATEGORIES.includes(form.category) ? (
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Stock quantity</legend>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.oneSizeStock}
                  onChange={e => setForm({ ...form, oneSizeStock: e.target.value })}
                  className="input input-bordered w-32"
                />
                <p className="text-xs text-base-content/50 mt-2">
                  This is an adjustable, one-size cap, so it just needs a single stock count.
                </p>
              </fieldset>
            ) : (
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Available sizes & stock</legend>
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
            )}

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
        <FilterTabs
          tabs={[
            { value: 'all', label: 'All' },
            ...CATEGORIES.map(c => ({ value: c, label: CATEGORY_LABELS[c] })),
          ]}
          active={category}
          onChange={setCategory}
        />
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
              <div>
                {/* Image Gallery */}
                {(viewingProduct.images && viewingProduct.images.length > 0) || viewingProduct.image ? (
                  <div className="space-y-3">
                    {/* Main Image */}
                    <div className="bg-base-200 rounded-xl overflow-hidden aspect-square relative">
                      <img
                        src={viewingProduct.image}
                        alt={viewingProduct.name}
                        className="w-full h-full object-contain p-4"
                        id="main-product-image"
                      />
                      {(viewingProduct.images && viewingProduct.images.length > 1) && (
                        <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-1">
                          {viewingProduct.images.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => document.getElementById('main-product-image').src = img}
                              className={`w-2 h-2 rounded-full transition-all ${
                                img === viewingProduct.image ? 'bg-primary' : 'bg-base-content/50 hover:bg-base-content/80'
                              }`}
                              aria-label={`View image ${idx + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Thumbnails */}
                    {(viewingProduct.images && viewingProduct.images.length > 1) && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {viewingProduct.images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => document.getElementById('main-product-image').src = img}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              img === viewingProduct.image ? 'border-primary' : 'border-base-300 hover:border-primary/50'
                            }`}
                            aria-label={`Thumbnail ${idx + 1}`}
                          >
                            <img src={img} alt={`${viewingProduct.name} ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-base-200 rounded-xl overflow-hidden aspect-square flex items-center justify-center">
                    <span className="text-base-content/40 text-sm">No image</span>
                  </div>
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
                    Sizes & stock
                  </p>
                  {ONE_SIZE_CATEGORIES.includes(viewingProduct.category) ? (
                    <p className="text-sm text-base-content/70">One size (adjustable)</p>
                  ) : Object.keys(viewingProduct.sizes_stock || {}).length === 0 ? (
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