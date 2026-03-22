import { useState } from 'react';
import { useCart } from '../context/CartContext';

const PRODUCTS = [
  { id: 'trucker-classic', name: 'Classic Mesh Trucker', description: 'Traditional mesh back with foam front', price: 450, image: '/images/trucker-classic.png' },
  { id: 'trucker-vintage', name: 'Vintage Washed Trucker', description: 'Distressed vintage finish', price: 480, image: '/images/trucker-vintage.png' },
  { id: 'trucker-camo', name: 'Camo Print Trucker', description: 'Military camouflage pattern', price: 460, image: '/images/trucker-camo.png' },
  { id: 'trucker-neon', name: 'Neon Color Trucker', description: 'Bright neon color accents', price: 470, image: '/images/trucker-neon.png' },
  { id: 'trucker-logo', name: 'Logo Embroidery Trucker', description: 'Detailed embroidered logo', price: 490, image: '/images/trucker-logo.png' },
  { id: 'trucker-sports', name: 'Sports Team Trucker', description: 'Team colors and logos', price: 475, image: '/images/trucker-sports.png' },
  { id: 'trucker-retro', name: 'Retro Graphic Trucker', description: '80s and 90s inspired graphics', price: 465, image: '/images/trucker-retro.png' },
  { id: 'trucker-denim', name: 'Premium Denim Trucker', description: 'High-quality denim material', price: 495, image: '/images/trucker-denim.png' },
  { id: 'trucker-limited', name: 'Limited Edition Trucker', description: 'Exclusive limited release', price: 520, image: '/images/trucker-limited.png' },
];

export default function Trucker() {
  const { addToCart } = useCart();
  const [visible, setVisible] = useState(9);

  return (
    <div className="page-bg-trucker font-body">
      <section className="pt-28 pb-12 mt-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-heading mb-12 text-center tracking-wide uppercase text-white">
            TRUCKER CAPS
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
                      onClick={() => addToCart({ ...product, size: 'One Size', quantity: 1 })}
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
