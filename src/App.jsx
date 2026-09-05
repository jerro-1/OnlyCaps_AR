import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from "react";
import { CartProvider } from './context/CartContext';
import { SessionContext } from './context/SessionContext';
import supabase from './utils/supabase';
import "./App.css";

// Customer-facing pages
import Home from './pages/Home';
import FittedCaps from './pages/FittedCaps';
import AFrames from './pages/AFrames';
import Trucker from './pages/Trucker';
import MoreStuff from './pages/MoreStuff';
import Login from './pages/Login';
import RegisterEmail from './pages/RegisterEmail';
import VerifyEmail from './pages/VerifyEmail';
import MFASetup from './pages/MFASetup';
import MFAVerify from './pages/MFAVerify';
import Account from './pages/Account';
import Orders from './pages/Orders';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import CapMeasurement from './pages/CapMeasurement';
import FaceTracker from './pages/FaceTracker';
import SearchResults from './pages/SearchResults';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminInventory from './pages/admin/AdminInventory';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminPayments from './pages/admin/AdminPayments';

// Global widgets
import ChatBotWidget from './components/ChatbotWidget';

export default function App() {
  return <AppInner />;
}

function AppInner() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={session}>
      <CartProvider>
        <Routes>
          {/* Public / guest-accessible */}
          <Route path="/" element={<Home />} />
          <Route path="/fitted-caps" element={<FittedCaps />} />
          <Route path="/a-frames" element={<AFrames />} />
          <Route path="/trucker" element={<Trucker />} />
          <Route path="/more-stuff" element={<MoreStuff />} />
          <Route path="/sizing" element={<CapMeasurement />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/face-tracker" element={<FaceTracker />} />

          {/* Auth flow */}
          <Route path="/login" element={<Login />} />
          <Route path="/register-email" element={<RegisterEmail />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/mfa-setup" element={<MFASetup />} />
          <Route path="/mfa-verify" element={<MFAVerify />} />

          {/* Requires login */}
          <Route path="/account" element={<Account />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/cartpage" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />

          {/* Admin only -- each page checks role itself via AdminLayout */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
        </Routes>

        {/* Chatbot floats on every page, guest-accessible (panel note #35) */}
        <ChatbotWidget />
      </CartProvider>
    </SessionContext.Provider>
  );
}