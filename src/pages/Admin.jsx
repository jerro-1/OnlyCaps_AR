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
    user_id,
    order_items (*),
    profiles (
      email
    )
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
            <div className="drawer lg:drawer-open">
                <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
                <div className="drawer-content">
                    {/* Navbar */}
                    <nav className="navbar w-full bg-base-300">
                        <label htmlFor="my-drawer-4" aria-label="open sidebar" className="btn btn-square btn-ghost">
                            {/* Sidebar toggle icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor" className="my-1.5 inline-block size-4"><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path><path d="M9 4v16"></path><path d="M14 10l2 2l-2 2"></path></svg>
                        </label>
                        <div className="px-4">Navbar Title</div>
                    </nav>
                    {/* Page content here */}
                    <div className="py-20 ml-20 max-w-6xl mx-auto px-4 flex gap-8">
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold mb-6">My Orders</h1>

                            {loading ? (
                                <p>Loading...</p>
                            ) : orders.length === 0 ? (
                                <p>No orders found.</p>
                            ) : (
                                orders.map(order => (
                                    <OrderCard key={order.id} className="mb-6 p-6 bg-white rounded-xl shadow-sm border">

                                        {/* HEADER */}
                                        <div className="flex justify-between items-start mb-4">

                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    Order #{order.id}
                                                </p>

                                                <p className="text-sm text-gray-500">
                                                    {order.profiles?.email}
                                                </p>
                                            </div>

                                            <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                                                {order.status}
                                            </span>
                                        </div>

                                        {/* ITEMS */}
                                        <div className="space-y-4 border-t pt-4">
                                            {order.order_items?.map(item => (
                                                <div key={item.id} className="flex items-center gap-4">

                                                    {/* IMAGE */}
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-16 h-16 object-cover rounded-lg border"
                                                    />

                                                    {/* DETAILS */}
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">
                                                            {item.name}
                                                        </p>

                                                        <p className="text-sm text-gray-500">
                                                            Qty: {item.quantity}
                                                        </p>
                                                    </div>

                                                    {/* PRICE */}
                                                    <p className="font-semibold text-gray-900">
                                                        ₱{item.price}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* TOTAL */}
                                        <div className="mt-5 pt-4 border-t flex justify-between items-center">
                                            <p className="text-sm text-gray-500">
                                                Customer total
                                            </p>

                                            <p className="text-lg font-bold text-gray-900">
                                                ₱{order.total}
                                            </p>
                                        </div>

                                    </OrderCard>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="drawer-side is-drawer-close:overflow-visible">
                    <label htmlFor="my-drawer-4" aria-label="close sidebar" className="drawer-overlay"></label>
                    <div className="flex min-h-full flex-col items-start bg-base-200 is-drawer-close:w-14 is-drawer-open:w-64">
                        {/* Sidebar content here */}
                        <ul className="menu w-full grow">
                            {/* List item */}
                            <li>
                                <button className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Homepage">
                                    {/* Home icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor" className="my-1.5 inline-block size-4"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                                    <span className="is-drawer-close:hidden">Homepage</span>
                                </button>
                            </li>

                            {/* List item */}
                            <li>
                                <button className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Settings">
                                    {/* Settings icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor" className="my-1.5 inline-block size-4"><path d="M20 7h-9"></path><path d="M14 17H5"></path><circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle></svg>
                                    <span className="is-drawer-close:hidden">Settings</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

        </>
    )
}

export default Admin