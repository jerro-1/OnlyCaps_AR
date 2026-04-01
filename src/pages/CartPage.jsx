import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import supabase from "../utils/supabase";

const CartPage = () => {
    const { cart, removeFromCart, updateQuantity, totalItems, subtotal } = useCart();
    const [paymentMethod, setPaymentMethod] = useState('');

    if (cart.length === 0) {
        return <div className="p-8 text-center">Your cart is empty.</div>;
    }

    const handleCheckout = async () => {
        if (!paymentMethod) {
            alert('Please select a payment method');
            return;
        }

        try {
            // 👇 GET CURRENT USER
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert('You must be logged in');
                return;
            }

            // 👇 CREATE ORDER (FIX HERE)
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id, // 🔥 REQUIRED FIX
                    total: subtotal,
                    status: 'pending',
                    payment_method: paymentMethod,
                    payment_status: paymentMethod === 'cod' ? 'unpaid' : 'paid'
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 👇 INSERT ORDER ITEMS (this part is already good)
            const items = cart.map(item => ({
                order_id: order.id,
                product_id: item.id,
                name: item.name,
                size: item.size,
                price: item.price,
                quantity: item.quantity
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(items);

            if (itemsError) throw itemsError;

            alert('Order placed successfully!');

        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <>
            <Header />
            <div className="container mx-auto px-6 pt-24 pb-12">
                <h1 className="text-3xl font-bold mb-8">
                    Your Cart ({totalItems} items)
                </h1>

                {/* 2 COLUMN LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT SIDE - CART ITEMS */}
                    <div className="lg:col-span-2 space-y-4">
                        {cart.map(item => (
                            <div
                                key={`${item.id}-${item.size}`}
                                className="flex items-center justify-between p-4 border rounded-xl shadow-sm bg-white"
                            >
                                <div className="flex items-center gap-4">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-24 h-24 object-cover rounded-lg"
                                    />
                                    <div>
                                        <h2 className="font-semibold text-lg">{item.name}</h2>
                                        <p className="text-gray-500 text-sm">Size: {item.size}</p>
                                        <p className="text-gray-700 font-medium">₱{item.price}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={(e) =>
                                            updateQuantity(item.id, item.size, parseInt(e.target.value))
                                        }
                                        className="w-16 border rounded text-center"
                                    />

                                    <button
                                        onClick={() => removeFromCart(item.id, item.size)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* RIGHT SIDE - SUMMARY */}
                    <div className="bg-white p-6 rounded-xl shadow-md h-fit">
                        <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                        {/* ITEM BREAKDOWN */}
                        <div className="space-y-2 mb-4">
                            {cart.map(item => (
                                <div
                                    key={`${item.id}-${item.size}`}
                                    className="flex justify-between text-sm text-gray-600"
                                >
                                    <span>
                                        {item.name} x{item.quantity}
                                    </span>
                                    <span>₱{item.price * item.quantity}</span>
                                </div>
                            ))}
                        </div>

                        {/* SUBTOTAL */}
                        <div className="border-t pt-4 flex justify-between font-semibold text-lg">
                            <span>Subtotal</span>
                            <span>₱{subtotal}</span>
                        </div>

                        {/* PAYMENT OPTIONS */}
                        <div className="mt-6">
                            <h3 className="font-semibold mb-2">Payment Method</h3>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:border-black">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="gcash"
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    GCash
                                </label>

                                <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:border-black">
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

                        {/* CHECKOUT BUTTON */}
                        <button
                            className="w-full mt-6 py-3 bg-black text-white rounded-full"
                            onClick={handleCheckout}
                        >
                            Checkout
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
};

export default CartPage;