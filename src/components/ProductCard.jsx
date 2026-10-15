import React from 'react'
import { Link } from 'react-router-dom';

const ProductCard = ({ product, onClick }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <Link
      to={`/product/${product.product_id ?? product.id}`}
      onClick={(e) => { if (onClick) onClick(product); }}
      className="card overflow-hidden block h-full transition-all-200"
    >
      <div className="relative aspect-square bg-base-100 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.full_name ?? product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-base-300">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {product.category && (
          <span className="absolute top-3 left-3 badge badge-info text-xs">
            {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
          </span>
        )}
        {product.badge && (
          <span className="absolute top-3 right-3 badge badge-warning text-xs">
            {product.badge}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-base-content line-clamp-1 mb-1">
          {product.full_name ?? product.name}
        </h3>
        {product.subtitle && (
          <p className="text-sm text-base-content/60 mb-2">{product.subtitle}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-base-content">
            {formatPrice(product.price)}
          </span>
          <span className="text-sm text-accent font-medium">Quick View →</span>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard