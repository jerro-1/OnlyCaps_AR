import { useCallback, useEffect, useState, useContext, lazy, Suspense } from 'react';
import { useCart } from '../context/CartContext';
import { SessionContext } from '../context/SessionContext';
import ProductCard from '../components/ProductCard';
import Header from '../components/Header';
import BgImg2 from '../components/BgImg2';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loadFaceTracker, preloadFaceTracker } from '../utils/faceTrackerPreload';
import { useInfiniteScroll } from '../utils/useInfiniteScroll';
import supabase from '../utils/supabase';
import SignInPromptModal from '../components/SignInPromptModal';

const FaceTracker = lazy(loadFaceTracker);

const SIZES = ['6 7/8', '7', '7 1/8', '7 1/4', '7 3/8', '7 1/2'];
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

export default function FittedCaps() {
  const { addToCart } = useCart();
  const session = useContext(SessionContext);
  const [visible, setVisible] = useState(6);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();
  const [showFaceTracker, setShowFaceTracker] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  const [searchParams] = useSearchParams();
  const sizeFilter = searchParams.get('size');

  const filteredProducts = sizeFilter
    ? products.filter(p => (p.sizes_stock?.[sizeFilter] ?? 0) > 0)
    : products;

  const hasMore = visible < filteredProducts.length;
  const loadMore = useCallback(() => setVisible(v => Math.min(v + 3, filteredProducts.length)), [filteredProducts.length]);
  const sentinelRef = useInfiniteScroll(loadMore, hasMore);

  useEffect(() => {
    fetchProducts();
  }, [session]);

  // Reset "visible" count whenever the size filter changes, so you don't
  // land on a filtered view stuck at whatever pagination position you were
  // on before filtering
  useEffect(() => {
    setVisible(6);
  }, [sizeFilter]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      console.error(error);
      setProducts([]);
      return;
    }
    setProducts(data || []);
  };

  const openModal = (product) => {
    setModal(product);
    setSelectedSize(null);
    preloadFaceTracker();
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModal(null);
    document.body.style.overflow = 'auto';
  };

  // Stock behind Buy Now: the selected size once one is picked, otherwise the
  // product's overall stock across all sizes
  const activeStockQty = modal ? (selectedSize ? getSizeStock(modal, selectedSize) : getOverallStock(modal)) : 0;
  const activeStockLevel = stockLevel(activeStockQty);

  const handleAddToCart = () => {
    if (!session) {
      setShowSignInPrompt(true);
      return;
    }

    if (!selectedSize) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    addToCart({
      id: modal.product_id ?? modal.id,
      name: modal.full_name ?? modal.name,
      price: modal.price,
      size: selectedSize,
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
    if (!selectedSize) {
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
          size: selectedSize,
          image: modal.image,
          quantity: 1,
        },
      },
    });
  };

  return (
    <>
      <BgImg2>
        <Header />
        <div className="page-bg-fitted font-body">
          <section className="pt-28 pb-12 mt-16">
            <div className="container mx-auto px-4">
              <h1 className="text-5xl md:text-6xl font-heading mb-6 text-center tracking-wide uppercase text-white">
                FITTED CAPS
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
                    <Link to="/fitted-caps" className="text-[#00BFFF] hover:underline ml-2">
                      Clear
                    </Link>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.slice(0, visible).map(product => (
                  <ProductCard key={product.id} product={product} onClick={openModal} />
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <p className="text-white text-center opacity-70 mt-8">
                  No caps found in this size right now.
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
            </div>
          </section>

          {/* Product Modal */}
          {modal && (
            <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={closeModal}>
              <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative animate-modalSlide" onClick={e => e.stopPropagation()}>
                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10 bg-white rounded-full p-1 shadow-lg border-none cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="grid md:grid-cols-2 gap-8 p-8">
                  <div>
                    <div className="bg-gray-100 rounded-xl overflow-hidden">
                      <img src={modal.image} alt={modal.full_name} className="w-full object-cover" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-heading mb-2 text-gray-900">{modal.name}</h2>
                      <p className="text-gray-600 text-lg">{modal.subtitle}</p>
                      <div className="text-3xl font-bold text-blue-600 mt-4">₱{modal.price}</div>
                    </div>

                    <div className="border-t border-b border-gray-900 py-4">
                      <p className="text-gray-700 leading-relaxed">{modal.description}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-lg font-bold text-gray-900">Select Size:</h3>
                        <span className={`status status-glow status-${activeStockLevel}`} aria-hidden="true"></span>
                        <span className="text-sm font-medium text-gray-600">{stockLabel[activeStockLevel]}</span>
                      </div>
                      <div className={`flex flex-wrap gap-2 ${shake ? 'shake' : ''}`}>
                        {SIZES.map(size => {
                          const stockForSize = getSizeStock(modal, size);
                          const outOfStock = stockForSize <= 0;
                          const level = stockLevel(stockForSize);
                          const isSelected = selectedSize === size;
                          return (
                            <button
                              key={size}
                              disabled={outOfStock}
                              title={stockLabel[level]}
                              className={`size-btn inline-flex items-center gap-1.5 ${isSelected ? 'selected' : ''} ${outOfStock ? 'opacity-30 cursor-not-allowed line-through' : ''}`}
                              onClick={() => !outOfStock && setSelectedSize(size)}
                            >
                              {/* Only the clicked size reveals its stock status, keeping the row quiet until then */}
                              {isSelected && <span className={`status status-glow status-${level}`} aria-hidden="true"></span>}
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        closeModal();
                        setShowFaceTracker(true);
                      }}
                      className="w-full bg-black text-white py-2 rounded-full font-medium hover:bg-gray-800 transition text-lg btn-hover border-none cursor-pointer"
                    >
                      TRY IT ON
                    </button>

                    <button
                      onClick={handleBuyNow}
                      className="w-full bg-[#00BFFF] text-black py-2 rounded-full font-medium hover:bg-[#00a8e0] transition text-lg border-none cursor-pointer"
                    >
                      BUY NOW
                    </button>

                    <button
                      onClick={handleAddToCart}
                      className="w-full bg-black text-white py-2 rounded-full font-medium hover:bg-gray-800 transition text-lg btn-hover border-none cursor-pointer"
                    >
                      ADD TO CART
                    </button>

                    <div className="text-sm text-gray-500 space-y-2">
                      <p>✓ Authentic 59FIFTY Fitted</p>
                      <p>✓ Official MLB Licensed</p>
                      <p>✓ Free Shipping on Orders ₱2000+</p>
                      <p>✓ 30-Day Returns</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showFaceTracker && (
  <div
    className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4"
    onClick={() => setShowFaceTracker(false)}
  >
    <div
      className="bg-black rounded-2xl max-w-4xl w-full h-[90vh] relative overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full h-full">
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="try-on-spinner" /></div>}>
          <FaceTracker onClose={() => setShowFaceTracker(false)} />
        </Suspense>
      </div>
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