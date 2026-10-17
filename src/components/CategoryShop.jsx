import { useCallback, useEffect, useState, useContext, lazy, Suspense } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { SessionContext } from '../context/SessionContext';
import ProductCard from './ProductCard';
import Header from './Header';
import SignInPromptModal from './SignInPromptModal';
import SizeGuideCard from './SizeGuideCard';
import { loadFaceTracker, preloadFaceTracker } from '../utils/faceTrackerPreload';
import { useInfiniteScroll } from '../utils/useInfiniteScroll';
import { CAP_SIZES } from '../utils/capSizes';
import supabase from '../utils/supabase';

const FaceTracker = lazy(loadFaceTracker);
const AITryOnModal = lazy(() => import('./AITryOnModal'));

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

const DEFAULT_FEATURES = [
  'Authentic licensed cap',
  'Official merchandise',
  'Free shipping on orders ₱2000+',
  '30-day returns',
];

export default function CategoryShop({
  category,
  heading,
  bgImage, // kept for prop compatibility but not used
  emptyText,
  sizeGuideLink = false,
  oneSize = false,
  features = DEFAULT_FEATURES,
}) {
  const { addToCart } = useCart();
  const session = useContext(SessionContext);
  const [visible, setVisible] = useState(12);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();
  const [showFaceTracker, setShowFaceTracker] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showAITryOn, setShowAITryOn] = useState(false);
  const [currentAITryOnProduct, setCurrentAITryOnProduct] = useState(null);
  const [currentModelFile, setCurrentModelFile] = useState(null);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [arProduct, setArProduct] = useState(null);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [descOpen, setDescOpen] = useState(true);

  const [searchParams] = useSearchParams();
  const sizeFilter = sizeGuideLink ? searchParams.get('size') : null;

  const filteredProducts = sizeFilter
    ? products.filter(p => (p.sizes_stock?.[sizeFilter] ?? 0) > 0)
    : products;

  const hasMore = visible < filteredProducts.length;
  const loadMore = useCallback(
    () => setVisible(v => Math.min(v + 6, filteredProducts.length)),
    [filteredProducts.length],
  );
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
    return () => {
      cancelled = true;
    };
  }, [category, session]);

  useEffect(() => {
    setVisible(12);
  }, [sizeFilter]);

  const openModal = product => {
    setModal(product);
    setSelectedSize(null);
    setDescOpen(true);
    preloadFaceTracker();
    // document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModal(null);
    // document.body.style.overflow = 'auto';
  };

  const activeStockQty = modal
    ? !oneSize && selectedSize
      ? getSizeStock(modal, selectedSize)
      : getOverallStock(modal)
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

  const formatPrice = price => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="section bg-base-100">
          <div className="container">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-base-content tracking-tight">
                  {heading}
                </h1>
                {sizeFilter && (
                  <p className="text-base-content/60 mt-1">
                    Filtering by size: <strong>{sizeFilter}</strong>
                  </p>
                )}
              </div>
              {sizeFilter && (
                <Link
                  to={`/${category === 'fitted' ? 'fitted-caps' : category}`}
                  className="btn btn-ghost text-sm"
                >
                  <svg
                    className="h-4 w-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                    />
                  </svg>
                  Clear Filter
                </Link>
              )}
            </div>

            {loading ? (
              <div className="product-grid">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="card overflow-hidden">
                    <div className="aspect-square loading-skeleton" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 w-3/4 loading-skeleton" />
                      <div className="h-4 w-1/2 loading-skeleton" />
                      <div className="h-5 w-24 loading-skeleton" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="product-grid">
                  {filteredProducts.slice(0, visible).map(product => (
                    <ProductCard key={product.id} product={product} onClick={openModal} />
                  ))}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-base-content/60">
                      {sizeFilter ? 'No caps found in this size right now.' : emptyText}
                    </p>
                  </div>
                )}

                <div ref={sentinelRef} className="text-center mt-8 h-4">
                  {hasMore ? (
                    <div className="loading-skeleton h-8 w-24 mx-auto" />
                  ) : filteredProducts.length > 0 ? (
                    <p className="text-base-content/50 text-sm">All products loaded</p>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Product Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col relative animate-modalSlide"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-base-content/50 hover:text-base-content z-10 bg-white rounded-full p-2 shadow-lg border-none cursor-pointer transition-colors"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col md:flex-row h-full overflow-hidden">
              {/* Left: Image - Fixed on desktop, scrollable on mobile */}
              <div className="relative md:flex-none w-full md:w-1/2 bg-base-100 md:rounded-l-xl rounded-t-xl md:rounded-t-none">
                <div className="aspect-square md:h-full w-full overflow-hidden">
                  <img
                    src={modal.image}
                    alt={modal.full_name ?? modal.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Right: Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                <div>
                  {modal.subtitle && (
                    <p className="text-sm text-base-content/60 mb-1">{modal.subtitle}</p>
                  )}
                  <h2 className="text-2xl md:text-3xl font-bold text-base-content leading-tight">
                    {modal.name}
                  </h2>
                  <p className="text-2xl font-bold text-base-content mt-2">
                    {formatPrice(modal.price)}
                  </p>
                </div>

                <div className="divider" />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-base-content">Size</span>
                    <button
                      type="button"
                      onClick={() => setShowSizeGuide(true)}
                      className="text-sm text-accent underline hover:text-accent/80 bg-transparent border-none cursor-pointer p-0"
                    >
                      Sizing Chart
                    </button>
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
                        const stockForSize = getSizeStock(modal, size);
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

                <button
                  onClick={handleAddToCart}
                  className="w-full btn btn-primary py-3 text-base font-medium"
                  disabled={!chosenSize || (oneSize && activeStockQty <= 0)}
                >
                  Add to Cart
                </button>

                <button
                  onClick={handleBuyNow}
                  className="w-full btn btn-secondary py-3 text-base font-medium"
                  disabled={!chosenSize || (oneSize && activeStockQty <= 0)}
                >
                  Buy Now
                </button>

                <button
                  onClick={() => {
                    setCurrentProduct(modal);
                    setArProduct(modal);
                    setCurrentModelFile(modal.model_filename);
                    closeModal();
                    setShowFaceTracker(true);
                  }}
                  className="w-full btn btn-outline flex items-center justify-between"
                >
                  <span className="font-medium text-sm">Try It On (AR)</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => {
                    setCurrentAITryOnProduct(modal);
                    closeModal();
                    setShowAITryOn(true);
                  }}
                  className="w-full btn btn-outline flex items-center justify-between"
                >
                  <span className="font-medium text-sm">AI Photo Try-On</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="w-full btn btn-outline flex items-center justify-between"
                >
                  <span className="font-medium text-sm">Size Guide</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="divider pt-4" />
                <button
                  onClick={() => setDescOpen(o => !o)}
                  className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer p-0"
                >
                  <span className="font-semibold text-base-content">Description</span>
                  <svg
                    className={`w-5 h-5 text-base-content/50 transition-transform ${descOpen ? '' : 'rotate-180'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 15l-6-6-6 6" />
                  </svg>
                </button>
                {descOpen && modal.description && (
                  <p className="text-sm text-base-content/70 leading-relaxed mt-3">
                    {modal.description}
                  </p>
                )}

                <div className="text-sm text-base-content/60 space-y-2 pt-4 border-t border-base-300">
                  {features.map(f => (
                    <p key={f} className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 text-success flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Face Tracker Modal */}
      {showFaceTracker && (
        <div
          className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4"
          onClick={() => setShowFaceTracker(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full h-[90vh] relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full h-full flex items-center justify-center">
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="loading-skeleton h-8 w-8 rounded-full" />
                  </div>
                }
              >
                <FaceTracker
                  modelFile={currentModelFile}
                  product={currentProduct}
                  onBack={() => {
                    setShowFaceTracker(false);
                    setModal(currentProduct);
                  }}
                  onClose={() => setShowFaceTracker(false)}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div
          className="fixed inset-0 bg-black/50 z-70 flex items-center justify-center p-4"
          onClick={() => setShowSizeGuide(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative p-6"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSizeGuide(false)}
              aria-label="Close size guide"
              className="absolute top-4 right-4 text-base-content/50 hover:text-base-content bg-base-200 hover:bg-base-300 rounded-full p-2 border-none cursor-pointer z-10 transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <SizeGuideCard onSaved={() => setShowSizeGuide(false)} />
          </div>
        </div>
      )}

      {/* AI Try-On Modal */}
      {showAITryOn && currentAITryOnProduct && (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-black/50 z-70 flex items-center justify-center p-4">
              <div className="loading-skeleton h-8 w-8 rounded-full" />
            </div>
          }
        >
          <AITryOnModal product={currentAITryOnProduct} onClose={() => setShowAITryOn(false)} />
        </Suspense>
      )}

      {showSignInPrompt && <SignInPromptModal onClose={() => setShowSignInPrompt(false)} />}
    </>
  );
}
