import { useCallback, useEffect, useState, useContext, lazy, Suspense } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { SessionContext } from '../context/SessionContext';
import ProductCard from './ProductCard';
import Header from './Header';
import BgImg2 from './BgImg2';
import SignInPromptModal from './SignInPromptModal';
import SizeGuideCard from './SizeGuideCard';
import { loadFaceTracker, preloadFaceTracker } from '../utils/faceTrackerPreload';
import { useInfiniteScroll } from '../utils/useInfiniteScroll';
import { CAP_SIZES } from '../utils/capSizes';
import supabase from '../utils/supabase';

const FaceTracker = lazy(loadFaceTracker);

const SIZES = CAP_SIZES;
const LOW_STOCK = 5;

// Rows without per-size stock fall back to the overall stock count
const getSizeStock = (product, size) => {
  const hasSizeData = Object.keys(product.sizes_stock || {}).length > 0;
  return hasSizeData ? (product.sizes_stock[size] ?? 0) : (product.stock_quantity ?? 0);
};

const getOverallStock = (product) => {
  const hasSizeData = Object.keys(product.sizes_stock || {}).length > 0;
  return hasSizeData
    ? Object.values(product.sizes_stock).reduce((sum, n) => sum + (n || 0), 0)
    : (product.stock_quantity ?? 0);
};

const stockLevel = (qty) => (qty <= 0 ? 'error' : qty <= LOW_STOCK ? 'warning' : 'success');
const stockLabel = { success: 'In stock', warning: 'Low stock', error: 'Out of stock' };

// The one shared shopping page (grid + quick-view modal) behind Fitted Caps,
// A-Frames, Trucker and More Stuff -- so the four category pages look and
// behave identically and only need to change in one place going forward.
const DEFAULT_FEATURES = ['Authentic licensed cap', 'Official merchandise', 'Free shipping on orders ₱2000+', '30-day returns'];

export default function CategoryShop({ category, heading, bgImage, emptyText, sizeGuideLink = false, oneSize = false, features = DEFAULT_FEATURES }) {
  const { addToCart } = useCart();
  const session = useContext(SessionContext);
  const [visible, setVisible] = useState(6);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();
  const [showFaceTracker, setShowFaceTracker] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [currentModelFile, setCurrentModelFile] = useState(null);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [descOpen, setDescOpen] = useState(true);

  const [searchParams] = useSearchParams();
  const sizeFilter = sizeGuideLink ? searchParams.get('size') : null;

  const filteredProducts = sizeFilter
    ? products.filter(p => (p.sizes_stock?.[sizeFilter] ?? 0) > 0)
    : products;

  const hasMore = visible < filteredProducts.length;
  const loadMore = useCallback(() => setVisible(v => Math.min(v + 3, filteredProducts.length)), [filteredProducts.length]);
  const sentinelRef = useInfiniteScroll(loadMore, hasMore);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('active', true)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error(error);
        setProducts(data || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [category, session]);

  // Reset "visible" count whenever the size filter changes, so you don't
  // land on a filtered view stuck at whatever pagination position you were on
  useEffect(() => {
    setVisible(6);
  }, [sizeFilter]);

  const openModal = (product) => {
    setModal(product);
    setSelectedSize(null);
    setDescOpen(true);
    preloadFaceTracker();
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModal(null);
    document.body.style.overflow = 'auto';
  };

  // Stock behind Buy Now: the selected size once one is picked, otherwise the
  // product's overall stock across all sizes. One-size products have no size
  // to pick, so they always show their overall stock.
  const activeStockQty = modal ? (!oneSize && selectedSize ? getSizeStock(modal, selectedSize) : getOverallStock(modal)) : 0;
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
      id: modal.product_id ?? modal.id,
      name: modal.full_name ?? modal.name,
      price: modal.price,
      size: chosenSize,
      image: modal.image,
      quantity: 1,
    });

    closeModal();
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
          id: modal.product_id ?? modal.id,
          name: modal.full_name ?? modal.name,
          price: modal.price,
          size: chosenSize,
          image: modal.image,
          quantity: 1,
        },
      },
    });
  };

  return (
    <>
      <BgImg2 image={bgImage}>
        <Header />
        <div className="font-body">
          <section className="pt-28 pb-12 mt-16">
            <div className="container mx-auto px-4">
              <h1 className="text-5xl md:text-6xl font-heading mb-6 text-center tracking-wide uppercase text-white">
                {heading}
              </h1>

              {sizeFilter && (
                <div className="flex justify-center items-center gap-3 mb-8 flex-wrap">
                  <Link
                    to="/sizing"
                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-full transition-colors"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Back to size guide
                  </Link>
                  <div className="flex items-center gap-2 bg-white/10 text-white text-sm px-4 py-2 rounded-full">
                    <span>Filtering by size: <strong>{sizeFilter}</strong></span>
                    <Link to={`/${category === 'fitted' ? 'fitted-caps' : category}`} className="text-[#00BFFF] hover:underline ml-2">
                      Clear
                    </Link>
                  </div>
                </div>
              )}

              {loading ? (
                <p className="text-white text-center opacity-70">Loading...</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.slice(0, visible).map(product => (
                      <ProductCard key={product.id} product={product} onClick={openModal} />
                    ))}
                  </div>

                  {filteredProducts.length === 0 && (
                    <p className="text-white text-center opacity-70 mt-8">
                      {sizeFilter ? 'No caps found in this size right now.' : emptyText}
                    </p>
                  )}

                  {/* Scrolling near here loads the next batch automatically -- see useInfiniteScroll */}
                  <div ref={sentinelRef} className="text-center mt-12 h-4">
                    {hasMore ? (
                      <div className="try-on-spinner mx-auto" />
                    ) : filteredProducts.length > 0 ? (
                      <p className="text-white text-sm opacity-70">All products loaded</p>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Product Modal */}
          {modal && (
            <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4" onClick={closeModal}>
              <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative animate-modalSlide" onClick={e => e.stopPropagation()}>
                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10 bg-white rounded-full p-1 shadow-lg border-none cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="grid md:grid-cols-2 gap-8 p-8">
                  <div>
                    <div className="bg-gray-100 rounded-xl overflow-hidden">
                      <img src={modal.image} alt={modal.full_name ?? modal.name} className="w-full object-cover" />
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      {modal.subtitle && <p className="text-sm text-gray-500 mb-1">{modal.subtitle}</p>}
                      <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{modal.name}</h2>
                      <p className="text-xl font-bold text-gray-900 mt-2">₱{modal.price}</p>
                    </div>

                    <div className="border-t border-gray-200" />

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-gray-900">Size</span>
                        <button
                          type="button"
                          onClick={() => setShowSizeGuide(true)}
                          className="text-sm text-gray-500 underline hover:text-gray-700 bg-transparent border-none cursor-pointer p-0"
                        >
                          Sizing Chart
                        </button>
                      </div>

                      {oneSize ? (
                        <div className={shake ? 'shake' : ''}>
                          <div className="inline-block border-2 border-gray-900 rounded-lg px-5 py-2.5 font-bold text-sm text-gray-900">
                            One Size
                          </div>
                        </div>
                      ) : (
                        <div className={`flex flex-wrap gap-2 ${shake ? 'shake' : ''}`}>
                          {SIZES.map(size => {
                            const stockForSize = getSizeStock(modal, size);
                            const outOfStock = stockForSize <= 0;
                            const isSelected = selectedSize === size;
                            return (
                              <button
                                key={size}
                                disabled={outOfStock}
                                title={stockLabel[stockLevel(stockForSize)]}
                                className={`border-2 rounded-lg px-4 py-2.5 font-bold text-sm transition-colors ${
                                  isSelected ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-900 hover:border-gray-900'
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
                        <span className={`status status-glow status-${activeStockLevel}`} aria-hidden="true"></span>
                        <span className="text-xs font-medium text-gray-500">{stockLabel[activeStockLevel]}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      className="w-full bg-[#00BFFF] text-black py-4 rounded-full font-bold text-base hover:bg-[#00a8e0] transition-colors border-none cursor-pointer"
                    >
                      ADD TO CART
                    </button>

                    <button
                      onClick={handleBuyNow}
                      className="w-full bg-gray-900 text-white py-4 rounded-full font-bold text-base hover:bg-black transition-colors border-none cursor-pointer"
                    >
                      BUY NOW
                    </button>

                    <button
                      onClick={() => {
                        setCurrentModelFile(modal.model_filename);
                        closeModal();
                        setShowFaceTracker(true);
                      }}
                      className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 rounded-xl px-5 py-4 transition-colors border-none cursor-pointer text-left"
                    >
                      <span className="font-bold text-gray-900 text-sm">Try It On</span>
                      <span className="text-gray-500 text-sm flex items-center gap-1">
                        See it live
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </span>
                    </button>

                    <button
                      onClick={() => setShowSizeGuide(true)}
                      className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 rounded-xl px-5 py-4 transition-colors border-none cursor-pointer text-left"
                    >
                      <span className="font-bold text-gray-900 text-sm">Size Guide</span>
                      <span className="text-gray-500 text-sm flex items-center gap-1">
                        Find your fit
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </span>
                    </button>

                    <div className="border-t border-gray-200 pt-4">
                      <button
                        onClick={() => setDescOpen(o => !o)}
                        className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer p-0"
                      >
                        <span className="font-bold text-gray-900">Description</span>
                        <svg
                          className={`w-5 h-5 text-gray-500 transition-transform ${descOpen ? '' : 'rotate-180'}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 15l-6-6-6 6" />
                        </svg>
                      </button>
                      {descOpen && modal.description && (
                        <p className="text-sm text-gray-600 leading-relaxed mt-3">{modal.description}</p>
                      )}
                    </div>

                    <div className="text-sm text-gray-500 space-y-2">
                      {features.map(f => <p key={f}>✓ {f}</p>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showFaceTracker && (
            <div
              className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4"
              onClick={() => setShowFaceTracker(false)}
            >
              <div
                className="bg-black rounded-2xl max-w-4xl w-full h-[90vh] relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full h-full">
                  <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="try-on-spinner" /></div>}>
                    <FaceTracker modelFile={currentModelFile} onClose={() => setShowFaceTracker(false)} />
                  </Suspense>
                </div>
              </div>
            </div>
          )}

          {showSizeGuide && (
            <div
              className="fixed inset-0 bg-black/70 z-70 flex items-center justify-center p-4"
              onClick={() => setShowSizeGuide(false)}
            >
              <div
                className="bg-[#0B0B0C] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative p-6 sm:p-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowSizeGuide(false)}
                  aria-label="Close size guide"
                  className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 border-none cursor-pointer z-10"
                >
                  ✕
                </button>
                <SizeGuideCard onSaved={() => setShowSizeGuide(false)} />
              </div>
            </div>
          )}

          {showSignInPrompt && (
            <SignInPromptModal onClose={() => setShowSignInPrompt(false)} />
          )}
        </div>
      </BgImg2>
    </>
  );
}
