import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartPopup() {
  const { cart, cartOpen, setCartOpen, subtotal, totalItems, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();

  if (!cartOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) setCartOpen(false);
  };

  const handleViewCart = () => {
    setCartOpen(false);
    navigate('/cartpage');
  };

  return (
    <div className="cart-popup-overlay" onClick={handleOverlayClick}>
      <div className="cart-popup !bg-[#FAF8F4] !rounded-2xl flex flex-col min-h-140" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E4DFD3] flex justify-between items-center">
          <h2 className="font-heading text-xl uppercase tracking-wide text-[#14110D]">
            Your cart{totalItems > 0 && <span className="text-[#6B6558] text-sm normal-case tracking-normal ml-2">({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>}
          </h2>
          <button
            onClick={() => setCartOpen(false)}
            className="text-[#6B6558] hover:text-[#14110D] bg-transparent border-none cursor-pointer transition-colors"
            aria-label="Close cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="px-6 py-2 flex-1 max-h-96 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-body text-sm text-[#6B6558]">Your cart is empty</p>
              <button
                onClick={() => setCartOpen(false)}
                className="mt-3 font-body text-sm text-[#A9824C] font-medium hover:underline bg-transparent border-none cursor-pointer"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div key={`${item.id}-${item.size}`} className="flex items-center gap-4 py-4 border-b border-[#E4DFD3] last:border-b-0">
                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg bg-white" />
                <div className="flex-grow min-w-0">
                  <h4 className="font-body text-sm font-medium text-[#14110D] truncate">{item.name}</h4>
                  <p className="font-body text-xs text-[#6B6558]">Size: {item.size}</p>
                  <p className="font-body text-sm font-semibold text-[#14110D] mt-1">₱{(item.price * (item.quantity || 1)).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.size, (item.quantity || 1) - 1)}
                    className="w-7 h-7 border border-[#D8D2C4] rounded-full hover:bg-[#F0ECE1] cursor-pointer bg-transparent text-[#14110D] flex items-center justify-center"
                    aria-label="Decrease quantity"
                  >−</button>
                  <span className="w-5 text-center font-body text-sm text-[#14110D]">{item.quantity || 1}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.size, (item.quantity || 1) + 1)}
                    className="w-7 h-7 border border-[#D8D2C4] rounded-full hover:bg-[#F0ECE1] cursor-pointer bg-transparent text-[#14110D] flex items-center justify-center"
                    aria-label="Increase quantity"
                  >+</button>
                  <button
                    onClick={() => removeFromCart(item.id, item.size)}
                    className="ml-1 text-[#943D35] hover:text-[#6E2A24] bg-transparent border-none cursor-pointer"
                    aria-label="Remove item"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Subtotal + full cart */}
        <div className="px-6 py-5 border-t border-[#E4DFD3]">
          <div className="flex justify-between items-baseline mb-4">
            <span className="font-body text-sm text-[#6B6558]">Subtotal</span>
            <span className="font-heading text-xl text-[#14110D]">₱{subtotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleViewCart}
            className="w-full bg-[#14110D] text-[#FAF8F4] font-body text-sm font-medium py-3 rounded-full hover:bg-[#2A241C] transition-colors border-none cursor-pointer"
          >
            View cart
          </button>
        </div>
      </div>
    </div>
  );
}
