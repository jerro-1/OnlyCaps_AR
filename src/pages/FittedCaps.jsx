import { useState, useContext } from 'react';
import { useCart } from '../context/CartContext';
import { SessionContext } from '../context/SessionContext';
import ProductCard from '../components/ProductCard';
import Header from '../components/Header';

const PRODUCTS = [
  { id: 'yankees-navy', name: 'New York Yankees', fullName: 'New York Yankees Navy Classic', subtitle: 'Navy Classic 59FIFTY Fitted', description: 'The iconic New York Yankees fitted cap in navy blue. Features the classic interlocking NY logo embroidered on the front. Made with premium wool blend for lasting comfort and shape.', price: 500, image: '/images/yankees-navy.png' },
  { id: 'dodgers-royal', name: 'Los Angeles Dodgers', fullName: 'Los Angeles Dodgers Royal Blue', subtitle: 'Royal Blue 59FIFTY Fitted', description: 'Show your Dodgers pride with this royal blue fitted cap. Features the iconic LA logo embroidered in white. Official MLB merchandise.', price: 500, image: '/images/dodgers-royal.png' },
  { id: 'redsox-maroon', name: 'Boston Red Sox', fullName: 'Boston Red Sox Maroon Heritage', subtitle: 'Maroon Heritage 59FIFTY Fitted', description: 'Classic Boston Red Sox fitted cap in maroon. Features the iconic hanging socks logo. Premium quality and authentic design.', price: 500, image: '/images/redsox-maroon.png' },
  { id: 'whitesox-black', name: 'Chicago White Sox', fullName: 'Chicago White Sox Blackout', subtitle: 'Blackout 59FIFTY Fitted', description: 'Sleek black-on-black Chicago White Sox fitted cap. Features embroidered logo with subtle contrast stitching.', price: 500, image: '/images/whitesox-black.png' },
  { id: 'braves-midnight', name: 'Atlanta Braves', fullName: 'Atlanta Braves Midnight Blue', subtitle: 'Midnight Blue 59FIFTY Fitted', description: 'Atlanta Braves fitted cap in deep midnight blue. Features the iconic tomahawk logo. Premium construction.', price: 500, image: '/images/braves-midnight.png' },
  { id: 'giants-orange', name: 'San Francisco Giants', fullName: 'San Francisco Giants Orange Rush', subtitle: 'Orange Rush 59FIFTY Fitted', description: 'Bold orange San Francisco Giants fitted cap. Features the iconic "SF" logo. Stand out in the crowd.', price: 500, image: '/images/giants-orange.png' },
  { id: 'astros-space', name: 'Houston Astros', fullName: 'Houston Astros Space City Navy', subtitle: 'Space City Navy 59FIFTY Fitted', description: 'Houston Astros fitted cap in navy blue with "Space City" star logo. Unique design for true fans.', price: 500, image: '/images/astros-space.png' },
  { id: 'bluejays-sky', name: 'Toronto Blue Jays', fullName: 'Toronto Blue Jays Sky Blue', subtitle: 'Sky Blue 59FIFTY Fitted', description: 'Toronto Blue Jays fitted cap in sky blue. Features the iconic bird logo. Fresh and vibrant.', price: 500, image: '/images/bluejays-sky.png' },
  { id: 'tigers-vintage', name: 'Detroit Tigers', fullName: 'Detroit Tigers Vintage Navy', subtitle: 'Vintage Navy 59FIFTY Fitted', description: 'Detroit Tigers fitted cap in vintage navy. Features old-school tiger logo. Retro styling.', price: 500, image: '/images/tigers-vintage.png' },
  { id: 'mets-orange', name: 'New York Mets', fullName: 'New York Mets Bright Orange', subtitle: 'Bright Orange 59FIFTY Fitted', description: 'New York Mets fitted cap in bright orange. Features iconic Mets logo. Bold and stylish.', price: 500, image: '/images/mets-orange.png' },
  { id: 'phillies-red', name: 'Philadelphia Phillies', fullName: 'Philadelphia Phillies Deep Red', subtitle: 'Deep Red 59FIFTY Fitted', description: 'Philadelphia Phillies fitted cap in deep red. Features classic "P" logo. A fan favorite.', price: 500, image: '/images/phillies-red.png' },
  { id: 'mariners-teal', name: 'Seattle Mariners', fullName: 'Seattle Mariners Teal Wave', subtitle: 'Teal Wave 59FIFTY Fitted', description: 'Seattle Mariners fitted cap in teal. Features unique wave logo. Perfect for Mariners fans.', price: 500, image: '/images/mariners-teal.png' },
  { id: 'padres-sand', name: 'San Diego Padres', fullName: 'San Diego Padres Sand Brown', subtitle: 'Sand Brown 59FIFTY Fitted', description: 'San Diego Padres fitted cap in sand brown. Features retro Padres logo. Unique colorway.', price: 500, image: '/images/padres-sand.png' },
  { id: 'brewers-gold', name: 'Milwaukee Brewers', fullName: 'Milwaukee Brewers Gold Edition', subtitle: 'Gold Edition 59FIFTY Fitted', description: 'Milwaukee Brewers fitted cap in gold. Features "MB" logo with barley design. Premium edition.', price: 500, image: '/images/brewers-gold.png' },
  { id: 'royals-ice', name: 'Kansas City Royals', fullName: 'Kansas City Royals Royal Blue Ice', subtitle: 'Royal Blue Ice 59FIFTY Fitted', description: 'Kansas City Royals fitted cap in ice blue. Features classic crown logo. Cool and stylish.', price: 500, image: '/images/royals-ice.png' },
];

const SIZES = ['6 7/8', '7', '7 1/8', '7 1/4', '7 3/8', '7 1/2'];

export default function FittedCaps() {
  const { addToCart } = useCart();
  const session = useContext(SessionContext); // get logged-in session
  const [visible, setVisible] = useState(6);
  const [modal, setModal] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [shake, setShake] = useState(false);

  const loadMore = () => setVisible(v => Math.min(v + 3, PRODUCTS.length));

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
      alert('Please sign in to add items to your cart'); // guest alert
      return;
    }

    if (!selectedSize) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    addToCart({
      id: modal.id,
      name: modal.fullName,
      price: modal.price,
      size: selectedSize,
      image: modal.image,
      quantity: 1,
    });

    closeModal();
  };

  return (
    <>
      <Header />
      <div className="page-bg-fitted font-body">
        <section className="pt-28 pb-12 mt-16">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl md:text-6xl font-heading mb-12 text-center tracking-wide uppercase text-white">
              FITTED CAPS
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PRODUCTS.slice(0, visible).map(product => (
                <ProductCard key={product.id} product={product} onClick={openModal} />
              ))}
            </div>

            <div className="text-center mt-12">
              {visible < PRODUCTS.length ? (
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
                    <img src={modal.image} alt={modal.fullName} className="w-full object-cover" />
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
                    onClick={handleAddToCart}
                    className="w-full bg-black text-white py-4 rounded-full font-medium hover:bg-gray-800 transition text-lg btn-hover border-none cursor-pointer"
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
      </div>
    </>
  );
}