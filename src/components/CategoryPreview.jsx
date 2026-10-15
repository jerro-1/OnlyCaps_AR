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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <section className="section">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-base-content">{title}</h2>
          <Link to={viewAllLink} className="btn btn-ghost mt-4 md:mt-0">
            View All
            <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
        <div className="product-grid">
          {products.map(p => (
            <Link key={p.id} to={`/product/${p.product_id ?? p.id}`} className="card overflow-hidden block h-full">
              <div className="relative aspect-square bg-base-100 overflow-hidden">
                <img 
                  src={p.image} 
                  alt={p.name} 
                  loading="lazy" 
                  decoding="async" 
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                {p.category && (
                  <span className="absolute top-3 left-3 badge badge-info text-xs">
                    {p.category.charAt(0).toUpperCase() + p.category.slice(1)}
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="font-medium text-base-content line-clamp-1 mb-1">{p.name}</p>
                <p className="text-lg font-bold text-base-content">{formatPrice(p.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}