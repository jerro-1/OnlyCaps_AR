import React, { useState, useEffect } from 'react';
import ControlPanel from '../components/ControlPanel';
import supabase from '../utils/supabase';
import OrderCard from '../components/OrderCard';

const Admin = () => {
    const [session, setSession] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
        });

        return () => data.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session) {
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, [session]);

    const fetchOrders = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('orders')
                .select(`
          id,
          total,
          status,
          order_items (*)
        `)
                .eq('user_id', session.user.id);

            if (error) throw error;

            console.log('Orders:', data);

            setOrders(data);

        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ControlPanel />
            <div className="py-20 max-w-6xl mx-auto px-4 flex gap-8">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-6">My Orders</h1>

                    {loading ? (
                        <p>Loading...</p>
                    ) : orders.length === 0 ? (
                        <p>No orders found.</p>
                    ) : (
                        orders.map(order => (
                            <OrderCard key={order.id} className="mb-6">

                                {/* ORDER HEADER */}
                                <div className="flex justify-between mb-4">
                                    <p className="font-semibold">Order ID: {order.id}</p>
                                    <p>Status: {order.status}</p>
                                </div>

                                {/* ITEMS */}
                                {order.order_items.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 border-t pt-4">

                                        {/* IMAGE */}
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-20 h-20 object-cover rounded"
                                        />

                                        {/* NAME + DETAILS */}
                                        <div className="flex-1">
                                            <p className="font-semibold">{item.name}</p>

                                            <p className="text-sm text-gray-500">
                                                Quantity: {item.quantity}
                                            </p>
                                        </div>

                                        {/* PRICE */}
                                        <p className="font-bold">₱{item.price}</p>

                                    </div>
                                ))}

                                {/* TOTAL */}
                                <div className="mt-4 text-right font-bold">
                                    Total: ₱{order.total}
                                </div>

                            </OrderCard>
                        ))
                    )}
                </div>
            </div>
        </>
    )
}

export default Admin