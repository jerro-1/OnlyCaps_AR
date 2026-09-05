import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ControlPanel from '../components/ControlPanel';
import supabase from '../utils/supabase';
import OrderCard from '../components/OrderCard';
import { SessionContext } from '../context/SessionContext';

const Admin = () => {
    const session = useContext(SessionContext); // FIX: shared session from App.jsx, no separate listener
    const [role, setRole] = useState(null);
    const [checkingRole, setCheckingRole] = useState(true);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkRole = async () => {
            if (!session) {
                setCheckingRole(false);
                setLoading(false);
                return;
            }
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (error || data?.role !== 'admin') {
                navigate('/');
                return;
            }
            setRole(data.role);
            setCheckingRole(false);
        };
        checkRole();
    }, [session, navigate]);

    useEffect(() => {
        if (role === 'admin') {
            fetchOrders();
        }
    }, [role]);

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
      `);

            if (error) throw error;

            setOrders(data || []);

        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    if (checkingRole) {
        return <div className="p-8 text-center">Checking access...</div>;
    }

    return (
        <>
            <div className="drawer lg:drawer-open">
                <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
                <div className="drawer-content">
                    <nav className="navbar w-full bg-base-300">
                        <label htmlFor="my-drawer-4" aria-label="open sidebar" className="btn btn-square btn-ghost">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor" className="my-1.5 inline-block size-4"><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path><path d="M9 4v16"></path><path d="M14 10l2 2l-2 2"></path></svg>
                        </label>
                        <div className="px-4">Admin Dashboard</div>
                    </nav>
                    <div className="py-20 ml-20 max-w-6xl mx-auto px-4 flex gap-8">
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold mb-6">All Orders</h1>

                            {loading ? (
                                <p>Loading...</p>
                            ) : orders.length === 0 ? (
                                <p>No orders found.</p>
                            ) : (
                                orders.map(order => (
                                    <div key={order.id} className="mb-6 bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
                                            <div>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    Order #{order.id}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    User ID: {order.user_id}
                                                </p>
                                            </div>

                                            <span className="px-4 py-1 text-sm rounded-full bg-gray-200 text-gray-700 capitalize">
                                                {order.status}
                                            </span>
                                        </div>

                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {order.order_items?.map(item => (
                                                <div key={item.id} className="border rounded-md overflow-hidden bg-white shadow-sm">
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-full h-40 object-cover"
                                                    />
                                                    <div className="p-4 space-y-2">
                                                        <p className="text-base font-semibold text-gray-900">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Size: <span className="font-medium text-gray-700">{item.size}</span>
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Quantity: <span className="font-medium text-gray-700">{item.quantity}</span>
                                                        </p>
                                                        <div className="pt-2 border-t flex justify-between items-center">
                                                            <p className="text-sm text-gray-500">Price</p>
                                                            <p className="text-lg font-semibold text-gray-900">
                                                                ₱{item.price}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t">
                                            <p className="text-sm text-gray-600">
                                                Total Items: {order.order_items?.length || 0}
                                            </p>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">Total</p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    ₱{order.total}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="drawer-side is-drawer-close:overflow-visible">
                    <label htmlFor="my-drawer-4" aria-label="close sidebar" className="drawer-overlay"></label>
                    <div className="flex min-h-full flex-col items-start bg-base-200 is-drawer-close:w-14 is-drawer-open:w-64">
                        <ul className="menu w-full grow">
                            <li>
                                <button className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Homepage">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor" className="my-1.5 inline-block size-4"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                                    <span className="is-drawer-close:hidden">Homepage</span>
                                </button>
                            </li>
                            <li>
                                <button className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Settings">
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