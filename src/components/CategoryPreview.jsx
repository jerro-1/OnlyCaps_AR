import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../utils/supabase';

export default function CategoryPreview({ category, title, viewAllLink }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    supabase.from('products').select('*').eq('category', category).limit(4)
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        setProducts(data || []);
      });
  }, [category]);

  if (products.length === 0) return null;

  return (
    <section className="py-14 bg-black">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-wide text-white">{title}</h2>
          <Link to={viewAllLink} className="font-body text-sm text-[#A9824C] hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {products.map(p => (
            <Link key={p.id} to={viewAllLink} className="block group">
              <div className="bg-white rounded-xl overflow-hidden">
                <img src={p.image} alt={p.name} className="w-full h-48 object-cover group-hover:scale-105 transition duration-300" />
              </div>
              <p className="font-body text-sm text-white mt-2 truncate">{p.name}</p>
              <p className="font-body text-sm text-[#A9824C]">₱{p.price}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}