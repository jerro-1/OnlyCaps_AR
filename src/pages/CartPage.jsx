import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import supabase from "../utils/supabase";
import BgImg from '../components/BgImg';
import Footer from '../components/Footer';

const CartPage = () => {
    const { cart, removeFromCart, updateQuantity, totalItems, subtotal, clearCart } = useCart();
    const [paymentMethod, setPaymentMethod] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 👇 Get the logged-in user on mount
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user || null);

            // Clear cart if not logged in
            if (!user) clearCart();

            setLoading(false);
        };

        fetchUser();

        // Listen for auth changes (login/logout)
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            if (!session?.user) clearCart();
        });

        return () => listener.subscription.unsubscribe();
    }, [clearCart]);

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    if (!user) {
        return <div className="p-8 text-center">You must be logged in to view your cart.</div>;
    }

    if (cart.length === 0) {
        return <div className="p-8 text-center">Your cart is empty.</div>;
    }

    const handleCheckout = async () => {
        if (!paymentMethod) {
            alert('Please select a payment method');
            return;
        }

        try {
            // Use the authenticated user
            if (!user) {
                alert('You must be logged in');
                return;
            }

            // Create order
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

            // Insert order items
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


    return (
        <>
            <BgImg>
                <Header />
                <div className="container mx-auto px-6 pt-24 pb-12">

                    <h1 className="text-4xl font-bold mb-10 text-center">
                        Your Cart <span className="text-gray-500 text-lg">({totalItems} items)</span>
                    </h1>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                        {/* LEFT - Cart Items */}
                        <div className="lg:col-span-2 space-y-5">
                            {cart.map(item => (
                                <div
                                    key={`${item.id}-${item.size}`}
                                    className="flex items-center justify-between p-5 rounded-2xl shadow-md bg-white hover:shadow-lg transition"
                                >
                                    <div className="flex items-center gap-5">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-28 h-28 object-cover rounded-xl border"
                                        />

                                        <div>
                                            <h2 className="font-semibold text-xl">{item.name}</h2>
                                            <p className="text-gray-500 text-sm mb-1">Size: {item.size}</p>
                                            <p className="text-black font-bold text-lg">₱{item.price}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-3">
                                        <input
                                            type="number"
                                            min={1}
                                            value={item.quantity}
                                            onChange={(e) =>
                                                updateQuantity(item.id, item.size, parseInt(e.target.value))
                                            }
                                            className="w-20 border rounded-lg text-center py-1 focus:outline-none focus:ring-2 focus:ring-black"
                                        />

                                        <button
                                            onClick={() => removeFromCart(item.id, item.size)}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* RIGHT - Order Summary */}
                        <div className="bg-white p-7 rounded-2xl shadow-lg h-fit sticky top-24">
                            <h2 className="text-2xl font-bold mb-5">Order Summary</h2>

                            <div className="space-y-3 mb-5 max-h-60 overflow-y-auto pr-2">
                                {cart.map(item => (
                                    <div
                                        key={`${item.id}-${item.size}`}
                                        className="flex justify-between text-sm text-gray-600"
                                    >
                                        <span>{item.name} x{item.quantity}</span>
                                        <span>₱{item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-4 flex justify-between font-bold text-xl">
                                <span>Subtotal</span>
                                <span>₱{subtotal}</span>
                            </div>

                            {/* Payment */}
                            <div className="mt-7">
                                <h3 className="font-semibold mb-3">Payment Method</h3>

                                <div className="space-y-3">
                                    <label className={`flex items-center gap-3 border p-3 rounded-xl cursor-pointer transition ${paymentMethod === 'gcash' ? 'border-black bg-gray-100' : 'hover:border-black'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="gcash"
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        GCash
                                    </label>

                                    <label className={`flex items-center gap-3 border p-3 rounded-xl cursor-pointer transition ${paymentMethod === 'card' ? 'border-black bg-gray-100' : 'hover:border-black'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="card"
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        Credit / Debit Card
                                    </label>
                                </div>
                            </div>

                            <button
                                className="w-full mt-8 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition"
                                onClick={handleCheckout}
                            >
                                Checkout
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