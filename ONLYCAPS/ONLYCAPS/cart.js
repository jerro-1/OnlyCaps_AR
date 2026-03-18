// ===== js/cart.js - SHARED CART FUNCTIONALITY =====
// This file is included in EVERY page

// Cart state
let cart = [];

// Load cart from localStorage on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    updateCartCount();
    renderCartPopup();
    addAnimationStyles();
});

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('onlycaps_cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            console.error('Error loading cart:', e);
            cart = [];
        }
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('onlycaps_cart', JSON.stringify(cart));
    updateCartCount();
    renderCartPopup();
}

// Update cart icon count
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        if (totalItems > 0) {
            cartCount.textContent = totalItems;
            cartCount.classList.remove('hidden');
            
            // Add bounce animation
            cartCount.style.animation = 'bounce 0.3s ease';
            setTimeout(() => {
                cartCount.style.animation = '';
            }, 300);
        } else {
            cartCount.classList.add('hidden');
        }
    }
}

// Calculate subtotal
function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
}

// Add to cart function
window.addToCart = function(product) {
    // Validate product
    if (!product || !product.id || !product.size) {
        showNotification('Error: Invalid product', 'error');
        return;
    }
    
    const existingItem = cart.find(item => 
        item.id === product.id && item.size === product.size
    );
    
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + (product.quantity || 1);
    } else {
        cart.push({
            id: product.id,
            name: product.name || 'Product',
            price: product.price || 0,
            size: product.size,
            image: product.image || '',
            quantity: product.quantity || 1
        });
    }
    
    saveCart();
    showNotification(`${product.name || 'Product'} (Size: ${product.size}) added to cart!`);
    openCartPopup();
};

// Remove from cart
function removeFromCart(productId, size) {
    cart = cart.filter(item => !(item.id === productId && item.size === size));
    saveCart();
    showNotification('Item removed from cart');
}

// Update quantity
function updateQuantity(productId, size, newQuantity) {
    const item = cart.find(item => item.id === productId && item.size === size);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId, size);
        } else {
            item.quantity = newQuantity;
            saveCart();
        }
    }
}

// Open cart popup
function openCartPopup() {
    const overlay = document.getElementById('cartOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
        renderCartPopup();
    }
}

// Close cart popup
function closeCartPopup(event) {
    if (event && event.target === event.currentTarget) {
        const overlay = document.getElementById('cartOverlay');
        overlay.style.display = 'none';
    } else if (!event) {
        const overlay = document.getElementById('cartOverlay');
        overlay.style.display = 'none';
    }
}

// Render cart popup
function renderCartPopup() {
    const cartItems = document.getElementById('cartItems');
    const cartSubtotal = document.getElementById('cartSubtotal');
    
    if (!cartItems || !cartSubtotal) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="text-center py-8">
                <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <p class="mt-4 text-gray-500">Your cart is empty</p>
                <button onclick="closeCartPopup()" class="mt-4 text-blue-600 hover:text-blue-800 transition">
                    Continue Shopping
                </button>
            </div>
        `;
        cartSubtotal.textContent = '₱0.00';
        return;
    }
    
    let itemsHtml = '';
    cart.forEach((item, index) => {
        itemsHtml += `
            <div class="cart-item flex items-center p-4 border-b border-gray-200 hover:bg-gray-50 transition" data-cart-index="${index}">
                <img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded-lg mr-4">
                <div class="flex-grow">
                    <h4 class="font-bold">${item.name}</h4>
                    <p class="text-sm text-gray-600">Size: ${item.size}"</p>
                    <p class="text-lg font-bold text-blue-600">₱${(item.price * (item.quantity || 1)).toFixed(2)}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="updateQuantity('${item.id}', '${item.size}', ${(item.quantity || 1) - 1})" class="w-8 h-8 border rounded-full hover:bg-gray-100 transition flex items-center justify-center font-bold">−</button>
                    <span class="w-8 text-center font-medium">${item.quantity || 1}</span>
                    <button onclick="updateQuantity('${item.id}', '${item.size}', ${(item.quantity || 1) + 1})" class="w-8 h-8 border rounded-full hover:bg-gray-100 transition flex items-center justify-center font-bold">+</button>
                    <button onclick="removeFromCart('${item.id}', '${item.size}')" class="ml-2 text-red-500 hover:text-red-700 transition">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    });
    
    cartItems.innerHTML = itemsHtml;
    cartSubtotal.textContent = `₱${calculateSubtotal().toFixed(2)}`;
}

// Notification system
function showNotification(message, type = 'success') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    let bgColor = '#10b981';
    if (type === 'error') bgColor = '#ef4444';
    if (type === 'warning') bgColor = '#f59e0b';
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.backgroundColor = bgColor;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2700);
}

// Add animation styles
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }
        
        .notification {
            position: fixed;
            top: 100px;
            right: 20px;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            font-weight: 500;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0%); opacity: 1; }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}

// AI Assistant
window.openAIAssistant = function() {
    showNotification('AI Size Assistant coming soon!', 'warning');
};

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeCartPopup();
    }
    if (e.key === 'c' || e.key === 'C') {
        openCartPopup();
    }
});

// Export functions to global scope
window.openCartPopup = openCartPopup;
window.closeCartPopup = closeCartPopup;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;