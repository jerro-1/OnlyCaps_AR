import React from 'react'
import { useCart } from '../context/CartContext';


const CartPage = () => {

    const { cart, removeFromCart, updateQuantity, totalItems, subtotal } = useCart();

    if (cart.length === 0) {
        return <div className="p-8 text-center">Your cart is empty.</div>;
    }

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Your Cart ({totalItems} items)</h1>
            <div className="space-y-4">
                {cart.map(item => (
                    <div key={`${item.id}-${item.size}`} className="flex items-center justify-between p-4 border rounded-lg">
                        <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded" />
                        <div className="flex-1 ml-4">
                            <h2 className="font-bold">{item.name}</h2>
                            <p className="text-gray-600">Size: {item.size}</p>
                            <p className="text-gray-600">Price: ₱{item.price}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.id, item.size, parseInt(e.target.value))}
                                className="w-16 border rounded text-center"
                            />
                            <button
                                onClick={() => removeFromCart(item.id, item.size)}
                                className="bg-red-500 text-white px-3 py-1 rounded"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 text-right">
                <p className="text-xl font-bold">Subtotal: ₱{subtotal}</p>
                <button
                    className="mt-4 px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition"
                    onClick={() => alert('Checkout not implemented yet')}
                >
                    Checkout
                </button>
            </div>
        </div>
    );
}
export default CartPage