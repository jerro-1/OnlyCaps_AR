import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import supabase from '../utils/supabase';
import OrderCard from '../components/OrderCard';
import Footer from '../components/Footer';
import Footer2 from '../components/Footer2';

const Orders = () => {
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
            <Header />

            <div className="py-30 ml-10 min-h-screen mr-20 flex gap-8">
                <SideBar />

                <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-6">Orders</h1>

                    {loading ? (
                        <p>Loading...</p>
                    ) : orders.length === 0 ? (
                        <p>No orders found.</p>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} className="mb-6 bg-white rounded-md overflow-hidden">

                                {/* ORDER HEADER */}
                                <div className="flex justify-between items-center px-5 py-4 bg-gray-100">
                                    <p className="font-light text-gray-900">
                                        Order number: {order.id}
                                    </p>

                                    <p className="text-sm text-gray-600">
                                        Status: {order.status}
                                    </p>
                                </div>

                                {/* ITEMS */}
                                <div className="divide-y border-white">
                                    {order.order_items.map(item => (
                                        <div key={item.id} className="flex border-gray-300 items-center gap-5 px-5 py-4">

                                            {/* IMAGE */}
                                            <div className="w-80 h-45 flex-shrink-0">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="size-full object-cover rounded-md"
                                                />
                                            </div>
                                            {/* NAME + DETAILS */}
                                            <div className="flex-1">
                                                <p className="font-base text-gray-900">
                                                    {item.name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Size: {item.size}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Quantity: {item.quantity}
                                                </p>

                                            </div>

                                            {/* PRICE */}
                                            <p className="font-bold text-gray-900">
                                                ₱{item.price}
                                            </p>
                                        </div>

                                    ))}
                                </div>


                                {/* TOTAL */}
                                <div className="flex justify-between items-center px-5 py-4 text-base bg-gray-800">
                                    <p className="font-normal text-white">
                                        Total:
                                    </p>
                                    <div className="font-normal text-white">
                                        ₱{order.total}
                                    </div>
                                </div>

                            </div>
                        ))
                    )}
                </div>
            </div>
            <Footer2 />
        </>
    );
};

export default Orders;