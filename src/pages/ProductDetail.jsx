import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { SessionContext } from '../context/SessionContext';
import { useContext } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import supabase from '../utils/supabase';
import { CAP_SIZES } from '../utils/capSizes';
import { BsArrowLeft, BsCheckCircle } from 'react-icons/bs';

const SIZES = CAP_SIZES;
const LOW_STOCK = 5;

const getSizeStock = (product, size) => {
  const hasSizeData = Object.keys(product.sizes_stock || {}).length > 0;
  return hasSizeData ? (product.sizes_stock[size] ?? 0) : (product.stock_quantity ?? 0);
};

const getOverallStock = product => {
  const hasSizeData = Object.keys(product.sizes_stock || {}).length > 0;
  return hasSizeData
    ? Object.values(product.sizes_stock).reduce((sum, n) => sum + (n || 0), 0)
    : (product.stock_quantity ?? 0);
};

const stockLevel = qty => (qty <= 0 ? 'error' : qty <= LOW_STOCK ? 'warning' : 'success');
const stockLabel = { success: 'In stock', warning: 'Low stock', error: 'Out of stock' };

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(price);
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const session = useContext(SessionContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [shake, setShake] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [images, setImages] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Try by product_id first (text ID like 'mets-orange'), then by numeric id
        let { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('product_id', id)
          .eq('active', true)
          .maybeSingle();

        if (error || !data) {
          // Try numeric id
          const numericId = parseInt(id, 10);
          if (!isNaN(numericId)) {
            const { data: data2, error: error2 } = await supabase
              .from('products')
              .select('*')
              .eq('id', numericId)
              .eq('active', true)
              .maybeSingle();
            if (!error2 && data2) {
              data = data2;
              error = null;
            }
          }
        }

        if (!error && data) {
          setProduct(data);
          // Build images array
          const allImages = data.images && data.images.length > 0 
            ? data.images 
            : (data.image ? [data.image] : []);
          setImages(allImages);
          setMainImageIndex(0);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const oneSize = product && ['aframe', 'trucker'].includes(product.category);
  const activeStockQty = product
    ? !oneSize && selectedSize
      ? getSizeStock(product, selectedSize)
      : getOverallStock(product)
    : 0;
  const activeStockLevel = stockLevel(activeStockQty);
  const chosenSize = oneSize ? 'One Size' : selectedSize;

  const handleAddToCart = () => {
    if (!session) {
      setShowSignInPrompt(true);
      return;
    }

    if (!chosenSize || (oneSize && activeStockQty <= 0)) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    addToCart({
      id: product.product_id ?? product.id,
      name: product.full_name ?? product.name,
      price: product.price,
      size: chosenSize,
      image: images[mainImageIndex] || product.image,
      quantity: 1,
    });
  };

  const handleBuyNow = () => {
    if (!session) {
      setShowSignInPrompt(true);
      return;
    }
    if (!chosenSize || (oneSize && activeStockQty <= 0)) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    navigate('/checkout', {
      state: {
        buyNowItem: {
          id: product.product_id ?? product.id,
          name: product.full_name ?? product.name,
          price: product.price,
          size: chosenSize,
          image: images[mainImageIndex] || product.image,
          quantity: 1,
        },
      },
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 section">
          <div className="container">
            <div className="product-grid">
              <div className="card overflow-hidden">
                <div className="aspect-square loading-skeleton" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 loading-skeleton" />
                  <div className="h-4 w-1/2 loading-skeleton" />
                  <div className="h-5 w-24 loading-skeleton" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="flex-1 section">
          <div className="container text-center py-12">
            <p className="text-base-content/60">Product not found</p>
            <Link to="/fitted-caps" className="mt-4 btn btn-primary inline-block">
              Continue Shopping
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const allImages = images.length > 0 ? images : (product.image ? [product.image] : []);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="section">
          <div className="container">
            {/* Breadcrumb */}
            <nav className="mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm text-base-content/50">
                <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
                <li className="text-base-300">/</li>
                <li>
                  <Link to={`/${product.category === 'fitted' ? 'fitted-caps' : product.category}`} className="hover:text-primary transition-colors">
                    {product.category === 'fitted' ? 'Fitted Caps' : product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                  </Link>
                </li>
                <li className="text-base-300">/</li>
                <li className="text-base-content font-medium">{product.name}</li>
              </ol>
            </nav>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              {/* Image Gallery */}
              <div>
                {/* Main Image */}
                <div className="aspect-square bg-base-100 rounded-xl overflow-hidden mb-4">
                  {allImages[mainImageIndex] ? (
                    <img
                      src={allImages[mainImageIndex]}
                      alt={product.full_name ?? product.name}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-base-300">
                      <svg className="h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setMainImageIndex(idx)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === mainImageIndex ? 'border-primary' : 'border-base-300 hover:border-primary/50'
                        }`}
                        aria-label={`View image ${idx + 1}`}
                      >
                        <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                {product.category && (
                  <span className="inline-block badge badge-info text-xs">
                    {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                  </span>
                )}

                <h1 className="text-3xl md:text-4xl font-bold text-base-content leading-tight">
                  {product.full_name ?? product.name}
                </h1>

                {product.subtitle && (
                  <p className="text-lg text-base-content/60">{product.subtitle}</p>
                )}

                <p className="text-3xl font-bold text-base-content">
                  {formatPrice(product.price)}
                </p>

                <div className="divider" />

                {/* Size Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-base-content">Size</span>
                    <Link
                      to="/sizing"
                      className="text-sm text-accent underline hover:text-accent/80"
                    >
                      Sizing Chart
                    </Link>
                  </div>

                  {oneSize ? (
                    <div className={`inline-block ${shake ? 'animate-shake' : ''}`}>
                      <button
                        disabled={activeStockQty <= 0}
                        className={`border-2 rounded-lg px-5 py-2.5 font-bold text-sm transition-colors ${
                          activeStockQty <= 0
                            ? 'border-base-300 text-base-content/30 bg-base-200 opacity-50 cursor-not-allowed line-through'
                            : 'border-primary bg-primary text-primary-content'
                        }`}
                      >
                        One Size
                      </button>
                    </div>
                  ) : (
                    <div className={`flex flex-wrap gap-2 ${shake ? 'animate-shake' : ''}`}>
                      {SIZES.map(size => {
                        const stockForSize = getSizeStock(product, size);
                        const outOfStock = stockForSize <= 0;
                        const isSelected = selectedSize === size;
                        return (
                          <button
                            key={size}
                            disabled={outOfStock}
                            title={stockLabel[stockLevel(stockForSize)]}
                            className={`border-2 rounded-lg px-4 py-2.5 font-bold text-sm transition-colors ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-content'
                                : 'border-base-300 text-base-content hover:border-primary'
                            } ${outOfStock ? 'opacity-30 cursor-not-allowed line-through' : 'cursor-pointer'}`}
                            onClick={() => !outOfStock && setSelectedSize(size)}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <span className={`badge badge-${activeStockLevel}`} aria-hidden="true"></span>
                    <span className="text-sm font-medium text-base-content/70">
                      {stockLabel[activeStockLevel]}
                    </span>
                  </div>
                </div>

                <div className="divider" />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleAddToCart}
                    className="w-full btn btn-primary py-3 text-base font-medium"
                    disabled={!chosenSize || (oneSize && activeStockQty <= 0)}
                  >
                    <BsCheckCircle className="h-5 w-5 mr-2" />
                    Add to Cart
                  </button>

                  <button
                    onClick={handleBuyNow}
                    className="w-full btn btn-secondary py-3 text-base font-medium"
                    disabled={!chosenSize || (oneSize && activeStockQty <= 0)}
                  >
                    Buy Now
                  </button>
                </div>

                {/* Features */}
                <div className="text-sm text-base-content/60 space-y-2 pt-4 border-t border-base-300">
                  {['Authentic licensed cap', 'Official merchandise', 'Free shipping on orders ₱2000+', '30-day returns'].map(f => (
                    <p key={f} className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-base-content mb-4">Description</h2>
                <div className="prose text-base-content/70 max-w-none">
                  <p className="leading-relaxed">{product.description}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />

      {showSignInPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] px-4" onClick={() => setShowSignInPrompt(false)}>
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] max-w-sm w-full p-8 text-center relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowSignInPrompt(false)} className="absolute top-4 right-4 text-base-content/50 hover:text-base-content bg-base-200 hover:bg-base-300 rounded-full p-2 border-none cursor-pointer transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-base-content mb-2">Sign in to continue</h2>
            <p className="text-sm text-base-content/60 mb-7">Create an account or sign in to add this to your cart and start shopping.</p>
            <div className="flex flex-col gap-3">
              <Link to="/login" onClick={() => setShowSignInPrompt(false)} className="w-full btn btn-primary py-3 text-sm font-medium">Sign In</Link>
              <Link to="/register-email" onClick={() => setShowSignInPrompt(false)} className="w-full btn btn-outline py-3 text-sm font-medium">Create an Account</Link>
            </div>
            <button onClick={() => setShowSignInPrompt(false)} className="mt-5 text-sm text-base-content/50 hover:text-base-content bg-transparent border-none cursor-pointer underline">Maybe Later</button>
          </div>
        </div>
      )}
    </>
  );
}