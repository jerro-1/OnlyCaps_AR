import { useEffect, useState, useContext } from 'react';
import { useCart } from '../context/CartContext';
import { SessionContext } from '../context/SessionContext';
import ProductCard from '../components/ProductCard';
import Header from '../components/Header';
import BgImg2 from '../components/BgImg2';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import FaceTracker from '../pages/FaceTracker';
import supabase from '../utils/supabase';
import SignInPromptModal from '../components/SignInPromptModal';

const SIZES = ['6 7/8', '7', '7 1/8', '7 1/4', '7 3/8', '7 1/2'];

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
    ? products.filter(p => p.size === sizeFilter)
    : products;

  const loadMore = () => setVisible(v => Math.min(v + 3, filteredProducts.length));

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
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModal(null);
    document.body.style.overflow = 'auto';
  };

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
      id: modal.product_id,
      name: modal.full_name,
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
          id: modal.product_id,
          name: modal.full_name,
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
                <div className="flex justify-center mb-8">
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

              <div className="text-center mt-12">
                {visible < filteredProducts.length ? (
                  <button
                    onClick={loadMore}
                    className="btn-hover bg-gray-800 text-white px-10 py-3 rounded-full font-medium hover:bg-black transition text-sm border-none cursor-pointer"
                  >
                    LOAD MORE
                  </button>
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
                      <h3 className="text-lg font-bold mb-3 text-gray-900 ">Select Size:</h3>
                      <div className={`flex flex-wrap gap-2 ${shake ? 'shake' : ''}`}>
                        {SIZES.map(size => {
                          const stockForSize = modal.sizes_stock?.[size] ?? 0;
                          const outOfStock = stockForSize <= 0;
                          return (
                            <button
                              key={size}
                              disabled={outOfStock}
                              className={`size-btn ${selectedSize === size ? 'selected' : ''} ${outOfStock ? 'opacity-30 cursor-not-allowed line-through' : ''}`}
                              onClick={() => !outOfStock && setSelectedSize(size)}
                            >
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
        <FaceTracker onClose={() => setShowFaceTracker(false)} />
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