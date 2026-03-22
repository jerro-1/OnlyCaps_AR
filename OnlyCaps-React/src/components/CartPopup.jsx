import { useCart } from '../context/CartContext';

export default function CartPopup() {
  const { cart, cartOpen, setCartOpen, subtotal, removeFromCart, updateQuantity, showNotification } = useCart();

  if (!cartOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) setCartOpen(false);
  };

  return (
    <div className="cart-popup-overlay" onClick={handleOverlayClick}>
      <div className="cart-popup" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Shopping Cart</h2>
            <button onClick={() => setCartOpen(false)} className="text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-4 text-gray-500">Your cart is empty</p>
              <button onClick={() => setCartOpen(false)} className="mt-4 text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer">
                Continue Shopping
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div key={`${item.id}-${item.size}`} className="flex items-center p-4 border-b border-gray-200">
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg mr-4" />
                <div className="flex-grow">
                  <h4 className="font-bold">{item.name}</h4>
                  <p className="text-sm text-gray-600">Size: {item.size}"</p>
                  <p className="text-lg font-bold text-blue-600">₱{(item.price * (item.quantity || 1)).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, item.size, (item.quantity || 1) - 1)} className="w-8 h-8 border rounded-full hover:bg-gray-100 cursor-pointer bg-white flex items-center justify-center font-bold">−</button>
                  <span className="w-8 text-center">{item.quantity || 1}</span>
                  <button onClick={() => updateQuantity(item.id, item.size, (item.quantity || 1) + 1)} className="w-8 h-8 border rounded-full hover:bg-gray-100 cursor-pointer bg-white flex items-center justify-center font-bold">+</button>
                  <button onClick={() => removeFromCart(item.id, item.size)} className="ml-2 text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* AI Assistant */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <p className="text-sm text-gray-600 mb-3">Don't know your size? Let our AI assist!</p>
          <button className="ai-assist-btn" onClick={() => showNotification('AI Size Assistant coming soon!', 'warning')}>
            AI SIZE ASSISTANT
          </button>
        </div>

        {/* Subtotal */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold">Subtotal:</span>
            <span className="text-2xl font-bold text-blue-600">₱{subtotal.toFixed(2)}</span>
          </div>
          <button className="w-full bg-black text-white py-4 rounded-full font-medium hover:bg-gray-800 transition text-lg border-none cursor-pointer btn-hover">
            CHECKOUT
          </button>
        </div>
      </div>
    </div>
  );
}
