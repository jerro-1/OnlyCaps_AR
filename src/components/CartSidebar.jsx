import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { SessionContext } from '../context/SessionContext';
import { BsX, BsTrash, BsPlus, BsDash, BsCheckCircle } from 'react-icons/bs';

export default function CartSidebar() {
  const { cart, totalItems, subtotal, cartOpen, updateQuantity, removeFromCart, clearCart, setCartOpen } = useCart();
  const session = useContext(SessionContext);
  const navigate = useNavigate();

  if (!session) return null;

  const handleCheckout = () => {
    setCartOpen(false);
    navigate('/checkout');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(price);
  };

  if (!cartOpen) return null;

  return (
    <>
      <div
        className="cart-sidebar-overlay open"
        onClick={() => setCartOpen(false)}
        aria-hidden="true"
      />
      <aside
        className="cart-sidebar open"
        role="dialog"
        aria-label="Shopping cart"
      >
        {/* Cart Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-base-content">Shopping Cart</h2>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="p-2 text-base-content/60 hover:text-base-content hover:bg-base-200 rounded-lg transition-colors"
            aria-label="Close cart"
          >
            <BsX className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <BsCheckCircle className="h-12 w-12 text-base-300 mb-4" />
              <p className="text-base-content/60 mb-2">Your cart is empty</p>
              <p className="text-sm text-base-content/40">Add some caps to get started</p>
              <Link
                to="/fitted-caps"
                onClick={() => setCartOpen(false)}
                className="mt-4 btn btn-primary"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div
                  key={`${item.id}-${item.size}-${index}`}
                  className="flex gap-3 p-3 bg-base-100 rounded-lg border border-base-200"
                >
                  <Link
                    to={`/product/${item.id}`}
                    onClick={() => setCartOpen(false)}
                    className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-base-200"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.id}`}
                      onClick={() => setCartOpen(false)}
                      className="block"
                    >
                      <h3 className="font-medium text-sm text-base-content line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-base-content/60 mt-0.5">{item.size}</p>
                    </Link>
                    <p className="font-semibold text-base-content mt-1">
                      {formatPrice(item.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="p-1.5 rounded border border-base-300 text-base-content/60 hover:text-base-content hover:bg-base-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <BsDash className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium text-base-content w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                        className="p-1.5 rounded border border-base-300 text-base-content/60 hover:text-base-content hover:bg-base-200 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <BsPlus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="ml-auto p-1.5 text-base-content/40 hover:text-error hover:bg-error/10 rounded transition-colors"
                        aria-label="Remove item"
                      >
                        <BsTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-base-300 bg-white sticky bottom-0 z-10">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-base-content/60">Subtotal</span>
              <span className="font-medium text-base-content">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-base-content/60">Shipping</span>
              <span className="font-medium text-base-content">Calculated at checkout</span>
            </div>
            <div className="divider mb-4" />
            <div className="flex justify-between text-lg font-semibold mb-4">
              <span className="text-base-content">Total</span>
              <span className="text-base-content">{formatPrice(subtotal)}</span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              className="w-full btn btn-primary py-3 text-base font-medium"
              disabled={cart.length === 0}
            >
              Proceed to Checkout
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your cart?')) {
                  clearCart();
                }
              }}
              className="w-full btn btn-ghost text-sm mt-2"
            >
              Clear Cart
            </button>
          </div>
        )}
      </aside>
    </>
  );
}