import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import React from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('onlycaps_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    localStorage.setItem('onlycaps_cart', JSON.stringify(cart));
  }, [cart]);

  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const addToCart = useCallback((product) => {
    if (!product?.id || !product?.size) {
      showNotification('Invalid product', 'error');
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id && i.size === product.size);
      if (existing) {
        return prev.map(i =>
          i.id === product.id && i.size === product.size
            ? { ...i, quantity: (i.quantity || 1) + (product.quantity || 1) }
            : i
        );
      }
      return [...prev, { ...product, quantity: product.quantity || 1 }];
    });
    showNotification(`${product.name} (Size: ${product.size}) added to cart!`);
    setCartOpen(true);
  }, [showNotification]);

  const removeFromCart = useCallback((id, size) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.size === size)));
    showNotification('Item removed from cart');
  }, [showNotification]);

  const updateQuantity = useCallback((id, size, qty) => {
    if (qty <= 0) {
      removeFromCart(id, size);
      return;
    }
    setCart(prev => prev.map(i =>
      i.id === id && i.size === size ? { ...i, quantity: qty } : i
    ));
  }, [removeFromCart]);

  return (
    <CartContext.Provider value={{
      cart, totalItems, subtotal,
      cartOpen, setCartOpen,
      addToCart, removeFromCart, updateQuantity,
      notification, showNotification,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
