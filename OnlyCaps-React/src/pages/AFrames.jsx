import { useState } from 'react';
import { useCart } from '../context/CartContext';

const PRODUCTS = [
  { id: 'aframe-classic', name: 'Classic A-Frame', description: 'Traditional structured design', price: 550, image: '/images/aframe-classic.png' },
  { id: 'aframe-modern', name: 'Modern A-Frame', description: 'Contemporary slim profile', price: 580, image: '/images/aframe-modern.png' },
  { id: 'aframe-vintage', name: 'Vintage A-Frame', description: 'Retro distressed finish', price: 560, image: '/images/aframe-vintage.png' },
  { id: 'aframe-leather', name: 'Premium Leather A-Frame', description: 'Genuine leather details', price: 620, image: '/images/aframe-leather.png' },
  { id: 'aframe-sports', name: 'Sports A-Frame', description: 'Athletic team styling', price: 570, image: '/images/aframe-sports.png' },
  { id: 'aframe-limited', name: 'Limited Edition A-Frame', description: 'Exclusive numbered release', price: 650, image: '/images/aframe-limited.png' },
  { id: 'aframe-street', name: 'Streetwear A-Frame', description: 'Urban street style', price: 590, image: '/images/aframe-street.png' },
  { id: 'aframe-designer', name: 'Designer A-Frame', description: 'High-fashion collaboration', price: 680, image: '/images/aframe-designer.png' },
  { id: 'aframe-custom', name: 'Custom A-Frame', description: 'Personalized embroidery', price: 720, image: '/images/aframe-custom.png' },
];

export default function AFrames() {
  const { addToCart, showNotification } = useCart();
  const [visible, setVisible] = useState(9);

  const handleAddToCart = (product) => {
    addToCart({ ...product, size: 'One Size', quantity: 1 });
  };

  return (
    <div className="page-bg-aframes font-body">
      <section className="pt-28 pb-12 mt-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-heading mb-12 text-center tracking-wide uppercase text-white">
            A-FRAMES
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCTS.slice(0, visible).map(product => (
              <div key={product.id} className="product-card bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200">
                <div className="relative overflow-hidden">
                  <img src={product.image} alt={product.name} className="w-full h-72 object-cover transition duration-300 hover:scale-105" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">₱{product.price}</span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="btn-hover bg-black text-white px-6 py-3 rounded-full text-sm hover:bg-gray-800 transition border-none cursor-pointer"
                    >
                      ADD TO CART
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            {visible < PRODUCTS.length ? (
              <button
                onClick={() => setVisible(v => Math.min(v + 3, PRODUCTS.length))}
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
    </div>
  );
}
