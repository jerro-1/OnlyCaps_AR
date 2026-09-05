import React, { useContext, useState } from 'react';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import supabase from "../utils/supabase";
import BgImg from '../components/BgImg';
import Footer from '../components/Footer';
import { useNavigate } from "react-router-dom";
import { SessionContext } from '../context/SessionContext';

const CartPage = () => {
    const { cart, removeFromCart, updateQuantity, totalItems, subtotal, clearCart } = useCart();
    const [paymentMethod, setPaymentMethod] = useState('');
    const session = useContext(SessionContext);
    const user = session?.user || null;
    const navigate = useNavigate();

    if (!user) {
        return (
            <BgImg>
                <Header />
                <div className="min-h-screen flex items-center justify-center px-4">
                    <div className="bg-[#FAF8F4] rounded-2xl px-10 py-9 text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]">
                        <p className="font-heading text-lg uppercase tracking-wide text-[#14110D] mb-2">Sign in required</p>
                        <p className="font-body text-sm text-[#6B6558] mb-6">Log in to view and manage your cart.</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-[#14110D] text-[#FAF8F4] font-body text-sm px-6 py-2.5 rounded-full hover:bg-[#2A241C] transition-colors"
                        >
                            Go to login
                        </button>
                    </div>
                </div>
            </BgImg>
        );
    }

    if (cart.length === 0) {
        return (
            <BgImg>
                <Header />
                <div className="min-h-screen flex items-center justify-center px-4">
                    <div className="bg-[#FAF8F4] rounded-2xl px-10 py-9 text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]">
                        <p className="font-heading text-lg uppercase tracking-wide text-[#14110D] mb-2">Your cart is empty</p>
                        <p className="font-body text-sm text-[#6B6558] mb-6">Browse the collection to find your next fit.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-[#14110D] text-[#FAF8F4] font-body text-sm px-6 py-2.5 rounded-full hover:bg-[#2A241C] transition-colors"
                        >
                            Continue shopping
                        </button>
                    </div>
                </div>
            </BgImg>
        );
    }

    const handleCheckout = async () => {
        if (!paymentMethod) {
            alert('Please select a payment method');
            return;
        }
        try {
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    total: subtotal,
                    status: 'pending',
                    payment_method: paymentMethod,
                    payment_status: paymentMethod === 'cod' ? 'unpaid' : 'paid'
                })
                .select()
                .single();

            if (orderError) throw orderError;

            const items = cart.map(item => ({
                order_id: order.id,
                user_id: user.id,
                product_id: item.id,
                name: item.name,
                size: item.size,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(items);

            if (itemsError) throw itemsError;

            alert('Order placed successfully!');
            clearCart();
        } catch (error) {
            alert(error.message);
        }
    };

    const PAYMENT_OPTIONS = [
        { id: 'gcash', label: 'GCash' },
        { id: 'card', label: 'Credit / Debit Card' },
    ];

    return (
        <>
            <BgImg>
                <Header />
                <div className="container mx-auto px-6 pt-28 pb-16 max-w-5xl">

                    <div className="mb-10">
                        <p className="text-[#A9824C] text-xs tracking-[0.2em] font-body mb-2">Checkout</p>
                        <h1 className="font-heading text-3xl md:text-4xl uppercase tracking-wide text-white">
                            Your cart
                            <span className="text-[#8A8477] text-lg normal-case tracking-normal font-body ml-3">
                                {totalItems} {totalItems === 1 ? 'item' : 'items'}
                            </span>
                        </h1>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">

                        {/* Items */}
                        <div className="lg:col-span-2 space-y-3">
                            {cart.map(item => (
                                <div
                                    key={`${item.id}-${item.size}`}
                                    className="flex items-center gap-5 p-5 rounded-2xl bg-[#FAF8F4]"
                                >
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                                    />

                                    <div className="flex-1 min-w-0">
                                        <h2 className="font-body font-semibold text-[#14110D] text-base truncate">{item.name}</h2>
                                        <p className="text-[#6B6558] font-body text-xs mt-0.5">Size: {item.size}</p>
                                        <p className="text-[#14110D] font-body font-semibold text-sm mt-1">₱{item.price}</p>
                                    </div>

                                    <div className="flex items-center gap-1 border border-[#E4DFD3] rounded-full">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                                            className="w-8 h-8 flex items-center justify-center text-[#14110D] font-body text-lg hover:bg-[#F0ECE1] rounded-full transition-colors"
                                            aria-label="Decrease quantity"
                                        >
                                            −
                                        </button>
                                        <span className="w-6 text-center font-body text-sm text-[#14110D]">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                                            className="w-8 h-8 flex items-center justify-center text-[#14110D] font-body text-lg hover:bg-[#F0ECE1] rounded-full transition-colors"
                                            aria-label="Increase quantity"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => removeFromCart(item.id, item.size)}
                                        className="text-[#B8544A] hover:text-[#943D35] font-body text-xs font-medium flex-shrink-0"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="bg-[#FAF8F4] rounded-2xl p-7 h-fit sticky top-24">
                            <h2 className="font-heading text-lg uppercase tracking-wide text-[#14110D] mb-5">
                                Order summary
                            </h2>

                            <div className="space-y-2.5 mb-5 max-h-52 overflow-y-auto pr-1">
                                {cart.map(item => (
                                    <div
                                        key={`${item.id}-${item.size}`}
                                        className="flex justify-between font-body text-xs text-[#6B6558]"
                                    >
                                        <span className="truncate pr-2">{item.name} ×{item.quantity}</span>
                                        <span className="flex-shrink-0 text-[#14110D]">₱{item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-[#E4DFD3] pt-4 flex justify-between items-baseline">
                                <span className="font-body text-sm text-[#6B6558]">Subtotal</span>
                                <span className="font-heading text-xl text-[#14110D]">₱{subtotal}</span>
                            </div>

                            <div className="mt-7">
                                <h3 className="font-body text-xs text-[#6B6558] mb-3">Payment method</h3>
                                <div className="space-y-2">
                                    {PAYMENT_OPTIONS.map(opt => (
                                        <label
                                            key={opt.id}
                                            className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-colors font-body text-sm ${
                                                paymentMethod === opt.id
                                                    ? 'border-[#A9824C] bg-[#F5EEE2] text-[#14110D]'
                                                    : 'border-[#E4DFD3] text-[#4A453B] hover:border-[#D8D2C4]'
                                            }`}
                                        >
                                            {opt.label}
                                            <input
                                                type="radio"
                                                name="payment"
                                                value={opt.id}
                                                checked={paymentMethod === opt.id}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="accent-[#A9824C]"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button
                                className="w-full mt-7 py-3.5 bg-[#14110D] text-[#FAF8F4] rounded-full font-body font-medium text-sm hover:bg-[#2A241C] transition-colors"
                                onClick={handleCheckout}
                            >
                                Checkout — ₱{subtotal}
                            </button>
                        </div>

                    </div>
                </div>
            </BgImg>
            <Footer />
        </>
    );
};

export default CartPage;