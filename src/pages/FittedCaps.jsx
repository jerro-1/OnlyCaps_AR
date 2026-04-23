import { useEffect, useState, useContext } from 'react';
import { useCart } from '../context/CartContext';
import { SessionContext } from '../context/SessionContext';
import ProductCard from '../components/ProductCard';
import Header from '../components/Header';
import BgImg2 from '../components/BgImg2';
import { Link, useNavigate } from 'react-router-dom';
import FaceTracker from '../pages/FaceTracker';
import supabase from '../utils/supabase';







const SIZES = ['6 7/8', '7', '7 1/8', '7 1/4', '7 3/8', '7 1/2'];

export default function FittedCaps() {
  const { addToCart } = useCart();
  const session = useContext(SessionContext); // get logged-in session
  const [visible, setVisible] = useState(6);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();
  const [showFaceTracker, setShowFaceTracker] = useState(false);

  const loadMore = () => setVisible(v => Math.min(v + 3, products.length));


  useEffect(() => {
    if (!session) {
      fetchProducts();
    } else if (session) {
      fetchProducts();
    }
  }, [session]);

  const fetchProducts = async () => {

    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      console.error(error);
    }
    setProducts(data);
  };




  console.log("products from fitted caps", products);

  const openModal = (product) => {
    setModal(product);
    setSelectedSize(null);
    document.body.style.overflow = 'hidden';
    console.log("Selected size:", modal.name);
  };

  const closeModal = () => {
    setModal(null);
    document.body.style.overflow = 'auto';
  };

  const handleAddToCart = () => {
    if (!session) {
      alert('Please sign in to add items to your cart'); // guest alert
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

  return (
    <>
      <BgImg2>
        <Header />
        <div className="page-bg-fitted font-body">
          <section className="pt-28 pb-12 mt-16">
            <div className="container mx-auto px-4">
              <h1 className="text-5xl md:text-6xl font-heading mb-12 text-center tracking-wide uppercase text-white">
                FITTED CAPS
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.slice(0, visible).map(product => (
                  <ProductCard key={product.id} product={product} onClick={openModal} />
                ))}
              </div>

              <div className="text-center mt-12">
                {visible < products.length ? (
                  <button
                    onClick={loadMore}
                    className="btn-hover bg-gray-800 text-white px-10 py-3 rounded-full font-medium hover:bg-black transition text-sm border-none cursor-pointer"
                  >
                    LOAD MORE
                  </button>
                ) : (
                  <p className="text-white text-sm opacity-70">All products loaded</p>
                )}
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
                  {/* Image */}
                  <div>
                    <div className="bg-gray-100 rounded-xl overflow-hidden">
                      <img src={modal.image} alt={modal.full_name} className="w-full object-cover" />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-heading mb-2">{modal.name}</h2>
                      <p className="text-gray-600 text-lg">{modal.subtitle}</p>
                      <div className="text-3xl font-bold text-blue-600 mt-4">₱{modal.price}</div>
                    </div>

                    <div className="border-t border-b border-gray-200 py-4">
                      <p className="text-gray-700 leading-relaxed">{modal.description}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold mb-3">Select Size:</h3>
                      <div className={`flex flex-wrap gap-2 ${shake ? 'shake' : ''}`}>
                        {['6 7/8', '7', '7 1/8', '7 1/4', '7 3/8', '7 1/2'].map(size => (
                          <button
                            key={size}
                            className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                            onClick={() => setSelectedSize(size)}
                          >
                            {size}
                          </button>
                        ))}
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
                {/* Close button */}
                <button
                  onClick={() => setShowFaceTracker(false)}
                  className="absolute top-4 right-4 text-white z-10 bg-black/50 rounded-full p-2"
                >
                  ✕
                </button>


                <div className="w-full h-full">
                  <FaceTracker />
                </div>
              </div>
            </div>
          )}

        </div>

      </BgImg2>
    </>
  );
}