import { useState } from 'react';
import { useCart } from '../context/CartContext';

const PRODUCTS = [
  { id: 'snapback-classic', name: 'Classic Snapback', description: 'Adjustable strap back', price: 420, image: '/images/snapback-classic.png' },
  { id: 'beanie-knit', name: 'Knit Beanie', description: 'Warm winter beanie', price: 380, image: '/images/beanie-knit.png' },
  { id: 'dad-hat', name: 'Dad Hat', description: 'Unstructured low profile', price: 400, image: '/images/dad-hat.png' },
  { id: 'bucket-hat', name: 'Bucket Hat', description: 'Summer style bucket hat', price: 450, image: '/images/bucket-hat.png' },
  { id: 'sports-visor', name: 'Sports Visor', description: 'Athletic performance visor', price: 350, image: '/images/sports-visor.png' },
  { id: 'flat-bill', name: 'Flat Bill Cap', description: 'Straight flat bill design', price: 480, image: '/images/flat-bill.png' },
  { id: '5-panel', name: '5-Panel Cap', description: 'Minimalist 5-panel design', price: 520, image: '/images/5-panel.png' },
  { id: 'camp-cap', name: 'Camp Cap', description: 'Soft structured camp cap', price: 440, image: '/images/camp-cap.png' },
  { id: 'accessories-pack', name: 'Accessories Pack', description: 'Hat clips and maintenance kit', price: 280, image: '/images/accessories-pack.png' },
];

export default function MoreStuff() {
  const { addToCart } = useCart();
  const [visible, setVisible] = useState(9);

  return (
    <div className="page-bg-morestuff font-body">
      <section className="pt-28 pb-12 mt-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-heading mb-12 text-center tracking-wide uppercase text-white">
            MORE STUFF
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
