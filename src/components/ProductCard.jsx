import React from 'react'

const ProductCard = ({ product, onClick }) => {

    return (
        <div
            className="product-card bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200 cursor-pointer"
            onClick={() => onClick(product)}
        >
            <div className="relative overflow-hidden">
                <img
                    src={product.image}
                    alt={product.fullName}
                    className="w-full h-64 object-cover transition duration-300 hover:scale-105"
                />
            </div>
            <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{product.subtitle}</p>
                <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">₱{product.price}</span>
                    <span className="text-sm text-blue-600">Quick View →</span>
                </div>
            </div>
        </div>
    );
}

export default ProductCard